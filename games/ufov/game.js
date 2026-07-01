const CENTER = 250;
const PERIPHERAL_RADIUS = 200;
const FLANKER_RADIUS = 44;
const SHAPES = ['circle', 'triangle'];
const DIRS = [
  { key: 'N',  angle: -Math.PI / 2,       arrow: '↑' },
  { key: 'NE', angle: -Math.PI / 4,       arrow: '↗' },
  { key: 'E',  angle: 0,                  arrow: '→' },
  { key: 'SE', angle:  Math.PI / 4,       arrow: '↘' },
  { key: 'S',  angle:  Math.PI / 2,       arrow: '↓' },
  { key: 'SW', angle:  3 * Math.PI / 4,   arrow: '↙' },
  { key: 'W',  angle:  Math.PI,           arrow: '←' },
  { key: 'NW', angle: -3 * Math.PI / 4,   arrow: '↖' },
];
const DIR_GRID_LAYOUT = ['NW', 'N', 'NE', 'W', null, 'E', 'SW', 'S', 'SE'];

const TARGET_CENTER_FILL = '#ffcc00';
const TARGET_PERIPHERAL_FILL = '#66ccff';
const DISTRACTOR_BASE = [0x55, 0x55, 0x55];
const DISTRACTOR_MAX  = [0x5a, 0xb8, 0xe0]; // approaches target but never matches

const MAX_LEVEL = 22; // 7 peripheral + 7 flanker + 8 color-similarity steps

const state = {
  trial: 0,
  correct: 0,
  duration: 500,
  minDur: 50,
  maxDur: 2000,
  streak: 0,
  level: 0,
  running: false,
  current: null,
  answers: { shape: null, dir: null },
};

const stage = document.getElementById('stage');
const promptEl = document.getElementById('prompt');
const centralChoice = document.getElementById('central-choice');
const peripheralChoice = document.getElementById('peripheral-choice');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const dirGrid = document.getElementById('dir-grid');
const trialEl = document.getElementById('trial-num');
const correctEl = document.getElementById('correct-num');
const durEl = document.getElementById('dur-num');
const levelEl = document.getElementById('level-num');

function svgNS(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function clearStage() { stage.innerHTML = ''; }

function difficultyForLevel(level) {
  const peripheralDistractors = Math.min(7, level);
  const centralFlankers = Math.min(7, Math.max(0, level - 7));
  const colorSim = Math.min(1, Math.max(0, (level - 14) / 8));
  return { peripheralDistractors, centralFlankers, colorSim };
}

function distractorColor(sim) {
  const r = Math.round(DISTRACTOR_BASE[0] + (DISTRACTOR_MAX[0] - DISTRACTOR_BASE[0]) * sim);
  const g = Math.round(DISTRACTOR_BASE[1] + (DISTRACTOR_MAX[1] - DISTRACTOR_BASE[1]) * sim);
  const b = Math.round(DISTRACTOR_BASE[2] + (DISTRACTOR_MAX[2] - DISTRACTOR_BASE[2]) * sim);
  return `rgb(${r},${g},${b})`;
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCentralShape(shape, cx, cy, size, fill) {
  if (shape === 'circle') {
    stage.appendChild(svgNS('circle', { cx, cy, r: size, fill }));
  } else {
    const p = size;
    const pts = `${cx},${cy - p} ${cx + p},${cy + p} ${cx - p},${cy + p}`;
    stage.appendChild(svgNS('polygon', { points: pts, fill }));
  }
}

function drawSquare(cx, cy, size, fill) {
  stage.appendChild(svgNS('rect', {
    x: cx - size / 2, y: cy - size / 2, width: size, height: size, fill, rx: 3,
  }));
}

function drawFixation() {
  clearStage();
  const g = svgNS('g', { stroke: '#888', 'stroke-width': '2' });
  g.appendChild(svgNS('line', { x1: CENTER - 8, y1: CENTER, x2: CENTER + 8, y2: CENTER }));
  g.appendChild(svgNS('line', { x1: CENTER, y1: CENTER - 8, x2: CENTER, y2: CENTER + 8 }));
  stage.appendChild(g);
}

function drawStimulus(shape, dir) {
  clearStage();
  const { peripheralDistractors, centralFlankers, colorSim } = difficultyForLevel(state.level);
  const dColor = distractorColor(colorSim);

  // Peripheral distractors (draw first so target sits on top if any overlap).
  const nonTargetDirs = DIRS.filter(d => d.key !== dir);
  const chosenDistractors = shuffled(nonTargetDirs).slice(0, peripheralDistractors);
  for (const d of chosenDistractors) {
    const px = CENTER + Math.cos(d.angle) * PERIPHERAL_RADIUS;
    const py = CENTER + Math.sin(d.angle) * PERIPHERAL_RADIUS;
    drawSquare(px, py, 30, dColor);
  }

  // Central flankers around the central shape (mixed shapes so they crowd the discrimination).
  const flankerSlots = shuffled(DIRS).slice(0, centralFlankers);
  for (const f of flankerSlots) {
    const fx = CENTER + Math.cos(f.angle) * FLANKER_RADIUS;
    const fy = CENTER + Math.sin(f.angle) * FLANKER_RADIUS;
    const fShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    drawCentralShape(fShape, fx, fy, 8, TARGET_CENTER_FILL);
  }

  // Central target.
  drawCentralShape(shape, CENTER, CENTER, 22, TARGET_CENTER_FILL);

  // Peripheral target.
  const t = DIRS.find(x => x.key === dir);
  const tx = CENTER + Math.cos(t.angle) * PERIPHERAL_RADIUS;
  const ty = CENTER + Math.sin(t.angle) * PERIPHERAL_RADIUS;
  drawSquare(tx, ty, 30, TARGET_PERIPHERAL_FILL);
}

function drawMask() {
  clearStage();
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 500;
    const y = Math.random() * 500;
    const r = 3 + Math.random() * 6;
    stage.appendChild(svgNS('circle', { cx: x, cy: y, r, fill: '#555' }));
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTrial() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const dir = DIRS[Math.floor(Math.random() * DIRS.length)].key;
  state.current = { shape, dir };
  state.answers = { shape: null, dir: null };

  promptEl.textContent = 'Focus on the center.';
  drawFixation();
  await delay(700);
  drawStimulus(shape, dir);
  await delay(state.duration);
  drawMask();
  await delay(150);
  clearStage();
  drawFixation();
  askResponses();
}

function askResponses() {
  promptEl.textContent = 'Which central shape did you see?';
  centralChoice.classList.remove('hidden');
  peripheralChoice.classList.add('hidden');
  clearButtonMarks();
}

function clearButtonMarks() {
  document.querySelectorAll('button.correct, button.wrong').forEach(b => b.classList.remove('correct', 'wrong'));
}

function onCentralPick(shape, btn) {
  if (state.answers.shape) return;
  state.answers.shape = shape;
  btn.classList.add(shape === state.current.shape ? 'correct' : 'wrong');
  setTimeout(() => {
    centralChoice.classList.add('hidden');
    peripheralChoice.classList.remove('hidden');
    promptEl.textContent = 'Where was the blue square?';
  }, 350);
}

function onPeripheralPick(dir, btn) {
  if (state.answers.dir) return;
  state.answers.dir = dir;
  btn.classList.add(dir === state.current.dir ? 'correct' : 'wrong');
  setTimeout(finishTrial, 500);
}

function finishTrial() {
  const shapeOk = state.answers.shape === state.current.shape;
  const dirOk = state.answers.dir === state.current.dir;
  state.trial++;
  if (shapeOk && dirOk) {
    state.correct++;
    state.streak++;
    if (state.streak >= 2) {
      state.streak = 0;
      if (state.duration > state.minDur) {
        state.duration = Math.max(state.minDur, Math.round(state.duration * 0.8));
      } else if (state.level < MAX_LEVEL) {
        state.level++;
      }
    }
    promptEl.textContent = 'Correct! Both right.';
  } else {
    state.streak = 0;
    if (state.level > 0) {
      state.level = Math.max(0, state.level - 1);
    } else {
      state.duration = Math.min(state.maxDur, Math.round(state.duration * 1.25));
    }
    const parts = [];
    if (!shapeOk) parts.push(`center was ${state.current.shape}`);
    if (!dirOk) parts.push(`outer was ${state.current.dir}`);
    promptEl.textContent = 'Missed: ' + parts.join(', ') + '.';
  }
  updateStats();
  peripheralChoice.classList.add('hidden');
  centralChoice.classList.add('hidden');
  if (state.running) setTimeout(runTrial, 1200);
}

function updateStats() {
  trialEl.textContent = state.trial;
  correctEl.textContent = state.correct;
  durEl.textContent = state.duration;
  if (levelEl) levelEl.textContent = state.level;
}

function buildDirGrid() {
  dirGrid.innerHTML = '';
  for (const key of DIR_GRID_LAYOUT) {
    if (!key) {
      const spacer = document.createElement('div');
      spacer.className = 'spacer';
      dirGrid.appendChild(spacer);
      continue;
    }
    const dir = DIRS.find(d => d.key === key);
    const btn = document.createElement('button');
    btn.textContent = dir.arrow;
    btn.title = key;
    btn.addEventListener('click', () => onPeripheralPick(key, btn));
    dirGrid.appendChild(btn);
  }
}

function wireCentralButtons() {
  centralChoice.querySelectorAll('button[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => onCentralPick(btn.dataset.shape, btn));
  });
}

function start() {
  if (state.running) return;
  state.running = true;
  startBtn.textContent = 'Pause';
  runTrial();
}

function pause() {
  state.running = false;
  startBtn.textContent = 'Resume';
  promptEl.textContent = 'Paused.';
}

function reset() {
  state.running = false;
  state.trial = 0;
  state.correct = 0;
  state.duration = 500;
  state.streak = 0;
  state.level = 0;
  state.answers = { shape: null, dir: null };
  updateStats();
  centralChoice.classList.add('hidden');
  peripheralChoice.classList.add('hidden');
  clearStage();
  drawFixation();
  promptEl.textContent = 'Press Start to begin.';
  startBtn.textContent = 'Start';
}

startBtn.addEventListener('click', () => {
  if (state.running) pause();
  else start();
});
resetBtn.addEventListener('click', reset);

buildDirGrid();
wireCentralButtons();
reset();
