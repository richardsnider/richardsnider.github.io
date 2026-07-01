'use strict';

// Linear-algebra drill aimed at graphics math: cross products, matrix*vector,
// matrix*matrix, determinants and transposes. Values stay small on purpose.

// --- Math helpers --------------------------------------------------------

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function zeros(rows, cols) {
  return Array.from({ length: rows }, () => new Array(cols).fill(0));
}

function matmul(A, B) {
  const p = A.length, q = B.length, r = B[0].length;
  const out = zeros(p, r);
  for (let i = 0; i < p; i++)
    for (let j = 0; j < r; j++) {
      let s = 0;
      for (let k = 0; k < q; k++) s += A[i][k] * B[k][j];
      out[i][j] = s;
    }
  return out;
}

function transpose(M) {
  const out = zeros(M[0].length, M.length);
  for (let i = 0; i < M.length; i++)
    for (let j = 0; j < M[0].length; j++) out[j][i] = M[i][j];
  return out;
}

function det(M) {
  const n = M.length;
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  // 3x3 via cofactor expansion
  return (
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  );
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function colVec(v) { return v.map(x => [x]); }
function isHomogeneous(M) {
  const n = M.length;
  return M[n - 1].every((x, j) => x === (j === n - 1 ? 1 : 0));
}

// --- Matrix generation ---------------------------------------------------

const RANGES = {
  easy:   { vec: 3, mat: 2, t: 3 },
  medium: { vec: 5, mat: 3, t: 4 },
  hard:   { vec: 8, mat: 5, t: 5 },
};

function nonZero(range) {
  let v = 0;
  while (v === 0) v = randInt(-range, range);
  return v;
}

function randomMatrix(rows, cols, range) {
  const M = zeros(rows, cols);
  let any = false;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++) {
      M[i][j] = randInt(-range, range);
      if (M[i][j] !== 0) any = true;
    }
  if (!any) M[0][0] = 1;
  return M;
}

const ROT2 = {
  1: [[0, -1], [1, 0]],
  2: [[-1, 0], [0, -1]],
  3: [[0, 1], [-1, 0]],
};
const ROT3 = {
  x: [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
  y: [[0, 0, 1], [0, 1, 0], [-1, 0, 0]],
  z: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
};

function identity(n) {
  const M = zeros(n, n);
  for (let i = 0; i < n; i++) M[i][i] = 1;
  return M;
}

// A recognizable graphics transform of size n (2, 3 or 4).
function namedTransform(n, cfg) {
  if (n === 2) {
    switch (pick(['rot', 'scale', 'reflect', 'shear', 'identity'])) {
      case 'rot': return ROT2[pick([1, 2, 3])];
      case 'scale': return [[nonZero(3), 0], [0, nonZero(3)]];
      case 'reflect': return pick([[[-1, 0], [0, 1]], [[1, 0], [0, -1]], [[-1, 0], [0, -1]]]);
      case 'shear': return pick([[[1, nonZero(2)], [0, 1]], [[1, 0], [nonZero(2), 1]]]);
      default: return identity(2);
    }
  }
  if (n === 3) {
    switch (pick(['rot3', 'scale3', 'translate2', 'identity', 'reflect3'])) {
      case 'rot3': return ROT3[pick(['x', 'y', 'z'])];
      case 'scale3': return [[nonZero(3), 0, 0], [0, nonZero(3), 0], [0, 0, nonZero(3)]];
      case 'translate2': return [[1, 0, nonZero(cfg.t)], [0, 1, nonZero(cfg.t)], [0, 0, 1]];
      case 'reflect3': return [[pick([1, -1]), 0, 0], [0, pick([1, -1]), 0], [0, 0, pick([1, -1])]];
      default: return identity(3);
    }
  }
  // n === 4: 3D homogeneous transform (upper-left linear part + translation)
  const M = identity(4);
  const linear = pick(['rot', 'scale', 'identity']);
  let L;
  if (linear === 'rot') L = ROT3[pick(['x', 'y', 'z'])];
  else if (linear === 'scale') L = [[nonZero(3), 0, 0], [0, nonZero(3), 0], [0, 0, nonZero(3)]];
  else L = identity(3);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) M[i][j] = L[i][j];
  for (let i = 0; i < 3; i++) M[i][3] = nonZero(cfg.t); // translation column
  return M;
}

let styleEl, opEl, difficultyEl;

function chooseStyle() {
  const s = styleEl.value;
  if (s === 'named') return 'named';
  if (s === 'random') return 'random';
  return Math.random() < 0.5 ? 'named' : 'random';
}

function genSquare(n, cfg) {
  if (chooseStyle() === 'named') return namedTransform(n, cfg);
  const range = n >= 4 ? Math.max(1, cfg.mat - 1) : cfg.mat;
  return randomMatrix(n, n, range);
}

// --- Question building ---------------------------------------------------

function buildQuestion() {
  const cfg = RANGES[difficultyEl.value] || RANGES.medium;
  let types;
  switch (opEl.value) {
    case 'cross': types = ['cross']; break;
    case 'matvec': types = ['matvec']; break;
    case 'matmat': types = ['matmat']; break;
    case 'detT': types = ['det', 'transpose']; break;
    default: types = ['cross', 'matvec', 'matmat', 'det', 'transpose'];
  }
  const type = pick(types);
  const parts = []; // expression before "="
  let answer, name;

  if (type === 'cross') {
    const a = [nonZero(cfg.vec), nonZero(cfg.vec), nonZero(cfg.vec)];
    const b = [nonZero(cfg.vec), nonZero(cfg.vec), nonZero(cfg.vec)];
    name = 'Cross product  a × b';
    parts.push({ mtx: colVec(a) }, { op: '×' }, { mtx: colVec(b) });
    answer = colVec(cross(a, b));
  } else if (type === 'matvec') {
    const n = pick([2, 3, 4]);
    const M = genSquare(n, cfg);
    const v = Array.from({ length: n }, () => randInt(-cfg.vec, cfg.vec));
    if (isHomogeneous(M)) v[n - 1] = 1; // treat as a point
    name = 'Matrix × vector';
    parts.push({ mtx: M }, { mtx: colVec(v) });
    answer = matmul(M, colVec(v));
  } else if (type === 'matmat') {
    const n = pick([2, 3, 4]);
    const A = genSquare(n, cfg);
    const B = genSquare(n, cfg);
    name = 'Matrix × matrix';
    parts.push({ mtx: A }, { mtx: B });
    answer = matmul(A, B);
  } else if (type === 'det') {
    const n = pick([2, 3]);
    const M = genSquare(n, cfg);
    name = 'Determinant';
    parts.push({ label: 'det' }, { mtx: M });
    answer = [[det(M)]];
  } else { // transpose
    const rows = pick([2, 3, 4]);
    const cols = pick([2, 3, 4]);
    const M = randomMatrix(rows, cols, cfg.mat);
    name = 'Transpose';
    parts.push({ mtx: M, sup: 'T' });
    answer = transpose(M);
  }

  return { parts, answer, name };
}

// --- Rendering -----------------------------------------------------------

const workEl = document.getElementById('work');
const opNameEl = document.getElementById('op-name');
const feedbackEl = document.getElementById('feedback');
const revealEl = document.getElementById('reveal');
const statusEl = document.getElementById('status');

let answerInputs = []; // { input, r, c }
let current = null;
let answered = false;
let streak = 0, best = 0;

function renderMatrix(mat, opts = {}) {
  const rows = mat.length, cols = mat[0].length;
  const wrap = document.createElement('div');
  wrap.className = 'mtx' + (rows === 1 && cols === 1 ? ' scalar' : '');
  wrap.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (opts.editable) {
        const inp = document.createElement('input');
        inp.className = 'cell';
        inp.type = 'text';
        inp.inputMode = 'numeric';
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        answerInputs.push({ input: inp, r, c });
        wrap.appendChild(inp);
      } else {
        const d = document.createElement('div');
        d.className = 'cell static';
        d.textContent = mat[r][c];
        wrap.appendChild(d);
      }
    }
  if (opts.sup) {
    const s = document.createElement('span');
    s.className = 'sup';
    s.textContent = opts.sup;
    wrap.appendChild(s);
  }
  return wrap;
}

function renderPart(part) {
  if (part.op) {
    const s = document.createElement('span');
    s.className = 'op';
    s.textContent = part.op;
    return s;
  }
  if (part.label) {
    const s = document.createElement('span');
    s.className = 'label';
    s.textContent = part.label;
    return s;
  }
  return renderMatrix(part.mtx, { sup: part.sup });
}

function newQuestion() {
  current = buildQuestion();
  answered = false;
  answerInputs = [];
  workEl.innerHTML = '';
  revealEl.innerHTML = '';
  feedbackEl.textContent = ' ';
  feedbackEl.className = '';
  opNameEl.textContent = current.name;

  for (const part of current.parts) workEl.appendChild(renderPart(part));

  const eq = document.createElement('span');
  eq.className = 'op';
  eq.textContent = '=';
  workEl.appendChild(eq);
  workEl.appendChild(renderMatrix(current.answer, { editable: true }));

  updateStatus();
  if (answerInputs[0]) answerInputs[0].input.focus();
}

function updateStatus() {
  statusEl.textContent = `Streak: ${streak}   Best: ${best}`;
}

function parseCell(input) {
  const v = input.value.trim();
  if (v === '') return null;
  if (!/^-?\d+$/.test(v)) return NaN;
  return Number(v);
}

function submit() {
  if (answered) { newQuestion(); return; }

  let complete = true, correct = true;
  for (const { input, r, c } of answerInputs) {
    const val = parseCell(input);
    input.classList.remove('ok', 'bad');
    if (val === null) { complete = false; continue; }
    if (val === current.answer[r][c]) input.classList.add('ok');
    else { input.classList.add('bad'); correct = false; }
  }

  if (!complete && correct) {
    feedbackEl.textContent = 'Fill in every entry first.';
    feedbackEl.className = '';
    return;
  }

  if (complete && correct) {
    streak++;
    best = Math.max(best, streak);
    feedbackEl.textContent = '✓ Correct';
    feedbackEl.className = 'correct';
    answered = true;
    updateStatus();
    setTimeout(() => { if (answered) newQuestion(); }, 650);
  } else {
    streak = 0;
    answered = true;
    feedbackEl.textContent = '✗ Not quite — press Enter to continue';
    feedbackEl.className = 'wrong';
    showReveal();
    updateStatus();
  }
}

function reveal() {
  if (answered) return;
  streak = 0;
  answered = true;
  feedbackEl.textContent = 'Answer shown — press Enter to continue';
  feedbackEl.className = '';
  showReveal();
  updateStatus();
}

function showReveal() {
  revealEl.innerHTML = '';
  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = '=';
  revealEl.appendChild(label);
  revealEl.appendChild(renderMatrix(current.answer));
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { submit(); e.preventDefault(); }
  else if (e.key === 'Escape') { reveal(); e.preventDefault(); }
});
document.getElementById('skip-btn').addEventListener('click', reveal);
difficultyEl = document.getElementById('difficulty');
opEl = document.getElementById('op');
styleEl = document.getElementById('style');
difficultyEl.addEventListener('change', () => { streak = 0; newQuestion(); });
opEl.addEventListener('change', () => { streak = 0; newQuestion(); });
styleEl.addEventListener('change', () => { streak = 0; newQuestion(); });

newQuestion();
