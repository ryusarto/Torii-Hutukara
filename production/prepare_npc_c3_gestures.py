"""Pack generated poses without redrawing pixels; stable feet/scale per identity."""
from pathlib import Path
from PIL import Image
import hashlib,json
root=Path(__file__).resolve().parents[1]
folder=root/'assets/npcs/vida-v2'
source=folder/'C3_GESTOS_FONTE.png'
image=Image.open(source).convert('RGBA')
assert image.size==(1536,1024)
refs=['MORADORA_DISTRITO_A_MOVIMENTO_8_FRAMES','MORADOR_DISTRITO_B_MOVIMENTO_8_FRAMES','TRABALHADORA_CANAL_MOVIMENTO_8_FRAMES','OPERADOR_USINA_MOVIMENTO_8_FRAMES']
ids=['c3_resident','c3_resident_b','c3_canal_worker','c3_plant_operator']
packed=Image.new('RGBA',image.size)
rows=[]
for row,(name,npc_id) in enumerate(zip(refs,ids)):
    reference=Image.open(root/'assets/chapter-03/runtime/personagens'/f'{name}.png').convert('RGBA')
    bounds=reference.crop((0,0,reference.width//8,reference.height)).getbbox()
    target_height=round((bounds[3]-bounds[1])/reference.height*256)
    hashes=[]
    for frame in range(6):
        cell=image.crop((frame*256,row*256,(frame+1)*256,(row+1)*256))
        box=cell.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
        assert box
        left,top,right,bottom=box
        crop=cell.crop((max(0,left-2),max(0,top-2),min(256,right+2),min(256,bottom+2)))
        width=round(crop.width*target_height/crop.height)
        crop=crop.resize((width,target_height),Image.Resampling.NEAREST)
        target=Image.new('RGBA',(256,256));target.alpha_composite(crop,((256-width)//2,256-target_height))
        packed.alpha_composite(target,(frame*256,row*256))
        hashes.append(hashlib.sha256(target.tobytes()).hexdigest())
    assert len(set(hashes))==6
    rows.append({'id':npc_id,'row':row,'frames':6,'uniqueFrames':6,'frameSha256':hashes,'cell':[256,256],'anchor':[128,256],'reference':str(Path('assets/chapter-03/runtime/personagens')/f'{name}.png')})
output=folder/'NPC_C3_GESTURES_6X4.png';packed.save(output,optimize=True)
manifest={'version':'vida-v2','file':output.name,'source':source.name,'size':list(packed.size),'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'rows':rows,'method':'Built-in ImageGen, identity references; Pillow only packs and normalizes cell feet/height. No painted/interpolated frames.'}
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(output.relative_to(root),manifest['sha256'])
