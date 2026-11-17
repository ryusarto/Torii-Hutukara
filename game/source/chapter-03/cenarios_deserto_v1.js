/* Chapter-3-only visual variants. Never mutate area objects, gates, flags or saves.
 * The compiler chooses the C3 library once; A11/A12 remain the original assets.
 */
'use strict';
const CenariosDesertoV1={
 active(){return !!G&&C3.AREAS.includes(G.area)&&CenariosV2.manifest.theme==='deserto-v1'},
 ensure(area=G?.area){
  if(!area||!C3.AREAS.includes(area))return;
  const groups={D11:['sky_terminal','distortion_district','sky_lift','cloud_terrace','last_torii'],D12:C3.AREAS,D13:['ciro_workshop','sky_canal','sky_lift']};
  for(const [id,places]of Object.entries(groups))if(places.includes(area)&&CenariosV2.manifest.sheets[id])CenariosV2.image(id);
 },
 binding(p){
  const type=p.env2GroundType||p.type;
  if(type==='c3_elevator')return {item:G.c3.liftOpen?'c3_desert_elevator_open':'c3_desert_elevator_closed',display:[142,132]};
  if(type==='c3_sanctuary'&&G.area==='cloud_terrace')return {item:'c3_desert_terrace_landmark',display:[212,166]};
  if(type==='env2_prop'&&p.item==='checkpoint_recorder')return {item:'c3_desert_checkpoint_recorder',display:[p.w,p.h]};
  const simple={c3_club:['club_facade',220,176],c3_workshop:['workshop_facade',190,132],c3_lamp:['lamp',70,126],c3_neon_lamp:['lamp',70,126],c3_neon_utility:['utility',108,144]};
  const v=simple[type];if(v)return {item:'c3_desert_'+v[0],display:v.slice(1)};
  const extra={"c3_bench":["c3_desert_bench",96,58],"c3_planter":["c3_desert_planter",96,54],"c3_crates":["c3_desert_crates",82,72],"c3_vending":["c3_desert_vending",60,88],"c3_railing":["c3_desert_railing",106,58],"c3_drain":["c3_desert_drain",72,38],"c3_kiosk":["c3_desert_kiosk",68,80],"c3_workbench":["c3_desert_workbench",154,88],"c3_flute_rack":["c3_desert_flute_rack",112,78],"c3_wind_console":["c3_desert_wind_console",82,92],"c3_tuning_machine":["c3_desert_tuning_machine",86,84],"c3_interference / c3_interference_calm":["c3_desert_interference_calm",92,96],"c3_broken_pipe":["c3_desert_broken_pipe",96,76],"c3_lift_console":["c3_desert_lift_console",104,76],"c3_wind_receiver":["c3_desert_wind_receiver",82,98],"c3_bass_lock":["c3_desert_bass_lock",92,68]};
  if(type==='checkpointStone')return {item:'c3_desert_kiosk',display:[46,60]};
  const key=type==='c3_interference'&&(G.c3.canalPath||G.c3.canalDone)?'c3_interference_calm':type,entry=extra[key];
  return entry?{item:entry[0],display:entry.slice(1)}:null;
 }
};
const desertEnsureV1=CenariosV2.ensure;
CenariosV2.ensure=function(area=G?.area){desertEnsureV1.call(this,area);CenariosDesertoV1.ensure(area)};
const desertPropV1=drawProp;
drawProp=function(p,cx,cy){
 if(!CenariosDesertoV1.active())return desertPropV1(p,cx,cy);
 CenariosDesertoV1.ensure();const binding=CenariosDesertoV1.binding(p);
 if(binding&&CenariosV2.manifest.items[binding.item]){
  const x=(p.x+.5)*T-cx,y=(p.y+.65)*T-cy;
  if(CenariosV2.sprite(binding.item,x,y,...binding.display))return;
 }
 return desertPropV1(p,cx,cy);
};
