'use strict';

// --- Config --------------------------------------------------------------

// Max value (exclusive-ish) per difficulty.
const RANGES = { easy: 16, medium: 256, hard: 4096 };

const BASES = {
  2:  { name: 'binary',  prefix: '0b', valid: /^[01]+$/ },
  10: { name: 'decimal', prefix: '',   valid: /^[0-9]+$/ },
  16: { name: 'hex',     prefix: '0x', valid: /^[0-9a-f]+$/i },
};

// Allowed (from, to) base pairs per mode.
const MODES = {
  all:    [[2, 10], [10, 2], [16, 10], [10, 16], [2, 16], [16, 2]],
  bin:    [[2, 10], [10, 2]],
  hex:    [[16, 10], [10, 16]],
  binhex: [[2, 16], [16, 2]],
};

// --- State ---------------------------------------------------------------

const valueEl = document.getElementById('value');
const fromBaseEl = document.getElementById('from-base');
const toBaseEl = document.getElementById('to-base');
const prefixEl = document.getElementById('prefix');
const answerEl = document.getElementById('answer');
const feedbackEl = document.getElementById('feedback');
const statusEl = document.getElementById('status');
const difficultyEl = document.getElementById('difficulty');
const modeEl = document.getElementById('mode');

let current = null;   // { value, from, to }
let streak = 0;
let best = 0;
let answered = false; // true once the current question has been graded wrong/skipped

function randInt(max) { return Math.floor(Math.random() * max); }

function newQuestion() {
  const pairs = MODES[modeEl.value] || MODES.all;
  const [from, to] = pairs[randInt(pairs.length)];
  // Avoid 0 so there is always at least one digit to reason about.
  const value = 1 + randInt((RANGES[difficultyEl.value] || 256) - 1);
  current = { value, from, to };
  answered = false;

  valueEl.textContent = value.toString(from).toUpperCase();
  fromBaseEl.textContent = BASES[from].name;
  toBaseEl.textContent = BASES[to].name;
  prefixEl.textContent = BASES[to].prefix;

  answerEl.value = '';
  answerEl.className = '';
  answerEl.disabled = false;
  feedbackEl.textContent = ' ';
  feedbackEl.className = '';
  answerEl.focus();
  updateStatus();
}

function updateStatus() {
  statusEl.textContent = `Streak: ${streak}   Best: ${best}`;
}

function normalize(str) {
  return str.trim().replace(/^0[bx]/i, '').replace(/^0+(?=\d)/, '').toLowerCase();
}

function submit() {
  if (answered) { newQuestion(); return; }
  const raw = answerEl.value.trim();
  if (raw === '') return;

  const expected = current.value.toString(current.to).toLowerCase();
  const guess = normalize(raw);

  if (!BASES[current.to].valid.test(raw.replace(/^0[bx]/i, ''))) {
    feedbackEl.textContent = `Only ${BASES[current.to].name} digits allowed.`;
    feedbackEl.className = 'wrong';
    answerEl.className = 'wrong';
    return;
  }

  if (guess === expected) {
    streak++;
    best = Math.max(best, streak);
    answerEl.className = 'correct';
    feedbackEl.textContent = '✓ Correct';
    feedbackEl.className = 'correct';
    answerEl.disabled = true;
    updateStatus();
    setTimeout(newQuestion, 600);
  } else {
    streak = 0;
    answered = true;
    answerEl.className = 'wrong';
    feedbackEl.textContent = `✗ ${BASES[current.to].prefix}${expected.toUpperCase()} — press Enter to continue`;
    feedbackEl.className = 'wrong';
    updateStatus();
  }
}

function skip() {
  streak = 0;
  const expected = current.value.toString(current.to).toUpperCase();
  feedbackEl.textContent = `Answer: ${BASES[current.to].prefix}${expected}`;
  feedbackEl.className = '';
  updateStatus();
  answered = true;
  answerEl.className = '';
}

answerEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { submit(); e.preventDefault(); }
  else if (e.key === 'Escape') { skip(); e.preventDefault(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.activeElement !== answerEl) { skip(); }
});
document.getElementById('skip-btn').addEventListener('click', skip);
difficultyEl.addEventListener('change', () => { streak = 0; newQuestion(); });
modeEl.addEventListener('change', () => { streak = 0; newQuestion(); });

newQuestion();
