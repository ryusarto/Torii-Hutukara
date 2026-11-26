'use strict';
// Independent image oracles for PNG-authored assets in portable/hosted builds.
// Never reads the runtime image URI. References are selected by source hashes,
// the build manifest, verified converter-cache bytes, and Pillow RGBA equality.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{fileURLToPath}=require('node:url'),{spawnSync}=require('node:child_process');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),artifacts=new Map();
async function artifact(root,input){
 const config=JSON.parse(fs.readFileSync(path.join(root,'web/playtest/build.json'))),manifestPath=path.resolve(root,config.manifest),manifest=JSON.parse(fs.readFileSync(manifestPath)),portable=path.join(path.dirname(manifestPath),manifest.output.file);
 const key=manifestPath+':'+manifest.output.sha256;if(artifacts.has(key))return artifacts.get(key);
 const promise=(async()=>{if(process.env.EXPECTED_SOURCE_SHA)assert.equal(manifest.output.sha256,process.env.EXPECTED_SOURCE_SHA,'Unexpected image-reference build');if(/^file:/.test(input)){assert.equal(fs.realpathSync(fileURLToPath(input)),fs.realpathSync(portable),'Portable reference must match the current manifest');assert.equal(fs.statSync(portable).size,manifest.output.bytes);const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(portable))hash.update(chunk);assert.equal(hash.digest('hex'),manifest.output.sha256,'Portable bytes differ from manifest')}else if(/^https?:/.test(input)){const info=JSON.parse(fs.readFileSync(path.join(root,'production/playtest-dist/build-info.json')));assert.equal(info.sourceSha256,manifest.output.sha256,'Hosted and portable references differ')}else throw Error('Expected file: or HTTP artifact');return{manifest,portable}})();artifacts.set(key,promise);return promise;
}
function canonical(root,name,manifest,expected){
 const file=path.resolve(root,name),relative=path.relative(root,file);assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Reference outside project');const bytes=fs.readFileSync(file),hash=digest(bytes),record=manifest.sources[relative.split(path.sep).join('/')];if(record)assert.equal(hash,record.sha256,'Authored source differs from build manifest: '+relative);if(expected)assert.equal(hash,expected,'Authored source provenance mismatch: '+relative);return{file,relative,bytes,hash,listed:!!record};
}
function encodedReference(root,manifest,source){
 const key='media/'+source.hash+'.png',target=manifest.webp_from_png?.[key];
 if(!target){assert(source.listed,'Unlisted original reference: '+source.relative);return{bytes:source.bytes,mime:'image/png',mode:'original',target:key}}
 assert.equal(manifest.webp_modes[key],'lossless','Authored reference was converted with loss: '+source.relative);assert(/^media\/[a-f0-9]{64}\.webp$/.test(target),'Invalid encoded reference path');const expected=path.basename(target,'.webp'),cache=path.join(root,'production/.media-cache');
 const candidates=fs.existsSync(cache)?fs.readdirSync(cache,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>path.join(cache,d.name,source.hash+'.webp')):[];candidates.push(path.join(root,'production/playtest-dist',target));
 for(const file of candidates)if(fs.existsSync(file)){const bytes=fs.readFileSync(file);if(digest(bytes)===expected)return{bytes,mime:'image/webp',mode:'lossless',target}}
 throw Error('Missing independently hashed lossless reference: '+target);
}
const PYTHON=String.raw`
import base64,hashlib,io,json,sys
from PIL import Image
cfg=json.load(sys.stdin)
def raw(data):
    with Image.open(io.BytesIO(data)) as im:
        rgba=im.convert('RGBA')
        return rgba.size,rgba.tobytes()
def sha(data): return hashlib.sha256(data).hexdigest()
original=base64.b64decode(cfg['original'],validate=True)
encoded=base64.b64decode(cfg['encoded'],validate=True)
assert raw(original)==raw(encoded),'Lossless conversion changed authored RGBA'
size,pixels=raw(original)
json.dump({'size':list(size),'canonicalRgbaSha256':sha(pixels),'referenceRgbaSha256':sha(raw(encoded)[1]),'rgbaIdentical':True},sys.stdout)
`;
async function imageReference({root,input,sourcePath,expectedCanonicalSha}){
 const {manifest}=await artifact(root,input),original=canonical(root,sourcePath,manifest,expectedCanonicalSha),encoded=encodedReference(root,manifest,original);
 // PYTHON_BIN can select a Python with Pillow; CI installs Pillow for python3.
 const processResult=spawnSync(process.env.PYTHON_BIN||'python3',['-I','-c',PYTHON],{input:JSON.stringify({original:original.bytes.toString('base64'),encoded:encoded.bytes.toString('base64')}),encoding:'utf8',maxBuffer:1024*1024});
 assert.equal(processResult.status,0,'Pillow lossless oracle failed; set PYTHON_BIN to a Python with Pillow. '+(processResult.stderr||processResult.error||''));const pixelProof=JSON.parse(processResult.stdout);
 const proof={artifactSha256:manifest.output.sha256,canonical:original.relative,canonicalSha256:original.hash,mode:encoded.mode,encodedTarget:encoded.target,referenceSha256:digest(encoded.bytes),referenceMime:encoded.mime,...pixelProof};
 return{uri:'data:'+encoded.mime+';base64,'+encoded.bytes.toString('base64'),proof};
}
module.exports={artifact,imageReference};
