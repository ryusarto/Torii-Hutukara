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
      File.binwrite(path, bytes)
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

  # Reconstruct every substituted asset to prove that export preserved its bytes.
  reconstructed = html.sub(new_decoder, old_decoder)
  media.each do |relative, data|
    bytes = File.binread(File.join(temp, relative))
    abort "Asset hash mismatch: #{relative}" unless Digest::SHA256.hexdigest(bytes) == data['sha256']
    encoded = Base64.strict_encode64(bytes)
    extension = File.extname(relative).delete('.')
    replacement = extension == 'mp3' ? encoded : "data:image/#{extension};base64,#{encoded}"
    reconstructed.gsub!(relative) { replacement }
  end
  abort 'Hosted export changed game content' unless reconstructed == original

  build_info = {
    'version' => config.fetch('version'), 'sourceSha256' => original_hash,
    'shellVersion' => 1, 'builtAt' => Time.now.utc.iso8601
  }
  tags = []
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
    'portableBuildUnchanged' => Digest::SHA256.file(build_path).hexdigest == original_hash,
    'gameContentRoundTrip' => true
  )
  File.write(File.join(temp, 'build-info.json'), JSON.pretty_generate(report) + "\n")

  # Only this ignored, generated directory is replaced; no historical build changes.
  FileUtils.rm_rf(OUTPUT)
  FileUtils.mkdir_p(OUTPUT)
  FileUtils.cp_r(Dir.glob(File.join(temp, '*'), File::FNM_DOTMATCH).reject { |p| %w[. ..].include?(File.basename(p)) }, OUTPUT)
  puts "Playtest #{config['version']}: HTML #{html.bytesize} bytes; #{media.length} cacheable assets"
  puts "Device notice: 4 seconds; original build: #{original_hash}"
  puts OUTPUT
end
