/* Ricardo Routine — Simple Offline PWA */
/* Everything stored locally (localStorage). No accounts. Offline-first. */

// --- Config
const STORAGE_KEY = "rr_simple_v2"; // keep same key so you don't lose past data

const DEFAULT_REPS = 5;
const DEFAULT_WEIGHT = 5;
const DEFAULT_SETS = 5;
const WEIGHT_STEP = 2;
const REST_PRESETS = [30, 60, 90, 120];

// --- Catalog
const CATALOG = {
  programs: [
    { id: "db_ppl", title: "Dumbbell PPL", icon: "dumbbell", tags: ["Dumbbells", "Bench"], workoutIds: ["db_push", "db_pull", "db_legs"] },
    { id: "db_full", title: "Dumbbell Full Body", icon: "dumbbell", tags: ["Dumbbells", "Bench"], workoutIds: ["db_full"] },
    { id: "ez_ppl", title: "EZ Bar PPL", icon: "ezbar", tags: ["EZ Bar", "Bench"], workoutIds: ["ez_push", "ez_pull", "ez_legs"] },
    { id: "ez_full", title: "EZ Bar Full Body", icon: "ezbar", tags: ["EZ Bar", "Bench"], workoutIds: ["ez_full"] },
    { id: "im_ppl", title: "Ironmaster PPL", icon: "ironmaster", tags: ["Bench", "Cable", "Attachments"], workoutIds: ["im_push", "im_pull", "im_legs"] },
    { id: "im_full", title: "Ironmaster Full Body", icon: "ironmaster", tags: ["Bench", "Cable", "Attachments"], workoutIds: ["im_full"] },
  ],
  complementary: [
    { id: "pelvic_tilt", title: "Pelvic Tilt Reset" },
    { id: "posture_reset", title: "Posture Reset" },
    { id: "mobility_flow", title: "Mobility Flow" },
    { id: "balance", title: "Balance & Stability" },
  ],
  workouts: {
    // Dumbbells
    db_push: { id: "db_push", title: "Push", programId: "db_ppl", exercises: [
      { id: "db_flat_bench", name: "Flat Dumbbell Bench Press", rx: "Work sets", swapGroup: "db_bench" },
      { id: "db_incline_press", name: "Incline Dumbbell Press", rx: "Work sets", swapGroup: "db_incline" },
      { id: "db_shoulder_press", name: "Dumbbell Shoulder Press", rx: "Work sets", swapGroup: "db_shoulder" },
      { id: "db_lateral_raise", name: "Dumbbell Lateral Raise", rx: "Work sets", swapGroup: "lateral" },
      { id: "db_triceps", name: "Overhead Dumbbell Triceps Extension", rx: "Work sets", swapGroup: "triceps" },
    ]},
    db_pull: { id: "db_pull", title: "Pull", programId: "db_ppl", exercises: [
      { id: "db_row", name: "One Arm Dumbbell Row", rx: "Work sets", swapGroup: "row" },
      { id: "db_rdl", name: "Dumbbell Romanian Deadlift", rx: "Work sets", swapGroup: "hinge" },
      { id: "db_pullover", name: "Dumbbell Pullover", rx: "Work sets", swapGroup: "pullover" },
      { id: "db_rear", name: "Rear Delt Fly", rx: "Work sets", swapGroup: "rear" },
      { id: "db_curl", name: "Dumbbell Curl", rx: "Work sets", swapGroup: "curl" },
    ]},
    db_legs: { id: "db_legs", title: "Legs", programId: "db_ppl", exercises: [
      { id: "db_goblet", name: "Goblet Squat", rx: "Work sets", swapGroup: "squat" },
      { id: "db_split", name: "Bulgarian Split Squat", rx: "Work sets", swapGroup: "split" },
      { id: "db_hinge", name: "Dumbbell RDL", rx: "Work sets", swapGroup: "hinge" },
      { id: "db_lunge", name: "Walking Lunges", rx: "Work sets", swapGroup: "lunge" },
      { id: "db_calf", name: "Standing Calf Raise", rx: "Work sets", swapGroup: "calf" },
    ]},
    db_full: { id: "db_full", title: "Full Body", programId: "db_full", exercises: [
      { id: "db_full_squat", name: "Goblet Squat", rx: "Work sets", swapGroup: "squat" },
      { id: "db_full_press", name: "Flat Dumbbell Bench Press", rx: "Work sets", swapGroup: "db_bench" },
      { id: "db_full_row", name: "One Arm Dumbbell Row", rx: "Work sets", swapGroup: "row" },
      { id: "db_full_hinge", name: "Dumbbell Romanian Deadlift", rx: "Work sets", swapGroup: "hinge" },
      { id: "db_full_lat", name: "Dumbbell Lateral Raise", rx: "Work sets", swapGroup: "lateral" },
      { id: "db_full_curl", name: "Dumbbell Curl", rx: "Work sets", swapGroup: "curl" },
    ]},

    // EZ Bar
    ez_push: { id: "ez_push", title: "Push", programId: "ez_ppl", exercises: [
      { id: "ez_bench", name: "EZ Bar Bench Press", rx: "Work sets", swapGroup: "ez_bench" },
      { id: "ez_incline", name: "EZ Bar Incline Press", rx: "Work sets", swapGroup: "ez_incline" },
      { id: "ez_ohp", name: "EZ Bar Overhead Press", rx: "Work sets", swapGroup: "ez_ohp" },
      { id: "ez_skull", name: "EZ Bar Skull Crushers", rx: "Work sets", swapGroup: "triceps" },
      { id: "ez_lateral", name: "Dumbbell Lateral Raise", rx: "Work sets", swapGroup: "lateral" },
    ]},
    ez_pull: { id: "ez_pull", title: "Pull", programId: "ez_ppl", exercises: [
      { id: "ez_row", name: "EZ Bar Bent Over Row", rx: "Work sets", swapGroup: "ez_row" },
      { id: "ez_rdl", name: "EZ Bar Romanian Deadlift", rx: "Work sets", swapGroup: "hinge" },
      { id: "ez_curl", name: "EZ Bar Curl", rx: "Work sets", swapGroup: "ez_curl" },
      { id: "ez_rear", name: "Rear Delt Fly", rx: "Work sets", swapGroup: "rear" },
      { id: "ez_pullover", name: "Dumbbell Pullover", rx: "Work sets", swapGroup: "pullover" },
    ]},
    ez_legs: { id: "ez_legs", title: "Legs", programId: "ez_ppl", exercises: [
      { id: "ez_squat", name: "EZ Bar Front Squat", rx: "Work sets", swapGroup: "squat" },
      { id: "ez_split", name: "Bulgarian Split Squat", rx: "Work sets", swapGroup: "split" },
      { id: "ez_leg_curl", name: "Leg Curl (Bench attachment)", rx: "Work sets", swapGroup: "leg_curl" },
      { id: "ez_leg_ext", name: "Leg Extension (Bench attachment)", rx: "Work sets", swapGroup: "leg_ext" },
      { id: "ez_calf", name: "Standing Calf Raise", rx: "Work sets", swapGroup: "calf" },
    ]},
    ez_full: { id: "ez_full", title: "Full Body", programId: "ez_full", exercises: [
      { id: "ez_full_squat", name: "EZ Bar Front Squat", rx: "Work sets", swapGroup: "squat" },
      { id: "ez_full_press", name: "EZ Bar Bench Press", rx: "Work sets", swapGroup: "ez_bench" },
      { id: "ez_full_row", name: "EZ Bar Bent Over Row", rx: "Work sets", swapGroup: "ez_row" },
      { id: "ez_full_hinge", name: "EZ Bar Romanian Deadlift", rx: "Work sets", swapGroup: "hinge" },
      { id: "ez_full_curl", name: "EZ Bar Curl", rx: "Work sets", swapGroup: "ez_curl" },
    ]},

    // Ironmaster
    im_push: { id: "im_push", title: "Push", programId: "im_ppl", exercises: [
      { id: "im_press", name: "Dumbbell Bench Press", rx: "Work sets", swapGroup: "db_bench" },
      { id: "im_incline", name: "Incline Dumbbell Press", rx: "Work sets", swapGroup: "db_incline" },
      { id: "im_triceps", name: "Cable Triceps Pressdown", rx: "Work sets", swapGroup: "cable_triceps" },
      { id: "im_ohp", name: "Dumbbell Shoulder Press", rx: "Work sets", swapGroup: "db_shoulder" },
      { id: "im_crunch", name: "Crunch Attachment", rx: "Work sets", swapGroup: "crunch" },
    ]},
    im_pull: { id: "im_pull", title: "Pull", programId: "im_ppl", exercises: [
      { id: "im_chins", name: "Chin Ups (BW)", rx: "Work sets", swapGroup: "chins" },
      { id: "im_lat", name: "Cable Lat Pulldown", rx: "Work sets", swapGroup: "lat" },
      { id: "im_row", name: "Cable Seated Row", rx: "Work sets", swapGroup: "cable_row" },
      { id: "im_curl", name: "Dumbbell Curl", rx: "Work sets", swapGroup: "curl" },
      { id: "im_rear", name: "Rear Delt Fly", rx: "Work sets", swapGroup: "rear" },
    ]},
    im_legs: { id: "im_legs", title: "Legs", programId: "im_ppl", exercises: [
      { id: "im_leg_ext", name: "Leg Extension (Leg Attachment)", rx: "Work sets", swapGroup: "leg_ext" },
      { id: "im_leg_curl", name: "Leg Curl (Leg Attachment)", rx: "Work sets", swapGroup: "leg_curl" },
      { id: "im_split", name: "Bulgarian Split Squat", rx: "Work sets", swapGroup: "split" },
      { id: "im_rdl", name: "Dumbbell Romanian Deadlift", rx: "Work sets", swapGroup: "hinge" },
      { id: "im_calf", name: "Standing Calf Raise", rx: "Work sets", swapGroup: "calf" },
    ]},
    im_full: { id: "im_full", title: "Full Body", programId: "im_full", exercises: [
      { id: "im_full_leg_ext", name: "Leg Extension (Leg Attachment)", rx: "Work sets", swapGroup: "leg_ext" },
      { id: "im_full_press", name: "Dumbbell Bench Press", rx: "Work sets", swapGroup: "db_bench" },
      { id: "im_full_lat", name: "Cable Lat Pulldown", rx: "Work sets", swapGroup: "lat" },
      { id: "im_full_row", name: "Cable Seated Row", rx: "Work sets", swapGroup: "cable_row" },
      { id: "im_full_crunch", name: "Crunch Attachment", rx: "Work sets", swapGroup: "crunch" },
    ]},

    // Complementary (checklist)
    pelvic_tilt: { id: "pelvic_tilt", title: "Pelvic Tilt Reset", programId: "complementary", type: "checklist", exercises: [
      { id: "pt_1", name: "90/90 Hip Lift (Breathing)" },
      { id: "pt_2", name: "Dead Bug (Slow)" },
      { id: "pt_3", name: "Glute Bridge Hold" },
      { id: "pt_4", name: "Hip Flexor Stretch" },
    ]},
    posture_reset: { id: "posture_reset", title: "Posture Reset", programId: "complementary", type: "checklist", exercises: [
      { id: "pr_1", name: "Wall Slides" },
      { id: "pr_2", name: "Thoracic Extension (Bench)" },
      { id: "pr_3", name: "Scapular Retraction Holds" },
      { id: "pr_4", name: "Cat-Camel (Slow)" },
    ]},
    mobility_flow: { id: "mobility_flow", title: "Mobility Flow", programId: "complementary", type: "checklist", exercises: [
      { id: "mf_1", name: "Hip CARs" },
      { id: "mf_2", name: "Ankle Rocks" },
      { id: "mf_3", name: "Thoracic Rotations" },
      { id: "mf_4", name: "Hamstring Floss" },
    ]},
    balance: { id: "balance", title: "Balance & Stability", programId: "complementary", type: "checklist", exercises: [
      { id: "b_1", name: "Single-Leg Stand" },
      { id: "b_2", name: "Single-Leg RDL (Bodyweight)" },
      { id: "b_3", name: "Side Plank" },
      { id: "b_4", name: "Bird Dog" },
    ]},
  },

  swaps: {
    db_bench: ["Flat Dumbbell Bench Press", "Floor Press", "Close-Grip DB Press"],
    db_incline: ["Incline Dumbbell Press", "Incline Neutral Grip Press", "Incline DB Fly"],
    db_shoulder: ["Dumbbell Shoulder Press", "Arnold Press", "Seated DB Press"],
    row: ["One Arm Dumbbell Row", "Chest Supported Row", "Renegade Row"],
    hinge: ["Dumbbell Romanian Deadlift", "Hip Hinge (DB)", "Stiff-Leg Deadlift (DB)"],
    pullover: ["Dumbbell Pullover", "Straight Arm Pullover (Cable)", "Dumbbell Pullover (Bent arm)"] ,
    rear: ["Rear Delt Fly", "Face Pull (Cable)", "Reverse Fly (Cable)"],
    curl: ["Dumbbell Curl", "Hammer Curl", "Incline Curl"],
    triceps: ["Overhead Dumbbell Triceps Extension", "Triceps Kickback", "Close Grip Push Up"],
    lateral: ["Dumbbell Lateral Raise", "Lean-Away Lateral Raise", "Cable Lateral Raise"],
    squat: ["Goblet Squat", "Front Squat", "Split Squat"],
    split: ["Bulgarian Split Squat", "Reverse Lunge", "Step Ups"],
    lunge: ["Walking Lunges", "Reverse Lunge", "Step Ups"],
    calf: ["Standing Calf Raise", "Seated Calf Raise (DB on knee)", "Single-Leg Calf Raise"],

    ez_bench: ["EZ Bar Bench Press", "Close Grip EZ Bench Press", "EZ Bar Floor Press"],
    ez_incline: ["EZ Bar Incline Press", "EZ Bar Close-Grip Incline", "Incline Dumbbell Press"],
    ez_ohp: ["EZ Bar Overhead Press", "Dumbbell Shoulder Press", "Arnold Press"],
    ez_row: ["EZ Bar Bent Over Row", "Chest Supported Row", "One Arm Dumbbell Row"],
    ez_curl: ["EZ Bar Curl", "EZ Bar Reverse Curl", "Hammer Curl"],

    leg_ext: ["Leg Extension (Leg Attachment)", "Leg Extension (Slow)", "Sissy Squat (Bodyweight)"] ,
    leg_curl: ["Leg Curl (Leg Attachment)", "Sliding Leg Curl", "Nordic (Assisted)"] ,
    lat: ["Cable Lat Pulldown", "Straight Arm Pulldown", "Chin Ups (BW)"],
    cable_row: ["Cable Seated Row", "Low Cable Row", "One Arm Cable Row"],
    cable_triceps: ["Cable Triceps Pressdown", "Overhead Cable Extension", "Cable Kickback"],
    crunch: ["Crunch Attachment", "Reverse Crunch", "Hollow Hold"],
    chins: ["Chin Ups (BW)", "Neutral Grip Pull Ups (BW)", "Assisted Chin Ups"],
  }
};

// --- State
function makeDefaultState(){
  return {
    version: 2,
    ui: { tab: "home", programId: null, workoutId: null },
    prefs: { sound: true, restTimer: true, restSeconds: 90 },
    rotation: { pplNext: "db_legs" },
    workouts: {},
    history: [],
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return makeDefaultState();
    const st = JSON.parse(raw);
    // basic migration safety
    if(!st.ui) st.ui = { tab: "home" };
    if(!st.prefs) st.prefs = { sound:true, restTimer:true, restSeconds:90 };
    if(!st.rotation) st.rotation = { pplNext: "db_legs" };
    if(!st.workouts) st.workouts = {};
    if(!st.history) st.history = [];

    // If old app used push/pull/legs/fullbody ids, map them to dumbbell ones.
    const mapOld = {
      push: "db_push",
      pull: "db_pull",
      legs: "db_legs",
      fullbody_a: "db_full",
    };
    for(const [oldId,newId] of Object.entries(mapOld)){
      if(st.workouts[oldId] && !st.workouts[newId]){
        st.workouts[newId] = st.workouts[oldId];
      }
    }
    if(st.rotation?.pplNext){
      if(mapOld[st.rotation.pplNext]) st.rotation.pplNext = mapOld[st.rotation.pplNext];
    }

    return st;
  }catch{
    return makeDefaultState();
  }
}

function saveState(st){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
}

let STATE = loadState();

// --- Helpers
const $app = document.getElementById("app");

function h(tag, props={}, ...children){
  const el = document.createElement(tag);
  for(const [k,v] of Object.entries(props||{})){
    if(k === "class") el.className = v;
    else if(k === "style") Object.assign(el.style, v);
    else if(k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for(const c of children.flat()){
    if(c === null || c === undefined) continue;
    if(typeof c === "string" || typeof c === "number") el.appendChild(document.createTextNode(String(c)));
    else el.appendChild(c);
  }
  return el;
}

function formatTime(sec){
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function navTo(next){
  STATE.ui = { ...STATE.ui, ...next };
  saveState(STATE);
  render();
}

function ensureWorkoutState(workoutId){
  const w = CATALOG.workouts[workoutId];
  if(!w) return null;
  if(!STATE.workouts[workoutId]){
    const ex = {};
    for(const e of w.exercises){
      if(w.type === "checklist"){
        ex[e.id] = { name: e.name, done: false };
      }else{
        ex[e.id] = {
          name: e.name,
          rx: e.rx,
          swapGroup: e.swapGroup,
          sets: Array.from({length: DEFAULT_SETS}).map(()=>({ reps: DEFAULT_REPS, kg: DEFAULT_WEIGHT, done:false }))
        };
      }
    }
    STATE.workouts[workoutId] = { startedAt: Date.now(), exercise: ex };
    saveState(STATE);
  }
  return STATE.workouts[workoutId];
}

function addLongPress(el, onLongPress){
  let timer = null;
  let moved = false;

  const start = ()=>{
    moved = false;
    timer = setTimeout(()=>{ if(!moved) onLongPress(); }, 450);
  };
  const cancel = ()=>{ if(timer){ clearTimeout(timer); timer=null; } };

  el.addEventListener("touchstart", start, {passive:true});
  el.addEventListener("touchmove", ()=>{ moved=true; }, {passive:true});
  el.addEventListener("touchend", cancel);
  el.addEventListener("touchcancel", cancel);

  el.addEventListener("mousedown", start);
  el.addEventListener("mousemove", ()=>{ moved=true; });
  el.addEventListener("mouseup", cancel);
  el.addEventListener("mouseleave", cancel);
}

// --- Rest timer (discreet banner)
let REST = { active:false, endsAt:0, interval:null };

function maybeStartRestTimer(){
  const p = STATE.prefs;
  if(!p.restTimer) return;
  const sec = REST_PRESETS.includes(p.restSeconds) ? p.restSeconds : 90;
  startRest(sec);
}

function startRest(seconds){
  REST.active = true;
  REST.endsAt = Date.now() + seconds*1000;
  if(REST.interval) clearInterval(REST.interval);
  REST.interval = setInterval(()=>{
    if(Date.now() >= REST.endsAt){
      stopRest(true);
    }else{
      renderRestBanner();
    }
  }, 250);
  renderRestBanner();
}

function stopRest(beep){
  REST.active = false;
  if(REST.interval) clearInterval(REST.interval);
  REST.interval = null;
  REST.endsAt = 0;
  const el = document.getElementById("restBanner");
  if(el) el.remove();
  if(beep && STATE.prefs.sound) playBeep();
}

function renderRestBanner(){
  if(STATE.ui.tab !== "workout") return;
  const remaining = Math.max(0, Math.ceil((REST.endsAt - Date.now())/1000));
  let el = document.getElementById("restBanner");
  if(!REST.active){ if(el) el.remove(); return; }
  if(!el){
    el = document.createElement("div");
    el.id = "restBanner";
    el.className = "restBanner";
    document.body.appendChild(el);
  }
  el.innerHTML = "";
  el.appendChild(h("div",{class:"restText"}, `REST ${formatTime(remaining)}`));
  el.appendChild(h("button",{class:"restSkip", onclick:()=>stopRest(false)}, "Skip"));
}

function playBeep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, 130);
  }catch{}
}

// --- UI Screens
function render(){
  $app.innerHTML = "";
  // cleanup rest banner when leaving workout
  if(STATE.ui.tab !== "workout") stopRest(false);

  if(STATE.ui.tab === "home") renderHome();
  else if(STATE.ui.tab === "program") renderProgram();
  else if(STATE.ui.tab === "workout") renderWorkout();
  else if(STATE.ui.tab === "history") renderHistory();
  else if(STATE.ui.tab === "settings") renderSettings();
  else renderHome();
}

function renderBottomNav(active){
  return h("div",{class:"bottomNav"},
    navBtn("Home", active==="home", ()=>navTo({tab:"home"})),
    navBtn("History", active==="history", ()=>navTo({tab:"history"})),
    navBtn("Settings", active==="settings", ()=>navTo({tab:"settings"})),
  );
}

function navBtn(label, on, fn){
  return h("button",{class:`navBtn ${on?"navOn":""}`, onclick:fn}, label);
}

function renderHome(){
  const container = h("div",{class:"screen"},
    h("div",{class:"container"},
      h("div",{class:"hero"},
        h("div",{class:"heroIcon"},"🏋️"),
        h("div",{class:"heroTitle"},"Ricardo Routine"),
        h("div",{class:"heroSub"},"Choose your workout")
      ),
      h("div",{class:"sectionTitle"},"MAIN WORKOUTS"),
      h("div",{class:"stack"},
        ...CATALOG.programs.map(p=>{
          const isActive = (p.id === "db_ppl");
          const nextText = (p.id === "db_ppl")
            ? (CATALOG.workouts[STATE.rotation.pplNext]?.title || "Legs")
            : (CATALOG.workouts[p.workoutIds[0]]?.title || "Full Body");

          return h("div",{class:`card ${isActive?"cardActive":""}`},
            h("div",{class:"cardHeader"},
              h("div",{},
                h("div",{class:"cardTitle"},p.title),
                h("div",{class:"pillRow"}, ...p.tags.map(t=>h("span",{class:"pill"},t)))
              ),
              isActive ? h("span",{class:"badge"},"ACTIVE") : h("span",{}, "")
            ),
            h("div",{class:"cardFooter"},
              h("div",{class:"muted"}, `Next: ${nextText}`),
              h("button",{class:"btnPrimary", onclick:()=>{ STATE.ui.programId = p.id; navTo({tab:"program"}); }},"START")
            )
          );
        })
      ),

      h("div",{class:"sectionTitle"},"COMPLEMENTARY"),
      h("div",{class:"stack"},
        ...CATALOG.complementary.map(c=>h("div",{class:"listItem", onclick:()=>{ STATE.ui.workoutId = c.id; navTo({tab:"workout"}); }},
          h("div",{class:"listItemLeft"}, c.title),
          h("div",{class:"arrow"},"→")
        ))
      )
    ),
    renderBottomNav("home")
  );
  $app.appendChild(container);
}

function renderProgram(){
  const programId = STATE.ui.programId || "db_ppl";
  const program = CATALOG.programs.find(p=>p.id===programId) || CATALOG.programs[0];
  const list = program.workoutIds.map(id=>CATALOG.workouts[id]);

  const container = h("div",{class:"screen"},
    h("div",{class:"container"},
      h("div",{class:"topbar"},
        h("button",{class:"backbtn", onclick:()=>navTo({tab:"home"})},"← Home"),
        h("div",{})
      ),
      h("div",{class:"heroTitle", style:{textAlign:"left", fontSize:"44px"}}, program.title),
      h("div",{class:"muted", style:{marginTop:"6px"}}, program.tags.join(" • ")),

      h("div",{class:"card", style:{marginTop:"14px", cursor:"pointer"}, onclick:()=>{
        const next = (program.id === "db_ppl") ? (STATE.rotation.pplNext || list[0].id) : list[0].id;
        STATE.ui.workoutId = next;
        navTo({tab:"workout"});
      }},
        h("div",{class:"rowBetween"},
          h("div",{},
            h("div",{class:"cardTitle", style:{fontSize:"20px"}}, "⚡ Start Next Workout"),
            h("div",{class:"muted", style:{marginTop:"6px"}}, (program.id === "db_ppl") ? (CATALOG.workouts[STATE.rotation.pplNext]?.title || list[0].title) : list[0].title),
          ),
          h("div",{class:"arrow"},"›")
        )
      ),

      h("div",{class:"sectionTitle"},"WORKOUTS"),
      h("div",{class:"stack"},
        ...list.map(w=>h("div",{class:"listItem", onclick:()=>{ STATE.ui.workoutId = w.id; navTo({tab:"workout"}); }},
          h("div",{class:"listItemLeft"}, w.title),
          h("div",{class:"arrow"},"→")
        ))
      )
    ),
    renderBottomNav("home")
  );
  $app.appendChild(container);
}

function renderWorkout(){
  const workoutId = STATE.ui.workoutId || "db_push";
  const workout = CATALOG.workouts[workoutId];
  if(!workout){ navTo({tab:"home"}); return; }

  const ws = ensureWorkoutState(workoutId);

  const container = h("div",{class:"screen"},
    h("div",{class:"container"},
      h("div",{class:"topbar"},
        h("button",{class:"backbtn", onclick:()=>navTo({tab:"home"})},"← Home"),
        h("button",{class:"backbtn", onclick:()=>navTo({tab:"home"})},"Dashboard")
      ),

      h("div",{class:"heroTitle", style:{textAlign:"left", fontSize:"52px"}}, workout.title),
      h("div",{class:"muted", style:{marginTop:"4px"}}, `Started: ${new Date(ws.startedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`),

      workout.type === "checklist"
        ? h("div",{class:"stack", style:{marginTop:"18px"}},
            ...workout.exercises.map(e=>{
              const item = ws.exercise[e.id];
              return h("div",{class:"listItem", onclick:()=>{ item.done = !item.done; saveState(STATE); render(); }},
                h("div",{class:"listItemLeft"}, item.name),
                h("div",{class:"arrow"}, item.done ? "✓" : "○")
              );
            })
          )
        : h("div",{class:"stack", style:{marginTop:"18px"}},
            ...workout.exercises.map(e=>renderExerciseCard(workoutId, e.id))
          ),

      h("div",{style:{height:"14px"}}),
      h("button",{class:"btnFinish", onclick:()=>finishWorkout(workoutId)},"FINISH")
    ),
    renderBottomNav("home")
  );

  $app.appendChild(container);

  // if rest active, keep banner updated
  if(REST.active) renderRestBanner();
}

function renderExerciseCard(workoutId, exId){
  const workout = CATALOG.workouts[workoutId];
  const ws = ensureWorkoutState(workoutId);
  const exState = ws.exercise[exId];

  const header = h("div",{class:"rowBetween"},
    h("div",{},
      h("div",{class:"exerciseTitle"}, exState.name),
      h("div",{class:"exerciseSub"}, exState.rx || "")
    ),
    h("button",{class:"iconBtn", onclick:()=>swapExercise(workoutId, exId)},"↻")
  );

  const setsRow = h("div",{class:"setRow"});
  exState.sets.forEach((s, idx)=>{
    const circle = h("button",{class:`setCircle ${s.done?"setDone":""}`, onclick:()=>toggleSetDone(workoutId, exId, idx)}, s.done ? "✓" : String(s.reps));
    addLongPress(circle, ()=>editReps(workoutId, exId, idx));

    const kgLabel = (exState.name.includes("BW") || exState.name.includes("Chin Ups")) ? "BW" : `${s.kg}kg`;
    const kg = h("div",{class:"setKg", onclick:()=>editWeight(workoutId, exId, idx)}, kgLabel);
    addLongPress(kg, ()=>editRepsAndWeight(workoutId, exId, idx));

    setsRow.appendChild(h("div",{class:"setCol"}, circle, kg));
  });

  const addBtn = h("button",{class:"setCircleAdd", onclick:()=>addSet(workoutId, exId)},"+");
  setsRow.appendChild(h("div",{class:"setCol"}, addBtn, h("div",{class:"setAddLabel"},"Add")));

  return h("div",{class:"exerciseCard"}, header, setsRow);
}

function renderHistory(){
  const items = [...STATE.history].slice().sort((a,b)=>b.dateISO.localeCompare(a.dateISO));

  const container = h("div",{class:"screen"},
    h("div",{class:"container"},
      h("div",{class:"hero"},
        h("div",{class:"heroTitle"},"History"),
        h("div",{class:"heroSub"},"Saved sessions")
      ),
      items.length===0
        ? h("div",{class:"muted", style:{marginTop:"10px"}},"No sessions yet.")
        : h("div",{class:"stack"},
            ...items.map(it=>h("div",{class:"card"},
              h("div",{class:"cardHeader"},
                h("div",{},
                  h("div",{class:"cardTitle"}, it.title),
                  h("div",{class:"muted", style:{marginTop:"6px"}}, new Date(it.dateISO).toLocaleString())
                ),
                h("span",{class:"badge"}, `${Math.round(it.totalVolume)}kg`)
              ),
              h("div",{class:"cardFooter"},
                h("div",{class:"muted"}, it.workoutId),
                h("button",{class:"btnGhost", onclick:()=>{ STATE.ui.workoutId = it.workoutId; navTo({tab:"workout"}); }},"Open")
              )
            ))
          ),

      h("div",{style:{height:"18px"}}),
      h("button",{class:"btnDanger", onclick:()=>{ if(confirm("Clear history?")){ STATE.history=[]; saveState(STATE); render(); } }},"Clear History")
    ),
    renderBottomNav("history")
  );
  $app.appendChild(container);
}

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function renderSettings(){
  const p = STATE.prefs;
  const container = h("div",{class:"screen"},
    h("div",{class:"container"},
      h("div",{class:"hero"},
        h("div",{class:"heroTitle"},"Settings"),
        h("div",{class:"heroSub"},"Simple, offline")
      ),

      h("div",{class:"card"},
        rowToggle("Sound", p.sound, (v)=>{ p.sound=v; saveState(STATE); }),
        h("div",{class:"divider"}),
        rowToggle("Rest timer", p.restTimer, (v)=>{ p.restTimer=v; saveState(STATE); }),
        h("div",{class:"divider"}),
        h("div",{class:"rowBetween"},
          h("div",{class:"muted"},"Rest seconds"),
          h("select",{class:"select", onchange:(e)=>{ p.restSeconds = parseInt(e.target.value,10); saveState(STATE); }},
            ...REST_PRESETS.map(sec=>h("option",{value:sec, selected: p.restSeconds===sec}, `${sec}s`))
          )
        )
      ),

      h("div",{class:"sectionTitle"},"APP"),
      h("div",{class:"stack"},
        h("button",{class:"btnPrimary", onclick:async()=>{
          if(!deferredInstallPrompt){ alert("Install is available only in some browsers (Chrome/Edge on Android)."); return; }
          deferredInstallPrompt.prompt();
          await deferredInstallPrompt.userChoice;
          deferredInstallPrompt = null;
        }},"Install"),
        h("button",{class:"btnGhost", onclick:async()=>{
          try{
            if(navigator.share){
              await navigator.share({ title:"Ricardo Routine", text:"My simple offline workout app", url: location.href });
            } else {
              await navigator.clipboard.writeText(location.href);
              alert("Link copied.");
            }
          }catch{}
        }},"Share")
      ),

      h("div",{class:"sectionTitle"},"DATA"),
      h("button",{class:"btnDanger", onclick:()=>{
        if(confirm("Reset ALL data?")){
          localStorage.removeItem(STORAGE_KEY);
          STATE = makeDefaultState();
          saveState(STATE);
          render();
        }
      }},"Reset All Data")
    ),
    renderBottomNav("settings")
  );

  $app.appendChild(container);
}

function rowToggle(label, value, onChange){
  return h("div",{class:"rowBetween"},
    h("div",{}, label),
    h("label",{class:"switch"},
      h("input",{type:"checkbox", checked: value, onchange:(e)=>onChange(e.target.checked)}),
      h("span",{class:"slider"})
    )
  );
}

// --- Workout interactions
function toggleSetDone(workoutId, exId, idx){
  const ws = ensureWorkoutState(workoutId);
  const s = ws.exercise[exId].sets[idx];
  s.done = !s.done;
  saveState(STATE);
  if(s.done) maybeStartRestTimer();
  render();
}

function addSet(workoutId, exId){
  const ws = ensureWorkoutState(workoutId);
  const ex = ws.exercise[exId];
  ex.sets.push({ reps: DEFAULT_REPS, kg: DEFAULT_WEIGHT, done:false });
  saveState(STATE);
  render();
}

function swapExercise(workoutId, exId){
  const ws = ensureWorkoutState(workoutId);
  const ex = ws.exercise[exId];
  const workout = CATALOG.workouts[workoutId];
  const catalogEx = workout.exercises.find(e=>e.id===exId);
  if(!catalogEx || !catalogEx.swapGroup) return;

  const options = CATALOG.swaps[catalogEx.swapGroup] || [];
  if(options.length===0) return;

  const current = ex.name;
  const idx = options.indexOf(current);
  const next = options[(idx+1) % options.length];
  ex.name = next;
  saveState(STATE);
  render();
}

function editReps(workoutId, exId, idx){
  const ws = ensureWorkoutState(workoutId);
  const s = ws.exercise[exId].sets[idx];
  const next = prompt("Reps:", String(s.reps));
  if(next===null) return;
  const n = parseInt(next,10);
  if(Number.isFinite(n) && n>0 && n<200){
    s.reps = n;
    saveState(STATE);
    render();
  }
}

function editWeight(workoutId, exId, idx){
  const ws = ensureWorkoutState(workoutId);
  const exName = ws.exercise[exId].name || "";
  if(exName.includes("BW") || exName.includes("Chin Ups")){
    alert("Bodyweight exercise (BW). No kg needed.");
    return;
  }

  const s = ws.exercise[exId].sets[idx];
  const choice = prompt(`Weight kg (step ${WEIGHT_STEP}):`, String(s.kg));
  if(choice===null) return;
  const n = parseFloat(choice);
  if(Number.isFinite(n) && n>=0 && n<=500){
    s.kg = n;
    saveState(STATE);
    render();
  }
}

function editRepsAndWeight(workoutId, exId, idx){
  const ws = ensureWorkoutState(workoutId);
  const s = ws.exercise[exId].sets[idx];
  const nextReps = prompt("Reps:", String(s.reps));
  if(nextReps===null) return;
  const r = parseInt(nextReps,10);
  if(!Number.isFinite(r) || r<=0) return;

  const exName = ws.exercise[exId].name || "";
  if(exName.includes("BW") || exName.includes("Chin Ups")){
    s.reps = r;
    saveState(STATE);
    render();
    return;
  }

  const nextKg = prompt(`Weight kg:`, String(s.kg));
  if(nextKg===null) return;
  const k = parseFloat(nextKg);
  if(!Number.isFinite(k) || k<0) return;

  s.reps = r;
  s.kg = k;
  saveState(STATE);
  render();
}

function computeVolume(workoutId){
  const ws = ensureWorkoutState(workoutId);
  let vol = 0;
  for(const ex of Object.values(ws.exercise)){
    if(!ex.sets) continue;
    for(const s of ex.sets){
      vol += (s.kg||0) * (s.reps||0);
    }
  }
  return vol;
}

function finishWorkout(workoutId){
  const w = CATALOG.workouts[workoutId];
  const vol = (w.type === "checklist") ? 0 : computeVolume(workoutId);

  STATE.history.push({
    id: String(Date.now()),
    workoutId,
    title: w.title,
    dateISO: new Date().toISOString(),
    totalVolume: vol
  });

  // Dumbbell PPL rotation only
  if(workoutId === "db_push") STATE.rotation.pplNext = "db_pull";
  if(workoutId === "db_pull") STATE.rotation.pplNext = "db_legs";
  if(workoutId === "db_legs") STATE.rotation.pplNext = "db_push";

  // reset for next time (keep reps/kg)
  const ws = STATE.workouts[workoutId];
  if(ws){
    ws.startedAt = Date.now();
    for(const ex of Object.values(ws.exercise)){
      if(w.type === "checklist") ex.done = false;
      else ex.sets = ex.sets.map(s=>({...s, done:false}));
    }
  }

  saveState(STATE);
  stopRest(false);
  navTo({tab:"home"});
}

// --- Boot
render();

// Service worker is registered in index.html
