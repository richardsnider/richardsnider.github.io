const MIN_LEN = 3;
const MAX_LEN = 12;

const els = {
  definition: document.getElementById('definition'),
  word: document.getElementById('word'),
  status: document.getElementById('status'),
  hintBtn: document.getElementById('hint-btn'),
  continueBtn: document.getElementById('continue-btn'),
  difficulty: document.getElementById('difficulty'),
};

const WORD_FILES = {
  easy: '../../notes/words-easy.yaml',
  hard: '../../notes/words.yaml',
};

let pool = [];       // [{word, def}]
let current = null;  // {word, def}
let revealed = 0;    // number of letters shown, left-to-right

async function loadWords(file) {
  const res = await fetch(file);
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

function render() {
  els.word.innerHTML = '';
  const done = revealed >= current.word.length;
  for (let i = 0; i < current.word.length; i++) {
    const box = document.createElement('div');
    box.className = 'box';
    if (i < revealed) {
      box.textContent = current.word[i];
      box.classList.add(done ? 'filled' : 'revealed');
    }
    els.word.appendChild(box);
  }
}

function nextWord() {
  if (!pool.length) return;
  current = pool[Math.floor(Math.random() * pool.length)];
  revealed = 0;
  els.definition.textContent = current.def;
  render();
  els.status.textContent = '';
}

function hint() {
  if (!current || revealed >= current.word.length) return;
  revealed++;
  render();
  if (revealed >= current.word.length) {
    els.status.textContent = current.word;
  }
}

async function loadPool() {
  els.status.textContent = 'Loading vocabulary...';
  const file = WORD_FILES[els.difficulty.value] || WORD_FILES.hard;
  try {
    pool = await loadWords(file);
  } catch (err) {
    els.status.textContent = 'Failed to load words — serve this over http, not file://';
    pool = [];
    return false;
  }
  return true;
}

function onKey(e) {
  if (e.key === ' ') { e.preventDefault(); hint(); }
  else if (e.key === 'Enter') { e.preventDefault(); nextWord(); }
}

async function init() {
  els.hintBtn.addEventListener('click', hint);
  els.continueBtn.addEventListener('click', nextWord);
  els.difficulty.addEventListener('change', async () => {
    if (await loadPool()) nextWord();
  });
  // Keep keystrokes from also triggering focused buttons.
  document.addEventListener('keydown', onKey);
  if (await loadPool()) nextWord();
}

init();
