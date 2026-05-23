const homeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action="home"]'));
const desktopHome = document.querySelector<HTMLElement>('#desktop-home');
const modalLayer = document.querySelector<HTMLElement>('[data-modal-layer]');
const modalButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-modal]'));
const modalPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-modal-panel]'));
const modalCloseButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-modal-close]'));
const quantumProgress = document.querySelector<HTMLElement>('[data-quantum-progress]');
const quantumKicker = document.querySelector<HTMLElement>('[data-quantum-kicker]');
const quantumTitle = document.querySelector<HTMLElement>('[data-quantum-title]');
const quantumFact = document.querySelector<HTMLElement>('[data-quantum-fact]');
const quantumPrev = document.querySelector<HTMLButtonElement>('[data-quantum-prev]');
const quantumNext = document.querySelector<HTMLButtonElement>('[data-quantum-next]');
const letterTray = document.querySelector<HTMLElement>('[data-letter-tray]');
const letterSlots = document.querySelector<HTMLElement>('[data-letter-slots]');
const letterShuffle = document.querySelector<HTMLButtonElement>('[data-letter-shuffle]');
const letterStatus = document.querySelector<HTMLOutputElement>('[data-letter-status]');
const letterGame = document.querySelector<HTMLElement>('[data-letter-game]');
const prizeDialog = document.querySelector<HTMLDialogElement>('[data-prize-dialog]');
const loseDialog = document.querySelector<HTMLDialogElement>('[data-lose-dialog]');
const loseClose = document.querySelector<HTMLButtonElement>('[data-lose-close]');

const quantumFacts = [
  {
    title: 'Atomic fire',
    fact: 'In 1945, Oppenheimer, Enrico Fermi, Niels Bohr, Richard Feynman, and many others helped build the first atomic bombs. The core idea was nuclear fission: split heavy uranium or plutonium atoms, release energy, and let flying neutrons split more atoms in a chain reaction.'
  },
  {
    title: 'Relativity without the headache',
    fact: 'Einstein showed that space and time are not a fixed stage. They bend around speed and gravity, which is why fast satellites experience time slightly differently from us. GPS has to correct for that, or maps would drift into nonsense.'
  },
  {
    title: 'Quantum superposition',
    fact: 'A tiny particle can behave like several possibilities at once until it is measured. It is not magic mood lighting; it is more like nature keeping multiple answers open until an interaction forces one result.'
  },
  {
    title: 'Entanglement',
    fact: 'Two particles can share one linked state even when far apart. Measure one, and the shared description updates instantly. It does not let us send faster-than-light texts, sadly, but it does power serious quantum computing ideas.'
  },
  {
    title: 'Black holes',
    fact: 'A black hole is what happens when gravity wins so hard that escape velocity becomes faster than light. Cross the event horizon and every path points inward. Space itself has become a one-way trapdoor.'
  },
  {
    title: 'The uncertainty principle',
    fact: 'Heisenberg found that you cannot perfectly know both where a particle is and how fast it is moving. This is not bad equipment. It is a rule baked into reality at small scales, because particles act like waves too.'
  },
  {
    title: 'Fusion',
    fact: 'The Sun shines by fusion: hydrogen nuclei smash together and become helium. A tiny bit of mass turns into energy through E = mc². That small missing mass is the reason daylight exists. Casual cosmic accounting fraud.'
  },
  {
    title: 'Dark matter',
    fact: 'Galaxies spin as if they contain more mass than we can see. Dark matter is the name for that missing gravitational influence. We do not know what it is yet, only that the universe keeps leaving its fingerprints in the math.'
  }
];

let quantumIndex = 0;
let quantumTimer: number | null = null;

function openModal(name: string) {
  if (!modalLayer) return;
  if (name === 'quantum-teacher') {
    quantumIndex = 0;
    renderQuantumFact();
  }
  modalLayer.hidden = false;
  modalPanels.forEach((panel) => {
    panel.hidden = panel.dataset.modalPanel !== name;
  });
  modalPanels.find((panel) => panel.dataset.modalPanel === name)?.querySelector<HTMLElement>('button')?.focus();
}

function clearHashTarget() {
  if (!window.location.hash) return;
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

function closeModal(clearHash = false) {
  if (!modalLayer) return;
  modalLayer.hidden = true;
  modalPanels.forEach((panel) => {
    panel.hidden = true;
  });
  if (clearHash) clearHashTarget();
}

function renderQuantumFact() {
  const fact = quantumFacts[quantumIndex];
  if (!fact) return;
  if (quantumKicker) quantumKicker.textContent = `Story ${String(quantumIndex + 1).padStart(2, '0')} / ${String(quantumFacts.length).padStart(2, '0')}`;
  if (quantumTitle) quantumTitle.textContent = fact.title;
  if (quantumFact) quantumFact.textContent = fact.fact;
  if (quantumProgress) {
    quantumProgress.style.animation = 'none';
    window.requestAnimationFrame(() => {
      quantumProgress.style.animation = '';
    });
  }
}

function advanceQuantumFact(direction = 1) {
  quantumIndex = (quantumIndex + direction + quantumFacts.length) % quantumFacts.length;
  renderQuantumFact();
}

function startQuantumTeacher() {
  if (!quantumFact) return;
  if (quantumTimer !== null) window.clearInterval(quantumTimer);
  quantumTimer = window.setInterval(() => advanceQuantumFact(1), 30_000);
  renderQuantumFact();
}

modalButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    const modalName = button.dataset.modal;
    if (!modalName) return;
    if (button instanceof HTMLAnchorElement) {
      event.preventDefault();
      const url = new URL(button.href, window.location.origin);
      window.history.pushState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
    openModal(modalName);
  });
});

modalCloseButtons.forEach((button) => {
  button.addEventListener('click', () => closeModal(true));
});

modalLayer?.addEventListener('click', (event) => {
  if (event.target === modalLayer) closeModal(true);
});

function openHashTarget() {
  if (window.location.hash === '#quantum-teacher') {
    openModal('quantum-teacher');
    return;
  }
  closeModal(false);
}

window.addEventListener('hashchange', openHashTarget);
openHashTarget();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal(true);
});

quantumPrev?.addEventListener('click', () => advanceQuantumFact(-1));
quantumNext?.addEventListener('click', () => advanceQuantumFact(1));
startQuantumTeacher();

homeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    closeModal(true);
    prizeDialog?.close();
    loseDialog?.close();
    if (loseDialog) loseDialog.hidden = true;
    desktopHome?.scrollIntoView({ block: 'start' });
  });
});

if (letterTray && letterSlots) {
  const tray = letterTray;
  const slots = letterSlots;
  const targetWord = 'YOUCUNT!';
  const targetLetters = targetWord.split('');
  const blockCount = targetLetters.length;
  const grassColors = ['#8fb247', '#5f9e5f', '#bb9b42', '#58a6a9', '#9aa64b', '#7fb85a', '#d78b3b', '#e3c44e'];
  let scrambled = makePrizeBlocks();
  let planted: Array<(typeof scrambled)[number] | null> = Array.from({ length: blockCount }, () => null);
  let draggingTileId: string | null = null;
  let draggingButton: HTMLButtonElement | null = null;
  let draggingPointerId: number | null = null;
  let draggingOriginKind: 'slot' | 'tile' | null = null;
  let draggingOriginIndex: number | null = null;
  let dragOrigin = { x: 0, y: 0 };
  let pointerMoved = false;
  let suppressClickKey: string | null = null;
  let activeTileId: string | null = null;

  function shuffle<T>(items: T[]) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function randomDisplayLetter(letter: string) {
    if (letter === '!') return letter;
    return Math.random() > 0.5 ? letter.toUpperCase() : letter.toLowerCase();
  }

  function makePrizeBlocks() {
    const blocks = targetLetters.map((letter, index) => ({
      id: `${letter}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      letter,
      displayLetter: randomDisplayLetter(letter),
      color: grassColors[index % grassColors.length]
    }));
    let shuffled = shuffle(blocks);
    while (shuffled.map((tile) => tile.letter).join('') === targetWord) {
      shuffled = shuffle(blocks);
    }
    return shuffled;
  }

  function setLetterStatus(text: string) {
    if (letterStatus) letterStatus.textContent = text;
  }

  function clearSlotHover() {
    slots.querySelectorAll('.letter-slot.is-hovered').forEach((slot) => {
      slot.classList.remove('is-hovered');
    });
    tray.classList.remove('is-hovered');
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
    draggingButton.classList.remove('is-dragging', 'is-pointer-dragging');
    draggingButton.style.transform = '';
    draggingButton.style.zIndex = '';
    draggingButton.style.pointerEvents = '';
    draggingButton = null;
    draggingPointerId = null;
    draggingTileId = null;
    draggingOriginKind = null;
    draggingOriginIndex = null;
    pointerMoved = false;
  }

  function suppressClickFor(key: string) {
    suppressClickKey = key;
    window.setTimeout(() => {
      if (suppressClickKey === key) suppressClickKey = null;
    }, 80);
  }

  function getTile(tileId: string) {
    return scrambled.find((item) => item.id === tileId) ?? null;
  }

  function findPlantedIndex(tileId: string) {
    return planted.findIndex((item) => item?.id === tileId);
  }

  function trayContainsPoint(x: number, y: number) {
    const rect = tray.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function setActiveTile(tileId: string | null) {
    activeTileId = activeTileId === tileId ? null : tileId;
    renderLetterGame();
    const tile = activeTileId ? getTile(activeTileId) : null;
    if (!tile) {
      setLetterStatus('Selection cleared. Pick another letter.');
      return;
    }
    const plantedIndex = findPlantedIndex(tile.id);
    setLetterStatus(
      plantedIndex >= 0
        ? `Selected ${tile.displayLetter}. Tap another bed to move it, or tap the same bed to return it to the tray.`
        : `Selected ${tile.displayLetter}. Tap an answer bed to place it.`
    );
  }

  function beginPointerDrag(
    event: PointerEvent,
    button: HTMLButtonElement,
    tileId: string,
    originKind: 'slot' | 'tile',
    originIndex: number | null = null
  ) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    draggingTileId = tileId;
    draggingButton = button;
    draggingPointerId = event.pointerId;
    draggingOriginKind = originKind;
    draggingOriginIndex = originIndex;
    dragOrigin = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
  }

  function movePointerDrag(event: PointerEvent) {
    if (!draggingButton || !draggingTileId) return;
    if (draggingPointerId !== null && event.pointerId !== draggingPointerId) return;
    const dx = event.clientX - dragOrigin.x;
    const dy = event.clientY - dragOrigin.y;
    if (!pointerMoved && Math.hypot(dx, dy) < 6) return;
    pointerMoved = true;
    event.preventDefault();
    draggingButton.classList.add('is-dragging', 'is-pointer-dragging');
    draggingButton.style.zIndex = '50';
    draggingButton.style.transform = `translate(${dx}px, ${dy}px) rotate(0deg) scale(1.04)`;
    hoverSlotFromPoint(event.clientX, event.clientY);
    if (findPlantedIndex(draggingTileId) >= 0 && trayContainsPoint(event.clientX, event.clientY)) {
      tray.classList.add('is-hovered');
    }
  }

  function activateSlot(index: number, tile: (typeof scrambled)[number] | null) {
    const clickKey = tile ? `slot:${tile.id}` : `slot-empty:${index}`;
    if (suppressClickKey === clickKey) {
      suppressClickKey = null;
      return;
    }
    if (!tile && activeTileId) {
      moveTile(activeTileId, index);
      return;
    }
    if (!tile) {
      setLetterStatus('Pick a letter first, then tap an answer bed.');
      return;
    }
    if (activeTileId && activeTileId !== tile.id) {
      moveTile(activeTileId, index);
      return;
    }
    if (activeTileId === tile.id) {
      suppressClickFor(`slot-empty:${index}`);
      releaseTile(tile.id);
      return;
    }
    setActiveTile(tile.id);
  }

  function activateTrayTile(tile: (typeof scrambled)[number]) {
    const clickKey = `tile:${tile.id}`;
    if (suppressClickKey === clickKey) {
      suppressClickKey = null;
      return;
    }
    setActiveTile(tile.id);
  }

  function endPointerDrag(event: PointerEvent) {
    if (!draggingButton || !draggingTileId) return;
    if (draggingPointerId !== null && event.pointerId !== draggingPointerId) return;
    const tileId = draggingTileId;
    const originKind = draggingOriginKind;
    const originIndex = draggingOriginIndex;
    if (!pointerMoved) {
      if (originKind === 'slot' && originIndex !== null) {
        const tile = getTile(tileId);
        suppressClickFor(`slot:${tileId}`);
        resetPointerDrag();
        activateSlot(originIndex, tile);
        return;
      }
      if (originKind === 'tile') {
        const tile = getTile(tileId);
        suppressClickFor(`tile:${tileId}`);
        resetPointerDrag();
        if (tile) activateTrayTile(tile);
        return;
      }
      resetPointerDrag();
      return;
    }
    event.preventDefault();
    const slotIndex = slotIndexFromPoint(event.clientX, event.clientY);
    const releasedToTray = findPlantedIndex(tileId) >= 0 && trayContainsPoint(event.clientX, event.clientY);
    suppressClickFor(originKind === 'slot' ? `slot:${tileId}` : `tile:${tileId}`);
    resetPointerDrag();
    if (slotIndex === null) {
      if (releasedToTray) {
        releaseTile(tileId);
      } else {
        setLetterStatus('Drop the piece into one of the answer beds.');
      }
    } else {
      moveTile(tileId, slotIndex);
    }
  }

  function showPrizeDialog() {
    letterGame?.classList.remove('garden-lost');
    letterGame?.classList.add('garden-won');
    loseDialog?.close();
    if (loseDialog) loseDialog.hidden = true;
    if (prizeDialog && !prizeDialog.open) {
      prizeDialog.showModal();
    }
  }

  function showLoseDialog() {
    letterGame?.classList.remove('garden-won');
    letterGame?.classList.add('garden-lost');
    prizeDialog?.close();
    if (loseDialog && !loseDialog.open) {
      loseDialog.hidden = false;
      loseDialog.showModal();
    }
  }

  function checkGardenAnswer() {
    const answer = planted.map((item) => item?.letter ?? '').join('');
    const plantedCount = planted.filter(Boolean).length;
    if (!answer) {
      setLetterStatus('Tap a letter, then tap an answer bed. Dragging also works.');
      return;
    }
    if (plantedCount < blockCount) {
      setLetterStatus(`${plantedCount}/${blockCount} planted. Fill every bed, then the garden will judge.`);
      return;
    }
    if (answer === targetWord) {
      setLetterStatus('Prize unlocked. The chaos confessed.');
      showPrizeDialog();
      return;
    }
    setLetterStatus('Wrong order. Shuffle the insult harder.');
    letterGame?.classList.add('garden-shake');
    window.setTimeout(() => letterGame?.classList.remove('garden-shake'), 420);
    showLoseDialog();
  }

  function moveTile(tileId: string, slotIndex = planted.findIndex((item) => item === null)) {
    if (slotIndex < 0) return;
    const tile = getTile(tileId);
    if (!tile) return;
    const sourceIndex = findPlantedIndex(tileId);
    const targetTile = planted[slotIndex];
    if (sourceIndex === slotIndex) {
      activeTileId = null;
      renderLetterGame();
      checkGardenAnswer();
      return;
    }
    if (sourceIndex >= 0 && targetTile) {
      planted[sourceIndex] = targetTile;
    } else if (sourceIndex >= 0) {
      planted[sourceIndex] = null;
    }
    planted[slotIndex] = tile;
    activeTileId = null;
    renderLetterGame();
    checkGardenAnswer();
  }

  function releaseTile(tileId: string) {
    const sourceIndex = findPlantedIndex(tileId);
    if (sourceIndex < 0) {
      setActiveTile(tileId);
      return;
    }
    planted[sourceIndex] = null;
    activeTileId = null;
    renderLetterGame();
    checkGardenAnswer();
    const tile = getTile(tileId);
    if (tile) setLetterStatus(`${tile.displayLetter} returned to the tray.`);
  }

  function renderLetterGame() {
    slots.innerHTML = '';
    planted.forEach((tile, index) => {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = `letter-slot${index === 3 ? ' word-break' : ''}${tile ? ' is-planted' : ''}${tile && activeTileId === tile.id ? ' is-selected' : ''}${activeTileId && !tile ? ' is-targetable' : ''}`;
      slot.dataset.slotIndex = String(index);
      if (tile) {
        const face = document.createElement('span');
        face.className = 'letter-face';
        face.textContent = tile.displayLetter;
        slot.append(face);
      }
      if (tile) slot.style.setProperty('--piece-color', tile.color);
      slot.setAttribute(
        'aria-label',
        tile ? `Move ${tile.displayLetter} from bed ${index + 1}` : activeTileId ? `Place selected letter in bed ${index + 1}` : `Empty answer bed ${index + 1}`
      );
      slot.setAttribute('aria-pressed', String(Boolean(tile && activeTileId === tile.id)));
      if (tile) {
        slot.dataset.tileId = tile.id;
        slot.dataset.letter = tile.letter;
      }
      slot.addEventListener('click', () => activateSlot(index, tile));
      if (tile) {
        slot.addEventListener('pointerdown', (event) => beginPointerDrag(event, slot, tile.id, 'slot', index));
        slot.addEventListener('pointercancel', () => resetPointerDrag());
      }
      slots.append(slot);
    });

    tray.innerHTML = '';
    const plantedIds = new Set(planted.filter(Boolean).map((item) => item?.id));
    scrambled.filter((tile) => !plantedIds.has(tile.id)).forEach((tile) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `letter-tile${activeTileId === tile.id ? ' is-selected' : ''}`;
      const face = document.createElement('span');
      face.className = 'letter-face';
      face.textContent = tile.displayLetter;
      button.append(face);
      button.style.setProperty('--piece-color', tile.color);
      button.setAttribute('aria-label', `Move garden piece ${tile.displayLetter}`);
      button.setAttribute('aria-pressed', String(activeTileId === tile.id));
      button.dataset.tileId = tile.id;
      button.dataset.letter = tile.letter;
      button.addEventListener('pointerdown', (event) => beginPointerDrag(event, button, tile.id, 'tile'));
      button.addEventListener('pointercancel', () => resetPointerDrag());
      button.addEventListener('click', () => activateTrayTile(tile));
      tray.append(button);
    });
  }

  function resetLetterGame(reshuffle = false) {
    resetPointerDrag();
    planted = Array.from({ length: blockCount }, () => null);
    activeTileId = null;
    suppressClickKey = null;
    if (reshuffle) scrambled = makePrizeBlocks();
    letterGame?.classList.remove('garden-won');
    letterGame?.classList.remove('garden-lost');
    letterGame?.classList.remove('garden-shake');
    prizeDialog?.close();
    loseDialog?.close();
    if (loseDialog) loseDialog.hidden = true;
    setLetterStatus('Tap a letter, then tap an answer bed. Dragging also works.');
    renderLetterGame();
  }

  letterShuffle?.addEventListener('click', () => resetLetterGame(true));
  prizeDialog?.addEventListener('click', (event) => {
    if (event.target === prizeDialog) prizeDialog.close();
  });
  loseClose?.addEventListener('click', () => {
    loseDialog?.close();
    if (loseDialog) loseDialog.hidden = true;
    resetLetterGame(true);
  });

  window.addEventListener('pointermove', movePointerDrag, { passive: false });
  window.addEventListener('pointerup', endPointerDrag, { passive: false });
  window.addEventListener('pointercancel', () => resetPointerDrag());

  resetLetterGame(true);
}
