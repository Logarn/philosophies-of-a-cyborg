const agentButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action="agent-mode"]'));
const modalLayer = document.querySelector<HTMLElement>('[data-modal-layer]');
const modalButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-modal]'));
const modalPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-modal-panel]'));
const modalCloseButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-modal-close]'));
const calcDisplay = document.querySelector<HTMLElement>('[data-calc-display]');
const calcLesson = document.querySelector<HTMLElement>('[data-calc-lesson]');
const calcKeys = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-key]'));

let expression = '';

const lessons: Record<string, string> = {
  'π': 'Pi is what circles keep whispering: circumference divided by diameter.',
  'φ': 'Phi is the golden ratio. People overuse it, but it is still a lovely number.',
  c: 'c is the speed of light. Fast enough to make most deadlines look unserious.',
  E: 'E = mc². Mass is basically energy wearing a heavier jacket.',
  'F=ma': 'Force equals mass times acceleration. Push more, or move smarter.',
  '∫': 'An integral adds tiny pieces until the whole shape admits what it is.'
};

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
