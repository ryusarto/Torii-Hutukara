/* Palette-only transformation explicitly requested by the user.
 * No resize, interpolation, drawing, blur, alpha editing, or geometry operation.
 * Input PNGs remain untouched; root promotes the audited copies afterwards.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const sharp=require('sharp');
const BASE=__dirname;
const CONTEXT='contextos/c3_deserto';
const DEST=path.join(BASE,CONTEXT);
const HEROES=['ryuchi_percussionista','franco_sintetizador'];
const DEFAULT_RECIPE={
 version:1,label:'C3 · deserto, poeira e ferrugem',operation:'selective RGB palette lookup only',
 date:'2026-11-17',
 anchors:{areia:'#C3A06C',poeira:'#DFC49A',ferrugem:'#9A5537',ferrugem_escura:'#6E3F2A',aco:'#53524A',carvao:'#282724',osso:'#F0E0BD',oxidacao:'#626B53',sombra:'#3F5155',ciano_funcional:'#6CC1BC',ambar:'#E7B26B',rosa_residual:'#C27C85'},
 selection:{blueHue:[205,270],purpleHue:[270,315],minimumHslSaturation:.20,minimumValue:48/255,minimumAlpha:16},
 protection:{warmHueMaximum:80,warmHairHueMinimum:320,lowSaturationMaximum:.20,darkValueMaximum:48/255,functionalCyanHue:[155,205],brightBlueHue:[205,230],brightBlueMinimumValue:.72,brightBlueMinimumHslSaturation:.40,francoHairDominantColors:32},
 heroes:{
  ryuchi_percussionista:{blue:{anchor:'sombra',highlightAnchor:'sombra',strength:.68,saturationSource:.55,saturationAnchor:.25,saturationMinimum:.14,saturationMaximum:.40,lightnessScale:.98,lightnessOffset:.002,hueVariation:.10},purple:{anchor:'aco',highlightAnchor:'poeira',strength:.84,saturationSource:.18,saturationAnchor:.40,saturationMinimum:.04,saturationMaximum:.20,lightnessScale:.97,lightnessOffset:.003,hueVariation:.04}},
  franco_sintetizador:{blue:{anchor:'sombra',highlightAnchor:'aco',strength:.70,saturationSource:.35,saturationAnchor:.30,saturationMinimum:.08,saturationMaximum:.30,lightnessScale:.98,lightnessOffset:.003,hueVariation:.06},purple:{anchor:'ferrugem',highlightAnchor:'areia',strength:.84,saturationSource:.50,saturationAnchor:.15,saturationMinimum:.18,saturationMaximum:.50,lightnessScale:.98,lightnessOffset:.003,hueVariation:.10}}
 },
 collisionPolicy:'Injective per-hero RGB lookup. Reserve every unchanged visible color; nearest free RGB preserves distinct color clusters.',
 geometryPolicy:'Same pixel coordinates/dimensions/alpha byte-for-byte; exact RGBA equality boundaries audited after PNG encoding.',
 notes:['The anchors guide garment ramps; no global sepia filter is applied.','Warm skin, ivory mask, goggles, dominant warm hair, gold and functional cyan remain unchanged.','Source shading steps are mapped consistently by RGB, never interpolated across pixels.']
};
const recipeFile=path.join(DEST,'PALETA_C3_DESERTO.json');
const recipeArg=process.argv.indexOf('--recipe');
const recipe=recipeArg>=0?JSON.parse(fs.readFileSync(process.argv[recipeArg+1],'utf8')):fs.existsSync(recipeFile)?JSON.parse(fs.readFileSync(recipeFile,'utf8')):DEFAULT_RECIPE;
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
const key=(r,g,b)=>(r<<16)|(g<<8)|b;
const unpack=k=>[(k>>>16)&255,(k>>>8)&255,k&255];
const hex=s=>[parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
const writeJson=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n')};
function hsl(r,g,b){r/=255;g/=255;b/=255;const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,l=(hi+lo)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=hi===r?60*(((g-b)/d)%6):hi===g?60*((b-r)/d+2):60*((r-g)/d+4);if(h<0)h+=360}return {h,s,l,v:hi}}
function rgb(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else [r,g,b]=[c,0,x];return [r,g,b].map(v=>Math.round(clamp(v+m)*255))}
function filesIn(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?filesIn(path.join(folder,e.name)):e.name.endsWith('.png')?[path.join(folder,e.name)]:[])}
function inventory(){const result=[];for(const [folder,kind] of [['atlas','atlas'],['retratos','portrait'],['originais','source']])for(const file of filesIn(path.join(BASE,folder)).sort()){
 const relative=path.relative(BASE,file).split(path.sep).join('/');const hero=HEROES.find(h=>relative.includes(h));if(!hero)throw Error('Unknown hero: '+relative);
 const parts=relative.split('/');const basename=path.basename(file,'.png');const id=kind==='portrait'?`${parts[1]}_${parts[2]}_portrait_${basename}`:basename;
 result.push({kind,key:id,hero,baseFile:relative,contextFile:CONTEXT+'/'+relative,file});
 }return result}
async function raw(file){const result=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});if(result.info.channels!==4)throw Error('Expected RGBA');return result}
async function hairColors(){const {data,info}=await raw(path.join(BASE,'atlas/franco_sintetizador_unmasked_idle.png'));const counts=new Map();for(let y=45;y<101;y++)for(let x=77;x<179;x++){
 const i=(y*info.width+x)*4;if(data[i+3]<200)continue;const color=key(data[i],data[i+1],data[i+2]);const c=hsl(...unpack(color));if(!(c.h>=320||c.h<=80||c.v<=.25))continue;counts.set(color,(counts.get(color)||0)+1)
 }return new Set([...counts].sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,recipe.protection.francoHairDominantColors).map(p=>p[0]))}
const reasonNames=['darkOutline','warmSkinHairGoldIvory','lowSaturationNeutral','functionalCyan','dominantHair','outsideGarmentSelection','nearTransparent'];
function classify(color,hero,hair){const c=hsl(...unpack(color)),p=recipe.protection,s=recipe.selection;let mask=0;
 if(c.v<=p.darkValueMaximum)mask|=1;
 if(c.h<=p.warmHueMaximum||c.h>=p.warmHairHueMinimum)mask|=2;
 if(c.s<=p.lowSaturationMaximum)mask|=4;
 if(c.h>=p.functionalCyanHue[0]&&c.h<=p.functionalCyanHue[1]||c.h>=p.brightBlueHue[0]&&c.h<=p.brightBlueHue[1]&&c.v>=p.brightBlueMinimumValue&&c.s>=p.brightBlueMinimumHslSaturation)mask|=8;
 if(hero==='franco_sintetizador'&&hair.has(color))mask|=16;
 let family=null;if(c.h>=s.blueHue[0]&&c.h<s.blueHue[1])family='blue';else if(c.h>=s.purpleHue[0]&&c.h<=s.purpleHue[1])family='purple';
 if(!family||c.s<s.minimumHslSaturation||c.v<s.minimumValue)mask|=32;
 return {protected:mask!==0,mask,family,...c};
}
function desired(color,classification,hero){const cfg=recipe.heroes[hero][classification.family];const a=hsl(...hex(recipe.anchors[cfg.anchor])),z=hsl(...hex(recipe.anchors[cfg.highlightAnchor]));const t=clamp((classification.l-.50)/.35);const targetH=(a.h+(z.h-a.h)*t+(classification.h-(classification.family==='blue'?237.5:292.5))*cfg.hueVariation+360)%360;const targetS=clamp(classification.s*cfg.saturationSource+a.s*cfg.saturationAnchor,cfg.saturationMinimum,cfg.saturationMaximum);const targetL=clamp(classification.l*cfg.lightnessScale+cfg.lightnessOffset);const target=rgb(targetH,targetS,targetL);return unpack(color).map((v,i)=>Math.round(clamp(v+(target[i]-v)*cfg.strength,0,255)))}
const shells=new Map();
function offsets(radius){if(!shells.has(radius)){const values=[];for(let r=-radius;r<=radius;r++)for(let g=-radius;g<=radius;g++)for(let b=-radius;b<=radius;b++)if(Math.max(Math.abs(r),Math.abs(g),Math.abs(b))===radius)values.push([r,g,b]);values.sort((a,b)=>a.reduce((s,v)=>s+v*v,0)-b.reduce((s,v)=>s+v*v,0)||a[0]-b[0]||a[1]-b[1]||a[2]-b[2]);shells.set(radius,values)}return shells.get(radius)}
class ReservedColors{constructor(){this.flags=new Uint8Array(1<<24);this.size=0;this.cursors=new Map()}has(color){return this.flags[color]!==0}add(color){if(!this.flags[color]){this.flags[color]=1;this.size++}}}
let searchOffsets;
function nearestFree(target,reserved){
 const original=key(...target);if(!reserved.flags[original])return {color:original,distance:0};
 if(!searchOffsets){const values=[0,0,0];for(let radius=1;radius<=24;radius++)for(const shift of offsets(radius))values.push(...shift);searchOffsets=Int8Array.from(values)}
 const count=searchOffsets.length/3,begin=reserved.cursors.get(original)||0,r=target[0],g=target[1],b=target[2];
 for(let n=begin;n<count;n++){const j=n*3,dr=searchOffsets[j],dg=searchOffsets[j+1],db=searchOffsets[j+2],rr=r+dr,gg=g+dg,bb=b+db;if(rr<0||rr>255||gg<0||gg>255||bb<0||bb>255)continue;const candidate=(rr<<16)|(gg<<8)|bb;if(!reserved.flags[candidate]){reserved.cursors.set(original,n+1);return {color:candidate,distance:Math.sqrt(dr*dr+dg*dg+db*db)}}}
 throw Error('Palette collision requires artistic review')
}
function alphaBytes(data){const alpha=Buffer.allocUnsafe(data.length/4);for(let i=0,j=0;i<data.length;i+=4,j++)alpha[j]=data[i+3];return alpha}
function clusterMask(data,width,height){const mask=Buffer.allocUnsafe(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const p=y*width+x,i=p*4;let value=0;if(x+1<width){const j=i+4;if((data[i+3]||data[j+3])&&data[i]===data[j]&&data[i+1]===data[j+1]&&data[i+2]===data[j+2]&&data[i+3]===data[j+3])value|=1}if(y+1<height){const j=i+width*4;if((data[i+3]||data[j+3])&&data[i]===data[j]&&data[i+1]===data[j+1]&&data[i+2]===data[j+2]&&data[i+3]===data[j+3])value|=2}mask[p]=value
 }return mask}
async function preview(){
 const cards=[];for(const hero of HEROES)for(const variant of ['unmasked','masked'])cards.push({hero,variant,key:`${hero}_${variant}_idle`});
 const w=1152,h=744,tile=288;const parts=[];
 const labels=[];labels.push('<text x="24" y="35" fill="#efe5d0" font-size="22">C3 · comparação de paleta (mesmos frames e pixels)</text>');
 labels.push('<text x="24" y="77" fill="#aaa5a0" font-size="16">ANTES</text><text x="24" y="403" fill="#d9b786" font-size="16">DESERTO / POEIRA / FERRUGEM</text>');
 for(let c=0;c<cards.length;c++){
  const card=cards[c];labels.push(`<text x="${c*tile+16}" y="105" fill="#d6c9b3" font-size="15">${card.hero.startsWith('ryuchi')?'Ryuchi Percussionista':'Franco Sintetizador'} · ${card.variant==='masked'?'máscara':'rosto'}</text>`);
  for(let row=0;row<2;row++){
   const source=path.join(row?DEST:BASE,'atlas',card.key+'.png');const input=await sharp(source).extract({left:0,top:0,width:256,height:256}).png().toBuffer();parts.push({input,left:c*tile+16,top:116+row*326});
  }
 }
 let swatchX=24;for(const [label,color] of Object.entries(recipe.anchors)){labels.push(`<rect x="${swatchX}" y="710" width="56" height="14" fill="${color}"/>`);swatchX+=76}
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#1b1917"/>${labels.join('')}</svg>`);
 await sharp(svg).composite(parts).png().toFile(path.join(DEST,'PREVIA_COMPARATIVA.png'));
}
async function main(){
 fs.mkdirSync(DEST,{recursive:true});writeJson(recipeFile,recipe);const files=inventory();const actual=Object.fromEntries(['atlas','portrait','source'].map(k=>[k,files.filter(f=>f.kind===k).length]));if(actual.atlas!==52||actual.portrait!==32||actual.source!==56)throw Error('Incomplete inventory: '+JSON.stringify(actual));
 const hair=await hairColors();const palettes=Object.fromEntries(HEROES.map(hero=>[hero,{colors:new Map(),classification:new Map(),forcedProtected:new Set(),lookup:new Map()}]));
 let n=0;for(const entry of files){const {data}=await raw(entry.file);const p=palettes[entry.hero];for(let i=0;i<data.length;i+=4){const alpha=data[i+3];if(!alpha)continue;const color=key(data[i],data[i+1],data[i+2]);p.colors.set(color,(p.colors.get(color)||0)+1);if(alpha<=recipe.selection.minimumAlpha)p.forcedProtected.add(color)}if(++n%20===0)console.log(`Inventory ${n}/${files.length}`)}
 const mappingAudit={};
 for(const hero of HEROES){const p=palettes[hero],reserved=new ReservedColors(),selected=[];for(const [color,count] of p.colors){const classification=classify(color,hero,hair);if(p.forcedProtected.has(color)){classification.protected=true;classification.mask|=64}p.classification.set(color,classification);if(classification.protected)reserved.add(color);else selected.push([color,count])}selected.sort((a,b)=>b[1]-a[1]||a[0]-b[0]);console.log(`Mapping ${hero}: ${selected.length} garment colors, ${reserved.size} protected colors`);let collisions=0,maxDelta=0,assigned=0;for(const [color] of selected){const target=desired(color,p.classification.get(color),hero);const mapped=nearestFree(target,reserved);p.lookup.set(color,mapped.color);reserved.add(mapped.color);if(mapped.distance){collisions++;maxDelta=Math.max(maxDelta,mapped.distance)}if(++assigned%50000===0)console.log(`Mapped ${hero} ${assigned}/${selected.length}`)}
  const pairs=Buffer.allocUnsafe(p.lookup.size*8);let i=0;for(const [from,to] of [...p.lookup].sort((a,b)=>a[0]-b[0])){pairs.writeUInt32BE(from,i);pairs.writeUInt32BE(to,i+4);i+=8}mappingAudit[hero]={inputVisibleColors:p.colors.size,selectedColors:p.lookup.size,protectedVisibleColors:p.colors.size-p.lookup.size,outputPaletteInjective:reserved.size===p.colors.size,collisionsResolved:collisions,maxCollisionRgbDistance:maxDelta,mappingSha256:sha(pairs)};if(!mappingAudit[hero].outputPaletteInjective)throw Error('Palette merge detected')
 }
 const entries=[];n=0;for(const entry of files){const {data,info}=await raw(entry.file);const output=Buffer.from(data),p=palettes[entry.hero];let changed=0,protectedPixels=0,opaqueProtectedPixels=0;const reasonCounts=Object.fromEntries(reasonNames.map(reason=>[reason,0]));
  for(let i=0;i<data.length;i+=4){const a=data[i+3];if(!a)continue;const color=key(data[i],data[i+1],data[i+2]),classification=p.classification.get(color);if(classification.protected){protectedPixels++;if(a===255)opaqueProtectedPixels++;for(let bit=0;bit<reasonNames.length;bit++)if(classification.mask&(1<<bit))reasonCounts[reasonNames[bit]]++;continue}const mapped=p.lookup.get(color),values=unpack(mapped);if(mapped!==color){output[i]=values[0];output[i+1]=values[1];output[i+2]=values[2];changed++}}
  const out=path.join(BASE,entry.contextFile);fs.mkdirSync(path.dirname(out),{recursive:true});await sharp(output,{raw:{width:info.width,height:info.height,channels:4}}).png({compressionLevel:9,adaptiveFiltering:false}).toFile(out);
  const decoded=await raw(out);if(decoded.info.width!==info.width||decoded.info.height!==info.height)throw Error('Dimension changed');let alphaDiff=0,protectedChanged=0,opaqueProtectedChanged=0,zeroAlphaRgbChanged=0,outsideSelectionChanged=0;
  for(let i=0;i<data.length;i+=4){alphaDiff=Math.max(alphaDiff,Math.abs(data[i+3]-decoded.data[i+3]));const rgbChanged=data[i]!==decoded.data[i]||data[i+1]!==decoded.data[i+1]||data[i+2]!==decoded.data[i+2];if(!data[i+3]){if(rgbChanged)zeroAlphaRgbChanged++;continue}if(p.classification.get(key(data[i],data[i+1],data[i+2])).protected&&rgbChanged){protectedChanged++;outsideSelectionChanged++;if(data[i+3]===255)opaqueProtectedChanged++}}
  const baseAlpha=sha(alphaBytes(data)),contextAlpha=sha(alphaBytes(decoded.data)),baseCluster=sha(clusterMask(data,info.width,info.height)),contextCluster=sha(clusterMask(decoded.data,info.width,info.height));const record={kind:entry.kind,key:entry.key,hero:entry.hero,baseFile:entry.baseFile,contextFile:entry.contextFile,width:info.width,height:info.height,baseSha256:sha(fs.readFileSync(entry.file)),contextSha256:sha(fs.readFileSync(out)),baseAlphaSha256:baseAlpha,contextAlphaSha256:contextAlpha,baseClusterSha256:baseCluster,contextClusterSha256:contextCluster,geometryEqual:alphaDiff===0&&baseAlpha===contextAlpha,pixelCoordinatesPreserved:true,rgbaAlphaMaxDiff:alphaDiff,shadingClustersPreserved:baseCluster===contextCluster,changedPixels:changed,protectedPixels,opaqueProtectedPixels,protectedPixelsChanged:protectedChanged,opaqueProtectedPixelsChanged:opaqueProtectedChanged,zeroAlphaRgbChanged,outsideSelectionPixelsChanged:outsideSelectionChanged,protectedReasonCounts:reasonCounts};
  if(!record.geometryEqual||!record.shadingClustersPreserved||protectedChanged||zeroAlphaRgbChanged)throw Error('Pixel preservation failed: '+entry.baseFile);entries.push(record);if(++n%10===0)console.log(`Palette ${n}/${files.length}`);
 }
 const audit={version:1,date:recipe.date,label:recipe.label,recipe:CONTEXT+'/PALETA_C3_DESERTO.json',recipeSha256:sha(fs.readFileSync(recipeFile)),generator:'gerar_paleta_c3.cjs',counts:actual,files:entries.length,paletteMappings:mappingAudit,hairDominantProtectedRgb:[...hair].map(color=>unpack(color)),entries,pixelGeometryPreserved:entries.every(e=>e.geometryEqual&&e.shadingClustersPreserved&&e.protectedPixelsChanged===0),summary:{changedPixels:entries.reduce((s,e)=>s+e.changedPixels,0),protectedPixels:entries.reduce((s,e)=>s+e.protectedPixels,0),opaqueProtectedPixels:entries.reduce((s,e)=>s+e.opaqueProtectedPixels,0),protectedPixelsChanged:entries.reduce((s,e)=>s+e.protectedPixelsChanged,0),outsideSelectionPixelsChanged:entries.reduce((s,e)=>s+e.outsideSelectionPixelsChanged,0),maxAlphaDifference:Math.max(...entries.map(e=>e.rgbaAlphaMaxDiff)),clusterFailures:entries.filter(e=>!e.shadingClustersPreserved).length}};
 writeJson(path.join(DEST,'AUDITORIA_GEOMETRIA.json'),audit);const context={label:recipe.label,atlas:{},portraits:{},paletteRecipe:CONTEXT+'/PALETA_C3_DESERTO.json',geometryAudit:CONTEXT+'/AUDITORIA_GEOMETRIA.json',pixelGeometryPreserved:audit.pixelGeometryPreserved};for(const entry of entries){if(entry.kind==='atlas')context.atlas[entry.key]=entry.contextFile;if(entry.kind==='portrait')context.portraits[entry.key]=entry.contextFile}writeJson(path.join(BASE,'CONTEXTO_C3_DESERTO.json'),context);await preview();console.log(JSON.stringify({complete:true,files:entries.length,counts:actual,...audit.summary,pixelGeometryPreserved:audit.pixelGeometryPreserved,preview:CONTEXT+'/PREVIA_COMPARATIVA.png'}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
