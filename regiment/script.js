'use strict';
/* ===== CONFIG (edit here only) ===== */
const CFG={
 name:'Raptors',
 desc:'Raptors Chapter — Personal Identity Record\nOne chapter. Infinite identities.',
 postUrl:'https://github.com/mdimrankhanalpha/Raptors/blob/main/Post.txt',
 images:[
  'https://github.com/mdimrankhanalpha/Raptors/blob/main/file_000000006ba48211b843be786dd522d8.png',
  'https://github.com/mdimrankhanalpha/Raptors/blob/main/file_00000000aad481fab372c5be6d3148f7.png',
  'https://github.com/mdimrankhanalpha/Raptors/blob/main/file_00000000aea881f8a57c1791491baeb8.png'],
 shuffleMs:5000,rolePhotos:{}, /* optional real photos: {'Eliminator':['https://github.com/USER/REPO/blob/main/sniper1.png']} */
 refreshMs:60000,batch:10,pBatch:24,baseId:'7400000000000001'};
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
 let tk=false;addEventListener('scroll',()=>{if(!tk){tk=true;requestAnimationFrame(()=>{tk=false;check()})}},{passive:true});addEventListener('resize',check);setInterval(()=>{if(!document.hidden)check()},1500);
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
/* Portrait generator: unique per ID (seed), styled by role and rank. Optional real photos: CFG.rolePhotos */
const LV=[1,0,1,1,1,1,2,3,4,5,6,2,2,3,3,2,1,3,3,2,1,1,1,3];
function photo(ri,seed,lv){
 const pool=CFG.rolePhotos&&CFG.rolePhotos[R[ri][0]];
 if(pool&&pool.length)return toRaw(pool[seed%pool.length]);
 const r=rng(seed),P=(a,b)=>a+r()*(b-a),v=(seed>>1)%3,F='#0b0d0c',S='#A8ACA7',L='#303A2A';
 const rifle=(long)=>`<g transform="rotate(-18 80 140)"><rect x="${long?-20:10}" y="134" width="${long?200:150}" height="7" fill="${F}" stroke="${L}"/><rect x="40" y="124" width="30" height="9" rx="3" fill="${F}" stroke="${L}"/><circle cx="70" cy="128" r="4.5" fill="#A51E25"/><rect x="60" y="140" width="24" height="12" fill="${F}"/></g>`;
 const cam=[1,2,3,19].includes(ri),hood=cam||ri===14;
 let o=`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a21"/><stop offset="1" stop-color="#070908"/></linearGradient><radialGradient id="e"><stop offset="0" stop-color="#ff4047"/><stop offset="1" stop-color="#A51E25" stop-opacity="0"/></radialGradient><radialGradient id="vg" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-opacity="0"/><stop offset="1" stop-opacity=".75"/></radialGradient><path id="a" d="M8 34c6-14 20-24 40-22l8 6-10 2 6 6-12 0 4 8-12-4 2 10-8-8-6 8z"/><path id="pl" d="M12 160Q6 112 38 100Q56 96 62 106V160Z"/><path id="pr" d="M148 160Q154 112 122 100Q104 96 98 106V160Z"/><clipPath id="c"><use href="#pl"/><use href="#pr"/></clipPath></defs><rect width="160" height="160" fill="url(#g)"/>`;
 o+=v===0?'<circle cx="32" cy="30" r="15" fill="#D5D8D3" opacity=".8"/><circle cx="40" cy="26" r="11" fill="#1b2a21" opacity=".35"/>':v===1?'<path d="M0 100V40h14v-8h12v8h10v60zM118 100V30h10V18h10v12h22v70z" fill="#0d1410"/>':'<path d="M20 0V110M52 0V90M132 0V100" stroke="#0e1711" stroke-width="7"/>';
 o+=`<path d="M112 0h40v70l-20-10-20 10z" fill="#0c120e" stroke="${L}"/><use href="#a" transform="translate(116 6) scale(.52)" fill="${S}" opacity=".75"/><g transform="${seed&1?'translate(160 0) scale(-1 1)':''}">`;
 const EX={4:`<rect x="38" y="84" width="14" height="24" fill="${F}"/><rect x="108" y="84" width="14" height="24" fill="${F}"/><path d="M122 160L142 96" stroke="${S}" stroke-width="5" stroke-dasharray="3 2"/>`,
 5:`<rect x="14" y="128" width="130" height="14" rx="4" fill="${F}" stroke="${L}"/><rect x="136" y="122" width="20" height="26" fill="${F}" stroke="${L}"/><path d="M26 152h100" stroke="${S}" stroke-dasharray="3 3"/>`,
 12:`<circle cx="36" cy="46" r="15" stroke="${S}" stroke-dasharray="3 2" fill="none"/><path d="M122 104Q150 84 140 50" stroke="${L}" stroke-width="6" fill="none"/><path d="M133 50l7-10 7 10" stroke="${S}" fill="none"/>`,
 13:`<path d="M138 34V160" stroke="${S}" stroke-width="4"/><circle cx="138" cy="28" r="8" fill="${S}"/>`,
 14:`<circle cx="80" cy="56" r="44" fill="url(#e)" opacity=".22"/><path d="M140 20V160" stroke="${S}" stroke-width="3"/>`,
 15:`<path d="M22 100l34 34" stroke="${S}" stroke-width="5"/><circle cx="20" cy="98" r="7" fill="none" stroke="${S}" stroke-width="3"/>`,
 16:`<path d="M104 60V24" stroke="${S}" stroke-width="2"/><path d="M58 60q-8 4 0 14" stroke="${S}" stroke-width="3" fill="none"/>`,
 17:`<rect x="96" y="66" width="70" height="9" fill="${F}" transform="rotate(-14 96 66)"/><ellipse cx="80" cy="152" rx="76" ry="14" fill="${F}" stroke="${S}"/>`,
 20:`<path d="M52 92V10M108 92V22" stroke="${S}"/>`,21:`<rect x="100" y="118" width="46" height="32" fill="${L}" stroke="${S}"/><path d="M123 118v32" stroke="${S}"/>`,
 22:`<circle cx="134" cy="38" r="17" fill="#050706" stroke="${S}" stroke-width="3"/><circle cx="128" cy="34" r="1.5" fill="#D5D8D3"/>`,
 10:`<path d="M138 20V160" stroke="${S}" stroke-width="3"/><path d="M132 22l6-14 6 14z" fill="${S}"/>`,23:`<path d="M138 20V160" stroke="${S}" stroke-width="3"/><path d="M132 22l6-14 6 14z" fill="${S}"/>`};
 if(ri===18){o+=`<rect x="34" y="36" width="92" height="88" rx="12" fill="#131c16" stroke="${S}"/><rect x="54" y="54" width="52" height="24" fill="#050706"/><circle cx="68" cy="66" r="9" fill="url(#e)"/><circle cx="92" cy="66" r="9" fill="url(#e)"/><rect x="6" y="100" width="34" height="50" rx="6" fill="${F}" stroke="${S}"/><rect x="120" y="100" width="34" height="50" rx="6" fill="${F}" stroke="${S}"/><use href="#a" transform="translate(52 84) scale(.6)" fill="${S}" opacity=".8"/>`;}
 else{
  o+=EX[ri]||'';
  if(hood)o+=`<path d="M50 62Q48 16 80 16Q112 16 110 62L122 112L98 98L80 110L62 98L38 112Z" fill="${ri===14?'#1c2420':'#2c3a22'}"/>`;
  if(cam)for(let i=0;i<14;i++)o+=`<ellipse cx="${P(58,102)}" cy="${P(24,60)}" rx="${P(3,7)}" ry="${P(2,5)}" fill="${['#1a2a1d','#4a5a32','#0a0f0b'][i%3]}"/>`;
  o+=`<use href="#pl" fill="#131c16" stroke="${S}" stroke-width=".6"/><use href="#pr" fill="#131c16" stroke="${S}" stroke-width=".6"/>`;
  if(cam)for(let i=0;i<22;i++)o+=`<ellipse clip-path="url(#c)" cx="${P(8,152)}" cy="${P(96,160)}" rx="${P(3,8)}" ry="${P(2,6)}" fill="${['#1f3322','#33452a','#090c0a'][i%3]}"/>`;
  o+=`<rect x="62" y="96" width="36" height="64" fill="#0f1712"/><circle cx="80" cy="122" r="5" fill="${S}" opacity=".8"/><use href="#a" transform="translate(20 106) scale(.55)" fill="${S}" opacity=".85"/>`;
  for(let i=0;i<Math.min(lv,6);i++)o+=`<path d="M112 ${112+i*5}l9 4 9-4" stroke="${S}" stroke-width="1.6" fill="none"/>`;
  if(ri===9||ri===8||ri===10||ri===23)o+=`<path d="M62 36Q80 ${ri===9?-8:8} 98 36Z" fill="#761E20"/>`;
  if(ri===11)o+=`<path d="M62 100h-0" /><path d="M80 112v14M73 119h14" stroke="#A51E25" stroke-width="4"/>`;
  o+=`<rect x="64" y="90" width="32" height="10" fill="#0a0d0b"/>`;
  if(ri===13)o+=`<path d="M60 50Q60 26 80 26Q100 26 100 50V76Q100 88 90 92H70Q60 88 60 76Z" fill="#090b0a" stroke="${L}"/><ellipse cx="80" cy="62" rx="15" ry="19" fill="#cfd2cc"/><ellipse cx="73" cy="58" rx="4.5" ry="5.5" fill="#050706"/><ellipse cx="87" cy="58" rx="4.5" ry="5.5" fill="#050706"/><circle cx="73" cy="58" r="1.6" fill="#A51E25"/><circle cx="87" cy="58" r="1.6" fill="#A51E25"/><path d="M78 68l2 5 2-5zM72 80h16" stroke="#050706" fill="#050706"/>`;
  else o+=`<path d="M60 50Q60 28 80 28Q100 28 100 50V76Q100 88 90 92H70Q60 88 60 76Z" fill="#17221a" stroke="${L}" stroke-width="1.5"/><path d="M70 74h20v14H70z" fill="#0a0d0b"/><path d="M73 76v10M77 76v10M81 76v10M85 76v10" stroke="${S}" stroke-width=".8"/><circle cx="71" cy="56" r="9" fill="url(#e)" opacity=".55"/><circle cx="89" cy="56" r="9" fill="url(#e)" opacity=".55"/><ellipse cx="71" cy="56" rx="5.5" ry="2.4" fill="#A51E25"/><ellipse cx="89" cy="56" rx="5.5" ry="2.4" fill="#A51E25"/><path d="M60 40Q80 34 100 40" stroke="#000" stroke-width="6" opacity=".25" fill="none"/>`;
  if(ri===7)o+=`<path d="M80 28v18" stroke="#761E20" stroke-width="5"/>`;if(ri===11)o+=`<path d="M80 28v18" stroke="#D5D8D3" stroke-width="5"/>`;
  if(ri===6)o+=`<path d="M60 44h5M60 49h6M60 54h5" stroke="${S}" stroke-width="1.5"/>`;
  if(ri===19)o+=`<circle cx="70" cy="132" r="8" fill="${F}" stroke="${S}"/><circle cx="90" cy="132" r="8" fill="${F}" stroke="${S}"/>`;
  if([0,1].includes(ri))o+=rifle(false);if([2,3].includes(ri))o+=rifle(true);
 }
 for(let i=0;i<7;i++){const x=P(10,150),y=P(20,150);o+=`<path d="M${x} ${y}l${P(-9,9)} ${P(3,9)}" stroke="#D5D8D3" opacity=".12"/>`}
 o+=`</g><rect width="160" height="160" fill="url(#vg)"/><rect x=".5" y=".5" width="159" height="159" fill="none" stroke="${S}" opacity=".45"/>`;
 return'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">${o}</svg>`);
}
function gen(id){
 id=norm(id);const seed=H(id),r=rng(seed),pick=a=>a[Math.floor(r()*a.length)];
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
  get img(){return photo(ri,seed,LV[ri])}};
}
function ordinal(n){return n+(['th','st','nd','rd'][(n%10>3||(n>10&&n<14))?0:n%10]||'th')}
const recHtml=p=>`<div class="rec"><img src="${p.img}" alt=""><h2>${esc(p.name)}</h2><p>${esc(p.bio)}</p><dl><dt>ID</dt><dd>${p.id}</dd><dt>Callsign</dt><dd>${esc(p.call)}</dd><dt>Rank</dt><dd>${esc(p.rank)}</dd><dt>Profession</dt><dd>${esc(p.role)}</dd><dt>Company</dt><dd>${esc(p.company)}</dd><dt>Squad</dt><dd>${esc(p.sq)}</dd><dt>Specialization</dt><dd>${esc(p.spec)}</dd><dt>Service start</dt><dd>${p.start}.M41</dd><dt>Birth record</dt><dd>${p.born}</dd><dt>Status</dt><dd>${p.status}</dd><dt>Assignment</dt><dd>${esc(p.assign)}</dd><dt>Armour</dt><dd>${esc(p.armour)}</dd><dt>Weapons</dt><dd>${esc(p.weapon)}</dd><dt>Equipment</dt><dd>${esc(p.gear)}</dd></dl><h3>Timeline</h3><ul>${p.tl.map(e=>`<li>${e.y}.M41 — ${esc(e.t)}</li>`).join('')}</ul><h3>Operations</h3><ul>${p.ops.map(o=>`<li>${esc(o)}</li>`).join('')}</ul><h3>Achievements</h3><ul>${p.ach.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>`;
const openRec=p=>Viewer.showHtml(recHtml(p));
function card(p){const c=document.createElement('div');c.className='card';c.tabIndex=0;
 c.innerHTML=`<img src="${p.img}" alt=""><div><h3>${esc(p.name)} "${esc(p.call)}"</h3><small>ID ${p.id}</small><small>${esc(p.rank)} · ${esc(p.role)}</small><small>${esc(p.company)} · ${esc(p.sq)}</small><small class="${p.status==='Active'||p.status==='Deployed'?'':'st'}">${p.status}</small></div>`;
 c.onclick=()=>openRec(p);c.onkeydown=e=>{if(e.key==='Enter')openRec(p)};return c}
const Raptors=(()=>{let nextId=BigInt(CFG.baseId);
 const idAt=n=>(BigInt(CFG.baseId)+BigInt(n)).toString();
 let pend=false;function more(){if(pend)return;pend=true;let n=0;(function step(){const f=document.createDocumentFragment();for(let i=0;i<6;i++){f.appendChild(card(gen(nextId.toString())));nextId++}$('people').appendChild(f);n+=6;if(n<CFG.pBatch)requestAnimationFrame(step);else pend=false})()}
 let cache=null;
 const all=()=>cache||(cache=Array.from({length:3000},(_,i)=>gen(idAt(i))));
 function find(q){q=q.trim();if(!q)return[];const out=[];
  if(/^\d+$/.test(q))out.push(gen(q)); // exact ID, string only, any length
  const l=q.toLowerCase();
  for(const p of all()){if(out.length>=30)break;if(p.id===q)continue;
   if([p.name,p.call,p.rank,p.role,p.company,p.sq,p.spec,p.status,p.id].some(v=>v.toLowerCase().includes(l)))out.push(p)}
  return out}
 return{init(){more();setTimeout(more,400);scroller($('pEnd'),more,()=>!$('raptors').hidden)},find};
})();

/* ===== Navigation + search ===== */
const Nav=(()=>{
 let started=false;
 function go(v){const r=v==='raptors';if(r&&!started){started=true;Raptors.init()}$('profile').hidden=r;$('raptors').hidden=!r;
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

/* ===== Effects (cheap, compositor-only) ===== */
const Fx=(()=>{
 function init(){
  const root=document.documentElement;
  if((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2))root.classList.add('lite');
  document.addEventListener('visibilitychange',()=>root.classList.toggle('paused',document.hidden));
  if(!reduced&&!root.classList.contains('lite')){const e=$('embers');
   for(let i=0;i<14;i++){const s=document.createElement('i');s.style.cssText=`left:${Math.random()*100}%;animation-delay:${-Math.random()*14}s;animation-duration:${9+Math.random()*10}s;--s:${.5+Math.random()*1.2}`;e.appendChild(s)}}
  const p=$('prog');let raf=0;
  addEventListener('scroll',()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;const h=document.documentElement.scrollHeight-innerHeight;p.style.transform='scaleX('+(h>0?scrollY/h:0)+')'})},{passive:true});
 }
 return{init};
})();
/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded',()=>{
 document.title=CFG.name+' — The Infinite Raptors Universe';
 $('pname').textContent=CFG.name;$('pdesc').textContent=CFG.desc;
 Fx.init();Shuffle.init();Nav.init();Feed.init();
});
