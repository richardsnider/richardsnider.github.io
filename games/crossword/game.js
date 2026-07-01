const GRID_SIZE = 15;
const TARGET_WORDS = 12;
const MAX_ATTEMPTS = 800;
const MIN_LEN = 3;
const MAX_LEN = 9;

const els = {
  grid: document.getElementById('grid'),
  across: document.getElementById('across-clues'),
  down: document.getElementById('down-clues'),
  status: document.getElementById('status'),
  newBtn: document.getElementById('new-btn'),
  checkBtn: document.getElementById('check-btn'),
  revealBtn: document.getElementById('reveal-btn'),
};

let pool = [];           // [{word, def}]
let placed = [];         // [{word, def, r, c, dir, number}]
let solution = null;     // 2D array of letters (or null)
let numbers = null;      // 2D array of numbers (or 0)
let hints = null;        // Set of "r,c" strings for pre-filled helper cells
let cursor = { r: 0, c: 0, dir: 'A' };

async function loadWords() {
  const res = await fetch('../../notes/words.yaml');
  const text = await res.text();
  const entries = [];
  for (const line of text.split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const word = line.slice(0, i).trim().toUpperCase();
    const def = line.slice(i + 1).trim();
    if (!def) continue;
    if (!/^[A-Z]+$/.test(word)) continue;
    if (word.length < MIN_LEN || word.length > MAX_LEN) continue;
    entries.push({ word, def });
  }
  return entries;
}

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function canPlace(grid, word, r, c, dr, dc) {
  const endR = r + dr * (word.length - 1);
  const endC = c + dc * (word.length - 1);
  if (r < 0 || c < 0 || endR < 0 || endC < 0) return false;
  if (r >= GRID_SIZE || c >= GRID_SIZE || endR >= GRID_SIZE || endC >= GRID_SIZE) return false;
  // Cell just before word start and just after word end must be empty.
  const beforeR = r - dr, beforeC = c - dc;
  const afterR = endR + dr, afterC = endC + dc;
  if (inBounds(beforeR, beforeC) && grid[beforeR][beforeC]) return false;
  if (inBounds(afterR, afterC) && grid[afterR][afterC]) return false;

  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    const existing = grid[rr][cc];
    if (existing) {
      if (existing !== word[i]) return false;
      crossings++;
    } else {
      // Parallel neighbors must be empty when placing a fresh cell.
      // Perpendicular direction relative to word: swap dr/dc.
      const pr1 = rr + dc, pc1 = cc + dr;
      const pr2 = rr - dc, pc2 = cc - dr;
      if (inBounds(pr1, pc1) && grid[pr1][pc1]) return false;
      if (inBounds(pr2, pc2) && grid[pr2][pc2]) return false;
    }
  }
  return crossings > 0 || isEmptyGrid(grid);
}

function isEmptyGrid(grid) {
  for (const row of grid) for (const v of row) if (v) return false;
  return true;
}

function inBounds(r, c) {
  return r >= 0 && c >= 0 && r < GRID_SIZE && c < GRID_SIZE;
}

function commitPlacement(grid, word, r, c, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    grid[r + dr * i][c + dc * i] = word[i];
  }
}

function generatePuzzle() {
  const alphaPool = pool.slice();
  shuffle(alphaPool);

  // Seed with a longish word placed horizontally near center.
  const seedIdx = alphaPool.findIndex(e => e.word.length >= 6 && e.word.length <= 8);
  const seed = seedIdx >= 0 ? alphaPool.splice(seedIdx, 1)[0] : alphaPool.shift();
  const grid = emptyGrid();
  const midR = Math.floor(GRID_SIZE / 2);
  const midC = Math.floor((GRID_SIZE - seed.word.length) / 2);
  commitPlacement(grid, seed.word, midR, midC, 0, 1);
  const placements = [{ ...seed, r: midR, c: midC, dir: 'A' }];

  let attempts = 0;
  while (placements.length < TARGET_WORDS && attempts < MAX_ATTEMPTS && alphaPool.length) {
    attempts++;
    const idx = Math.floor(Math.random() * alphaPool.length);
    const cand = alphaPool[idx];
    let placedIt = false;

    // Look for intersection points: any letter of the candidate that matches an existing cell.
    const positions = [...Array(cand.word.length).keys()];
    shuffle(positions);
    outer:
    for (const i of positions) {
      const letter = cand.word[i];
      const cells = findCellsWithLetter(grid, letter);
      shuffle(cells);
      for (const [rr, cc] of cells) {
        // Try both orientations. Skip the one that would extend the crossing's direction.
        for (const [dr, dc, dir] of [[1, 0, 'D'], [0, 1, 'A']]) {
          const r0 = rr - dr * i;
          const c0 = cc - dc * i;
          if (canPlace(grid, cand.word, r0, c0, dr, dc)) {
            commitPlacement(grid, cand.word, r0, c0, dr, dc);
            placements.push({ ...cand, r: r0, c: c0, dir });
            alphaPool.splice(idx, 1);
            placedIt = true;
            break outer;
          }
        }
      }
    }
    if (!placedIt) {
      // Rotate this candidate to the back so we don't keep retrying the same one.
      alphaPool.splice(idx, 1);
      alphaPool.push(cand);
    }
  }

  return { grid, placements };
}

function findCellsWithLetter(grid, letter) {
  const out = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === letter) out.push([r, c]);
    }
  }
  return out;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function computeBounds(grid) {
  let minR = GRID_SIZE, minC = GRID_SIZE, maxR = -1, maxC = -1;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c]) {
        if (r < minR) minR = r;
        if (c < minC) minC = c;
        if (r > maxR) maxR = r;
        if (c > maxC) maxC = c;
      }
    }
  }
  return { minR, minC, maxR, maxC };
}

function assignNumbers(sol, placements) {
  const rows = sol.length, cols = sol[0].length;
  numbers = Array.from({ length: rows }, () => Array(cols).fill(0));
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!sol[r][c]) continue;
      const startsAcross = (c === 0 || !sol[r][c - 1]) && c + 1 < cols && sol[r][c + 1];
      const startsDown = (r === 0 || !sol[r - 1][c]) && r + 1 < rows && sol[r + 1][c];
      if (startsAcross || startsDown) numbers[r][c] = n++;
    }
  }
  // Attach numbers to placements by matching start cell.
  for (const p of placements) {
    p.number = numbers[p.r][p.c];
  }
}

function render() {
  els.grid.innerHTML = '';
  const rows = solution.length, cols = solution[0].length;
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < cols; c++) {
      const td = document.createElement('td');
      if (solution[r][c]) {
        td.className = 'cell';
        td.dataset.r = r; td.dataset.c = c;
        if (numbers[r][c]) {
          const n = document.createElement('span');
          n.className = 'num';
          n.textContent = numbers[r][c];
          td.appendChild(n);
        }
        const inp = document.createElement('input');
        inp.maxLength = 1;
        inp.autocapitalize = 'characters';
        inp.spellcheck = false;
        if (hints && hints.has(`${r},${c}`)) {
          inp.value = solution[r][c];
          inp.readOnly = true;
          td.classList.add('hint');
        }
        inp.addEventListener('keydown', handleKey);
        inp.addEventListener('input', handleInput);
        inp.addEventListener('focus', () => onFocusCell(r, c));
        inp.addEventListener('click', () => onClickCell(r, c));
        td.appendChild(inp);
      } else {
        td.className = 'block';
      }
      tr.appendChild(td);
    }
    els.grid.appendChild(tr);
  }
  renderClues();
}

function renderClues() {
  els.across.innerHTML = '';
  els.down.innerHTML = '';
  const across = placed.filter(p => p.dir === 'A').sort((a, b) => a.number - b.number);
  const down = placed.filter(p => p.dir === 'D').sort((a, b) => a.number - b.number);
  for (const p of across) addClue(els.across, p);
  for (const p of down) addClue(els.down, p);
}

function addClue(ol, p) {
  const li = document.createElement('li');
  li.value = p.number;
  li.textContent = p.def;
  li.dataset.number = p.number;
  li.dataset.dir = p.dir;
  li.addEventListener('click', () => {
    cursor = { r: p.r, c: p.c, dir: p.dir };
    focusCell(p.r, p.c);
  });
  ol.appendChild(li);
}

function handleKey(e) {
  const r = +e.target.parentElement.dataset.r;
  const c = +e.target.parentElement.dataset.c;
  if (e.key === 'ArrowRight') { e.preventDefault(); cursor.dir = 'A'; move(r, c, 0, 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); cursor.dir = 'A'; move(r, c, 0, -1); }
  else if (e.key === 'ArrowDown') { e.preventDefault(); cursor.dir = 'D'; move(r, c, 1, 0); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); cursor.dir = 'D'; move(r, c, -1, 0); }
  else if (e.key === ' ' || e.key === 'Tab') { e.preventDefault(); cursor.dir = cursor.dir === 'A' ? 'D' : 'A'; highlightWord(); }
  else if (e.key === 'Backspace') {
    e.preventDefault();
    if (!e.target.readOnly) {
      e.target.value = '';
      clearMark(e.target);
    }
    const [dr, dc] = cursor.dir === 'A' ? [0, -1] : [-1, 0];
    move(r, c, dr, dc);
  }
}

function handleInput(e) {
  const val = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
  e.target.value = val;
  if (!val) return;
  clearMark(e.target);
  const r = +e.target.parentElement.dataset.r;
  const c = +e.target.parentElement.dataset.c;
  const [dr, dc] = cursor.dir === 'A' ? [0, 1] : [1, 0];
  move(r, c, dr, dc);
}

function clearMark(input) {
  input.parentElement.classList.remove('correct', 'wrong');
}

function move(r, c, dr, dc) {
  let nr = r + dr, nc = c + dc;
  while (inBounds(nr, nc) && !solution[nr][nc]) {
    nr += dr; nc += dc;
  }
  if (inBounds(nr, nc)) focusCell(nr, nc);
}

function focusCell(r, c) {
  const td = els.grid.querySelector(`td[data-r="${r}"][data-c="${c}"]`);
  if (td) td.querySelector('input').focus();
}

function onFocusCell(r, c) {
  cursor.r = r; cursor.c = c;
  highlightWord();
}

function onClickCell(r, c) {
  if (cursor.r === r && cursor.c === c) {
    cursor.dir = cursor.dir === 'A' ? 'D' : 'A';
    highlightWord();
  }
}

function highlightWord() {
  els.grid.querySelectorAll('td.cell').forEach(td => td.classList.remove('highlight'));
  const [dr, dc] = cursor.dir === 'A' ? [0, 1] : [1, 0];
  // Walk backwards to word start, then forwards, highlighting.
  let sr = cursor.r, sc = cursor.c;
  while (inBounds(sr - dr, sc - dc) && solution[sr - dr][sc - dc]) { sr -= dr; sc -= dc; }
  let rr = sr, cc = sc;
  while (inBounds(rr, cc) && solution[rr][cc]) {
    const td = els.grid.querySelector(`td[data-r="${rr}"][data-c="${cc}"]`);
    if (td) td.classList.add('highlight');
    rr += dr; cc += dc;
  }
  // Also highlight the matching clue.
  document.querySelectorAll('#clues li').forEach(li => li.classList.remove('active'));
  const startNum = numbers[sr][sc];
  document.querySelector(`#clues li[data-number="${startNum}"][data-dir="${cursor.dir}"]`)?.classList.add('active');
}

function check() {
  let allCorrect = true, anyFilled = false;
  els.grid.querySelectorAll('td.cell').forEach(td => {
    const r = +td.dataset.r, c = +td.dataset.c;
    const inp = td.querySelector('input');
    const val = inp.value.toUpperCase();
    td.classList.remove('correct', 'wrong');
    if (!val) { allCorrect = false; return; }
    anyFilled = true;
    if (val === solution[r][c]) td.classList.add('correct');
    else { td.classList.add('wrong'); allCorrect = false; }
  });
  if (allCorrect && anyFilled) els.status.textContent = 'Solved!';
  else if (anyFilled) els.status.textContent = 'Some cells are wrong or empty.';
  else els.status.textContent = 'Nothing filled in yet.';
}

function reveal() {
  els.grid.querySelectorAll('td.cell').forEach(td => {
    const r = +td.dataset.r, c = +td.dataset.c;
    const inp = td.querySelector('input');
    inp.value = solution[r][c];
    td.classList.remove('wrong');
    td.classList.add('correct');
  });
  els.status.textContent = 'Revealed.';
}

function newPuzzle() {
  els.status.textContent = 'Generating...';
  // Defer so the status update actually paints before the heavy work.
  setTimeout(() => {
    const { grid, placements } = generatePuzzle();
    const { minR, minC, maxR, maxC } = computeBounds(grid);
    solution = [];
    for (let r = minR; r <= maxR; r++) {
      const row = [];
      for (let c = minC; c <= maxC; c++) row.push(grid[r][c]);
      solution.push(row);
    }
    placed = placements.map(p => ({ ...p, r: p.r - minR, c: p.c - minC }));
    assignNumbers(solution, placed);
    hints = new Set();
    for (const p of placed) {
      const [dr, dc] = p.dir === 'A' ? [0, 1] : [1, 0];
      const idxs = [...Array(p.word.length).keys()];
      shuffle(idxs);
      for (const i of idxs.slice(0, 2)) hints.add(`${p.r + dr * i},${p.c + dc * i}`);
    }
    render();
    els.status.textContent = `${placed.length} words placed.`;
  }, 0);
}

async function init() {
  els.status.textContent = 'Loading vocabulary...';
  try {
    pool = await loadWords();
  } catch (err) {
    els.status.textContent = 'Failed to load words.yaml — serve this over http, not file://';
    return;
  }
  els.status.textContent = `${pool.length} words loaded.`;
  els.newBtn.addEventListener('click', newPuzzle);
  els.checkBtn.addEventListener('click', check);
  els.revealBtn.addEventListener('click', reveal);
  newPuzzle();
}

init();
