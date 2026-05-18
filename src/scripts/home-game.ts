const board = document.querySelector<HTMLElement>('.thought-board');
const files = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-file]'));
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.play-controls button'));
const agentButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action="agent-mode"]'));
const agentReadable = document.querySelector<HTMLElement>('.agent-readable');
const previewTitle = document.querySelector<HTMLElement>('[data-preview-title]');
const previewSummary = document.querySelector<HTMLElement>('[data-preview-summary]');
const previewDate = document.querySelector<HTMLElement>('[data-preview-date]');
const previewReading = document.querySelector<HTMLElement>('[data-preview-reading]');

function selectedFile() {
  return files.find((file) => file.classList.contains('is-selected')) ?? files[0];
}

function syncPreview(file: HTMLButtonElement) {
  files.forEach((candidate) => {
    candidate.classList.toggle('is-selected', candidate === file);
    candidate.setAttribute('aria-pressed', String(candidate === file));
  });

  if (previewTitle) previewTitle.textContent = file.dataset.title ?? '';
  if (previewSummary) previewSummary.textContent = file.dataset.summary ?? '';
  if (previewDate) previewDate.textContent = file.dataset.date ?? '';
  if (previewReading) previewReading.textContent = file.dataset.readingTime ?? '';
}

function spotlightPinned() {
  const pinned = files.find((file) => file.dataset.pinned === 'true') ?? files[0];
  if (!pinned || !board) return;
  syncPreview(pinned);
  board.animate(
    [
      { filter: 'saturate(1)', transform: 'translateY(0)' },
      { filter: 'saturate(1.35)', transform: 'translateY(-4px)' },
      { filter: 'saturate(1)', transform: 'translateY(0)' }
    ],
    { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' }
  );
}

function selectNextFile() {
  if (!files.length) return;
  const current = selectedFile();
  const nextIndex = (files.indexOf(current) + 1) % files.length;
  syncPreview(files[nextIndex]);
}

function openSelectedFile() {
  const href = selectedFile()?.dataset.href;
  if (href) window.location.href = href;
}

function setAgentMode(enabled: boolean) {
  document.body.classList.toggle('agent-mode', enabled);
  agentButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = 'Agent-readable mode';
  });
}

files.forEach((file) => {
  file.setAttribute('aria-pressed', String(file.classList.contains('is-selected')));
  file.addEventListener('click', () => syncPreview(file));
  file.addEventListener('dblclick', openSelectedFile);
});

if (agentReadable && agentButtons.length) {
  const params = new URLSearchParams(window.location.search);
  setAgentMode(params.get('mode') === 'agent');
  agentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      window.history.replaceState({}, '', '/?mode=agent');
      setAgentMode(true);
    });
  });
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.action === 'spotlight') spotlightPinned();
    if (button.dataset.action === 'next') selectNextFile();
    if (button.dataset.action === 'open') openSelectedFile();
  });
});
