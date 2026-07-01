const CENTER = 250;
const PERIPHERAL_RADIUS = 200;
const FLANKER_RADIUS = 44;
const SHAPES = ['circle', 'triangle', 'square', 'diamond', 'pentagon', 'hexagon', 'star'];
const PALETTE = [
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
  '#c77dff', '#ff9f43', '#4ecdc4', '#f78fb3',
];
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

const FLASH_MS = 2000;
const PERIPHERAL_DISTRACTORS = 7;
const CENTRAL_FLANKERS = 7;

const state = {
  trial: 0,
  correct: 0,
  running: false,
  current: null,
  answers: { shape: null, dir: null },
};

const stage = document.getElementById('stage');
const promptEl = document.getElementById('prompt');
const centralChoice = document.getElementById('central-choice');
const peripheralChoice = document.getElementById('peripheral-choice');
const peripheralLabel = document.getElementById('peripheral-label');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const dirGrid = document.getElementById('dir-grid');
const trialEl = document.getElementById('trial-num');
const correctEl = document.getElementById('correct-num');

function svgNS(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function clearStage() { stage.innerHTML = ''; }

function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function polyPoints(cx, cy, size, sides) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / sides;
    pts.push(`${(cx + Math.cos(a) * size).toFixed(2)},${(cy + Math.sin(a) * size).toFixed(2)}`);
  }
  return pts.join(' ');
}

function starPoints(cx, cy, size) {
  const pts = [];
  const inner = size * 0.45;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

function makeShapeEl(shape, cx, cy, size, fill) {
  switch (shape) {
    case 'square':   return svgNS('rect', { x: cx - size, y: cy - size, width: size * 2, height: size * 2, rx: 2, fill });
    case 'triangle': return svgNS('polygon', { points: polyPoints(cx, cy, size, 3), fill });
    case 'diamond':  return svgNS('polygon', { points: polyPoints(cx, cy, size, 4), fill });
    case 'pentagon': return svgNS('polygon', { points: polyPoints(cx, cy, size, 5), fill });
    case 'hexagon':  return svgNS('polygon', { points: polyPoints(cx, cy, size, 6), fill });
    case 'star':     return svgNS('polygon', { points: starPoints(cx, cy, size), fill });
    case 'circle':
    default:         return svgNS('circle', { cx, cy, r: size, fill });
  }
}

function drawShape(shape, cx, cy, size, fill) {
  stage.appendChild(makeShapeEl(shape, cx, cy, size, fill));
}

function drawFixation() {
  clearStage();
  const g = svgNS('g', { stroke: '#888', 'stroke-width': '2' });
  g.appendChild(svgNS('line', { x1: CENTER - 8, y1: CENTER, x2: CENTER + 8, y2: CENTER }));
  g.appendChild(svgNS('line', { x1: CENTER, y1: CENTER - 8, x2: CENTER, y2: CENTER + 8 }));
  stage.appendChild(g);
}

function drawStimulus(shape, dir, targetShape) {
  clearStage();

  // Peripheral distractors: any shape EXCEPT the target shape, so the target
  // is the only instance of its shape and can be located without a color cue.
  const distractorShapes = SHAPES.filter(s => s !== targetShape);
  const nonTargetDirs = DIRS.filter(d => d.key !== dir);
  for (const d of shuffled(nonTargetDirs).slice(0, PERIPHERAL_DISTRACTORS)) {
    const px = CENTER + Math.cos(d.angle) * PERIPHERAL_RADIUS;
    const py = CENTER + Math.sin(d.angle) * PERIPHERAL_RADIUS;
    drawShape(randOf(distractorShapes), px, py, 15, randOf(PALETTE));
  }

  // Central flankers.
  for (const f of shuffled(DIRS).slice(0, CENTRAL_FLANKERS)) {
    const fx = CENTER + Math.cos(f.angle) * FLANKER_RADIUS;
    const fy = CENTER + Math.sin(f.angle) * FLANKER_RADIUS;
    drawShape(randOf(SHAPES), fx, fy, 8, randOf(PALETTE));
  }

  // Central target.
  drawShape(shape, CENTER, CENTER, 22, randOf(PALETTE));

  // Peripheral target: unique shape, ordinary color.
  const t = DIRS.find(x => x.key === dir);
  const tx = CENTER + Math.cos(t.angle) * PERIPHERAL_RADIUS;
  const ty = CENTER + Math.sin(t.angle) * PERIPHERAL_RADIUS;
  drawShape(targetShape, tx, ty, 15, randOf(PALETTE));
}

function drawMask() {
  clearStage();
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 500;
    const y = Math.random() * 500;
    const r = 3 + Math.random() * 6;
    drawShape(randOf(SHAPES), x, y, r, randOf(PALETTE));
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTrial() {
  const shape = randOf(SHAPES);
  const dir = randOf(DIRS).key;
  const targetShape = randOf(SHAPES);
  state.current = { shape, dir, targetShape };
  state.answers = { shape: null, dir: null };

  promptEl.textContent = 'Focus on the center.';
  drawFixation();
  await delay(700);
  drawStimulus(shape, dir, targetShape);
  await delay(FLASH_MS);
  drawMask();
  await delay(150);
  clearStage();
  drawFixation();
  askResponses();
}

function askResponses() {
  promptEl.textContent = 'Which shape was in the center?';
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
    peripheralLabel.textContent = `Where was the ${state.current.targetShape}?`;
    promptEl.textContent = `Where was the ${state.current.targetShape}?`;
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
    promptEl.textContent = 'Correct! Both right.';
  } else {
    const parts = [];
    if (!shapeOk) parts.push(`center was ${state.current.shape}`);
    if (!dirOk) parts.push(`${state.current.targetShape} was ${state.current.dir}`);
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

function buildCentralButtons() {
  centralChoice.querySelectorAll('button').forEach(b => b.remove());
  for (const shape of SHAPES) {
    const btn = document.createElement('button');
    btn.dataset.shape = shape;
    btn.title = shape;
    const svg = svgNS('svg', { viewBox: '0 0 40 40' });
    svg.appendChild(makeShapeEl(shape, 20, 20, 14, '#fff'));
    btn.appendChild(svg);
    btn.addEventListener('click', () => onCentralPick(shape, btn));
    centralChoice.appendChild(btn);
  }
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
buildCentralButtons();
reset();
