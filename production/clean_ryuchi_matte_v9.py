"""Bake exterior neutral matte correction into derived Ryuchi body atlases.

Never rewrites canonical V5/V7 art. Alpha, opaque pixels and masked rows remain
byte-identical; the runtime no longer pays image readback/flood-fill costs.
Requires Pillow and numpy. Run from any directory; all paths resolve to repo.
"""
from pathlib import Path
import hashlib,json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'assets/protagonistas/v9-matte'
STATES=('idle','walk','run','roll','attack_1','attack_2','attack_3','skill','advanced','signature','hurt','defeat')
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def clean(source):
    original=np.array(Image.open(source).convert('RGBA'));result=original.copy();height=original.shape[0]//2
    data=original[:height];alpha=data[:,:,3];rgb=data[:,:,:3].astype(np.float64)
    empty=alpha==0;edge=np.zeros(empty.shape,dtype=bool)
    for dy in range(-2,3):
        for dx in range(-2,3):
            y0,y1=max(0,-dy),min(height,height-dy);x0,x1=max(0,-dx),min(empty.shape[1],empty.shape[1]-dx)
            edge[y0:y1,x0:x1]|=empty[y0+dy:y1+dy,x0+dx:x1+dx]
    mask=(alpha>0)&(alpha<230)&(rgb.min(2)>75)&((rgb.max(2)-rgb.min(2))<=35)&edge
    a=alpha[mask].astype(np.float64)[:,None]
    result[:height,:,:3][mask]=np.clip(np.floor((rgb[mask]*255-(255-a)*255)/a+.5),0,255).astype('uint8')
    assert np.array_equal(original[:,:,3],result[:,:,3]),'alpha invariant'
    assert np.array_equal(original[height:],result[height:]),'masked invariant'
    opaque=original[:,:,3]==255
    assert np.array_equal(original[opaque],result[opaque]),'opaque invariant'
    return Image.fromarray(result),int(mask.sum()),int(np.any(original[:,:,:3]!=result[:,:,:3],axis=2).sum())
def main():
    (OUTPUT/'atlas').mkdir(parents=True,exist_ok=True)
    records=[]
    for state in STATES:
        folder='v7-locomocao'if state in {'walk','run'}else'v5'
        source=ROOT/f'assets/protagonistas/{folder}/atlas/ryuchi_{state}.png'
        destination=OUTPUT/f'atlas/ryuchi_{state}.png'
        image,eligible,changed=clean(source);image.save(destination,optimize=True)
        check=np.array(Image.open(destination).convert('RGBA'));original=np.array(Image.open(source).convert('RGBA'))
        assert np.array_equal(original[:,:,3],check[:,:,3]);assert np.array_equal(original[1024:],check[1024:]);assert np.array_equal(original[original[:,:,3]==255],check[original[:,:,3]==255])
        record={'key':'ryuchi_'+state,'source':str(source.relative_to(ROOT)),'atlas':str(destination.relative_to(OUTPUT)),'sourceSha256':sha(source),'sha256':sha(destination),'dimensions':list(image.size),'eligibleEdgePixels':eligible,'changedRGBPixels':changed,'alphaChanges':0,'opaqueChanges':0,'maskedChanges':0}
        records.append(record);print(record['key'],changed,flush=True)
    manifest={'version':9,'purpose':'Derived exterior neutral matte RGB correction; canonical sources unchanged. No frame creation, recoloring of opaque pixels, alpha edits, or masked edits. Rejected V7 intermediate poses are handled by walkFrameMap, not erased here.','cell':[256,256],'pivot':[128,224],'directions':['down','left','up','right'],'rows':['unmasked/down','unmasked/left','unmasked/up','unmasked/right','masked/down','masked/left','masked/up','masked/right'],'algorithm':{'neutralMinimum':75,'neutralRangeMaximum':35,'alphaRangeExclusive':[0,230],'exteriorRadiusSourcePixels':2,'unmatteBackgroundRGB':[255,255,255]},'bakedEdgeMatte':[r['key']for r in records],'atlases':records}
    (OUTPUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':main()
