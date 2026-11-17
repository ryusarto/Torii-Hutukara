"""Exporta poses dos atlas publicados, sem redesenhar ou interpolar pixels."""
from pathlib import Path
from argparse import ArgumentParser
from PIL import Image
import hashlib,json

def main():
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('--assets',type=Path,default=Path(__file__).resolve().parents[1]/'assets/variantes/percussao-sintetizador-v1')
    parser.add_argument('--out',type=Path,help='Destino opcional dos PNGs individuais; sem destino apenas verifica.')
    args=parser.parse_args();manifest=json.loads((args.assets/'manifest.json').read_text())
    if manifest.get('complete') is not True:raise ValueError('Pacote ainda incompleto')
    cache={};count=0;digests=[]
    for animation in manifest['animations']:
        atlas=animation['atlas']
        if atlas not in cache:
            image=Image.open(args.assets/atlas)
            if image.mode!='RGBA' or image.size!=(2048,1024):raise ValueError(f'Atlas inválido: {atlas}')
            cache[atlas]=image
        for n in range(animation['frames']):
            frame=cache[atlas].crop((n*256,animation['row']*256,(n+1)*256,(animation['row']+1)*256))
            if not frame.getchannel('A').getbbox():raise ValueError(f'Frame vazio: {atlas}/{n}')
            digest=hashlib.sha256(frame.tobytes()).hexdigest();digests.append(digest)
            if args.out:
                relative=animation['individualFrames'].replace('{frame:02}',f'{n:02}')
                path=args.out/relative;path.parent.mkdir(parents=True,exist_ok=True);frame.save(path)
                if Image.open(path).convert('RGBA').tobytes()!=frame.tobytes():raise ValueError(f'Pixels alterados: {path}')
            count+=1
    if count!=1664 or len(cache)!=52:raise ValueError('Cobertura inesperada')
    print(json.dumps({'passed':True,'atlases':len(cache),'frames':count,'exported':bool(args.out),'pixelDigest':hashlib.sha256(''.join(digests).encode()).hexdigest()}))

if __name__=='__main__':main()
