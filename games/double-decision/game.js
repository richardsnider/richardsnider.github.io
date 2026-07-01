const CENTER = 250;
const PERIPHERAL_RADIUS = 200;
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

const state = {
  trial: 0,
  correct: 0,
  duration: 500,
  minDur: 50,
  maxDur: 2000,
  streak: 0,
  running: false,
  current: null, // { shape, dir }
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

function svgNS(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function clearStage() { stage.innerHTML = ''; }

function drawFixation() {
  clearStage();
  const g = svgNS('g', { stroke: '#888', 'stroke-width': '2' });
  g.appendChild(svgNS('line', { x1: CENTER - 8, y1: CENTER, x2: CENTER + 8, y2: CENTER }));
  g.appendChild(svgNS('line', { x1: CENTER, y1: CENTER - 8, x2: CENTER, y2: CENTER + 8 }));
  stage.appendChild(g);
}

function drawStimulus(shape, dir) {
  clearStage();
  // Central shape.
  if (shape === 'circle') {
    stage.appendChild(svgNS('circle', { cx: CENTER, cy: CENTER, r: 22, fill: '#ffcc00' }));
  } else {
    const p = 22;
    const pts = `${CENTER},${CENTER - p} ${CENTER + p},${CENTER + p} ${CENTER - p},${CENTER + p}`;
    stage.appendChild(svgNS('polygon', { points: pts, fill: '#ffcc00' }));
  }
  // Peripheral shape (a square) at chosen direction.
  const d = DIRS.find(x => x.key === dir);
  const px = CENTER + Math.cos(d.angle) * PERIPHERAL_RADIUS;
  const py = CENTER + Math.sin(d.angle) * PERIPHERAL_RADIUS;
  stage.appendChild(svgNS('rect', {
    x: px - 15, y: py - 15, width: 30, height: 30, fill: '#66ccff', rx: 3,
  }));
}

function drawMask() {
  clearStage();
  // Random noise dots across the field to prevent afterimages.
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
    promptEl.textContent = 'Where was the outer shape?';
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
      state.duration = Math.max(state.minDur, Math.round(state.duration * 0.8));
      state.streak = 0;
    }
    promptEl.textContent = 'Correct! Both right.';
  } else {
    state.streak = 0;
    state.duration = Math.min(state.maxDur, Math.round(state.duration * 1.25));
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
