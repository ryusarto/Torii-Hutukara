#!/usr/bin/env ruby
# Publish only the current playable build. Portable HTML stays byte-for-byte intact.
require 'base64'
require 'digest'
require 'fileutils'
require 'json'
require 'tmpdir'
require 'time'

ROOT = File.expand_path('..', __dir__)
SOURCE = File.join(ROOT, 'web/playtest')
OUTPUT = File.join(ROOT, 'production/playtest-dist')
config = JSON.parse(File.read(File.join(SOURCE, 'build.json')))
manifest_path = File.expand_path(config.fetch('manifest'), ROOT)
manifest = JSON.parse(File.read(manifest_path))
build_path = File.join(File.dirname(manifest_path), manifest.fetch('output').fetch('file'))
original = File.binread(build_path).force_encoding(Encoding::UTF_8)
original_hash = Digest::SHA256.hexdigest(original)
abort 'Build differs from its approved manifest' unless original_hash == manifest['output']['sha256']

# Reuse immutable source bytes with copy-on-write on APFS. Linux/other volumes
# retain the ordinary byte write; exported media never hard-links source files.
source_media = {}
manifest.fetch('sources').each do |relative, info|
  next unless %w[.png .webp .mp3].include?(File.extname(relative))
  candidate = File.expand_path(relative, ROOT)
  next unless candidate.start_with?(ROOT + File::SEPARATOR) && File.file?(candidate)
  source_media[info.fetch('sha256')] = candidate
end

Dir.mktmpdir('torii-playtest-') do |temp|
  media = {}
  counts = Hash.new(0)
  preserved_audio = []
  save_media = lambda do |encoded, extension|
    bytes = Base64.strict_decode64(encoded)
    hash = Digest::SHA256.hexdigest(bytes)
    relative = "media/#{hash}.#{extension}"
    path = File.join(temp, relative)
    unless media.key?(relative)
      FileUtils.mkdir_p(File.dirname(path))
      source_path = source_media[hash]
      cloned = RUBY_PLATFORM.include?('darwin') && source_path &&
        File.size(source_path) == bytes.bytesize && Digest::SHA256.file(source_path).hexdigest == hash &&
        system('/bin/cp', '-c', source_path, path, out: File::NULL, err: File::NULL)
      File.binwrite(path, bytes) unless cloned
      media[relative] = { 'bytes' => bytes.bytesize, 'sha256' => hash }
    end
    counts[extension] += 1
    relative
  end

  # Same image bytes and dimensions, served as cacheable same-origin resources.
  html = original.gsub(%r{data:image/(png|webp);base64,([A-Za-z0-9+/]+={0,2})}) do
    save_media.call(Regexp.last_match(2), Regexp.last_match(1))
  end
  # Both ALBUM11 and C3.music contain bare, quoted MP3 base64 strings.
  html.gsub!(/(["'])([A-Za-z0-9+\/]{16384,}={0,2})\1/) do
    quote, encoded = Regexp.last_match(1), Regexp.last_match(2)
    begin
      bytes = Base64.strict_decode64(encoded)
    rescue ArgumentError
      # The historical walk_talk_twin string is malformed. Keep its existing
      # synthesized-audio fallback rather than silently change a released build.
      hash = Digest::SHA256.hexdigest(encoded)
      abort 'Unexpected malformed audio; review the source build' unless hash == '9d5adb9aabd5c03ca2f42737714674b6e90f3ad84d7b5967516c4128dcf9409e'
      preserved_audio << hash
      next quote + encoded + quote
    end
    is_mp3 = bytes.start_with?('ID3') || bytes.getbyte(0) == 255 && bytes.getbyte(1) & 224 == 224
    abort 'Unexpected embedded binary format' unless is_mp3
    quote + save_media.call(encoded, 'mp3') + quote
  end
  abort 'No game media found' unless counts['png'] > 0 && counts['webp'] > 0 && counts['mp3'] > 0
  abort 'Embedded images were not fully extracted' if html.match?(%r{data:image/(png|webp);base64,})

  old_decoder = 'const bytes=Uint8Array.from(atob(ALBUM11[id]),c=>c.charCodeAt(0));'
  abort 'Audio decoder changed; review hosted export' unless html.scan(old_decoder).length == 1
  new_decoder = "let bytes;if(ALBUM11[id].startsWith('media/')){const response=await fetch(ALBUM11[id]);if(!response.ok)throw new Error('HTTP '+response.status);bytes=new Uint8Array(await response.arrayBuffer())}else{bytes=Uint8Array.from(atob(ALBUM11[id]),c=>c.charCodeAt(0))}"
  html.sub!(old_decoder, new_decoder)

  # Hash the exact reconstructed bytes without allocating the full HTML for
  # each image. Every extracted asset is also checked independently.
  reconstructed = html.sub(new_decoder, old_decoder)
  original = nil
  GC.start
  media.each do |relative, data|
    bytes = File.binread(File.join(temp, relative))
    abort "Asset hash mismatch: #{relative}" unless Digest::SHA256.hexdigest(bytes) == data['sha256']
  end
  digest = Digest::SHA256.new
  cursor = 0
  reconstructed.scan(Regexp.union(media.keys)) do
    match = Regexp.last_match
    digest << reconstructed[cursor...match.begin(0)]
    relative = match[0]
    extension = File.extname(relative).delete('.')
    digest << "data:image/#{extension};base64," unless extension == 'mp3'
    digest << Base64.strict_encode64(File.binread(File.join(temp, relative)))
    cursor = match.end(0)
  end
  digest << reconstructed[cursor..]
  abort 'Hosted export changed game content' unless digest.hexdigest == original_hash

  # Imagens em WebP sem perda (pixels idênticos), com cache por conteúdo.
  optimizer = File.join(ROOT, 'production/otimizar_media.py')
  optimization_report = File.join(temp, 'media-optimization.json')
  system('python3', '-I', optimizer, File.join(temp, 'media'), optimization_report, exception: true)
  optimized = JSON.parse(File.read(optimization_report, encoding: 'UTF-8'))
  renamed = optimized.select { |from, data| data['file'] != from }
  unless renamed.empty?
    html.gsub!(Regexp.union(renamed.keys)) { |from| renamed.fetch(from)['file'] }
  end
  renamed.each do |from, data|
    abort "Imagem otimizada ausente: #{data['file']}" unless File.file?(File.join(temp, data['file']))
    media.delete(from)
    bytes = File.binread(File.join(temp, data['file']))
    media[data['file']] = { 'bytes' => bytes.bytesize, 'sha256' => Digest::SHA256.hexdigest(bytes), 'from' => from, 'mode' => data['mode'] }
  end
  abort 'Referência a imagem removida' if renamed.keys.any? { |from| html.include?(from) }

  # Só a mídia observada no título carrega sem uma solicitação do jogo.
  inventory = JSON.parse(File.read(File.join(SOURCE, 'media_priority.json'), encoding: 'UTF-8'))
  priority = inventory.fetch('ordem').select { |file| inventory.fetch('area')[file] == 'titulo' }
  priority = priority.map { |from| renamed.dig(from, 'file') || from }.select { |file| media.key?(file) }
  loader = File.read(File.join(SOURCE, 'loader.js'), encoding: 'UTF-8')
  abort 'Carregador sem marcador de prioridade' unless loader.scan('__MEDIA_PRIORITY__').length == 1
  loader = loader.sub('__MEDIA_PRIORITY__') { JSON.generate(priority) }
  abort 'Missing HTML head opening' unless html.scan('<head>').length == 1
  html.sub!('<head>') { "<head>\n<script>#{loader}</script>" }

  build_info = {
    'version' => config.fetch('version'), 'sourceSha256' => original_hash,
    'shellVersion' => 2, 'builtAt' => Time.now.utc.iso8601
  }
  tags = []
  # Reuse the project's canonical mask icon; avoid an implicit /favicon.ico
  # request outside the GitHub Pages project path.
  if File.file?(File.join(ROOT, 'web', 'album', 'assets', 'mask-original.webp'))
    tags << %(<link rel="icon" type="image/webp" href="album/assets/mask-original.webp">)
  end
  %w[css js].each do |extension|
    contents = File.binread(File.join(SOURCE, "entry.#{extension}"))
    name = "entry-#{Digest::SHA256.hexdigest(contents)[0, 12]}.#{extension}"
    File.binwrite(File.join(temp, name), contents)
    tags << if extension == 'css'
      %(<link rel="stylesheet" href="#{name}">)
    else
      %(<script>window.TORII_PLAYTEST_BUILD=#{JSON.generate(build_info)};</script>\n<script defer src="#{name}"></script>)
    end
  end
  abort 'Missing HTML head' unless html.scan('</head>').length == 1
  html.sub!('</head>', tags.join("\n") + "\n</head>")
  File.write(File.join(temp, 'index.html'), html)
  File.write(File.join(temp, '.nojekyll'), '')
  report = build_info.merge(
    'indexBytes' => html.bytesize, 'indexSha256' => Digest::SHA256.hexdigest(html),
    'mediaOccurrences' => counts, 'assets' => media,
    'preservedLegacyAudio' => preserved_audio,
    'mediaBytes' => media.values.sum { |m| m['bytes'] },
    'priorityFiles' => priority.length,
    'portableBuildUnchanged' => Digest::SHA256.file(build_path).hexdigest == original_hash,
    'gameContentRoundTrip' => true
  )
  File.write(File.join(temp, 'build-info.json'), JSON.pretty_generate(report) + "\n")

  # Only this ignored, generated directory is replaced; no historical build changes.
  FileUtils.rm_rf(OUTPUT)
  # Temporary export and output share the volume; move avoids duplicating all
  # media on a nearly full developer disk. Recreate the empty temporary root
  # for Ruby 2.6 mktmpdir cleanup after the move.
  FileUtils.mv(temp, OUTPUT)
  FileUtils.mkdir_p(temp)
  # Site editorial do álbum, isolado da build original do jogo.
  album_source = File.join(ROOT, 'web', 'album')
  if Dir.exist?(album_source)
    FileUtils.cp_r(album_source, File.join(OUTPUT, 'album'))
  end
  puts "Playtest #{config['version']}: HTML #{html.bytesize} bytes; #{media.length} cacheable assets"
  puts "Device notice: 4 seconds; original build: #{original_hash}"
  puts OUTPUT
end
