'use strict';
/* ===== CONFIG (edit here only) ===== */
const CFG={
 name:'REGIMENT',
 desc:'Raptors Chapter — Personal Identity Record\nOne chapter. Infinite identities.',
 postUrl:'https://github.com/mdimrankhanalpha/Raptors/blob/main/Post.txt',
 images:[
  'https://github.com/mdimrankhanalpha/Raptors/blob/main/file_000000006ba48211b843be786dd522d8.png',
  'https://github.com/mdimrankhanalpha/Raptors/blob/main/file_00000000aad481fab372c5be6d3148f7.png',
  'https://github.com/mdimrankhanalpha/Raptors/blob/main/file_00000000aea881f8a57c1791491baeb8.png'],
 shuffleMs:5000,refreshMs:60000,batch:10,pBatch:24,baseId:'7400000000000001'};
const $=id=>document.getElementById(id);
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ===== GitHub URL conversion ===== */
function toRaw(u){
 u=u.trim();
 const m=u.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/(?:blob|raw)\/(.+?)(?:\?.*)?$/i);
 return m?`https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`:u;
}

/* ===== Profile image shuffle ===== */
const Shuffle=(()=>{
 let urls,cur=-1,front=0,timer=null,els;
 const next=()=>{let n;do{n=Math.floor(Math.random()*urls.length)}while(urls.length>1&&n===cur);return n};
 function show(i){
  const img=els[1-front];img.src=urls[i];
  const go=()=>{img.classList.add('show');els[front].classList.remove('show');front=1-front;cur=i};
  (img.decode?img.decode().catch(()=>{}):Promise.resolve()).then(go);
 }
 function tick(){show(next());}
 function start(){if(!timer)timer=setInterval(tick,CFG.shuffleMs)}
 function stop(){clearInterval(timer);timer=null}
 return{init(){
  urls=CFG.images.map(toRaw);els=[$('picA'),$('picB')];
  urls.forEach(u=>{const i=new Image();i.src=u});
  els[0].classList.add('show');els[0].src=urls[cur=next()];
  start();
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 }};
})();

/* ===== Post parsing ===== */
/* Rule: a line containing only "$" separates posts. Write "\$" for a literal $ inside text. */
function parsePosts(txt){
 const out=[];let cur=[];
 const push=()=>{const b=cur.join('\n').replace(/^\s+|\s+$/g,'');if(b)out.push(b.replace(/\\\$/g,'$'));cur=[]};
 for(const l of txt.replace(/\r\n?/g,'\n').split('\n')){if(l.trim()==='$')push();else cur.push(l)}
 push();return out;
}
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)+s.length};
const kind=u=>{const p=u.split(/[?#]/)[0].toLowerCase();
 if(/\.(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(p))return'img';
 if(/\.(mp4|webm|mov|m4v|ogv)$/.test(p))return'vid';
 if(/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/.test(p))return'aud';return''};

/* ===== Media: images ===== */
const imgIO='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){imgIO.unobserve(e.target);loadImg(e.target)}}),{rootMargin:'400px'}):null;
function loadImg(box){
 box.innerHTML='';box.classList.remove('ok');
 const i=new Image();i.decoding='async';i.alt='';
 i.onload=()=>{box.classList.add('ok');box.appendChild(i)};
 i.onerror=()=>{box.innerHTML='<button class="rt">Image failed — retry</button>';box.querySelector('button').onclick=ev=>{ev.stopPropagation();loadImg(box)}};
 i.src=box.dataset.src;
}
function gallery(urls){
 const g=document.createElement('div');g.className='gal n'+Math.min(urls.length,3);
 urls.forEach((u,k)=>{const b=document.createElement('div');b.className='ph';b.dataset.src=u;
  b.onclick=()=>{if(b.classList.contains('ok'))Viewer.open(urls,k)};
  g.appendChild(b);imgIO?imgIO.observe(b):loadImg(b)});
 return g;
}
/* ===== Media: video (no download until user presses play) ===== */
function video(u){
 const v=document.createElement('video');v.controls=true;v.preload='none';v.playsInline=true;v.src=u;
 v.onerror=()=>{const d=document.createElement('p');d.className='muted';d.textContent='Video unavailable: '+u;v.replaceWith(d)};
 return v;
}
/* ===== Media: audio ===== */
const fmt=t=>isFinite(t)?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):'0:00';
function audio(u){
 const d=document.createElement('div');d.className='aud';
 const name=decodeURIComponent(u.split(/[?#]/)[0].split('/').pop());
 d.innerHTML=`<div class="t">${esc(name)}</div><button class="pl">&#9654;</button><input class="sk" type="range" min="0" max="100" value="0" aria-label="Progress"><span class="tm">0:00 / 0:00</span><input class="v" type="range" min="0" max="1" step=".05" value="1" aria-label="Volume"><a href="${esc(u)}" download target="_blank" rel="noopener">Download</a>`;
 const a=new Audio();a.preload='none';a.src=u;const $$=s=>d.querySelector(s);
 const upd=()=>{$$('.tm').textContent=fmt(a.currentTime)+' / '+fmt(a.duration);if(a.duration)$$('.sk').value=a.currentTime/a.duration*100};
 $$('.pl').onclick=()=>a.paused?a.play().catch(()=>$$('.t').textContent='Audio unavailable'):a.pause();
 a.onplay=()=>$$('.pl').innerHTML='&#10074;&#10074;';a.onpause=a.onended=()=>$$('.pl').innerHTML='&#9654;';
 a.ontimeupdate=upd;a.onloadedmetadata=upd;a.onerror=()=>$$('.t').textContent='Audio unavailable: '+name;
 $$('.sk').oninput=e=>{if(a.duration)a.currentTime=e.target.value/100*a.duration};
 $$('.v').oninput=e=>a.volume=e.target.value;
 return d;
}
/* ===== Post rendering ===== */
function linkify(s){return esc(s).replace(/(https?:\/\/[^\s<]+)/g,u=>`<a href="${u}" target="_blank" rel="noopener">${u}</a>`)}
function renderPost(raw){
 const el=document.createElement('article');el.className='post';el.dataset.h=hash(raw);
 const imgs=[],vids=[],auds=[],txt=[];
 raw.split('\n').forEach(l=>{const t=l.trim();
  if(/^https?:\/\/\S+$/.test(t)){const u=toRaw(t),k=kind(u);if(k==='img')return imgs.push(u);if(k==='vid')return vids.push(u);if(k==='aud')return auds.push(u)}
  txt.push(l)});
 const body=txt.join('\n').trim();
 if(body){const p=document.createElement('p');p.innerHTML=linkify(body);el.appendChild(p)}
 if(imgs.length)el.appendChild(gallery(imgs));
 vids.forEach(u=>el.appendChild(video(u)));auds.forEach(u=>el.appendChild(audio(u)));
 return el;
}
/* ===== Image viewer ===== */
const Viewer=(()=>{let list=[],i=0;const m=$('modal'),b=$('mbody');
 function draw(){b.innerHTML='';const im=new Image();im.src=list[i];im.onclick=()=>im.classList.toggle('z');b.appendChild(im);
  $('mcount').textContent=(i+1)+' / '+list.length;$('mp').hidden=$('mn').hidden=list.length<2}
 const close=()=>{m.hidden=true;b.innerHTML=''};
 $('mx').onclick=close;m.onclick=e=>{if(e.target===m)close()};
 $('mp').onclick=()=>{i=(i-1+list.length)%list.length;draw()};$('mn').onclick=()=>{i=(i+1)%list.length;draw()};
 document.addEventListener('keydown',e=>{if(m.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')$('mp').click();if(e.key==='ArrowRight')$('mn').click()});
 return{open(l,k){list=l;i=k;m.hidden=false;draw()},showHtml(h){list=[];m.hidden=false;b.innerHTML=h;$('mcount').textContent='';$('mp').hidden=$('mn').hidden=true}};
})();
/* ===== Infinite scroll engine (IntersectionObserver + scroll/timer fallback) ===== */
function scroller(sentinel,fn,active){
 let busy=false;
 const check=()=>{if(busy||!active())return;const r=sentinel.getBoundingClientRect();
  if(r.top<innerHeight+1500){busy=true;const y=scrollY;fn();if(Math.abs(scrollY-y)>1)scrollTo(0,y);busy=false}};
 if('IntersectionObserver'in window)new IntersectionObserver(check,{rootMargin:'1500px'}).observe(sentinel);
 addEventListener('scroll',check,{passive:true});addEventListener('resize',check);setInterval(check,1000);
 return check;
}
/* ===== Feed + refresh ===== */
const Feed=(()=>{
 let posts=[],rendered=0,fails=0,loading=false;const feed=$('feed');
 function more(){const f=document.createDocumentFragment();let n=0;
  while(rendered<posts.length&&n<CFG.batch){f.appendChild(renderPost(posts[rendered++]));n++}
  if(n)feed.appendChild(f)}
 function sync(next){
  const old=posts;posts=next;$('pcount').textContent=posts.length;
  const kids=feed.children;
  for(let i=0;i<Math.min(rendered,posts.length);i++){ // replace only changed items (never touches unchanged/playing media)
   if(kids[i]&&kids[i].dataset.h!==hash(posts[i]))kids[i].replaceWith(renderPost(posts[i]))}
  while(rendered>posts.length){feed.lastChild.remove();rendered--}
  if(old.length===0)more();
 }
 async function load(manual){
  if(loading)return;loading=true;const st=$('pstatus');
  try{
   const res=await fetch(toRaw(CFG.postUrl)+'?t='+Date.now(),{cache:'no-store'});
   if(res.status===429||res.status===403)throw new Error('Rate limited by GitHub');
   if(!res.ok)throw new Error('HTTP '+res.status);
   sync(parsePosts(await res.text()));fails=0;
   st.textContent='';
  }catch(e){
   fails++;st.textContent=(navigator.onLine?'Could not load posts: ':'Offline: ')+e.message+(posts.length?' — showing last known posts':' — retrying');
   if(fails<4)setTimeout(()=>load(),Math.min(30000,2000*2**fails));
  }finally{loading=false}
 }
 return{init(){
  load();setInterval(()=>{if(!document.hidden)load()},CFG.refreshMs);
  addEventListener('online',()=>load());
  scroller($('feedEnd'),more,()=>!$('profile').hidden);
 },load};
})();

/* ===== Deterministic personnel generation ===== */
const H=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const SQ=['Tactical','Scout','Infiltrator','Eliminator','Assault','Heavy Support','Veteran','Veteran Sergeant','Lieutenant','Captain','Chapter Command','Apothecary','Techmarine','Chaplain','Librarian','Armour Specialist','Vehicle Crew','Tank Commander','Dreadnought Pilot','Recon Intelligence','Communications','Logistics','Fleet','Honour Guard'];
// [role, ranks, weapon, armour, equipment, scope, spec]  scope: S=squad C=company H=chapter X=specialist
const R=[
['Tactical Marine',['Battle-Brother'],'Bolter','Mk VII Aquila, forest camouflage','Auspex, frag grenades','S','Line infantry'],
['Scout Marine',['Neophyte Scout'],'Scout bolter, combat knife','Scout carapace, ghillie cloak','Cameleoline cloak, magnoculars','S','Forward reconnaissance'],
['Infiltrator',['Battle-Brother'],'Marksman bolt carbine','Phobos armour, camouflage','Comms jammer, helix gauntlet','S','Behind-lines infiltration'],
['Eliminator',['Battle-Brother'],'Las fusil, bolt sniper','Phobos armour, ghillie hood','Camo cloak, scope array','S','Precision elimination'],
['Assault Marine',['Battle-Brother'],'Bolt pistol, chainsword','Mk VI Corvus, jump pack','Jump pack, melta bombs','S','Close assault'],
['Heavy Support Marine',['Battle-Brother'],'Heavy bolter, missile launcher','Reinforced Mk VII, ammo rig','Ammo hoist, targeter','S','Fire support'],
['Veteran',['Veteran Brother'],'Combi-weapon, power sword','Mk VIII, veteran markings','Chapter honours, auspex','S','Elite shock'],
['Veteran Sergeant',['Veteran Sergeant'],'Plasma pistol, power fist','Mk VIII, sergeant crest','Squad vox, banner staff','S','Squad leadership'],
['Lieutenant',['Lieutenant'],'Master-crafted bolter, power sword','Artificer armour, command markings','Command vox, tactical slate','C','Company officer'],
['Captain',['Captain'],'Master-crafted bolt pistol, power axe','Artificer armour, captain crest','Company banner, vox array','C','Company command'],
['Chapter Command Personnel',['Chapter Master','Master of the Watch','Chapter Champion'],'Relic blade, storm bolter','Relic artificer armour','Chapter seal, strategium link','H','Chapter strategy'],
['Apothecary',['Apothecary'],'Bolt pistol, reductor','White-trim Mk VII, narthecium','Narthecium, gene-seed vials','X','Battlefield medicine'],
['Techmarine',['Techmarine'],'Plasma cutter, servo-arm','Artificer armour, servo-harness','Servo-arm, rites kit','X','Machine rites'],
['Chaplain',['Chaplain'],'Crozius arcanum, bolt pistol','Skull-helm black armour','Rosarius, reclusiam litany','X','Spiritual guidance'],
['Librarian',['Librarian'],'Force staff, bolt pistol','Psychic hood armour','Psychic hood, force staff','X','Psychic warfare'],
['Armour Specialist',['Armour Specialist'],'Melta gun, bolter','Heavy workshop plate','Repair rig, vehicle manifests','X','Armour maintenance'],
['Vehicle Crew',['Crew Brother'],'Bolter, storm bolter','Crew armour','Vehicle intercom, repair kit','X','Vehicle operation'],
['Tank Commander',['Armour Commander'],'Turret battle cannon, storm bolter','Commander armour, cupola gear','Cupola vox, tactical map','X','Armoured command'],
['Dreadnought Pilot',['Interred Brother'],'Twin autocannon, power fist','Dreadnought sarcophagus','Life-support cradle','X','Walker warfare'],
['Intelligence & Reconnaissance Specialist',['Recon Specialist'],'Silenced bolter','Light Phobos, camouflage','Auspex array, cipher slate','X','Intelligence analysis'],
['Communications Specialist',['Vox Specialist'],'Bolter','Standard armour, vox-pack','Long-range vox, cipher','X','Vox relay'],
['Logistics Officer',['Logistics Brother'],'Bolt pistol','Utility armour','Cargo slate, supply seals','X','Supply chain'],
['Fleet Personnel',['Fleet Brother'],'Bolt pistol, boarding axe','Voidsuit armour','Void comm, ship keys','X','Strike cruiser duty'],
['Honour Guard',['Honour Guard'],'Power halberd, bolt pistol','Ornate Mk VIII, honour plate','Chapter banner, ceremonial seal','H','Command protection']];
const N1=['Aurel','Corvin','Dravis','Evander','Falk','Gaius','Hesper','Ivar','Jorun','Kael','Lucan','Marek','Nerus','Orsin','Pavel','Quill','Rhys','Sevran','Talos','Ulric','Varek','Wystan','Xavian','Yorick','Zeno'];
const N2=['Ravenscar','Thorne','Vael','Hollis','Draken','Ashfall','Grimwald','Skarn','Morrow','Falconer','Blackmere','Stormhand','Ironwood','Nightwing','Veyra','Coldharbour'];
const CALL=['Talon','Shade','Owl','Reaper','Fang','Gale','Hollow','Ember','Ghost','Thorn','Wraith','Crow','Strike','Mire','Hawk','Veil'];
const STAT=['Active','Deployed','Reserve','Recovering','Missing in Action','Killed in Action'];
const OPS=['Siege of Vael Ridge','Purge of Hollow Marsh','Battle of Ashfall Spire','Culling of Thorne Basin','Defence of Cold Harbour','Night Hunt of Kharn','Reclamation of Nerus Gate','Forest Strike on Mire-9','Relief of Orsin Keep','Ghost Run of Draken Pass'];
const norm=s=>s.replace(/^0+(?=\d)/,'');
const SVGS={};
function photo(role,seed){
 const k=role+seed%3;if(SVGS[k])return SVGS[k];
 const ab=role.split(/[ &]+/).map(w=>w[0]).join('').slice(0,3).toUpperCase();
 return SVGS[k]='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84"><rect width="84" height="84" fill="#101B15"/><path d="M0 84V60l20-8 22-6 22 6 20 8v24z" fill="#18271D"/><path d="M26 52V30c0-10 8-18 16-18s16 8 16 18v22l-8 6H34z" fill="#080A09" stroke="#A8ACA7" stroke-width="1.5"/><rect x="31" y="31" width="9" height="3" fill="#A51E25"/><rect x="44" y="31" width="9" height="3" fill="#A51E25"/><text x="42" y="75" font-size="10" fill="#A8ACA7" text-anchor="middle" font-family="Georgia">${ab}</text></svg>`);
}
function gen(id){
 id=norm(id);const r=rng(H(id)),pick=a=>a[Math.floor(r()*a.length)];
 const ri=Math.floor(r()*R.length),role=R[ri],sc=role[5];
 const name=pick(N1)+' '+pick(N2),call=pick(CALL),co=1+Math.floor(r()*10);
 const company=sc==='H'?'Chapter Command':ordinal(co)+' Company';
 const sq=sc==='S'?'Squad '+(1+Math.floor(r()*10))+' ('+role[0].split(' ')[0]+')':sc==='C'?'Company Staff':sc==='H'?'Chapter Staff':'Specialist Corps';
 const start=720+Math.floor(r()*230),st=pick(STAT);
 const stages=['Recruited from the Raptors recruitment worlds','Completed Scout trials and training','Initial assignment as '+(role[5]==='S'?'Scout brother':'initiate')+' in '+company,'First deployment'];
 const ops=2+Math.floor(r()*3),opsList=[];
 for(let i=0;i<ops;i++)opsList.push(pick(OPS));
 stages.push('Promoted to full battle-brother','Specialist training: '+role[6]);
 opsList.forEach(o=>stages.push('Took part in '+o));
 stages.push('Assigned as '+role[1][Math.floor(r()*role[1].length)]);
 const ys=[start];for(let i=1;i<stages.length;i++)ys.push(Math.min(999,ys[i-1]+Math.floor(r()*((999-ys[i-1])/(stages.length-i)+1))));
 const rank=role[1][Math.floor(r()*role[1].length)];
 const dead=st==='Killed in Action';
 const tl=stages.map((s,i)=>({y:ys[i],t:s}));
 if(dead)tl.push({y:999,t:'Killed in action'});
 return{id,name,call,rank,role:role[0],company,sq,spec:role[6],start,born:start-12-Math.floor(r()*6)+'.M41 (gene-seed induction)',status:st,
  gear:role[4],armour:role[3],weapon:role[2],tl,ops:opsList,
  ach:[r()<.5?'Chapter Honour Marker':'Mention in dispatches',r()<.3?'Vael Ridge Commendation':'Service Stripe '+(1+Math.floor(r()*5))],
  assign:dead?'None — interred':st==='Deployed'?'Forward deployment, '+pick(OPS):'Garrison, '+company,
  bio:`${name}, callsign "${call}", serves the Raptors as ${role[0]} (${rank}) of ${company}, specialising in ${role[6].toLowerCase()}.`,
  img:photo(role[0],ri)};
}
function ordinal(n){return n+(['th','st','nd','rd'][(n%10>3||(n>10&&n<14))?0:n%10]||'th')}
const recHtml=p=>`<div class="rec"><img src="${p.img}" alt=""><h2>${esc(p.name)}</h2><p>${esc(p.bio)}</p><dl><dt>ID</dt><dd>${p.id}</dd><dt>Callsign</dt><dd>${esc(p.call)}</dd><dt>Rank</dt><dd>${esc(p.rank)}</dd><dt>Profession</dt><dd>${esc(p.role)}</dd><dt>Company</dt><dd>${esc(p.company)}</dd><dt>Squad</dt><dd>${esc(p.sq)}</dd><dt>Specialization</dt><dd>${esc(p.spec)}</dd><dt>Service start</dt><dd>${p.start}.M41</dd><dt>Birth record</dt><dd>${p.born}</dd><dt>Status</dt><dd>${p.status}</dd><dt>Assignment</dt><dd>${esc(p.assign)}</dd><dt>Armour</dt><dd>${esc(p.armour)}</dd><dt>Weapons</dt><dd>${esc(p.weapon)}</dd><dt>Equipment</dt><dd>${esc(p.gear)}</dd></dl><h3>Timeline</h3><ul>${p.tl.map(e=>`<li>${e.y}.M41 — ${esc(e.t)}</li>`).join('')}</ul><h3>Operations</h3><ul>${p.ops.map(o=>`<li>${esc(o)}</li>`).join('')}</ul><h3>Achievements</h3><ul>${p.ach.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>`;
const openRec=p=>Viewer.showHtml(recHtml(p));
function card(p){const c=document.createElement('div');c.className='card';c.tabIndex=0;
 c.innerHTML=`<img src="${p.img}" alt=""><div><h3>${esc(p.name)} "${esc(p.call)}"</h3><small>ID ${p.id}</small><small>${esc(p.rank)} · ${esc(p.role)}</small><small>${esc(p.company)} · ${esc(p.sq)}</small><small class="${p.status==='Active'||p.status==='Deployed'?'':'st'}">${p.status}</small></div>`;
 c.onclick=()=>openRec(p);c.onkeydown=e=>{if(e.key==='Enter')openRec(p)};return c}
const Raptors=(()=>{let nextId=BigInt(CFG.baseId);
 const idAt=n=>(BigInt(CFG.baseId)+BigInt(n)).toString();
 function more(){const f=document.createDocumentFragment();for(let i=0;i<CFG.pBatch;i++){f.appendChild(card(gen(nextId.toString())));nextId++}$('people').appendChild(f)}
 let cache=null;
 const all=()=>cache||(cache=Array.from({length:3000},(_,i)=>gen(idAt(i))));
 function find(q){q=q.trim();if(!q)return[];const out=[];
  if(/^\d+$/.test(q))out.push(gen(q)); // exact ID, string only, any length
  const l=q.toLowerCase();
  for(const p of all()){if(out.length>=30)break;if(p.id===q)continue;
   if([p.name,p.call,p.rank,p.role,p.company,p.sq,p.spec,p.status,p.id].some(v=>v.toLowerCase().includes(l)))out.push(p)}
  return out}
 return{init(){more();scroller($('pEnd'),more,()=>!$('raptors').hidden)},find};
})();

/* ===== Navigation + search ===== */
const Nav=(()=>{
 function go(v){const r=v==='raptors';$('profile').hidden=r;$('raptors').hidden=!r;
  $('nRaptors').hidden=r;$('search').hidden=true;scrollTo(0,0)}
 return{init(){
  $('back').onclick=()=>go('profile');
  $('nRaptors').onclick=()=>go('raptors');
  $('nSearch').onclick=()=>{const s=$('search');s.hidden=!s.hidden;if(!s.hidden)$('q').focus()};
  $('qx').onclick=()=>$('search').hidden=true;
  let t;$('q').oninput=e=>{clearTimeout(t);t=setTimeout(()=>{
   const res=$('res');res.innerHTML='';
   Raptors.find(e.target.value).forEach(p=>{const d=document.createElement('div');d.textContent=`${p.id} — ${p.name} "${p.call}" · ${p.rank} · ${p.role} · ${p.status}`;d.onclick=()=>openRec(p);res.appendChild(d)});
   if(!res.children.length&&e.target.value.trim())res.textContent='No matching personnel.'},120)};
 }};
})();

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded',()=>{
 document.title=CFG.name+' — The Infinite Raptors Universe';
 $('pname').textContent=CFG.name;$('pdesc').textContent=CFG.desc;
 Shuffle.init();Nav.init();Raptors.init();Feed.init();
});
