// Ricardo Routine — Professional Offline PWA (vanilla JS)
// Philosophy: minimal, fast, reliable, offline-first.

const STORAGE_KEY = "rr_v2_state";
const HISTORY_KEY = "rr_v2_history";
const SETTINGS_KEY = "rr_v2_settings";

const DEFAULT_SETTINGS = {
  restEnabled: true,
  soundEnabled: true,
  restPreset: 90, // seconds
  weightStep: 2,  // kg step for dumbbells
};

const ICONS = {
  dumbbell: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3.5 9.5v5M6.5 8v8M9.5 10h5M8.5 12h7M17.5 8v8M20.5 9.5v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  ezbar: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 9c2 0 2 6 4 6s2-6 4-6 2 6 4 6 2-6 4-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  cable: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 4v16M6 6h8a4 4 0 0 1 0 8H10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 14v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  iron: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 20V8l8-4 8 4v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 20v-7h6v7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  play: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z"/>
  </svg>`,
  home: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 11l8-7 8 7v9a2 2 0 0 1-2 2h-4v-6H10v6H6a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

const LOGO = `
<div class="logo" aria-hidden="true">
  <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
    <rect x="6" y="24" width="12" height="16" rx="4" fill="#e53e3e"/>
    <rect x="46" y="24" width="12" height="16" rx="4" fill="#e53e3e"/>
    <rect x="18" y="30" width="28" height="4" rx="2" fill="#e53e3e"/>
    <path d="M32 44c0 0-2 8-10 8" stroke="#f5f5f5" stroke-width="5" stroke-linecap="round"/>
    <path d="M32 44c0 0 2 8 10 8" stroke="#f5f5f5" stroke-width="5" stroke-linecap="round"/>
    <path d="M27 56h10" stroke="#f5f5f5" stroke-width="5" stroke-linecap="round"/>
  </svg>
</div>
`;

function nowISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function formatTime(s) {
  s = Math.max(0, Math.floor(s));
  const m = Math.floor(s/60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2,"0")}`;
}

// ----------------- Programs / Workouts (base templates) -----------------

// A "set" stores reps + kg.
// Default requested: 5 sets, 5 reps, 5 kg (user can change).
const defaultSet = (kg=5, reps=5) => ({ kg, reps, done: false });

function makeExercise(id, name, equip, demoKey, sets=5, defaultKg=5, defaultReps=5, notes="") {
  return {
    id, name, equip, demoKey, notes,
    sets: Array.from({length: sets}, () => defaultSet(defaultKg, defaultReps)),
  };
}

// Ultra-light demos: two SVG frames toggled in modal.
// (We can expand later, but this already satisfies "movement" without big files.)
const DEMOS = {
  "db-bench": {
    title: "Dumbbell Bench Press",
    cues: ["Shoulders down", "Elbows ~45°", "Control the descent"],
    frames: [
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><path d="M70 120h180" stroke="#2a2a2a" stroke-width="10" stroke-linecap="round"/><circle cx="140" cy="70" r="18" fill="#e53e3e"/><path d="M140 88v40" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M120 90l-30 10" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 90l30 10" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><rect x="80" y="110" width="120" height="16" rx="8" fill="#e53e3e"/></svg>`,
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><path d="M70 120h180" stroke="#2a2a2a" stroke-width="10" stroke-linecap="round"/><circle cx="140" cy="70" r="18" fill="#e53e3e"/><path d="M140 88v40" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M112 70l-34 -8" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M168 70l34 -8" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><rect x="80" y="110" width="120" height="16" rx="8" fill="#e53e3e"/></svg>`
    ]
  },
  "1arm-row": {
    title: "One-Arm Dumbbell Row",
    cues: ["Neutral spine", "Pull elbow to hip", "No twist"],
    frames: [
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><rect x="180" y="110" width="90" height="16" rx="8" fill="#e53e3e"/><circle cx="120" cy="70" r="18" fill="#e53e3e"/><path d="M120 88l30 40" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M150 128h60" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M130 100l-25 10" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><circle cx="90" cy="120" r="10" fill="#e53e3e"/></svg>`,
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><rect x="180" y="110" width="90" height="16" rx="8" fill="#e53e3e"/><circle cx="120" cy="70" r="18" fill="#e53e3e"/><path d="M120 88l30 40" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M150 128h60" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M140 86l-22 -14" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><circle cx="90" cy="100" r="10" fill="#e53e3e"/></svg>`
    ]
  },
  "goblet": {
    title: "Goblet Squat",
    cues: ["Ribs down", "Knees out", "Drive up"],
    frames: [
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><circle cx="160" cy="55" r="18" fill="#e53e3e"/><path d="M160 73v38" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 92l-22 12" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 92l22 12" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 110l-18 42" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 110l18 42" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><rect x="150" y="78" width="20" height="16" rx="8" fill="#e53e3e"/></svg>`,
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><circle cx="160" cy="55" r="18" fill="#e53e3e"/><path d="M160 73v38" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 94l-30 20" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 94l30 20" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 110l-10 48" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 110l10 48" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><rect x="150" y="78" width="20" height="16" rx="8" fill="#e53e3e"/></svg>`
    ]
  },
  "rdl": {
    title: "Romanian Deadlift (DB)",
    cues: ["Hinge hips back", "Soft knees", "Feel hamstrings"],
    frames: [
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><circle cx="150" cy="52" r="18" fill="#e53e3e"/><path d="M150 70v44" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M150 92l-18 12" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M150 92l18 12" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M150 114l-10 46" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M150 114l10 46" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><circle cx="125" cy="120" r="10" fill="#e53e3e"/><circle cx="175" cy="120" r="10" fill="#e53e3e"/></svg>`,
      `<svg viewBox="0 0 320 180" width="100%" height="100%"><rect width="320" height="180" rx="18" fill="#101010"/><circle cx="150" cy="52" r="18" fill="#e53e3e"/><path d="M150 70l22 50" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 92l-18 12" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M160 92l18 12" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M172 120l-6 40" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><path d="M172 120l14 40" stroke="#f5f5f5" stroke-width="10" stroke-linecap="round"/><circle cx="130" cy="140" r="10" fill="#e53e3e"/><circle cx="182" cy="140" r="10" fill="#e53e3e"/></svg>`
    ]
  },
};

const PROGRAMS = [
  { id: "db_ppl",   title: "Dumbbell PPL",      icon: "dumbbell", group: "MAIN",  equip: "Dumbbell" },
  { id: "db_full",  title: "Dumbbell Full Body",icon: "dumbbell", group: "MAIN",  equip: "Dumbbell" },
  { id: "ez_ppl",   title: "EZ Bar PPL",        icon: "ezbar",    group: "MAIN",  equip: "EZ Bar" },
  { id: "ez_full",  title: "EZ Bar Full Body",  icon: "ezbar",    group: "MAIN",  equip: "EZ Bar" },
  { id: "im_ppl",   title: "Ironmaster PPL",    icon: "iron",     group: "MAIN",  equip: "Ironmaster" },
  { id: "im_full",  title: "Ironmaster Full Body", icon: "iron",  group: "MAIN",  equip: "Ironmaster" },

  { id: "pelvic",   title: "Pelvic Tilt Reset", icon: "dumbbell", group: "COMPLEMENTARY", equip: "Reset" },
  { id: "posture",  title: "Posture Reset",     icon: "dumbbell", group: "COMPLEMENTARY", equip: "Reset" },
  { id: "mobility", title: "Mobility Flow",     icon: "dumbbell", group: "COMPLEMENTARY", equip: "Flow" },
  { id: "balance",  title: "Balance & Stability", icon: "dumbbell", group: "COMPLEMENTARY", equip: "Control" },
];

// Templates per program: keep exercises relevant to your situation (home setup, bench, posture / hip flexor / pelvic tilt themes)
function programTemplate(programId) {
  // default kg/reps: 5kg + 5 reps, 5 sets
  const baseKg = 5, baseReps = 5, baseSets = 5;

  if (programId === "db_ppl") {
    return {
      title: "Dumbbell PPL",
      type: "program",
      days: ["Push", "Pull", "Legs"],
      rotationIndex: 0,
      workouts: {
        Push: [
          makeExercise("db_bp", "Dumbbell Bench Press", "dumbbell", "db-bench", baseSets, baseKg, baseReps),
          makeExercise("db_inc", "Incline DB Press", "dumbbell", "db-bench", baseSets, baseKg, baseReps),
          makeExercise("db_ohp", "Seated DB Shoulder Press", "dumbbell", "db-bench", baseSets, baseKg, baseReps),
          makeExercise("db_lat", "DB Lateral Raise", "dumbbell", null, baseSets, baseKg, baseReps),
          makeExercise("db_tri", "DB Overhead Triceps Extension", "dumbbell", null, baseSets, baseKg, baseReps),
        ],
        Pull: [
          makeExercise("db_row", "One-Arm Dumbbell Row", "dumbbell", "1arm-row", baseSets, baseKg, baseReps),
          makeExercise("db_rdl", "DB Romanian Deadlift", "dumbbell", "rdl", baseSets, baseKg, baseReps),
          makeExercise("db_rev", "Rear Delt Fly (Incline)", "dumbbell", null, baseSets, baseKg, baseReps),
          makeExercise("db_curl", "DB Curl", "dumbbell", null, baseSets, baseKg, baseReps),
          makeExercise("chin", "Chin-Ups (BW)", "bodyweight", null, baseSets, 0, baseReps),
        ],
        Legs: [
          makeExercise("goblet", "Goblet Squat", "dumbbell", "goblet", baseSets, baseKg, baseReps),
          makeExercise("split", "Bulgarian Split Squat", "dumbbell", null, baseSets, baseKg, baseReps),
          makeExercise("hip", "Hip Thrust (Bench)", "dumbbell", null, baseSets, baseKg, baseReps),
          makeExercise("legext", "Leg Extension (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
          makeExercise("legcurl", "Hamstring Curl (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
        ],
      }
    };
  }

  if (programId === "db_full") {
    return {
      title: "Dumbbell Full Body",
      type: "program",
      days: ["Full Body"],
      rotationIndex: 0,
      workouts: {
        "Full Body": [
          makeExercise("db_bp", "Dumbbell Bench Press", "dumbbell", "db-bench", baseSets, baseKg, baseReps),
          makeExercise("row", "One-Arm Dumbbell Row", "dumbbell", "1arm-row", baseSets, baseKg, baseReps),
          makeExercise("goblet", "Goblet Squat", "dumbbell", "goblet", baseSets, baseKg, baseReps),
          makeExercise("rdl", "DB Romanian Deadlift", "dumbbell", "rdl", baseSets, baseKg, baseReps),
          makeExercise("ohp", "Seated DB Shoulder Press", "dumbbell", "db-bench", baseSets, baseKg, baseReps),
          makeExercise("curl", "DB Curl", "dumbbell", null, baseSets, baseKg, baseReps),
        ],
      }
    };
  }

  if (programId === "ez_ppl") {
    return {
      title: "EZ Bar PPL",
      type: "program",
      days: ["Push", "Pull", "Legs"],
      rotationIndex: 0,
      workouts: {
        Push: [
          makeExercise("ez_press", "EZ Bar Bench Press", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("ez_inc", "EZ Bar Incline Press", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("ez_ohp", "EZ Bar Overhead Press", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("tri", "EZ Bar Skullcrusher", "ezbar", null, baseSets, baseKg, baseReps),
        ],
        Pull: [
          makeExercise("ez_row", "EZ Bar Bent Row", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("ez_curl", "EZ Bar Curl", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("chin", "Chin-Ups (BW)", "bodyweight", null, baseSets, 0, baseReps),
        ],
        Legs: [
          makeExercise("ez_rdl", "EZ Bar RDL", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("split", "Bulgarian Split Squat", "dumbbell", null, baseSets, baseKg, baseReps),
          makeExercise("legext", "Leg Extension (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
          makeExercise("legcurl", "Hamstring Curl (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
        ],
      }
    };
  }

  if (programId === "ez_full") {
    return {
      title: "EZ Bar Full Body",
      type: "program",
      days: ["Full Body"],
      rotationIndex: 0,
      workouts: {
        "Full Body": [
          makeExercise("ez_press", "EZ Bar Bench Press", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("ez_row", "EZ Bar Bent Row", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("ez_rdl", "EZ Bar RDL", "ezbar", null, baseSets, baseKg, baseReps),
          makeExercise("legext", "Leg Extension (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
          makeExercise("curl", "EZ Bar Curl", "ezbar", null, baseSets, baseKg, baseReps),
        ]
      }
    };
  }

  if (programId === "im_ppl") {
    return {
      title: "Ironmaster PPL",
      type: "program",
      days: ["Push", "Pull", "Legs"],
      rotationIndex: 0,
      workouts: {
        Push: [
          makeExercise("db_bp", "Dumbbell Bench Press", "dumbbell", "db-bench", baseSets, baseKg, baseReps),
          makeExercise("cable_fly", "Cable Fly (High)", "cable", null, baseSets, baseKg, baseReps),
          makeExercise("pressdown", "Cable Triceps Pressdown", "cable", null, baseSets, baseKg, baseReps),
        ],
        Pull: [
          makeExercise("lat", "Lat Pulldown (Cable)", "cable", null, baseSets, baseKg, baseReps),
          makeExercise("row", "Seated Row (Cable)", "cable", null, baseSets, baseKg, baseReps),
          makeExercise("curl", "Cable Curl", "cable", null, baseSets, baseKg, baseReps),
          makeExercise("chin", "Chin-Ups (BW)", "bodyweight", null, baseSets, 0, baseReps),
        ],
        Legs: [
          makeExercise("legext", "Leg Extension (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
          makeExercise("legcurl", "Hamstring Curl (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
          makeExercise("hip", "Hip Thrust (Bench)", "dumbbell", null, baseSets, baseKg, baseReps),
        ]
      }
    };
  }

  if (programId === "im_full") {
    return {
      title: "Ironmaster Full Body",
      type: "program",
      days: ["Full Body"],
      rotationIndex: 0,
      workouts: {
        "Full Body": [
          makeExercise("db_bp", "Dumbbell Bench Press", "dumbbell", "db-bench", baseSets, baseKg, baseReps),
          makeExercise("lat", "Lat Pulldown (Cable)", "cable", null, baseSets, baseKg, baseReps),
          makeExercise("row", "Seated Row (Cable)", "cable", null, baseSets, baseKg, baseReps),
          makeExercise("legext", "Leg Extension (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
          makeExercise("legcurl", "Hamstring Curl (Attachment)", "ironmaster", null, baseSets, baseKg, baseReps),
        ]
      }
    };
  }

  // Complementary flows (short checklists, no weights)
  if (programId === "pelvic") {
    return { title: "Pelvic Tilt Reset", type: "checklist", items: [
      { text: "90/90 breathing (ribs down)", done:false },
      { text: "Hip flexor stretch (each side)", done:false },
      { text: "Glute bridge (slow)", done:false },
      { text: "Dead bug (control)", done:false },
    ]};
  }
  if (programId === "posture") {
    return { title: "Posture Reset", type: "checklist", items: [
      { text: "Wall slides", done:false },
      { text: "Band pull-aparts (or rear delt fly)", done:false },
      { text: "Chin tucks", done:false },
      { text: "Thoracic extension", done:false },
    ]};
  }
  if (programId === "mobility") {
    return { title: "Mobility Flow", type: "checklist", items: [
      { text: "Cat-cow (slow)", done:false },
      { text: "Hip hinge drill", done:false },
      { text: "World's greatest stretch", done:false },
      { text: "Ankle rocks", done:false },
    ]};
  }
  if (programId === "balance") {
    return { title: "Balance & Stability", type: "checklist", items: [
      { text: "Single-leg stand (each side)", done:false },
      { text: "Split squat iso hold", done:false },
      { text: "Side plank (each side)", done:false },
      { text: "Farmer hold (DB)", done:false },
    ]};
  }

  return { title: "Unknown", type: "checklist", items: [] };
}

// ----------------- App state -----------------

let settings = loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS);
settings = { ...DEFAULT_SETTINGS, ...settings };

let state = loadJSON(STORAGE_KEY, {
  activeTab: "home",     // home | history | settings
  activeProgramId: null, // e.g. db_ppl
  activeDay: null,       // Push/Pull/Legs/Full Body
  activeWorkout: null,   // current workout object (deep)
  sessionStart: null,    // timestamp
  rest: null,            // { endsAt, duration }
});

let history = loadJSON(HISTORY_KEY, []);

// install prompt
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

// service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
}

// ----------------- Audio (beep) -----------------
function beepDouble() {
  if (!settings.soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (t, freq=880, dur=0.08) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.08;
      o.connect(g); g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
    };
    const t0 = ctx.currentTime + 0.02;
    play(t0, 880, 0.08);
    play(t0 + 0.18, 880, 0.08);
    setTimeout(()=>ctx.close(), 600);
  } catch {}
}
function vibrate(ms=200) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

// ----------------- UI helpers -----------------
const app = document.getElementById("app");

function saveAll() {
  saveJSON(SETTINGS_KEY, settings);
  saveJSON(STORAGE_KEY, state);
  saveJSON(HISTORY_KEY, history);
}

function setTab(tab) {
  state.activeTab = tab;
  saveAll();
  render();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function startProgram(programId) {
  const tpl = programTemplate(programId);
  state.activeProgramId = programId;

  if (tpl.type === "program") {
    // restore per-program last saved data if exists
    const perKey = `rr_v2_prog_${programId}`;
    const saved = loadJSON(perKey, null);
    const programState = saved ?? tpl;

    // choose day by rotation index
    const day = programState.days[programState.rotationIndex % programState.days.length];
    state.activeDay = day;
    // deep clone workout day (so we can edit sets/done)
    state.activeWorkout = deepClone({ title: programState.title, day, exercises: programState.workouts[day] });
    state.sessionStart = Date.now();
    state.rest = null;

    // persist program state separately
    saveJSON(perKey, programState);

    state.activeTab = "workout";
  } else {
    // checklist
    const perKey = `rr_v2_check_${programId}`;
    const saved = loadJSON(perKey, null);
    state.activeWorkout = saved ?? tpl;
    state.sessionStart = Date.now();
    state.rest = null;
    state.activeTab = "checklist";
    saveJSON(perKey, state.activeWorkout);
  }

  saveAll();
  render();
}

function goHome() {
  state.activeTab = "home";
  state.activeProgramId = null;
  state.activeDay = null;
  state.activeWorkout = null;
  state.sessionStart = null;
  state.rest = null;
  saveAll();
  render();
}

function ensureModal() {
  if (document.getElementById("modalOverlay")) return;
  const div = document.createElement("div");
  div.id = "modalOverlay";
  div.className = "modalOverlay";
  div.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="Editor"></div>`;
  div.addEventListener("click", (e) => {
    if (e.target === div) closeModal();
  });
  document.body.appendChild(div);
}

function openModal(html) {
  ensureModal();
  const overlay = document.getElementById("modalOverlay");
  overlay.classList.add("open");
  overlay.querySelector(".modal").innerHTML = html;
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("open");
}

function longPress(el, onLongPress, ms=420) {
  let timer = null;
  let moved = false;

  const start = (e) => {
    moved = false;
    timer = setTimeout(() => {
      timer = null;
      if (!moved) onLongPress(e);
    }, ms);
  };
  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchmove", () => { moved = true; cancel(); }, { passive: true });
  el.addEventListener("touchend", cancel);
  el.addEventListener("touchcancel", cancel);

  el.addEventListener("mousedown", start);
  el.addEventListener("mousemove", () => { moved = true; cancel(); });
  el.addEventListener("mouseup", cancel);
  el.addEventListener("mouseleave", cancel);
}

// ----------------- Rest timer -----------------
let restInterval = null;

function startRest(durationSec) {
  if (!settings.restEnabled) return;
  state.rest = { endsAt: Date.now() + durationSec*1000, duration: durationSec };
  saveAll();
  render();
  tickRest();
  if (restInterval) clearInterval(restInterval);
  restInterval = setInterval(tickRest, 250);
}

function stopRest() {
  state.rest = null;
  saveAll();
  render();
  if (restInterval) clearInterval(restInterval);
  restInterval = null;
}

function tickRest() {
  if (!state.rest) return;
  const remaining = Math.ceil((state.rest.endsAt - Date.now()) / 1000);
  if (remaining <= 0) {
    stopRest();
    beepDouble();
    vibrate(180);
    return;
  }
  // re-render timer only (cheap approach: full render, still ok for small app)
  render();
}

// ----------------- Workout actions -----------------
function toggleSetDone(exIdx, setIdx) {
  const ex = state.activeWorkout.exercises[exIdx];
  const set = ex.sets[setIdx];
  set.done = !set.done;
  saveAll();
  render();

  if (set.done) startRest(settings.restPreset);
}

function editSet(exIdx, setIdx) {
  const ex = state.activeWorkout.exercises[exIdx];
  const set = ex.sets[setIdx];

  const isBW = ex.equip === "bodyweight";
  let reps = set.reps ?? 5;
  let kg = set.kg ?? 0;

  const weightStep = settings.weightStep || 2;

  const quickWeights = isBW
    ? [0]
    : [0, 2,4,6,8,10,12,14,16,18,20,22,24,26,28,30].filter(x => x % weightStep === 0);

  function renderModal() {
    openModal(`
      <div class="modalHeader">
        <div>
          <h3>${escapeHtml(ex.name)} · Set ${setIdx+1}</h3>
          <div class="smallMuted">${isBW ? "Bodyweight" : "Kg step: " + weightStep}</div>
        </div>
        <button id="mClose">Close</button>
      </div>

      <div class="kv">
        <div class="kvBox">
          <small>Reps</small>
          <div class="big" id="mReps">${reps}</div>
          <div class="stepper">
            <button id="repsMinus">−</button>
            <button id="repsPlus">+</button>
          </div>
        </div>
        <div class="kvBox">
          <small>${isBW ? "Load" : "Weight"}</small>
          <div class="big" id="mKg">${isBW ? "BW" : kg + " kg"}</div>
          <div class="stepper">
            <button id="kgMinus" ${isBW ? "disabled" : ""}>−</button>
            <button id="kgPlus" ${isBW ? "disabled" : ""}>+</button>
          </div>
        </div>
      </div>

      ${isBW ? "" : `
        <div class="quick" aria-label="Quick weights">
          ${quickWeights.map(w => `<button class="chip" data-w="${w}">${w} kg</button>`).join("")}
        </div>
      `}

      <div class="modalFooter">
        <button class="btnGhost" id="mReset">Reset</button>
        <button class="btnPrimary" id="mOk">OK</button>
      </div>
    `);

    document.getElementById("mClose").onclick = closeModal;
    document.getElementById("repsMinus").onclick = () => { reps = clamp(reps-1, 1, 99); renderModal(); };
    document.getElementById("repsPlus").onclick  = () => { reps = clamp(reps+1, 1, 99); renderModal(); };

    if (!isBW) {
      document.getElementById("kgMinus").onclick = () => { kg = clamp(kg-weightStep, 0, 999); renderModal(); };
      document.getElementById("kgPlus").onclick  = () => { kg = clamp(kg+weightStep, 0, 999); renderModal(); };
      document.querySelectorAll(".chip").forEach(btn => {
        btn.onclick = () => { kg = parseInt(btn.dataset.w, 10); renderModal(); };
      });
    }

    document.getElementById("mReset").onclick = () => {
      reps = 5;
      kg = isBW ? 0 : 5;
      renderModal();
    };

    document.getElementById("mOk").onclick = () => {
      set.reps = reps;
      set.kg = kg;
      saveAll();
      closeModal();
      render();
    };
  }

  renderModal();
}

function editSetCount(exIdx) {
  const ex = state.activeWorkout.exercises[exIdx];
  let count = ex.sets.length;

  openModal(`
    <div class="modalHeader">
      <div>
        <h3>${escapeHtml(ex.name)}</h3>
        <div class="smallMuted">Set count</div>
      </div>
      <button id="mClose">Close</button>
    </div>

    <div class="kv">
      <div class="kvBox" style="grid-column: 1 / -1;">
        <small>Sets</small>
        <div class="big" id="mCount">${count}</div>
        <div class="stepper">
          <button id="cMinus">−</button>
          <button id="cPlus">+</button>
        </div>
      </div>
    </div>

    <div class="modalFooter">
      <button class="btnGhost" id="mCancel">Cancel</button>
      <button class="btnPrimary" id="mApply">Apply</button>
    </div>
  `);

  document.getElementById("mClose").onclick = closeModal;
  document.getElementById("mCancel").onclick = closeModal;
  document.getElementById("cMinus").onclick = () => {
    count = clamp(count-1, 1, 12);
    document.getElementById("mCount").textContent = String(count);
  };
  document.getElementById("cPlus").onclick = () => {
    count = clamp(count+1, 1, 12);
    document.getElementById("mCount").textContent = String(count);
  };
  document.getElementById("mApply").onclick = () => {
    const cur = ex.sets.length;
    if (count > cur) {
      for (let i=0; i<count-cur; i++) ex.sets.push(defaultSet(ex.sets[0]?.kg ?? 5, ex.sets[0]?.reps ?? 5));
    } else if (count < cur) {
      ex.sets = ex.sets.slice(0, count);
    }
    saveAll();
    closeModal();
    render();
  };
}

function showDemo(exIdx) {
  const ex = state.activeWorkout.exercises[exIdx];
  const demo = ex.demoKey ? DEMOS[ex.demoKey] : null;
  if (!demo) {
    openModal(`
      <div class="modalHeader">
        <h3>No demo yet</h3>
        <button id="mClose">Close</button>
      </div>
      <div class="smallMuted" style="padding: 4px 6px 14px;">This exercise has no demo yet.</div>
      <div class="modalFooter">
        <button class="btnPrimary" id="mOk">OK</button>
      </div>
    `);
    document.getElementById("mClose").onclick = closeModal;
    document.getElementById("mOk").onclick = closeModal;
    return;
  }

  let frame = 0;
  let interval = null;

  const renderDemo = () => {
    openModal(`
      <div class="modalHeader">
        <div>
          <h3>${escapeHtml(demo.title)}</h3>
          <div class="smallMuted">${demo.cues.join(" · ")}</div>
        </div>
        <button id="mClose">Close</button>
      </div>

      <div style="border:1px solid rgba(255,255,255,.08); border-radius: 18px; overflow:hidden; background:#101010; height: 200px; display:grid; place-items:center;">
        <div id="demoFrame" style="width:100%; height:100%;">${demo.frames[frame]}</div>
      </div>

      <div class="modalFooter">
        <button class="btnPrimary" id="mOk">OK</button>
      </div>
    `);

    document.getElementById("mClose").onclick = () => { if(interval) clearInterval(interval); closeModal(); };
    document.getElementById("mOk").onclick = () => { if(interval) clearInterval(interval); closeModal(); };

    if (!interval) {
      interval = setInterval(() => {
        frame = (frame + 1) % demo.frames.length;
        const el = document.getElementById("demoFrame");
        if (el) el.innerHTML = demo.frames[frame];
      }, 700);
    }
  };

  renderDemo();
}

// ----------------- Finish workout -----------------
function finishWorkout() {
  if (!state.activeWorkout) return;

  // store into history
  const entry = {
    date: nowISO(),
    programId: state.activeProgramId,
    title: state.activeWorkout.title,
    day: state.activeWorkout.day || null,
    durationSec: state.sessionStart ? Math.floor((Date.now() - state.sessionStart)/1000) : null,
    workout: state.activeWorkout,
  };
  history.unshift(entry);
  history = history.slice(0, 200);

  // update program rotation + persist last sets (so next time fields are prefilled)
  const programId = state.activeProgramId;
  const perKey = `rr_v2_prog_${programId}`;
  const programState = loadJSON(perKey, null);

  if (programState && programState.type === "program") {
    // write back the edited workout day into programState.workouts[day]
    const day = state.activeWorkout.day;
    programState.workouts[day] = deepClone(state.activeWorkout.exercises);

    // advance rotation
    programState.rotationIndex = (programState.rotationIndex + 1) % programState.days.length;
    saveJSON(perKey, programState);
  } else if (state.activeWorkout.type === "checklist") {
    const checkKey = `rr_v2_check_${programId}`;
    saveJSON(checkKey, state.activeWorkout);
  }

  // reset active session, go HOME (as requested)
  state.activeProgramId = null;
  state.activeDay = null;
  state.activeWorkout = null;
  state.sessionStart = null;
  state.rest = null;
  state.activeTab = "home";

  saveAll();
  render();
}

// ----------------- Rendering -----------------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

function renderTop() {
  return `
    <div class="top">
      <div class="brand">
        ${LOGO}
        <div>
          <h1>Ricardo Routine</h1>
          <small>Offline home gym tracker</small>
        </div>
      </div>
    </div>
  `;
}

function renderHome() {
  const main = PROGRAMS.filter(p => p.group === "MAIN");
  const comp = PROGRAMS.filter(p => p.group === "COMPLEMENTARY");

  const card = (p) => `
    <div class="card">
      <div class="row">
        <div style="display:flex; align-items:center; gap:10px; min-width:0;">
          <div class="pill" style="display:flex; gap:8px; align-items:center;">
            ${ICONS[p.icon] || ICONS.dumbbell}
            <span>${escapeHtml(p.equip)}</span>
          </div>
          <div style="min-width:0;">
            <p class="cardTitle">${escapeHtml(p.title)}</p>
            <div class="cardSub">Tap to start</div>
          </div>
        </div>
        <button class="btnSmall" data-start="${p.id}">Start</button>
      </div>
    </div>
  `;

  return `
    ${renderTop()}
    <div class="sectionTitle">Main Workouts</div>
    <div class="grid">${main.map(card).join("")}</div>

    <div class="sectionTitle">Complementary</div>
    <div class="grid">${comp.map(card).join("")}</div>
  `;
}

function renderWorkout() {
  const w = state.activeWorkout;
  const elapsed = state.sessionStart ? Math.floor((Date.now()-state.sessionStart)/1000) : 0;

  const timerBar = (() => {
    if (!state.rest) return `
      <div class="timerBar">
        <div class="timerLeft">
          <b>Session</b>
          <small>${formatTime(elapsed)}</small>
        </div>
        <div class="timerRight">
          <span class="badge">Rest: ${settings.restPreset}s</span>
          <button class="btnSmall" id="homeBtn">${ICONS.home} Home</button>
        </div>
      </div>
    `;
    const remaining = Math.ceil((state.rest.endsAt - Date.now())/1000);
    return `
      <div class="timerBar">
        <div class="timerLeft">
          <b>Rest</b>
          <small>Session ${formatTime(elapsed)}</small>
        </div>
        <div class="timerRight">
          <div class="countdown">${formatTime(remaining)}</div>
          <button class="btnSmall" id="skipRest">Skip</button>
          <button class="btnSmall" id="homeBtn">${ICONS.home} Home</button>
        </div>
      </div>
    `;
  })();

  const exCards = w.exercises.map((ex, exIdx) => {
    const isBW = ex.equip === "bodyweight";
    return `
      <div class="exercise" data-ex="${exIdx}">
        <div class="exTop">
          <div class="exName" data-editsets="${exIdx}" title="Long-press to change set count">
            <h3>${escapeHtml(ex.name)}</h3>
          </div>
          <button class="playBtn" data-demo="${exIdx}" title="View demo">${ICONS.play}</button>
        </div>

        <div class="sets">
          ${ex.sets.map((s, setIdx) => `
            <div class="setBallWrap">
              <button class="setBall ${s.done ? "done":""}" data-set="${exIdx}:${setIdx}" title="Tap: done, Hold: edit">${escapeHtml(s.reps ?? 5)}</button>
              <div class="setKg">${isBW ? "BW" : escapeHtml(s.kg ?? 0)}<span>${isBW ? "" : "kg"}</span></div>
            </div>
          `).join("")}
        </div>

        <div class="setActions">
          <button class="btnGhost" data-addset="${exIdx}">+ Add set</button>
          <div class="badge">${isBW ? "Bodyweight" : "Tap = done, Hold = edit"}</div>
        </div>
      </div>
    `;
  }).join("");

  return `
    ${timerBar}
    <div class="screenHeader">
      <div>
        <h2>${escapeHtml(w.title)}${w.day ? " · " + escapeHtml(w.day) : ""}</h2>
        <div class="meta">Tap a set to complete, hold a set to edit reps & weight, hold title to change set count.</div>
      </div>
      <button class="btnGhost" id="finishBtn">Finish</button>
    </div>

    <div class="workoutList">${exCards}</div>
  `;
}

function renderChecklist() {
  const w = state.activeWorkout;
  const elapsed = state.sessionStart ? Math.floor((Date.now()-state.sessionStart)/1000) : 0;

  const timerBar = `
    <div class="timerBar">
      <div class="timerLeft">
        <b>Session</b>
        <small>${formatTime(elapsed)}</small>
      </div>
      <div class="timerRight">
        <button class="btnSmall" id="homeBtn">${ICONS.home} Home</button>
      </div>
    </div>
  `;

  const items = w.items.map((it, idx) => `
    <div class="setting" data-item="${idx}">
      <div style="font-weight:900">${escapeHtml(it.text)}</div>
      <button class="btnSmall" data-toggleitem="${idx}">${it.done ? "Done" : "Mark"}</button>
    </div>
  `).join("");

  const allDone = w.items.every(x => x.done);

  return `
    ${timerBar}
    <div class="screenHeader">
      <div>
        <h2>${escapeHtml(w.title)}</h2>
        <div class="meta">Quick checklist. Keep it simple.</div>
      </div>
      <button class="btnGhost" id="finishBtn" ${allDone ? "" : "disabled"}>${allDone ? "Finish" : "Finish (complete all)"}</button>
    </div>

    <div class="settingsList">${items}</div>
  `;
}

function renderHistory() {
  const items = history.length ? history.map((h, idx) => `
    <div class="card">
      <div class="row">
        <div style="min-width:0;">
          <p class="cardTitle">${escapeHtml(h.title)}${h.day ? " · " + escapeHtml(h.day) : ""}</p>
          <div class="cardSub">${escapeHtml(h.date)}${h.durationSec != null ? " · " + formatTime(h.durationSec) : ""}</div>
        </div>
        <button class="btnSmall" data-openhist="${idx}">View</button>
      </div>
    </div>
  `).join("") : `<div class="card"><div class="cardTitle">No history yet</div><div class="cardSub">Finish a workout to save it.</div></div>`;

  return `
    ${renderTop()}
    <div class="sectionTitle">History</div>
    <div class="grid">${items}</div>
  `;
}

function renderSettings() {
  const installEnabled = !!deferredInstallPrompt;
  return `
    ${renderTop()}
    <div class="sectionTitle">Settings</div>
    <div class="settingsList">

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Rest timer</div>
          <div class="smallMuted">Auto-start after set</div>
        </div>
        <button class="toggle ${settings.restEnabled ? "on":""}" id="toggleRest" aria-label="Toggle rest"></button>
      </div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Sound</div>
          <div class="smallMuted">Beep at rest end</div>
        </div>
        <button class="toggle ${settings.soundEnabled ? "on":""}" id="toggleSound" aria-label="Toggle sound"></button>
      </div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Rest preset</div>
          <div class="smallMuted">${settings.restPreset}s</div>
        </div>
        <div style="display:flex; gap:8px;">
          ${[30,60,90,120].map(v => `<button class="btnSmall" data-rest="${v}" style="${settings.restPreset===v ? "border-color: rgba(229,62,62,.45); background: rgba(229,62,62,.14);" : ""}">${v}s</button>`).join("")}
        </div>
      </div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Weight step</div>
          <div class="smallMuted">${settings.weightStep} kg</div>
        </div>
        <div style="display:flex; gap:8px;">
          ${[1,2,2.5,5].map(v => `<button class="btnSmall" data-step="${v}" style="${settings.weightStep===v ? "border-color: rgba(229,62,62,.45); background: rgba(229,62,62,.14);" : ""}">${v}</button>`).join("")}
        </div>
      </div>

      <div class="hr"></div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Install app</div>
          <div class="smallMuted">${installEnabled ? "Available" : "Already installed or not supported"}</div>
        </div>
        <button class="btnSmall" id="installBtn" ${installEnabled ? "" : "disabled"}>Install</button>
      </div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Share</div>
          <div class="smallMuted">Send link (WhatsApp, etc.)</div>
        </div>
        <button class="btnSmall" id="shareBtn">Share</button>
      </div>

      <div class="hr"></div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Export backup</div>
          <div class="smallMuted">JSON file</div>
        </div>
        <button class="btnSmall" id="exportBtn">Export</button>
      </div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Import backup</div>
          <div class="smallMuted">JSON file</div>
        </div>
        <input type="file" id="importFile" accept="application/json" style="max-width: 180px; color: var(--muted);" />
      </div>

      <div class="hr"></div>

      <div class="setting">
        <div>
          <div style="font-weight:1000;">Reset data</div>
          <div class="smallMuted">Clears workouts and history</div>
        </div>
        <button class="btnSmall" id="resetBtn" style="border-color: rgba(229,62,62,.45);">Reset</button>
      </div>
    </div>
  `;
}

function renderNav(active) {
  // active is one of home/history/settings; workout/checklist screens still show nav but home button exists.
  return `
    <div class="nav">
      <button class="${active==="home" ? "active":""}" data-tab="home">Home</button>
      <button class="${active==="history" ? "active":""}" data-tab="history">History</button>
      <button class="${active==="settings" ? "active":""}" data-tab="settings">Settings</button>
    </div>
  `;
}

function render() {
  const t = state.activeTab;

  let html = "";
  if (t === "home") html = renderHome() + renderNav("home");
  else if (t === "history") html = renderHistory() + renderNav("history");
  else if (t === "settings") html = renderSettings() + renderNav("settings");
  else if (t === "workout") html = renderWorkout() + renderNav("home");
  else if (t === "checklist") html = renderChecklist() + renderNav("home");
  else html = renderHome() + renderNav("home");

  app.innerHTML = html;

  // bind home cards
  document.querySelectorAll("[data-start]").forEach(btn => {
    btn.onclick = () => startProgram(btn.dataset.start);
  });

  // nav
  document.querySelectorAll(".nav [data-tab]").forEach(btn => {
    btn.onclick = () => setTab(btn.dataset.tab);
  });

  // workout actions
  const homeBtn = document.getElementById("homeBtn");
  if (homeBtn) homeBtn.onclick = goHome;

  const finishBtn = document.getElementById("finishBtn");
  if (finishBtn) finishBtn.onclick = finishWorkout;

  const skipRest = document.getElementById("skipRest");
  if (skipRest) skipRest.onclick = stopRest;

  // bind checklist toggle
  document.querySelectorAll("[data-toggleitem]").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.toggleitem, 10);
      state.activeWorkout.items[idx].done = !state.activeWorkout.items[idx].done;
      // persist checklists
      const key = `rr_v2_check_${state.activeProgramId}`;
      saveJSON(key, state.activeWorkout);
      saveAll();
      render();
    };
  });

  // bind demo + sets
  document.querySelectorAll("[data-demo]").forEach(btn => {
    btn.onclick = () => showDemo(parseInt(btn.dataset.demo,10));
  });

  document.querySelectorAll("[data-set]").forEach(btn => {
    const [exIdx, setIdx] = btn.dataset.set.split(":").map(x => parseInt(x,10));
    btn.onclick = () => toggleSetDone(exIdx, setIdx);
    longPress(btn, () => editSet(exIdx, setIdx));
  });

  // long press title to change set count
  document.querySelectorAll("[data-editsets]").forEach(el => {
    const exIdx = parseInt(el.dataset.editsets, 10);
    longPress(el, () => editSetCount(exIdx));
  });

  // add set
  document.querySelectorAll("[data-addset]").forEach(btn => {
    btn.onclick = () => {
      const exIdx = parseInt(btn.dataset.addset,10);
      const ex = state.activeWorkout.exercises[exIdx];
      const base = ex.sets[ex.sets.length-1] || defaultSet(5,5);
      ex.sets.push({ kg: base.kg, reps: base.reps, done: false });
      saveAll();
      render();
    };
  });

  // history view
  document.querySelectorAll("[data-openhist]").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.dataset.openhist, 10);
      const h = history[idx];
      openModal(`
        <div class="modalHeader">
          <div>
            <h3>${escapeHtml(h.title)}${h.day ? " · " + escapeHtml(h.day) : ""}</h3>
            <div class="smallMuted">${escapeHtml(h.date)}${h.durationSec != null ? " · " + formatTime(h.durationSec) : ""}</div>
          </div>
          <button id="mClose">Close</button>
        </div>
        <div class="smallMuted" style="padding: 6px 6px 12px;">(History stored locally)</div>
        <div class="modalFooter">
          <button class="btnPrimary" id="mOk">OK</button>
        </div>
      `);
      document.getElementById("mClose").onclick = closeModal;
      document.getElementById("mOk").onclick = closeModal;
    };
  });

  // settings binds
  const toggleRest = document.getElementById("toggleRest");
  if (toggleRest) toggleRest.onclick = () => { settings.restEnabled = !settings.restEnabled; saveAll(); render(); };

  const toggleSound = document.getElementById("toggleSound");
  if (toggleSound) toggleSound.onclick = () => { settings.soundEnabled = !settings.soundEnabled; saveAll(); render(); };

  document.querySelectorAll("[data-rest]").forEach(btn => {
    btn.onclick = () => { settings.restPreset = parseInt(btn.dataset.rest,10); saveAll(); render(); };
  });
  document.querySelectorAll("[data-step]").forEach(btn => {
    btn.onclick = () => { settings.weightStep = parseFloat(btn.dataset.step); saveAll(); render(); };
  });

  const installBtn = document.getElementById("installBtn");
  if (installBtn) installBtn.onclick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    render();
  };

  const shareBtn = document.getElementById("shareBtn");
  if (shareBtn) shareBtn.onclick = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ricardo Routine", text: "My offline workout tracker", url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
        openModal(`
          <div class="modalHeader"><h3>Link copied</h3><button id="mClose">Close</button></div>
          <div class="smallMuted" style="padding: 6px 6px 14px;">Paste it anywhere (WhatsApp, etc.).</div>
          <div class="modalFooter"><button class="btnPrimary" id="mOk">OK</button></div>
        `);
        document.getElementById("mClose").onclick = closeModal;
        document.getElementById("mOk").onclick = closeModal;
      }
    } catch {}
  };

  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) exportBtn.onclick = () => {
    const blob = new Blob([JSON.stringify({ state, history, settings }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ricardo-routine-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = document.getElementById("importFile");
  if (importFile) importFile.onchange = async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      if (obj.settings) settings = { ...DEFAULT_SETTINGS, ...obj.settings };
      if (obj.state) state = { ...state, ...obj.state, activeTab: "home", activeWorkout: null, activeProgramId: null };
      if (obj.history) history = obj.history;
      saveAll();
      openModal(`
        <div class="modalHeader"><h3>Import complete</h3><button id="mClose">Close</button></div>
        <div class="modalFooter"><button class="btnPrimary" id="mOk">OK</button></div>
      `);
      document.getElementById("mClose").onclick = closeModal;
      document.getElementById("mOk").onclick = closeModal;
    } catch {
      openModal(`
        <div class="modalHeader"><h3>Import failed</h3><button id="mClose">Close</button></div>
        <div class="smallMuted" style="padding: 6px 6px 14px;">Invalid JSON.</div>
        <div class="modalFooter"><button class="btnPrimary" id="mOk">OK</button></div>
      `);
      document.getElementById("mClose").onclick = closeModal;
      document.getElementById("mOk").onclick = closeModal;
    }
  };

  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.onclick = () => {
    openModal(`
      <div class="modalHeader"><h3>Reset everything?</h3><button id="mClose">Close</button></div>
      <div class="smallMuted" style="padding: 6px 6px 14px;">This clears workouts, settings and history on this device.</div>
      <div class="modalFooter">
        <button class="btnGhost" id="mCancel">Cancel</button>
        <button class="btnPrimary" id="mYes">Reset</button>
      </div>
    `);
    document.getElementById("mClose").onclick = closeModal;
    document.getElementById("mCancel").onclick = closeModal;
    document.getElementById("mYes").onclick = () => {
      localStorage.clear();
      settings = { ...DEFAULT_SETTINGS };
      state = { activeTab: "home", activeProgramId: null, activeDay: null, activeWorkout: null, sessionStart: null, rest: null };
      history = [];
      saveAll();
      closeModal();
      render();
    };
  };
}

render();
