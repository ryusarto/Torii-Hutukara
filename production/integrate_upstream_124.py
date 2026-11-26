#!/usr/bin/env python3
"""Three-way integrate the verified main snapshot, preserving local UI/game edits."""
from pathlib import Path
import subprocess,json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[1];REPO=Path('/private/tmp/torii-correcao-116')
BASE='66b0dbc3ca12b6f0342fb49e1b3e27f2f38c47a7';HEAD='db6297e25a3e701276df0b1ffd04b1dafb14afce'
OUT=ROOT/'qa/integration-1.25.0';BACK=OUT/'before';CONFLICTS=OUT/'conflicts';OUT.mkdir(parents=True,exist_ok=True)
def git(*args,allow_missing=False):
 p=subprocess.run(['git','-C',str(REPO),*args],stdout=subprocess.PIPE,stderr=subprocess.PIPE,env={**__import__('os').environ,'GIT_NO_LAZY_FETCH':'1'})
 if p.returncode and not allow_missing:raise RuntimeError(p.stderr.decode(errors='replace'))
 return p.stdout if p.returncode==0 else None
assert git('rev-parse','HEAD').decode().strip()==HEAD
names=git('diff','--name-only',BASE,HEAD).decode().splitlines();report={'base':BASE,'upstream':HEAD,'files':[]}
for name in names:
 dst=ROOT/name;theirs=git('show',HEAD+':'+name,allow_missing=True);base=git('show',BASE+':'+name,allow_missing=True);ours=dst.read_bytes() if dst.exists() else None
 if theirs is None:raise RuntimeError('Upstream deletion needs explicit reconciliation: '+name)
 item={'path':name,'upstreamSha256':hashlib.sha256(theirs).hexdigest()}
 if ours==theirs:item['status']='already-identical'
 elif ours is None or ours==base:
  if ours is not None:
   b=BACK/name;b.parent.mkdir(parents=True,exist_ok=True);b.write_bytes(ours)
  dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(theirs);item['status']='imported-upstream'
 else:
  b=BACK/name;b.parent.mkdir(parents=True,exist_ok=True);b.write_bytes(ours)
  stem=CONFLICTS/name;stem.parent.mkdir(parents=True,exist_ok=True)
  for suffix,data in [('.ours',ours),('.base',base or b''),('.theirs',theirs)]:Path(str(stem)+suffix).write_bytes(data)
  binary=any(b'\0' in data for data in [ours,base or b'',theirs])
  if binary:code=1;merged=b''
  else:
   p=subprocess.run(['git','merge-file','-p','--diff3',str(stem)+'.ours',str(stem)+'.base',str(stem)+'.theirs'],stdout=subprocess.PIPE,stderr=subprocess.PIPE);code=p.returncode;merged=p.stdout
  if code==0:dst.write_bytes(merged);item['status']='three-way-merged'
  else:Path(str(stem)+'.merged').write_bytes(merged);item['status']='needs-reconciliation'
 report['files'].append(item)
(OUT/'UPSTREAM.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'imported':sum(x['status']=='imported-upstream'for x in report['files']),'merged':sum(x['status']=='three-way-merged'for x in report['files']),'identical':sum(x['status']=='already-identical'for x in report['files']),'conflicts':[x['path']for x in report['files']if x['status']=='needs-reconciliation']},ensure_ascii=False))
