const CENTER = 250;
const PERIPHERAL_RADIUS = 200;
const CENTRAL_RADIUS = 80;
const FONT_SIZE = 26;

// A wide array of visually distinct glyphs: uppercase letters, digits, and
// common symbols. Rendered in Georgia (serif), whose serifed I and narrow 0
// keep the otherwise-confusable characters (I/1, O/0) distinct.
const CHARS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '★', '♦', '♥', '♠', '♣', '●', '▲', '■', '◆', '✦', '✿', '❄',
  '☀', '☂', '☎', '☯', '♫', '⚡', '✈', '☺', '⚑', '⌘',
];
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

const FLASH_MS = 3000;
const PERIPHERAL_DISTRACTORS = 3;
const CENTRAL_TARGETS = 5;      // characters shown at random central positions
const CENTRAL_CANDIDATES = 10;   // total buttons: the targets plus decoys

const state = {
  trial: 0,
  correct: 0,
  running: false,
  current: null,
  answers: { chars: null, dir: null },
};

let selected = [];   // central characters the player has toggled on this trial

const stage = document.getElementById('stage');
const promptEl = document.getElementById('prompt');
const centralChoice = document.getElementById('central-choice');
const peripheralChoice = document.getElementById('peripheral-choice');
const peripheralLabel = document.getElementById('peripheral-label');
const resultPanel = document.getElementById('result');
const resultSummary = document.getElementById('result-summary');
const continueBtn = document.getElementById('continue-btn');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const dirGrid = document.getElementById('dir-grid');
const trialEl = document.getElementById('trial-num');
const correctEl = document.getElementById('correct-num');

function svgNS(tag, attrs = {}, text) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text != null) el.textContent = text;
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

function makeCharEl(char, x, y, color) {
  return svgNS('text', {
    x, y, fill: color,
    'font-size': FONT_SIZE,
    'font-family': "Georgia, 'Times New Roman', serif",
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
  }, char);
}

function drawFixation() {
  clearStage();
  const g = svgNS('g', { stroke: '#888', 'stroke-width': '2' });
  g.appendChild(svgNS('line', { x1: CENTER - 8, y1: CENTER, x2: CENTER + 8, y2: CENTER }));
  g.appendChild(svgNS('line', { x1: CENTER, y1: CENTER - 8, x2: CENTER, y2: CENTER + 8 }));
  stage.appendChild(g);
}

// Scatter n non-overlapping points within a disc of CENTRAL_RADIUS around center.
function randomCentralPositions(n) {
  const pts = [];
  const minDist = FONT_SIZE * 1.6;
  let guard = 0;
  while (pts.length < n && guard++ < 500) {
    const a = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * CENTRAL_RADIUS;
    const x = CENTER + Math.cos(a) * r;
    const y = CENTER + Math.sin(a) * r;
    if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= minDist)) pts.push({ x, y });
  }
  return pts;
}

// Build a full description of every glyph on screen so the exact same layout
// can be redrawn after the player answers.
function buildLayout(centralChars, targetChar, dir) {
  const entities = [];

  // Peripheral distractors: any char EXCEPT the target char, so the target is
  // the only instance of its glyph and can be located without a color cue.
  const distractorChars = CHARS.filter(c => c !== targetChar);
  const nonTargetDirs = DIRS.filter(d => d.key !== dir);
  for (const d of shuffled(nonTargetDirs).slice(0, PERIPHERAL_DISTRACTORS)) {
    entities.push({
      role: 'distractor', char: randOf(distractorChars),
      x: CENTER + Math.cos(d.angle) * PERIPHERAL_RADIUS,
      y: CENTER + Math.sin(d.angle) * PERIPHERAL_RADIUS,
      color: randOf(PALETTE),
    });
  }

  // Central targets: the characters the player must recall, scattered near center.
  const positions = randomCentralPositions(centralChars.length);
  centralChars.forEach((char, i) => {
    entities.push({ role: 'central', char, x: positions[i].x, y: positions[i].y, color: randOf(PALETTE) });
  });

  // Peripheral target: unique glyph, ordinary color.
  const t = DIRS.find(x => x.key === dir);
  entities.push({
    role: 'target', char: targetChar,
    x: CENTER + Math.cos(t.angle) * PERIPHERAL_RADIUS,
    y: CENTER + Math.sin(t.angle) * PERIPHERAL_RADIUS,
    color: randOf(PALETTE),
  });

  return entities;
}

function renderLayout(layout) {
  clearStage();
  for (const e of layout) stage.appendChild(makeCharEl(e.char, e.x, e.y, e.color));
}

function ring(x, y, stroke) {
  stage.appendChild(svgNS('circle', { cx: x, cy: y, r: FONT_SIZE * 0.9, fill: 'none', stroke, 'stroke-width': 2 }));
}

function showOriginal(layout) {
  renderLayout(layout);
  for (const e of layout) {
    if (e.role === 'central') ring(e.x, e.y, '#4ec77b');
    else if (e.role === 'target') ring(e.x, e.y, '#4d96ff');
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTrial() {
  const centralChars = shuffled(CHARS).slice(0, CENTRAL_TARGETS);
  const targetChar = randOf(CHARS);
  const dir = randOf(DIRS).key;
  const layout = buildLayout(centralChars, targetChar, dir);

  const decoys = shuffled(CHARS.filter(c => !centralChars.includes(c)))
    .slice(0, CENTRAL_CANDIDATES - CENTRAL_TARGETS);
  const candidates = shuffled([...centralChars, ...decoys]);

  state.current = { centralChars, targetChar, dir, layout };
  state.answers = { chars: null, dir: null };
  selected = [];

  promptEl.textContent = 'Focus on the center.';
  drawFixation();
  await delay(700);
  renderLayout(layout);
  await delay(FLASH_MS);
  clearStage();
  drawFixation();
  askResponses(candidates);
}

function askResponses(candidates) {
  buildCentralButtons(candidates);
  promptEl.textContent = `Select the ${CENTRAL_TARGETS} characters shown near the center.`;
  centralChoice.classList.remove('hidden');
  peripheralChoice.classList.add('hidden');
  clearButtonMarks();
}

function clearButtonMarks() {
  document.querySelectorAll('button.correct, button.wrong, button.selected')
    .forEach(b => b.classList.remove('correct', 'wrong', 'selected'));
}

function onCentralPick(char, btn) {
  if (state.answers.chars) return;   // locked once all picks are in
  const i = selected.indexOf(char);
  if (i >= 0) {
    selected.splice(i, 1);
    btn.classList.remove('selected');
  } else {
    if (selected.length >= CENTRAL_TARGETS) return;
    selected.push(char);
    btn.classList.add('selected');
  }
  if (selected.length === CENTRAL_TARGETS) lockCentral();
}

function lockCentral() {
  state.answers.chars = selected.slice();
  const targetSet = new Set(state.current.centralChars);
  centralChoice.querySelectorAll('button').forEach(b => {
    if (selected.includes(b.dataset.char)) {
      b.classList.remove('selected');
      b.classList.add(targetSet.has(b.dataset.char) ? 'correct' : 'wrong');
    }
  });
  setTimeout(() => {
    centralChoice.classList.add('hidden');
    peripheralChoice.classList.remove('hidden');
    peripheralLabel.textContent = `Where was the ${state.current.targetChar} ?`;
    promptEl.textContent = `Where was the ${state.current.targetChar} ?`;
  }, 500);
}

function onPeripheralPick(dir, btn) {
  if (state.answers.dir) return;
  state.answers.dir = dir;
  btn.classList.add(dir === state.current.dir ? 'correct' : 'wrong');
  setTimeout(finishTrial, 500);
}

function resultRow(label, ok, youVal, correctVal) {
  const mark = ok ? '✓' : '✗';
  const detail = ok
    ? `<b>${youVal}</b>`
    : `<b>${youVal || '—'}</b> &middot; answer: <b>${correctVal}</b>`;
  return `<div class="result-line ${ok ? 'ok' : 'no'}"><span class="mark">${mark}</span>${label}: ${detail}</div>`;
}

function finishTrial() {
  const chosen = state.answers.chars || [];
  const targetSet = new Set(state.current.centralChars);
  const charOk = chosen.length === state.current.centralChars.length && chosen.every(c => targetSet.has(c));
  const dirOk = state.answers.dir === state.current.dir;
  state.trial++;
  if (charOk && dirOk) state.correct++;
  updateStats();

  showOriginal(state.current.layout);

  resultSummary.innerHTML =
    `<div class="result-head">${charOk && dirOk ? 'Both correct!' : charOk || dirOk ? 'One correct' : 'Both missed'}</div>` +
    resultRow('Center characters', charOk, chosen.join(' '), state.current.centralChars.join(' ')) +
    resultRow('Target location', dirOk, state.answers.dir, state.current.dir) +
    '<div class="result-legend"><span class="ring center">◯</span> center &nbsp; <span class="ring target">◯</span> target</div>';

  promptEl.textContent = 'Trial complete — original layout shown.';
  peripheralChoice.classList.add('hidden');
  centralChoice.classList.add('hidden');
  resultPanel.classList.remove('hidden');
  continueBtn.focus();
}

function onContinue() {
  resultPanel.classList.add('hidden');
  state.running = true;
  startBtn.textContent = 'Pause';
  runTrial();
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

function buildCentralButtons(candidates) {
  centralChoice.querySelectorAll('button').forEach(b => b.remove());
  for (const char of candidates) {
    const btn = document.createElement('button');
    btn.dataset.char = char;
    btn.textContent = char;
    btn.addEventListener('click', () => onCentralPick(char, btn));
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
  state.answers = { chars: null, dir: null };
  selected = [];
  updateStats();
  centralChoice.classList.add('hidden');
  peripheralChoice.classList.add('hidden');
  resultPanel.classList.add('hidden');
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
continueBtn.addEventListener('click', onContinue);

buildDirGrid();
reset();
