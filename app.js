const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const STORE = "rr_state_v2";
const DEFAULT_REST = 90;

const ICONS = {
  dumbbell: "./assets/svgs/dumbbell.svg",
  ezbar: "./assets/svgs/ezbar.svg",
  cable: "./assets/svgs/cable.svg",
  mobility: "./assets/svgs/mobility.svg",
};

const WEIGHTS = [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32];

function hhmm(){
  const d=new Date();
  return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}

function beep(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type="sine"; o.frequency.value=880;
    g.gain.value=0.0001;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.25);
    o.stop(ctx.currentTime+0.28);
    setTimeout(()=>ctx.close(), 350);
  }catch(e){}
}

function slug(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""); }
function deepClone(x){ return JSON.parse(JSON.stringify(x)); }

function ex(name, cues){
  return { id: slug(name), name, cues, anim:"./assets/lottie/loop.json", sets: defaultSets() };
}
function defaultSets(){
  return Array.from({length:5}).map(()=>({reps:8, kg:8, done:false}));
}

const WORKOUTS = [
  {
    id:"db_ppl", type:"main", title:"Dumbbell PPL",
    tags:[{k:"dumbbell",t:"Dumbbells"},{k:"dumbbell",t:"Bench"}],
    days:[
      {id:"legs", title:"Legs", exercises:[
        ex("Goblet Squat","Chest up, slow down, full depth"),
        ex("Bulgarian Split Squat","Knee tracks toes, control"),
        ex("DB Romanian Deadlift","Hips back, hamstrings stretch"),
        ex("Leg Extension (Ironmaster)","Pause top, slow down"),
        ex("Hamstring Curl (Ironmaster)","Hips down, squeeze"),
      ]},
      {id:"push", title:"Push", exercises:[
        ex("Flat Dumbbell Bench Press","Shoulders down, elbows ~45°, control"),
        ex("Incline Dumbbell Press","Upper chest, no bounce"),
        ex("Seated DB Shoulder Press","Ribs down, full range"),
        ex("DB Lateral Raise","Slight lean, no swing"),
        ex("Cable Triceps Pressdown (Ironmaster)","Elbows stable, full extension"),
      ]},
      {id:"pull", title:"Pull", exercises:[
        ex("Chin Up / Pull Up (Ironmaster)","Full hang, chest to bar"),
        ex("One-Arm DB Row","Pull to hip, pause"),
        ex("Cable Lat Pulldown (Ironmaster)","Elbows down, lats"),
        ex("DB Curl","No swing, full supination"),
        ex("Cable Face Pull (Ironmaster)","To eyes, external rotation"),
      ]},
    ]
  },
  {
    id:"ez_full", type:"main", title:"EZ Bar Full Body",
    tags:[{k:"ezbar",t:"EZ Bar"},{k:"dumbbell",t:"Bench"}],
    days:[
      {id:"full", title:"Full Body", exercises:[
        ex("EZ Bar Romanian Deadlift","Hips back, hamstrings"),
        ex("EZ Bar Bench Press","Control descent"),
        ex("EZ Bar Row","Pause top"),
        ex("EZ Bar Overhead Press","Ribs down"),
        ex("EZ Bar Curl","No swing"),
        ex("Crunch Attachment","Slow reps, exhale"),
      ]}
    ]
  },
  { id:"pelvic", type:"comp", title:"Pelvic Tilt Reset", tags:[{k:"mobility",t:"Reset"}],
    days:[{id:"pelvic", title:"Pelvic Tilt", exercises:[
      ex("90/90 Breathing","Ribs down, long exhale"),
      ex("Hip Flexor Stretch","Posterior tilt, squeeze glute"),
      ex("Glute Bridge Hold","Tuck pelvis, squeeze"),
    ]}]
  },
  { id:"posture", type:"comp", title:"Posture Reset", tags:[{k:"mobility",t:"Reset"}],
    days:[{id:"posture", title:"Posture", exercises:[
      ex("Wall Slides","Ribs down, slow"),
      ex("Chin Tucks","Long neck, hold"),
      ex("Face Pull (Cable)","Elbows high, squeeze"),
    ]}]
  },
  { id:"mobility", type:"comp", title:"Mobility Flow", tags:[{k:"mobility",t:"Flow"}],
    days:[{id:"mobility", title:"Mobility Flow", exercises:[
      ex("Cat-Cow","Slow spine"),
      ex("World's Greatest Stretch","Breathe"),
      ex("Thoracic Rotations","Open chest"),
    ]}]
  },
  { id:"balance", type:"comp", title:"Balance", tags:[{k:"mobility",t:"Equilibrium"}],
    days:[{id:"balance", title:"Balance", exercises:[
      ex("Single-Leg Stand","Barefoot if safe"),
      ex("Single-Leg RDL (Bodyweight)","Hips square"),
      ex("Heel-Toe Walk","Slow and steady"),
    ]}]
  },
];

function initState(){
  const raw = localStorage.getItem(STORE);
  if(raw){ try { return JSON.parse(raw); } catch(e){} }
  const s = {
    tab:"home",
    active:null,
    history:[],
    settings:{ restSec: DEFAULT_REST, sound:true, weightStep:2 }
  };
  localStorage.setItem(STORE, JSON.stringify(s));
  return s;
}
let STATE = initState();

function save(){ localStorage.setItem(STORE, JSON.stringify(STATE)); }
function setTab(t){ STATE.tab=t; save(); render(); }

function toast(msg){
  const t=document.createElement("div");
  t.className="toast show";
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.remove("show"), 1400);
  setTimeout(()=>t.remove(), 1800);
}

function render(){
  const root=$("#app");
  root.innerHTML="";
  const container=document.createElement("div");
  container.className="container";

  if(STATE.tab==="home") container.appendChild(renderHome());
  if(STATE.tab==="workout") container.appendChild(renderWorkout());
  if(STATE.tab==="history") container.appendChild(renderHistory());
  if(STATE.tab==="settings") container.appendChild(renderSettings());

  root.appendChild(container);
  root.appendChild(renderNav());
  root.appendChild(renderEditModal());
  root.appendChild(renderDemoModal());
}

function sectionTitle(t){
  const d=document.createElement("div");
  d.className="sectionTitle";
  d.textContent=t;
  return d;
}

function renderHome(){
  const w=document.createElement("div");

  const top=document.createElement("div");
  top.className="topIcon";
  const img=document.createElement("img");
  img.src=ICONS.dumbbell;
  img.alt="Dumbbell";
  top.appendChild(img);

  const h1=document.createElement("div");
  h1.className="h1";
  h1.textContent="Ricardo\nRoutine";
  h1.style.whiteSpace="pre-line";

  const h2=document.createElement("div");
  h2.className="h2";
  h2.textContent="Choose your workout";

  w.appendChild(top); w.appendChild(h1); w.appendChild(h2);

  w.appendChild(sectionTitle("MAIN WORKOUTS"));
  WORKOUTS.filter(x=>x.type==="main").forEach(x=>w.appendChild(workoutCard(x)));

  w.appendChild(sectionTitle("COMPLEMENTARY"));
  WORKOUTS.filter(x=>x.type==="comp").forEach(x=>w.appendChild(workoutCard(x,true)));

  return w;
}

function workoutCard(wk, small=false){
  const c=document.createElement("div");
  c.className="card";

  const row=document.createElement("div");
  row.className="cardRow";

  const left=document.createElement("div");
  const title=document.createElement("div");
  title.style.fontSize= small ? "28px":"34px";
  title.style.fontWeight="950";
  title.textContent=wk.title;

  const pills=document.createElement("div");
  pills.className="pills";
  (wk.tags||[]).forEach(tag=>{
    const p=document.createElement("div");
    p.className="pill pillIcon";
    const i=document.createElement("img");
    i.src=ICONS[tag.k]||ICONS.dumbbell;
    const s=document.createElement("span");
    s.textContent=tag.t;
    p.appendChild(i); p.appendChild(s);
    pills.appendChild(p);
  });
  left.appendChild(title); left.appendChild(pills);

  const right=document.createElement("div");
  right.style.display="flex";
  right.style.flexDirection="column";
  right.style.alignItems="flex-end";
  right.style.gap="10px";

  const isActive = STATE.active && STATE.active.workoutId===wk.id;
  if(isActive){
    const b=document.createElement("div");
    b.className="badge";
    b.textContent="ACTIVE";
    right.appendChild(b);
  }

  const btn=document.createElement("button");
  btn.className="btn btnPrimary";
  btn.textContent= isActive ? "RESUME":"START";
  btn.onclick=()=>startWorkout(wk.id);
  right.appendChild(btn);

  row.appendChild(left); row.appendChild(right);
  c.appendChild(row);

  const line=document.createElement("div");
  line.className="small";
  line.textContent= isActive ? `Current: ${activeDayTitle()}` : `Next: ${wk.days[0].title}`;
  c.appendChild(line);

  return c;
}

function getWorkout(id){ return WORKOUTS.find(w=>w.id===id); }
function getDay(wk, dayId){ return wk.days.find(d=>d.id===dayId) || wk.days[0]; }
function activeDayTitle(){
  const wk=getWorkout(STATE.active?.workoutId);
  if(!wk) return "";
  return getDay(wk, STATE.active.dayId).title;
}

function buildSession(wk){
  const data = {};
  wk.days.forEach(d=> data[d.id] = d.exercises.map(e=>deepClone(e)));
  return data;
}

function startWorkout(id){
  const wk=getWorkout(id);
  if(!wk) return;
  if(!STATE.active || STATE.active.workoutId!==id){
    STATE.active={
      workoutId:id,
      dayId:wk.days[0].id,
      startedAt:hhmm(),
      rest:{ running:false, endsAt:null, remaining: STATE.settings.restSec },
      data: buildSession(wk)
    };
    save();
  }
  STATE.tab="workout"; save(); render();
}

/* Rest timer */
let restInt=null;
function fmtRest(){
  const r=STATE.active.rest;
  const sec = r.running ? Math.max(0, Math.round((r.endsAt-Date.now())/1000)) : r.remaining;
  const m = String(Math.floor(sec/60));
  const s = String(sec%60).padStart(2,"0");
  return `${m}:${s}`;
}
function startRest(){
  const sec=STATE.settings.restSec;
  const r=STATE.active.rest;
  r.running=true;
  r.endsAt=Date.now()+sec*1000;
  r.remaining=sec;
  save();
}
function stopRest(silent=false){
  const r=STATE.active.rest;
  r.running=false; r.endsAt=null; r.remaining=STATE.settings.restSec;
  save();
  if(!silent) toast("Rest skipped");
}
function tickRest(){
  if(!STATE.active) return;
  const r=STATE.active.rest;
  const el=$("#restTime");
  if(!el) return;
  if(r.running){
    const rem=Math.max(0, Math.round((r.endsAt-Date.now())/1000));
    el.textContent=fmtRest();
    if(rem<=0){
      r.running=false; r.endsAt=null; r.remaining=STATE.settings.restSec;
      save();
      el.textContent=fmtRest();
      if(STATE.settings.sound) beep();
      toast("Rest done");
    }
  }else{
    el.textContent=fmtRest();
  }
}

function renderWorkout(){
  const wk=getWorkout(STATE.active?.workoutId);
  if(!wk){ setTab("home"); return renderHome(); }
  const day=getDay(wk, STATE.active.dayId);

  const wrap=document.createElement("div");
  const header=document.createElement("div");
  header.className="headerBar";
  const back=document.createElement("div");
  back.className="backLink";
  back.innerHTML="&#8592; Home";
  back.onclick=()=>setTab("home");
  const dash=document.createElement("div");
  dash.style.opacity=.75; dash.style.fontWeight=900;
  dash.textContent="Dashboard";
  header.appendChild(back); header.appendChild(dash);
  wrap.appendChild(header);

  const h1=document.createElement("div");
  h1.className="h1";
  h1.textContent=day.title;
  wrap.appendChild(h1);

  const started=document.createElement("div");
  started.className="h2";
  started.textContent=`Started: ${STATE.active.startedAt}`;
  wrap.appendChild(started);

  // rest pill
  const pill=document.createElement("div");
  pill.className="timerPill";
  const left=document.createElement("div");
  const lab=document.createElement("div");
  lab.style.fontWeight="950"; lab.style.opacity=.65; lab.textContent="REST";
  const time=document.createElement("div");
  time.className="timerBig"; time.id="restTime"; time.textContent=fmtRest();
  left.appendChild(lab); left.appendChild(time);
  const skip=document.createElement("button");
  skip.className="btn skipBtn"; skip.textContent="Skip";
  skip.onclick=()=>stopRest(true);
  pill.appendChild(left); pill.appendChild(skip);
  wrap.appendChild(pill);

  if(restInt) clearInterval(restInt);
  restInt=setInterval(tickRest, 300);

  const exList=STATE.active.data[day.id]||[];
  exList.forEach((exObj, exIndex)=>wrap.appendChild(renderExercise(day.id, exIndex, exObj)));

  const finish=document.createElement("button");
  finish.className="btn btnPrimary finishBtn";
  finish.textContent="FINISH WORKOUT";
  finish.onclick=finishWorkout;
  wrap.appendChild(finish);

  return wrap;
}

function renderExercise(dayId, exIndex, exObj){
  const c=document.createElement("div");
  c.className="card";

  const top=document.createElement("div");
  top.className="exerciseTop";
  const left=document.createElement("div");
  const title=document.createElement("div");
  title.className="exerciseTitle";
  title.textContent=exObj.name;
  const cue=document.createElement("div");
  cue.className="exerciseCue";
  cue.textContent=exObj.cues||"";
  left.appendChild(title); left.appendChild(cue);

  const play=document.createElement("div");
  play.className="playBtn";
  play.title="Show demo";
  const tri=document.createElement("div"); tri.className="playTri";
  play.appendChild(tri);
  play.onclick=()=>openDemo(exObj);

  top.appendChild(left); top.appendChild(play);

  const sub=document.createElement("div");
  sub.className="exerciseCue";
  sub.style.marginTop="10px"; sub.style.opacity=.7;
  sub.textContent="Work sets";

  c.appendChild(top); c.appendChild(sub);

  const grid=document.createElement("div");
  grid.className="setGrid";

  exObj.sets.forEach((s, setIndex)=>{
    const b=document.createElement("div");
    b.className="setBubble"+(s.done?" done":"");
    b.innerHTML=`<div class="setReps">${s.reps}</div><div class="setKg">${s.kg}kg</div>`;
    attachSetHandlers(b, dayId, exIndex, setIndex);
    grid.appendChild(b);
  });

  const add=document.createElement("div");
  add.className="setBubble addBubble";
  add.innerHTML=`<div class="setReps">+</div><div class="addLabel">Add</div>`;
  add.onclick=()=>addSet(dayId, exIndex);
  grid.appendChild(add);

  c.appendChild(grid);
  return c;
}

/* tap vs long press */
function attachSetHandlers(el, dayId, exIndex, setIndex){
  let t=null; let long=false;

  const start=()=>{ long=false; t=setTimeout(()=>{ long=true; openEdit(dayId, exIndex, setIndex); }, 420); };
  const end=()=>{ if(t) clearTimeout(t); if(!long) toggleDone(dayId, exIndex, setIndex); };

  el.addEventListener("touchstart", start, {passive:true});
  el.addEventListener("touchend", end);
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", end);
  el.addEventListener("mouseleave", ()=>{ if(t) clearTimeout(t); });
}

function setRef(dayId, exIndex, setIndex){
  return STATE.active.data[dayId][exIndex].sets[setIndex];
}
function toggleDone(dayId, exIndex, setIndex){
  const s=setRef(dayId, exIndex, setIndex);
  s.done=!s.done;
  if(s.done) startRest();
  save(); render();
}
function addSet(dayId, exIndex){
  const sets=STATE.active.data[dayId][exIndex].sets;
  const last=sets[sets.length-1]||{reps:8,kg:8};
  sets.push({reps:last.reps, kg:last.kg, done:false});
  save(); render();
}

/* Edit modal */
let EDIT=null;

function renderEditModal(){
  const bg=document.createElement("div");
  bg.className="modalBg";
  bg.id="editBg";
  bg.innerHTML=`
    <div class="modal">
      <div class="modalHeader">
        <div>
          <div class="modalTitle" id="editTitle">Edit Set</div>
          <div class="exerciseCue" id="editSub" style="margin-top:2px;">Reps and weight</div>
        </div>
        <button class="btn closeBtn" id="editClose">Close</button>
      </div>

      <div class="stepperRow">
        <button class="roundBtn" id="rMinus">−</button>
        <div style="text-align:center;">
          <div class="stepperLabel">REPS</div>
          <div class="stepperVal" id="rVal">8</div>
        </div>
        <button class="roundBtn" id="rPlus">+</button>
      </div>

      <div class="stepperRow" style="margin-top:12px;">
        <button class="roundBtn" id="kMinus">−</button>
        <div style="text-align:center;">
          <div class="stepperLabel">WEIGHT</div>
          <div class="stepperVal"><span id="kVal">8</span><span style="font-size:22px;opacity:.6;"> kg</span></div>
        </div>
        <button class="roundBtn" id="kPlus">+</button>
      </div>

      <div class="weightGrid" id="wGrid"></div>

      <div class="modalActions">
        <button class="btn btnGhost" id="editReset">Reset</button>
        <button class="btn btnPrimary btnOk" id="editOk">OK</button>
      </div>
    </div>
  `;
  setTimeout(()=>wireEdit(),0);
  bg.addEventListener("click",(e)=>{ if(e.target===bg) closeEdit(); });
  return bg;
}

function wireEdit(){
  const bg=$("#editBg");
  if(!bg) return;
  $("#editClose",bg).onclick=closeEdit;
  $("#rMinus",bg).onclick=()=>stepEdit("reps",-1);
  $("#rPlus",bg).onclick=()=>stepEdit("reps",+1);
  $("#kMinus",bg).onclick=()=>stepEdit("kg",-STATE.settings.weightStep);
  $("#kPlus",bg).onclick=()=>stepEdit("kg",+STATE.settings.weightStep);

  $("#editReset",bg).onclick=()=>{ if(!EDIT) return; EDIT.reps=8; EDIT.kg=8; updateEditUI(); };
  $("#editOk",bg).onclick=()=>{ applyEdit(); closeEdit(); };

  const grid=$("#wGrid",bg);
  grid.innerHTML="";
  WEIGHTS.forEach(v=>{
    const b=document.createElement("button");
    b.className="weightBtn";
    b.textContent=String(v);
    b.onclick=()=>{ if(!EDIT) return; EDIT.kg=v; updateEditUI(); };
    grid.appendChild(b);
  });
}

function openEdit(dayId, exIndex, setIndex){
  const exObj=STATE.active.data[dayId][exIndex];
  const s=exObj.sets[setIndex];
  EDIT={dayId, exIndex, setIndex, reps:s.reps, kg:s.kg, exName:exObj.name, setLabel:`Set ${setIndex+1}`};
  $("#editTitle").textContent=EDIT.setLabel;
  $("#editSub").textContent=EDIT.exName;
  updateEditUI();
  $("#editBg").classList.add("show");
}
function updateEditUI(){
  if(!EDIT) return;
  $("#rVal").textContent=String(EDIT.reps);
  $("#kVal").textContent=String(EDIT.kg);
  $$("#wGrid .weightBtn").forEach(btn=>btn.classList.toggle("active", btn.textContent===String(EDIT.kg)));
}
function stepEdit(field, delta){
  if(!EDIT) return;
  if(field==="reps") EDIT.reps=Math.max(1, Math.min(30, EDIT.reps+delta));
  if(field==="kg") EDIT.kg=Math.max(0, Math.min(200, EDIT.kg+delta));
  updateEditUI();
}
function applyEdit(){
  if(!EDIT) return;
  const s=setRef(EDIT.dayId, EDIT.exIndex, EDIT.setIndex);
  s.reps=EDIT.reps; s.kg=EDIT.kg;
  save(); render();
}
function closeEdit(){
  $("#editBg").classList.remove("show");
  EDIT=null;
}

/* Demo modal (Lottie loop) */
let DEMO=null;
function renderDemoModal(){
  const bg=document.createElement("div");
  bg.className="modalBg";
  bg.id="demoBg";
  bg.innerHTML=`
    <div class="modal">
      <div class="modalHeader">
        <div>
          <div class="modalTitle" id="demoTitle">Exercise Demo</div>
          <div class="exerciseCue" id="demoCue" style="margin-top:2px;"></div>
        </div>
        <button class="btn closeBtn" id="demoClose">Close</button>
      </div>

      <div style="margin-top:14px; border-radius:18px; border:1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); padding:14px;">
        <div id="lottieBox" style="width:100%; height:260px;"></div>
        <div style="display:flex; gap:12px; margin-top:12px;">
          <button class="btn btnGhost" id="demoPlay">Play</button>
          <button class="btn btnGhost" id="demoPause">Pause</button>
        </div>
      </div>

      <button class="btn btnPrimary finishBtn" id="demoOk" style="margin-top:14px;">OK</button>
    </div>
  `;
  setTimeout(()=>{
    $("#demoClose",bg).onclick=closeDemo;
    $("#demoOk",bg).onclick=closeDemo;
    $("#demoPlay",bg).onclick=()=>DEMO && DEMO.play();
    $("#demoPause",bg).onclick=()=>DEMO && DEMO.pause();
  },0);
  bg.addEventListener("click",(e)=>{ if(e.target===bg) closeDemo(); });
  return bg;
}
function openDemo(exObj){
  $("#demoTitle").textContent=exObj.name;
  $("#demoCue").textContent=exObj.cues||"";
  const box=$("#lottieBox");
  box.innerHTML="";
  if(DEMO){ try{DEMO.destroy();}catch(e){} DEMO=null; }
  if(window.lottie){
    DEMO=window.lottie.loadAnimation({container:box, renderer:"svg", loop:true, autoplay:true, path: exObj.anim});
  }else{
    box.innerHTML=`<div class="exerciseCue">Demo not available.</div>`;
  }
  $("#demoBg").classList.add("show");
}
function closeDemo(){
  $("#demoBg").classList.remove("show");
  if(DEMO){ try{DEMO.destroy();}catch(e){} DEMO=null; }
}

/* History & Settings */
function finishWorkout(){
  const wk=getWorkout(STATE.active.workoutId);
  const day=getDay(wk, STATE.active.dayId);
  STATE.history.push({ workout:wk.title, day:day.title, date:new Date().toLocaleDateString() });
  STATE.active=null;
  STATE.tab="home";
  save();
  toast("Saved to history");
  render();
}

function renderHistory(){
  const w=document.createElement("div");
  const h1=document.createElement("div"); h1.className="h1"; h1.textContent="History";
  w.appendChild(h1);
  if(!STATE.history.length){
    const p=document.createElement("div"); p.className="h2"; p.textContent="No workouts saved yet.";
    w.appendChild(p); return w;
  }
  STATE.history.slice().reverse().forEach(it=>{
    const c=document.createElement("div"); c.className="card";
    c.innerHTML=`<div style="font-size:22px;font-weight:950;">${it.workout}</div><div class="small">${it.day} · ${it.date}</div>`;
    w.appendChild(c);
  });
  return w;
}

function renderSettings(){
  const w=document.createElement("div");
  const h1=document.createElement("div"); h1.className="h1"; h1.textContent="Settings";
  w.appendChild(h1);

  const card=document.createElement("div"); card.className="card";

  const row1=document.createElement("div"); row1.className="cardRow";
  row1.innerHTML=`<div><div style="font-size:18px;font-weight:950;">Rest timer (seconds)</div><div class="small">Default rest after marking a set done</div></div>`;
  const input=document.createElement("input");
  input.type="number"; input.value=STATE.settings.restSec; input.min="10"; input.max="600";
  input.style.width="110px"; input.style.padding="12px"; input.style.borderRadius="14px";
  input.style.border="1px solid rgba(255,255,255,.12)";
  input.style.background="rgba(255,255,255,.04)";
  input.style.color="rgba(255,255,255,.9)";
  input.onchange=()=>{ STATE.settings.restSec=Math.max(10, Math.min(600, parseInt(input.value||DEFAULT_REST,10))); save(); toast("Saved"); };
  row1.appendChild(input);

  const hr=document.createElement("div"); hr.className="hr";

  const row2=document.createElement("div"); row2.className="cardRow";
  row2.innerHTML=`<div><div style="font-size:18px;font-weight:950;">Sound</div><div class="small">Beep when rest ends</div></div>`;
  const btn=document.createElement("button"); btn.className="btn";
  btn.textContent=STATE.settings.sound?"ON":"OFF";
  btn.onclick=()=>{ STATE.settings.sound=!STATE.settings.sound; save(); render(); };
  row2.appendChild(btn);

  card.appendChild(row1); card.appendChild(hr); card.appendChild(row2);

  const reset=document.createElement("button"); reset.className="btn"; reset.style.marginTop="14px";
  reset.textContent="Reset app data";
  reset.onclick=()=>{ localStorage.removeItem(STORE); STATE=initState(); toast("Reset done"); render(); };

  w.appendChild(card); w.appendChild(reset);
  return w;
}

/* Nav */
function renderNav(){
  const nav=document.createElement("div"); nav.className="nav";
  const inner=document.createElement("div"); inner.className="navInner";
  const tabs=[
    {id:"home", label:"Home"},
    {id:"history", label:"History"},
    {id:"settings", label:"Settings"},
  ];
  tabs.forEach(t=>{
    const b=document.createElement("button");
    const active = (STATE.tab===t.id) || (STATE.tab==="workout" && t.id==="home");
    b.className="navBtn"+(active?" active":"");
    b.textContent=t.label;
    b.onclick=()=>setTab(t.id);
    inner.appendChild(b);
  });
  nav.appendChild(inner);
  return nav;
}

render();
