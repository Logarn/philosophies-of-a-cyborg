const agentButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action="agent-mode"]'));
const modalLayer = document.querySelector<HTMLElement>('[data-modal-layer]');
const modalButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-modal]'));
const modalPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-modal-panel]'));
const modalCloseButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-modal-close]'));
const calcDisplay = document.querySelector<HTMLElement>('[data-calc-display]');
const calcLesson = document.querySelector<HTMLElement>('[data-calc-lesson]');
const calcKeys = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-key]'));
const eatClock = document.querySelector<HTMLElement>('[data-eat-clock]');
const eatDate = document.querySelector<HTMLElement>('[data-eat-date]');
const eatDateInput = document.querySelector<HTMLInputElement>('[data-eat-date-input]');
const eatInput = document.querySelector<HTMLInputElement>('[data-eat-input]');
const eatNowButton = document.querySelector<HTMLButtonElement>('[data-eat-now]');
const clockWindow = document.querySelector<HTMLElement>('[data-clock-window]');
const zoneOutputs = Array.from(document.querySelectorAll<HTMLOutputElement>('[data-zone]'));
const clockButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action="open-clock"]'));
const letterTray = document.querySelector<HTMLElement>('[data-letter-tray]');
const letterSlots = document.querySelector<HTMLElement>('[data-letter-slots]');
const letterShuffle = document.querySelector<HTMLButtonElement>('[data-letter-shuffle]');
const letterUndo = document.querySelector<HTMLButtonElement>('[data-letter-undo]');
const letterStatus = document.querySelector<HTMLOutputElement>('[data-letter-status]');

let expression = '';
let converterLocked = false;

const lessons: Record<string, string> = {
  'π': 'Pi is what circles keep whispering: circumference divided by diameter.',
  'φ': 'Phi is the golden ratio. People overuse it, but it is still a lovely number.',
  c: 'c is the speed of light. Fast enough to make most deadlines look unserious.',
  E: 'E = mc². Mass is basically energy wearing a heavier jacket.',
  'F=ma': 'Force equals mass times acceleration. Push more, or move smarter.',
  '∫': 'An integral adds tiny pieces until the whole shape admits what it is.'
};

const conversionZones: Record<string, string> = {
  est: 'America/New_York',
  pst: 'America/Los_Angeles',
  cst: 'America/Chicago',
  gmt: 'Etc/GMT',
  cet: 'Europe/Berlin',
  sast: 'Africa/Johannesburg'
};

const eatFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Nairobi',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const eatDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Nairobi',
  weekday: 'short',
  day: '2-digit',
  month: 'short'
});

function getEatParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function formatZoneTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    hourCycle: 'h23'
  }).format(date);
}

function eatInputDate() {
  if (!eatInput?.value || !eatDateInput?.value) return new Date();
  const [yearValue, monthValue, dayValue] = eatDateInput.value.split('-').map(Number);
  const [hourValue, minuteValue] = eatInput.value.split(':').map(Number);
  if (!yearValue || !monthValue || !dayValue || Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return new Date();
  return new Date(Date.UTC(yearValue, monthValue - 1, dayValue, hourValue - 3, minuteValue));
}

function eatInputLabel(date: Date) {
  return `${new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)} EAT`;
}

function updateZoneOutputs(date: Date) {
  zoneOutputs.forEach((output) => {
    const zone = output.dataset.zone;
    if (!zone || !conversionZones[zone]) return;
    output.value = formatZoneTime(date, conversionZones[zone]);
    output.textContent = output.value;
  });
}

function updateEatClock() {
  const now = new Date();
  const parts = getEatParts(now);
  if (eatClock) eatClock.textContent = `${eatFormatter.format(now)} EAT`;
  if (eatDate) eatDate.textContent = eatDateFormatter.format(now);
  if (eatDateInput && eatInput && !converterLocked) {
    eatDateInput.value = `${parts.year}-${parts.month}-${parts.day}`;
    eatInput.value = `${parts.hour}:${parts.minute}`;
    updateZoneOutputs(now);
  }
}

function setAgentMode(enabled: boolean) {
  document.body.classList.toggle('agent-mode', enabled);
  agentButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(enabled));
  });
}

const params = new URLSearchParams(window.location.search);
setAgentMode(params.get('mode') === 'agent');

agentButtons.forEach((button) => {
  button.addEventListener('click', () => {
    window.history.replaceState({}, '', '/?mode=agent');
    setAgentMode(true);
  });
});

function openModal(name: string) {
  if (!modalLayer) return;
  modalLayer.hidden = false;
  modalPanels.forEach((panel) => {
    panel.hidden = panel.dataset.modalPanel !== name;
  });
  modalPanels.find((panel) => panel.dataset.modalPanel === name)?.querySelector<HTMLElement>('button')?.focus();
}

function closeModal() {
  if (!modalLayer) return;
  modalLayer.hidden = true;
  modalPanels.forEach((panel) => {
    panel.hidden = true;
  });
}

function setLesson(text: string) {
  if (calcLesson) calcLesson.textContent = text;
}

function setDisplay(value: string) {
  if (calcDisplay) calcDisplay.textContent = value || '0';
}

function evaluateExpression() {
  if (!expression) return;
  if (!/^[\d+\-*/. ()]+$/.test(expression)) {
    setLesson('That expression got too weird. Clearing it is healthier.');
    expression = '';
    setDisplay('0');
    return;
  }

  try {
    const result = Function(`"use strict"; return (${expression})`)();
    expression = Number.isFinite(result) ? String(Number(result.toFixed(8))) : '';
    setDisplay(expression || '0');
    setLesson('The arithmetic worked. Suspicious, but acceptable.');
  } catch {
    setLesson('That did not parse. Very human. Try again.');
  }
}

function pressCalculatorKey(key: string) {
  if (key === 'clear') {
    expression = '';
    setDisplay('0');
    setLesson('Clean slate. Rare gift.');
    return;
  }

  if (key === '=') {
    evaluateExpression();
    return;
  }

  if (key === 'π') {
    expression += '3.14159265';
    setDisplay(expression);
    setLesson(lessons[key]);
    return;
  }

  if (key === 'φ') {
    expression += '1.61803399';
    setDisplay(expression);
    setLesson(lessons[key]);
    return;
  }

  if (key === 'c') {
    expression = '299792458';
    setDisplay(expression);
    setLesson(lessons[key]);
    return;
  }

  if (key === 'E' || key === 'F=ma' || key === '∫') {
    setLesson(lessons[key]);
    return;
  }

  expression += key;
  setDisplay(expression);
  setLesson('Regular calculator behavior. Nobody panic.');
}

modalButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const modalName = button.dataset.modal;
    if (modalName) openModal(modalName);
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', closeModal);
});

modalLayer?.addEventListener('click', (event) => {
  if (event.target === modalLayer) closeModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

calcKeys.forEach((button) => {
  button.addEventListener('click', () => pressCalculatorKey(button.dataset.key ?? ''));
});

clockButtons.forEach((button) => {
  button.addEventListener('click', () => {
    clockWindow?.classList.add('is-awake');
    clockWindow?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    window.setTimeout(() => clockWindow?.classList.remove('is-awake'), 900);
  });
});

eatDateInput?.addEventListener('input', () => {
  converterLocked = true;
  const date = eatInputDate();
  if (eatDate) eatDate.textContent = eatInputLabel(date);
  updateZoneOutputs(date);
});

eatInput?.addEventListener('input', () => {
  converterLocked = true;
  const date = eatInputDate();
  if (eatDate) eatDate.textContent = eatInputLabel(date);
  updateZoneOutputs(date);
});

eatNowButton?.addEventListener('click', () => {
  converterLocked = false;
  updateEatClock();
});

updateEatClock();
window.setInterval(updateEatClock, 1000);

if (letterTray && letterSlots) {
  const tray = letterTray;
  const slots = letterSlots;
  const prizeLetters = ['Y', 'O', 'U', 'C', 'U', 'N', 'T', '!'];
  const prizePattern: Array<number | null> = [0, 1, 2, null, 3, 4, 5, 6, 7];
  let scrambled = prizeLetters.map((letter, index) => ({ id: `${letter}-${index}`, letter }));
  let selected: typeof scrambled = [];

  function shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function setLetterStatus(text: string) {
    if (letterStatus) letterStatus.textContent = text;
  }

  function renderLetterGame() {
    slots.innerHTML = '';
    prizePattern.forEach((letterIndex) => {
      const slot = document.createElement('span');
      slot.className = letterIndex === null ? 'letter-slot letter-space' : 'letter-slot';
      slot.textContent = letterIndex === null ? '' : selected[letterIndex]?.letter ?? '';
      slots.append(slot);
    });

    tray.innerHTML = '';
    scrambled.forEach((tile) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'letter-tile';
      button.textContent = tile.letter;
      button.disabled = selected.some((item) => item.id === tile.id);
      button.addEventListener('click', () => {
        if (selected.length >= prizeLetters.length || button.disabled) return;
        selected = [...selected, tile];
        const attempt = selected.map((item) => item.letter).join('');
        if ('YOUCUNT!'.startsWith(attempt)) {
          setLetterStatus(selected.length === prizeLetters.length ? 'Prize unlocked: YOU CUNT!' : 'Keep going.');
        } else {
          setLetterStatus('Wrong order. Undo, then keep it rude.');
        }
        renderLetterGame();
      });
      tray.append(button);
    });
  }

  function resetLetterGame(reshuffle = false) {
    selected = [];
    if (reshuffle) scrambled = shuffle(scrambled);
    setLetterStatus('Hint: You C***');
    renderLetterGame();
  }

  letterShuffle?.addEventListener('click', () => resetLetterGame(true));
  letterUndo?.addEventListener('click', () => {
    selected = selected.slice(0, -1);
    setLetterStatus(selected.length ? 'Keep going.' : 'Hint: You C***');
    renderLetterGame();
  });

  resetLetterGame(true);
}
