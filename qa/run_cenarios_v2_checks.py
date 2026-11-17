"""Run scene checks sequentially with temporary local servers.
Requires Playwright Core and an installed browser (CHROME_PATH).
TORII_NODE may point to a bundled Node executable. No personal browser/save used.
Build/export first: ruby game/source/chapter-03/build_alpha.rb;
                   ruby production/build_playtest.rb
"""
import functools,http.server,json,os,subprocess,threading
from pathlib import Path
root=Path(__file__).resolve().parents[1]
class QuietHandler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path=='/__before.html':
   html=(root/'production/playtest-dist/index.html').read_text();start=html.index('/* Environment V2:');end=html.index('init();',start);data=(html[:start]+html[end:]).encode()
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data);return
  return super().do_GET()
def serve(directory):
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(directory)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 return server,'http://127.0.0.1:'+str(server.server_port)+'/'
game,url=serve(root/'production/playtest-dist');assets,preview=serve(root/'assets/cenarios/v2')
env={**os.environ,'TORII_URL':url,'TORII_BUILD_URL':url};node=env.get('TORII_NODE','node')
try:
 if not env.get('TORII_QA_ONLY'):
  print('Capturing baseline with only the environment module disabled',flush=True);subprocess.run([node,'qa/cenarios_v2_capture.cjs','antes'],cwd=root,env={**env,'TORII_URL':url+'__before.html'},check=True,timeout=600)
 for args in [['qa/cenarios_v2_capture.cjs','depois'],['qa/cenarios_v2_runtime.cjs',url],['qa/protagonist_art_v5.cjs',url],['qa/ninja_archer_art.cjs',url],['qa/input_regression.cjs'],['qa/gameplay_regression.cjs',url],['qa/playtest_site.cjs',url],['qa/cenarios_v2_preview.cjs',preview+'PREVIA.html']]:
  if env.get('TORII_QA_ONLY') and args[0] not in env['TORII_QA_ONLY'].split(','):continue
  print('Running '+args[0],flush=True);subprocess.run([node,*args],cwd=root,env=env,check=True,timeout=600)
 report=subprocess.run([node,'qa/cenarios_v2_routes.cjs','qa/cenarios-v2/antes/MAPAS.json','qa/cenarios-v2/depois/MAPAS.json'],cwd=root,env=env,check=True,capture_output=True,text=True)
 (root/'qa/cenarios-v2/GEOMETRY_RESULTS.json').write_text(report.stdout)
 print(report.stderr.strip(),flush=True)
 print('All scene, input, site, viewer and geometry checks passed.',flush=True)
finally:
 game.shutdown();assets.shutdown();game.server_close();assets.server_close()
