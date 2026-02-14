// Ricardo Routine — offline-first, no dependencies.
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const STORAGE_KEY = "rr_v3_state";
const DEFAULTS = {
  settings: { restEnabled:true, restSeconds:90, soundEnabled:true, vibrateEnabled:true, kgStep:2 },
  selectedProgramId:"db_ppl",
  rotation:{},
  lastWorkoutAt:null,
  history:[],
  current:null
};
const PROGRAMS = window.RR_PROGRAMS;
const EX_DB = window.RR_EX_DB;

function uid(prefix="id"){ return prefix+"_"+Math.random().toString(16).slice(2)+Date.now().toString(16); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULTS);
    const st = JSON.parse(raw);
    return {...structuredClone(DEFAULTS), ...st, settings:{...DEFAULTS.settings, ...(st.settings||{})}, rotation:st.rotation||{}, history:st.history||[]};
  }catch{ return structuredClone(DEFAULTS); }
}
let state = loadState();
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

// sound (offline)
let audioCtx=null;
function beepDouble(){
  if(!state.settings.soundEnabled) return;
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const now = audioCtx.currentTime;
  const mk = (t)=>{
    const o=audioCtx.createOscillator(); const g=audioCtx.createGain();
    o.type="sine"; o.frequency.setValueAtTime(880,t);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.25,t+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001,t+0.14);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t+0.16);
  };
  mk(now); mk(now+0.22);
}

function nav(to){ location.hash = to; }
function currentRoute(){ const h=location.hash.replace("#",""); return h||"home"; }
function setActiveTab(tab){ $$(".navbtn").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab)); }
function programById(id){ return PROGRAMS.find(p=>p.id===id); }
function cycleFor(programId){ return EX_DB[programId]?.cycle || ["Workout"]; }
function dayNameFor(programId){
  const cycle=cycleFor(programId); const idx = state.rotation[programId] ?? 0;
  return cycle[idx % cycle.length];
}
function advanceRotation(programId){
  const cycle=cycleFor(programId); const idx = state.rotation[programId] ?? 0;
  state.rotation[programId] = (idx+1) % cycle.length;
}

function defaultSet(){ return {kg:5,reps:5,done:false}; }
function buildSession(programId){
  const dayName=dayNameFor(programId);
  const dayExercises = EX_DB[programId]?.days?.[dayName] || [];
  const exercises = dayExercises.map(ex=>({id:ex.id,name:ex.name,subtitle:ex.subtitle||"",sets:Array.from({length:5},()=>defaultSet())}));
  return {id:uid("sess"), programId, dayName, startedAt:Date.now(), exercises, rest:{active:false, endsAt:null}};
}

let restInterval=null;

function render(){
  const route=currentRoute();
  if(route.startsWith("program/")){
    renderWorkout(route.split("/")[1] || state.selectedProgramId);
    setActiveTab("home"); return;
  }
  if(route==="home"){ renderHome(); setActiveTab("home"); return; }
  if(route==="history"){ renderHistory(); setActiveTab("history"); return; }
  if(route==="settings"){ renderSettings(); setActiveTab("settings"); return; }
  renderHome(); setActiveTab("home");
}

function renderHome(){
  $("#view").innerHTML = `<div class="section-title">Programs</div><div class="grid" id="programGrid"></div>`;
  const grid=$("#programGrid");
  PROGRAMS.forEach(p=>{
    const icon=`assets/icons/${p.icon}.svg`;
    const nextDay = EX_DB[p.id] ? dayNameFor(p.id) : "—";
    const isSelected = state.selectedProgramId===p.id;
    const el=document.createElement("div");
    el.className="card program-card";
    el.innerHTML=`
      <div class="iconbox"><img src="${icon}" alt=""></div>
      <div class="meta">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="tag">Next: ${nextDay}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-secondary" data-act="select">Select</button>
        <button class="btn" data-act="start">Start</button>
      </div>
    `;
    el.querySelector('[data-act="select"]').onclick=()=>{ state.selectedProgramId=p.id; saveState(); renderHome(); };
    el.querySelector('[data-act="start"]').onclick=()=>startProgram(p.id);
    if(isSelected) el.style.borderColor="rgba(209,75,69,.6)";
    grid.appendChild(el);
  });

  const selected=programById(state.selectedProgramId);
  if(selected){
    const wrap=document.createElement("div");
    wrap.className="card"; wrap.style.marginTop="12px";
    wrap.innerHTML=`
      <div class="row">
        <div class="iconbox"><img src="assets/icons/${selected.icon}.svg" alt=""></div>
        <div style="flex:1">
          <h3 style="margin:0">Next Workout</h3>
          <p style="margin:4px 0 0">${selected.name} • <b>${dayNameFor(selected.id)}</b></p>
        </div>
      </div>
      <div style="margin-top:12px"><button class="btn btn-wide" id="startNext">START NEXT WORKOUT</button></div>
    `;
    $("#view").appendChild(wrap);
    $("#startNext").onclick=()=>startProgram(selected.id);
  }
}

function startProgram(programId){
  state.selectedProgramId=programId;
  state.current=buildSession(programId);
  saveState();
  nav(`program/${programId}`);
}

function formatKg(v){ return (Math.round(v*10)%10===0) ? `${Math.round(v)} kg` : `${v.toFixed(1)} kg`; }

function renderWorkout(programId){
  if(!state.current || state.current.programId!==programId){
    state.current=buildSession(programId); saveState();
  }
  const p=programById(programId);
  const sess=state.current;

  $("#view").innerHTML = `
    <div class="workout-header">
      <div>
        <h2>${p?p.name:"Workout"} • ${sess.dayName}</h2>
        <div style="color:var(--muted);font-size:12px">Tap set = done • Hold set = edit kg/reps • Hold exercise title = sets</div>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" id="homeBtn">Home</button>
        <button class="btn btn-secondary" id="resetBtn">Reset</button>
      </div>
    </div>

    <div class="timerbar" id="timerBar">
      <div>
        <div class="t" id="timerText">Rest</div>
        <div class="small" id="timerSmall"></div>
      </div>
      <button class="btn btn-secondary" id="skipRest">Skip</button>
    </div>

    <div id="exerciseList"></div>

    <div class="footerbar" id="footerBar">
      <button class="btn btn-wide" id="finishBtn">FINISH WORKOUT</button>
    </div>
  `;

  $("#homeBtn").onclick=()=>nav("home");
  $("#resetBtn").onclick=()=>{ if(confirm("Reset this workout session?")){ state.current=buildSession(programId); saveState(); renderWorkout(programId);} };
  $("#finishBtn").onclick=()=>finishWorkout();
  $("#skipRest").onclick=()=>stopRest(true);

  const list=$("#exerciseList");
  sess.exercises.forEach((ex, exIdx)=>{
    const exEl=document.createElement("div");
    exEl.className="exercise";
    exEl.innerHTML=`
      <div class="exercise-top">
        <div>
          <div class="exercise-name" data-ex-title>${ex.name}</div>
          <div class="exercise-sub">${ex.subtitle||""}</div>
        </div>
        <div><button class="playbtn" data-play>▶</button></div>
      </div>
      <div class="sets" data-sets></div>
    `;
    attachHold(exEl.querySelector("[data-ex-title]"), ()=>openSetCountModal(exIdx));
    exEl.querySelector("[data-play]").onclick=()=>openDemoModal(ex.name);

    const setsEl=exEl.querySelector("[data-sets]");
    ex.sets.forEach((s, sIdx)=>{
      const b=document.createElement("div");
      b.className="set"+(s.done?" done":"");
      b.innerHTML=`<div class="kg">${formatKg(s.kg)}</div><div class="reps">${s.reps} reps</div>`;
      b.onclick=()=>toggleSetDone(exIdx, sIdx);
      attachHold(b, ()=>openEditSetModal(exIdx, sIdx));
      setsEl.appendChild(b);
    });
    list.appendChild(exEl);
  });

  tickTimer();
  if(restInterval) clearInterval(restInterval);
  restInterval=setInterval(tickTimer, 250);
}

function toggleSetDone(exIdx, sIdx){
  const sess=state.current;
  const set=sess.exercises[exIdx].sets[sIdx];
  set.done=!set.done;
  saveState();
  renderWorkout(sess.programId);
  if(set.done && state.settings.restEnabled) startRest(state.settings.restSeconds);
}

function startRest(seconds){
  const sess=state.current;
  sess.rest.active=true;
  sess.rest.endsAt=Date.now()+seconds*1000;
  saveState();
  $("#timerBar")?.classList.add("show");
}
function stopRest(hard=false){
  const sess=state.current;
  sess.rest.active=false; sess.rest.endsAt=null;
  saveState();
  if(hard) $("#timerBar")?.classList.remove("show");
}
function tickTimer(){
  const bar=$("#timerBar");
  if(!bar) return;
  const sess=state.current;
  if(!sess || !sess.rest.active || !sess.rest.endsAt){ bar.classList.remove("show"); return; }
  bar.classList.add("show");
  const ms=sess.rest.endsAt-Date.now();
  const sec=Math.max(0, Math.ceil(ms/1000));
  $("#timerText").textContent=`REST ${sec}s`;
  $("#timerSmall").textContent=`Preset: ${state.settings.restSeconds}s`;
  if(sec<=0){
    sess.rest.active=false; sess.rest.endsAt=null; saveState();
    beepDouble();
    if(state.settings.vibrateEnabled && navigator.vibrate) navigator.vibrate([80,80,120]);
    bar.classList.remove("show");
  }
}

function finishWorkout(){
  const sess=state.current; if(!sess) return;
  const record={id:uid("w"), programId:sess.programId, dayName:sess.dayName, ts:Date.now(),
    exercises:sess.exercises.map(ex=>({id:ex.id,name:ex.name,sets:ex.sets.map(s=>({kg:s.kg,reps:s.reps,done:s.done}))}))};
  state.history.unshift(record);
  state.lastWorkoutAt=record.ts;
  advanceRotation(sess.programId);
  state.current=null;
  saveState();
  nav("home");
}

function renderHistory(){
  const items=state.history;
  $("#view").innerHTML = `<div class="section-title">History</div><div id="hist"></div>`;
  const hist=$("#hist");
  if(items.length===0){
    hist.innerHTML=`<div class="card"><h3>No workouts yet</h3><p>Finish a workout to see it here.</p></div>`;
    return;
  }
  items.slice(0,50).forEach(w=>{
    const p=programById(w.programId);
    const d=new Date(w.ts);
    const el=document.createElement("div");
    el.className="card"; el.style.marginBottom="12px";
    el.innerHTML=`
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div>
          <h3 style="margin:0">${p?p.name:w.programId} • ${w.dayName}</h3>
          <p style="margin:6px 0 0">${d.toLocaleString()}</p>
        </div>
        <button class="btn btn-secondary" data-open>Open</button>
      </div>
      <div style="margin-top:10px;display:none" data-details></div>
    `;
    const btn=el.querySelector("[data-open]");
    const details=el.querySelector("[data-details]");
    btn.onclick=()=>{
      const open=details.style.display!=="none";
      details.style.display=open?"none":"block";
      btn.textContent=open?"Open":"Close";
      if(!open){
        details.innerHTML = w.exercises.map(ex=>{
          const sets=ex.sets.map((s,i)=>`${i+1}) ${formatKg(s.kg)} × ${s.reps}${s.done?"":" (skipped)"}`).join("<br/>");
          return `<div style="margin-top:10px"><b>${ex.name}</b><div style="color:var(--muted);font-size:12px;margin-top:4px">${sets}</div></div>`;
        }).join("");
      }
    };
    hist.appendChild(el);
  });
}

function renderSettings(){
  $("#view").innerHTML=`
    <div class="section-title">Settings</div>
    <div class="card">
      <h3>Rest Timer</h3>
      <p>Pick a preset. Timer starts when you complete a set.</p>

      <div class="controls" style="margin-top:12px">
        <button class="smallbtn" id="restToggle">${state.settings.restEnabled?"ON":"OFF"}</button>
        <button class="smallbtn" id="soundToggle">${state.settings.soundEnabled?"Sound ON":"Sound OFF"}</button>
        <button class="smallbtn" id="vibeToggle">${state.settings.vibrateEnabled?"Vibrate ON":"Vibrate OFF"}</button>
      </div>

      <div class="section-title" style="margin-top:14px">Rest preset</div>
      <div class="gridbtns">${[30,60,90,120].map(s=>`<button class="pbtn" data-rest="${s}">${s}s</button>`).join("")}</div>

      <div class="section-title" style="margin-top:14px">Dumbbell increment</div>
      <div class="gridbtns">${[1,2,2.5,5].map(s=>`<button class="pbtn" data-step="${s}">${s} kg</button>`).join("")}</div>

      <div class="section-title" style="margin-top:14px">Backup</div>
      <div class="controls">
        <button class="smallbtn" id="exportBtn">Export JSON</button>
        <button class="smallbtn" id="importBtn">Import JSON</button>
      </div>
      <input type="file" id="importFile" accept="application/json" style="display:none"/>
    </div>
  `;
  $("#restToggle").onclick=()=>{ state.settings.restEnabled=!state.settings.restEnabled; saveState(); renderSettings(); };
  $("#soundToggle").onclick=()=>{ state.settings.soundEnabled=!state.settings.soundEnabled; saveState(); renderSettings(); };
  $("#vibeToggle").onclick=()=>{ state.settings.vibrateEnabled=!state.settings.vibrateEnabled; saveState(); renderSettings(); };
  $$("[data-rest]").forEach(b=>b.onclick=()=>{ state.settings.restSeconds=Number(b.dataset.rest); saveState(); renderSettings(); });
  $$("[data-step]").forEach(b=>b.onclick=()=>{ state.settings.kgStep=Number(b.dataset.step); saveState(); renderSettings(); });

  $("#exportBtn").onclick=()=>{
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`ricardo-routine-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $("#importBtn").onclick=()=>$("#importFile").click();
  $("#importFile").onchange=async(e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const txt=await file.text();
    try{
      const incoming=JSON.parse(txt);
      state={...structuredClone(DEFAULTS), ...incoming, settings:{...DEFAULTS.settings, ...(incoming.settings||{})}};
      saveState(); alert("Imported."); render();
    }catch{ alert("Import failed. File not valid."); }
  };
}

// Modal helpers
function showModal(html){
  $("#modal").innerHTML=html;
  $("#modal").classList.add("show");
  $("#modal").onclick=(e)=>{ if(e.target.id==="modal") hideModal(); };
}
function hideModal(){
  $("#modal").classList.remove("show");
  $("#modal").innerHTML="";
}

function openEditSetModal(exIdx, sIdx){
  const sess=state.current;
  const ex=sess.exercises[exIdx];
  const s=ex.sets[sIdx];
  const step=state.settings.kgStep||2;

  const preset=[];
  for(let w=2; w<=40; w+=step){ preset.push(w); if(preset.length>=15) break; }

  showModal(`
    <div class="sheet">
      <h3>${ex.name} • Set ${sIdx+1}</h3>
      <div class="kv">
        <div class="kbox"><div class="label">KG</div><div class="value" id="kgVal">${formatKg(s.kg).replace(" kg","")}</div></div>
        <div class="kbox"><div class="label">REPS</div><div class="value" id="repsVal">${s.reps}</div></div>
      </div>

      <div class="controls">
        <button class="smallbtn" id="kgMinus">- ${step}kg</button>
        <button class="smallbtn" id="kgPlus">+ ${step}kg</button>
      </div>
      <div class="controls">
        <button class="smallbtn" id="repMinus">- 1</button>
        <button class="smallbtn" id="repPlus">+ 1</button>
      </div>

      <div class="section-title" style="margin-top:14px">Quick KG</div>
      <div class="gridbtns">${preset.map(v=>`<button class="pbtn" data-kg="${v}">${v}</button>`).join("")}</div>

      <div class="rowend">
        <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
        <button class="btn" id="saveBtn">Save</button>
      </div>
    </div>
  `);

  const kgVal=$("#kgVal"), repsVal=$("#repsVal");
  let kg=s.kg, reps=s.reps;
  const upd=()=>{ kgVal.textContent=(Math.round(kg*10)%10===0)?`${Math.round(kg)}`:`${kg.toFixed(1)}`; repsVal.textContent=`${reps}`; };

  $("#kgMinus").onclick=()=>{ kg=Math.max(0, +(kg-step).toFixed(1)); upd(); };
  $("#kgPlus").onclick=()=>{ kg=+(kg+step).toFixed(1); upd(); };
  $("#repMinus").onclick=()=>{ reps=Math.max(0, reps-1); upd(); };
  $("#repPlus").onclick=()=>{ reps=reps+1; upd(); };
  $$("[data-kg]").forEach(b=>b.onclick=()=>{ kg=Number(b.dataset.kg); upd(); });

  $("#cancelBtn").onclick=hideModal;
  $("#saveBtn").onclick=()=>{ s.kg=kg; s.reps=reps; saveState(); hideModal(); renderWorkout(sess.programId); };
}

function openSetCountModal(exIdx){
  const sess=state.current;
  const ex=sess.exercises[exIdx];
  const cur=ex.sets.length;

  showModal(`
    <div class="sheet">
      <h3>${ex.name}</h3>
      <p style="margin:0;color:var(--muted);font-size:13px">Choose how many sets you want.</p>
      <div class="gridbtns" style="margin-top:12px">
        ${[3,4,5,6,7,8,9,10].map(n=>`<button class="pbtn" data-n="${n}">${n}</button>`).join("")}
      </div>
      <div class="rowend">
        <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
        <button class="btn" id="applyBtn">Apply</button>
      </div>
    </div>
  `);

  let chosen=cur;
  $$("[data-n]").forEach(b=>{
    if(Number(b.dataset.n)===cur) b.style.borderColor="rgba(209,75,69,.7)";
    b.onclick=()=>{
      chosen=Number(b.dataset.n);
      $$("[data-n]").forEach(x=>x.style.borderColor="var(--border)");
      b.style.borderColor="rgba(209,75,69,.7)";
    };
  });

  $("#cancelBtn").onclick=hideModal;
  $("#applyBtn").onclick=()=>{
    if(chosen>ex.sets.length){ while(ex.sets.length<chosen) ex.sets.push(defaultSet()); }
    else if(chosen<ex.sets.length){ ex.sets = ex.sets.slice(0, chosen); }
    saveState(); hideModal(); renderWorkout(sess.programId);
  };
}

function openDemoModal(exName){
  showModal(`
    <div class="sheet">
      <h3>${exName}</h3>
      <p style="margin:0;color:var(--muted);font-size:13px">Lightweight offline loop (vector). No GIFs, no big files.</p>
      <div style="margin-top:12px;background:#0f0f0f;border:1px solid var(--border);border-radius:16px;padding:10px;display:grid;place-items:center">
        <div id="anim" style="width:280px;height:280px"></div>
      </div>
      <div class="rowend"><button class="btn btn-secondary" id="closeBtn">Close</button></div>
    </div>
  `);
  $("#anim").innerHTML=`
    <svg width="260" height="260" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">
      <circle cx="130" cy="130" r="64" stroke="white" stroke-width="10" fill="none">
        <animate attributeName="r" values="56;70;56" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.85;1;0.85" dur="1.2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="130" cy="130" r="6" fill="white">
        <animate attributeName="cy" values="120;140;120" dur="1.2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
  $("#closeBtn").onclick=hideModal;
}

// Hold gesture
function attachHold(el, onHold){
  let timer=null;
  const start=(e)=>{ e.preventDefault(); timer=setTimeout(()=>{ timer=null; onHold(); }, 420); };
  const end=()=>{ if(timer){ clearTimeout(timer); timer=null; } };
  el.addEventListener("touchstart", start, {passive:false});
  el.addEventListener("touchend", end);
  el.addEventListener("touchcancel", end);
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", end);
  el.addEventListener("mouseleave", end);
}

// Install + Share
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",(e)=>{ e.preventDefault(); deferredPrompt=e; });
async function promptInstall(){
  if(!deferredPrompt) return alert("Install will appear when the browser allows it.");
  deferredPrompt.prompt(); deferredPrompt=null;
}
async function shareApp(){
  const url = location.href.split("#")[0];
  if(navigator.share){
    try{ await navigator.share({title:"Ricardo Routine", text:"My offline workout app", url}); }catch{}
  }else{
    await navigator.clipboard.writeText(url);
    alert("Link copied.");
  }
}

function boot(){
  $("#installBtn").onclick=promptInstall;
  $("#shareBtn").onclick=shareApp;

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  }
  window.addEventListener("hashchange", render);
  render();
}
boot();
