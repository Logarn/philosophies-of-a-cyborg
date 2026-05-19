const homeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action="home"]'));
const desktopHome = document.querySelector<HTMLElement>('#desktop-home');
const modalLayer = document.querySelector<HTMLElement>('[data-modal-layer]');
const modalButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-modal]'));
const modalPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-modal-panel]'));
const modalCloseButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-modal-close]'));
const calcDisplay = document.querySelector<HTMLElement>('[data-calc-display]');
const calcLesson = document.querySelector<HTMLElement>('[data-calc-lesson]');
const calcKeys = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-key]'));
const letterTray = document.querySelector<HTMLElement>('[data-letter-tray]');
const letterSlots = document.querySelector<HTMLElement>('[data-letter-slots]');
const letterShuffle = document.querySelector<HTMLButtonElement>('[data-letter-shuffle]');
const letterStatus = document.querySelector<HTMLOutputElement>('[data-letter-status]');
const letterGame = document.querySelector<HTMLElement>('[data-letter-game]');
const prizeDialog = document.querySelector<HTMLDialogElement>('[data-prize-dialog]');
const prizeClose = document.querySelector<HTMLButtonElement>('[data-prize-close]');
const loseDialog = document.querySelector<HTMLDialogElement>('[data-lose-dialog]');
const loseClose = document.querySelector<HTMLButtonElement>('[data-lose-close]');

let expression = '';

const lessons: Record<string, string> = {
  'π': 'Pi is what circles keep whispering: circumference divided by diameter.',
  'φ': 'Phi is the golden ratio. People overuse it, but it is still a lovely number.',
  c: 'c is the speed of light. Fast enough to make most deadlines look unserious.',
  E: 'E = mc². Mass is basically energy wearing a heavier jacket.',
  'F=ma': 'Force equals mass times acceleration. Push more, or move smarter.',
  '∫': 'An integral adds tiny pieces until the whole shape admits what it is.'
};

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

function parseArithmetic(input: string) {
  let index = 0;

  function skipSpaces() {
    while (input[index] === ' ') index += 1;
  }

  function parseNumber() {
    skipSpaces();
    const start = index;
    while (/\d|\./.test(input[index] ?? '')) index += 1;
    if (start === index) throw new Error('Expected number.');
    const text = input.slice(start, index);
    if ((text.match(/\./g) ?? []).length > 1) throw new Error('Invalid decimal.');
    const value = Number(text);
    if (!Number.isFinite(value)) throw new Error('Invalid number.');
    return value;
  }

  function parseFactor(): number {
    skipSpaces();
    const char = input[index];
    if (char === '+') {
      index += 1;
      return parseFactor();
    }
    if (char === '-') {
      index += 1;
      return -parseFactor();
    }
    if (char === '(') {
      index += 1;
      const value = parseExpression();
      skipSpaces();
      if (input[index] !== ')') throw new Error('Expected closing parenthesis.');
      index += 1;
      return value;
    }
    return parseNumber();
  }

  function parseTerm() {
    let value = parseFactor();
    while (true) {
      skipSpaces();
      const operator = input[index];
      if (operator !== '*' && operator !== '/') break;
      index += 1;
      const right = parseFactor();
      value = operator === '*' ? value * right : value / right;
      if (!Number.isFinite(value)) throw new Error('Non-finite result.');
    }
    return value;
  }

  function parseExpression() {
    let value = parseTerm();
    while (true) {
      skipSpaces();
      const operator = input[index];
      if (operator !== '+' && operator !== '-') break;
      index += 1;
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  const result = parseExpression();
  skipSpaces();
  if (index !== input.length) throw new Error('Unexpected input.');
  if (!Number.isFinite(result)) throw new Error('Non-finite result.');
  return result;
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
    const result = parseArithmetic(expression);
    expression = String(Number(result.toFixed(8)));
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

function openHashTarget() {
  if (window.location.hash === '#calculator') openModal('calculator');
}

window.addEventListener('hashchange', openHashTarget);
openHashTarget();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
});

calcKeys.forEach((button) => {
  button.addEventListener('click', () => pressCalculatorKey(button.dataset.key ?? ''));
});

homeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    closeModal();
    prizeDialog?.close();
    loseDialog?.close();
    if (loseDialog) loseDialog.hidden = true;
    desktopHome?.scrollIntoView({ block: 'start' });
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname || '/');
    }
  });
});

if (letterTray && letterSlots) {
  const tray = letterTray;
  const slots = letterSlots;
  const targetWord = 'YOUCUNT!';
  const prizeLetters = targetWord.split('');
  const grassColors = ['#8fb247', '#5f9e5f', '#bb9b42', '#58a6a9', '#9aa64b', '#7fb85a', '#d78b3b', '#e3c44e'];
  let scrambled = prizeLetters.map((letter, index) => ({ id: `${letter}-${index}`, letter, color: grassColors[index] }));
  let selected: Array<(typeof scrambled)[number] | null> = Array.from({ length: prizeLetters.length }, () => null);
  let draggingTileId: string | null = null;
  let draggingButton: HTMLButtonElement | null = null;
  let dragOrigin = { x: 0, y: 0 };
  let pointerMoved = false;
  let suppressClickTileId: string | null = null;
  let selectedTileId: string | null = null;

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

  function clearSlotHover() {
    slots.querySelectorAll('.letter-slot.is-hovered').forEach((slot) => {
      slot.classList.remove('is-hovered');
    });
  }

  function slotIndexFromPoint(x: number, y: number) {
    const previousPointerEvents = draggingButton?.style.pointerEvents ?? '';
    if (draggingButton) draggingButton.style.pointerEvents = 'none';
    const slot = document.elementsFromPoint(x, y).find((element) => (
      element instanceof HTMLButtonElement && element.classList.contains('letter-slot')
    ));
    if (draggingButton) draggingButton.style.pointerEvents = previousPointerEvents;
    const slotIndex = Number((slot as HTMLButtonElement | undefined)?.dataset.slotIndex);
    return Number.isInteger(slotIndex) ? slotIndex : null;
  }

  function hoverSlotFromPoint(x: number, y: number) {
    clearSlotHover();
    const slotIndex = slotIndexFromPoint(x, y);
    if (slotIndex === null) return;
    slots.querySelector<HTMLElement>(`.letter-slot[data-slot-index="${slotIndex}"]`)?.classList.add('is-hovered');
  }

  function resetPointerDrag() {
    clearSlotHover();
    if (!draggingButton) return;
    draggingButton.classList.remove('is-pointer-dragging');
    draggingButton.style.transform = '';
    draggingButton.style.zIndex = '';
    draggingButton.style.pointerEvents = '';
    draggingButton = null;
    draggingTileId = null;
    pointerMoved = false;
  }

  function beginPointerDrag(event: PointerEvent, button: HTMLButtonElement, tileId: string) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    draggingTileId = tileId;
    draggingButton = button;
    dragOrigin = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
    button.setPointerCapture(event.pointerId);
  }

  function movePointerDrag(event: PointerEvent, button: HTMLButtonElement, tileId: string) {
    if (draggingTileId !== tileId || draggingButton !== button) return;
    const dx = event.clientX - dragOrigin.x;
    const dy = event.clientY - dragOrigin.y;
    if (!pointerMoved && Math.hypot(dx, dy) < 6) return;
    pointerMoved = true;
    event.preventDefault();
    button.classList.add('is-pointer-dragging');
    button.style.zIndex = '50';
    button.style.transform = `translate(${dx}px, ${dy}px) rotate(0deg) scale(1.04)`;
    hoverSlotFromPoint(event.clientX, event.clientY);
  }

  function endPointerDrag(event: PointerEvent, button: HTMLButtonElement, tileId: string) {
    if (draggingTileId !== tileId || draggingButton !== button) return;
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    if (!pointerMoved) {
      resetPointerDrag();
      return;
    }
    event.preventDefault();
    suppressClickTileId = tileId;
    const slotIndex = slotIndexFromPoint(event.clientX, event.clientY);
    resetPointerDrag();
    if (slotIndex === null) {
      setLetterStatus('Drop the piece into one of the answer beds.');
    } else {
      placeTile(tileId, slotIndex);
    }
    window.setTimeout(() => {
      if (suppressClickTileId === tileId) suppressClickTileId = null;
    }, 0);
  }

  function showPrizeDialog() {
    letterGame?.classList.add('garden-won');
    if (prizeDialog && !prizeDialog.open) {
      prizeDialog.showModal();
    }
  }

  function showLoseDialog() {
    letterGame?.classList.add('garden-lost');
    if (loseDialog && !loseDialog.open) {
      loseDialog.hidden = false;
      loseDialog.showModal();
    }
  }

  function checkGardenAnswer() {
    const answer = selected.map((item) => item?.letter ?? '').join('');
    const plantedCount = selected.filter(Boolean).length;
    if (!answer) {
      setLetterStatus('Drag the garden pieces into the answer beds.');
      return;
    }
    if (plantedCount < prizeLetters.length) {
      setLetterStatus(`${plantedCount}/${prizeLetters.length} planted. Fill every bed, then the garden will judge.`);
      return;
    }
    if (answer === targetWord) {
      setLetterStatus('Prize unlocked. The grass is judging you.');
      showPrizeDialog();
      return;
    }
    setLetterStatus('BETTER LUCK NEXT TIME, SUCKER!');
    letterGame?.classList.add('garden-shake');
    window.setTimeout(() => letterGame?.classList.remove('garden-shake'), 420);
    showLoseDialog();
  }

  function placeTile(tileId: string, slotIndex = selected.findIndex((item) => item === null)) {
    if (slotIndex < 0) return;
    const tile = scrambled.find((item) => item.id === tileId);
    if (!tile) return;
    const existingIndex = selected.findIndex((item) => item?.id === tileId);
    if (existingIndex >= 0) selected[existingIndex] = null;
    selected[slotIndex] = tile;
    selectedTileId = null;
    renderLetterGame();
    checkGardenAnswer();
  }

  function renderLetterGame() {
    slots.innerHTML = '';
    selected.forEach((tile, index) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = `letter-slot${index === 3 ? ' word-break' : ''}${tile ? ' is-planted' : ''}${selectedTileId && !tile ? ' is-targetable' : ''}`;
      slot.dataset.slotIndex = String(index);
      if (tile) {
        const face = document.createElement('span');
        face.className = 'letter-face';
        face.textContent = tile.letter;
        slot.append(face);
      }
      if (tile) slot.style.setProperty('--piece-color', tile.color);
      slot.setAttribute('aria-label', tile ? `Remove ${tile.letter} from bed ${index + 1}` : `Place selected letter in bed ${index + 1}`);
      slot.addEventListener('click', () => {
        if (!selected[index] && selectedTileId) {
          placeTile(selectedTileId, index);
          return;
        }
        if (!selected[index]) {
          setLetterStatus('Pick a letter first, then tap an answer bed.');
          return;
        }
        selected[index] = null;
        renderLetterGame();
        checkGardenAnswer();
      });
      slot.addEventListener('dragover', (event) => {
        event.preventDefault();
        slot.classList.add('is-hovered');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('is-hovered'));
      slot.addEventListener('drop', (event) => {
        event.preventDefault();
        slot.classList.remove('is-hovered');
        const tileId = event.dataTransfer?.getData('text/plain');
        if (tileId) placeTile(tileId, index);
      });
      slots.append(slot);
    });

    tray.innerHTML = '';
    const plantedIds = new Set(selected.filter(Boolean).map((item) => item?.id));
    scrambled.filter((tile) => !plantedIds.has(tile.id)).forEach((tile) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `letter-tile${selectedTileId === tile.id ? ' is-selected' : ''}`;
      const face = document.createElement('span');
      face.className = 'letter-face';
      face.textContent = tile.letter;
      button.append(face);
      button.style.setProperty('--piece-color', tile.color);
      button.setAttribute('aria-label', `Move garden piece ${tile.letter}`);
      button.setAttribute('aria-pressed', String(selectedTileId === tile.id));
      button.addEventListener('pointerdown', (event) => beginPointerDrag(event, button, tile.id));
      button.addEventListener('pointermove', (event) => movePointerDrag(event, button, tile.id));
      button.addEventListener('pointerup', (event) => endPointerDrag(event, button, tile.id));
      button.addEventListener('pointercancel', () => resetPointerDrag());
      button.addEventListener('click', () => {
        if (suppressClickTileId === tile.id) {
          suppressClickTileId = null;
          return;
        }
        selectedTileId = selectedTileId === tile.id ? null : tile.id;
        renderLetterGame();
        setLetterStatus(selectedTileId ? `Selected ${tile.letter}. Tap an answer bed to plant it.` : 'Selection cleared. Pick another letter.');
      });
      tray.append(button);
    });
  }

  function resetLetterGame(reshuffle = false) {
    selected = Array.from({ length: prizeLetters.length }, () => null);
    selectedTileId = null;
    if (reshuffle) scrambled = shuffle(scrambled);
    letterGame?.classList.remove('garden-won');
    letterGame?.classList.remove('garden-lost');
    setLetterStatus('Tap a letter, then tap an answer bed. Dragging also works.');
    renderLetterGame();
  }

  letterShuffle?.addEventListener('click', () => resetLetterGame(true));
  prizeClose?.addEventListener('click', () => prizeDialog?.close());
  loseClose?.addEventListener('click', () => {
    loseDialog?.close();
    if (loseDialog) loseDialog.hidden = true;
    resetLetterGame(true);
  });

  resetLetterGame(true);
}
