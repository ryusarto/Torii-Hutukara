"""Merge accepted generation results and explicit layout corrections into V5."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--base',default='sprites-principais-v5');args=parser.parse_args()
BASE=(ROOT/args.base).resolve()
plan=json.loads((BASE/'PLANO_PERSONAGENS.json').read_text())
sources={(s['hero'],s['state']):s for s in json.loads((BASE/'fontes.json').read_text())}
portraits={s['hero']:s for s in json.loads((BASE/'retratos.json').read_text())}
for source in json.loads((BASE/'GERADOS_V5.json').read_text()):
 if source['state']=='portrait':portraits[source['hero']]=source
 else:sources[source['hero'],source['state']]=source
corrections=BASE/'CORRECOES_V5.json'
if corrections.exists():
 for source in json.loads(corrections.read_text()):
  key=source['hero'],source['state'];sources[key]={**sources[key],**source}
missing=[(h,s) for h in plan['heroes'] for s in plan['states'] if (h,s) not in sources]
assert not missing,'Ações pendentes: '+str(missing)
assert set(portraits)==set(plan['heroes']),'Retratos pendentes'
ordered=[sources[h,s] for h in plan['heroes'] for s in plan['states']]
for source in ordered+list(portraits.values()):assert (BASE/source['file']).is_file(),source['file']
(BASE/'fontes.json').write_text(json.dumps(ordered,ensure_ascii=False,indent=2))
(BASE/'retratos.json').write_text(json.dumps(list(portraits.values()),ensure_ascii=False,indent=2))
print(f'{len(ordered)} atlas de ação e {len(portraits)} atlas de retratos completos')

