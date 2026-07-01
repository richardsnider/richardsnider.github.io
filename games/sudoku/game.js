'use strict';

// --- Sudoku generation ---------------------------------------------------

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Solve in place, filling empty (0) cells. Returns true if solvable.
function solve(board) {
  const idx = board.indexOf(0);
  if (idx === -1) return true;
  const row = Math.floor(idx / 9), col = idx % 9;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isValid(board, row, col, n)) {
      board[idx] = n;
      if (solve(board)) return true;
      board[idx] = 0;
    }
  }
  return false;
}

function isValid(board, row, col, n) {
  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === n) return false;
    if (board[i * 9 + col] === n) return false;
  }
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      if (board[(br + r) * 9 + (bc + c)] === n) return false;
  return true;
}

// Count solutions up to `limit` (used to guarantee uniqueness).
function countSolutions(board, limit) {
  const idx = board.indexOf(0);
  if (idx === -1) return 1;
  const row = Math.floor(idx / 9), col = idx % 9;
  let count = 0;
  for (let n = 1; n <= 9; n++) {
    if (isValid(board, row, col, n)) {
      board[idx] = n;
      count += countSolutions(board, limit);
      board[idx] = 0;
      if (count >= limit) break;
    }
  }
  return count;
}

// Generate a puzzle: returns { puzzle, solution }.
function generate(clues) {
  const solution = new Array(81).fill(0);
  solve(solution);
  const puzzle = solution.slice();
  const cells = shuffle([...Array(81).keys()]);
  let filled = 81;
  for (const cell of cells) {
    if (filled <= clues) break;
    const backup = puzzle[cell];
    puzzle[cell] = 0;
    const copy = puzzle.slice();
    if (countSolutions(copy, 2) !== 1) {
      puzzle[cell] = backup; // removing breaks uniqueness, keep it
    } else {
      filled--;
    }
  }
  return { puzzle, solution };
}

const CLUES = { easy: 40, medium: 32, hard: 27, expert: 24 };

// --- UI ------------------------------------------------------------------

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const difficultyEl = document.getElementById('difficulty');

let solution = [];
let given = [];     // true where the cell is a fixed clue
let values = [];    // current player values (0 = empty)
let cells = [];     // cell DOM elements
let selected = -1;

function newGame() {
  const clues = CLUES[difficultyEl.value] || 32;
  const g = generate(clues);
  solution = g.solution;
  values = g.puzzle.slice();
  given = g.puzzle.map(v => v !== 0);
  selected = -1;
  statusEl.textContent = '';
  statusEl.classList.remove('win');
  render();
}

function buildBoard() {
  boardEl.innerHTML = '';
  cells = [];
  for (let i = 0; i < 81; i++) {
    const el = document.createElement('div');
    el.className = 'cell';
    const row = Math.floor(i / 9), col = i % 9;
    if (row % 3 === 0) el.classList.add('bt');
    if (col % 3 === 0) el.classList.add('bl');
    el.addEventListener('click', () => select(i));
    boardEl.appendChild(el);
    cells.push(el);
  }
}

function select(i) {
  selected = i;
  render();
}

function render() {
  const solved = isSolved();
  for (let i = 0; i < 81; i++) {
    const el = cells[i];
    const v = values[i];
    el.textContent = v === 0 ? '' : v;
    el.className = 'cell';
    const row = Math.floor(i / 9), col = i % 9;
    if (row % 3 === 0) el.classList.add('bt');
    if (col % 3 === 0) el.classList.add('bl');
    if (given[i]) el.classList.add('given');

    if (selected >= 0) {
      const sr = Math.floor(selected / 9), sc = selected % 9;
      const sameBox = Math.floor(row / 3) === Math.floor(sr / 3) &&
                      Math.floor(col / 3) === Math.floor(sc / 3);
      if (i === selected) el.classList.add('selected');
      else if (row === sr || col === sc || sameBox) el.classList.add('peer');
      if (v !== 0 && values[selected] !== 0 && v === values[selected] && i !== selected)
        el.classList.add('same');
    }
  }
  if (solved) {
    statusEl.textContent = '✓ Solved!';
    statusEl.classList.add('win');
  }
}

function isSolved() {
  for (let i = 0; i < 81; i++) if (values[i] !== solution[i]) return false;
  return true;
}

function setValue(n) {
  if (selected < 0 || given[selected]) return;
  values[selected] = n;
  render();
}

function check() {
  let wrong = 0;
  for (let i = 0; i < 81; i++) {
    if (values[i] !== 0 && !given[i] && values[i] !== solution[i]) {
      cells[i].classList.add('error');
      wrong++;
    }
  }
  if (!isSolved()) {
    statusEl.textContent = wrong === 0
      ? 'No mistakes so far — keep going.'
      : `${wrong} mistake${wrong === 1 ? '' : 's'} highlighted.`;
  }
}

function move(dr, dc) {
  if (selected < 0) { select(0); return; }
  let row = Math.floor(selected / 9) + dr;
  let col = selected % 9 + dc;
  row = (row + 9) % 9;
  col = (col + 9) % 9;
  select(row * 9 + col);
}

document.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '9') { setValue(Number(e.key)); e.preventDefault(); }
  else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { setValue(0); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { move(-1, 0); e.preventDefault(); }
  else if (e.key === 'ArrowDown') { move(1, 0); e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { move(0, -1); e.preventDefault(); }
  else if (e.key === 'ArrowRight') { move(0, 1); e.preventDefault(); }
});

document.getElementById('pad').addEventListener('click', (e) => {
  const btn = e.target.closest('.num');
  if (btn) setValue(Number(btn.dataset.num));
});
document.getElementById('check-btn').addEventListener('click', check);
document.getElementById('new-btn').addEventListener('click', newGame);
difficultyEl.addEventListener('change', newGame);

buildBoard();
newGame();
