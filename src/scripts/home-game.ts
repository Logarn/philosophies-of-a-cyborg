const board = document.querySelector<HTMLElement>('.thought-board');
const tokens = Array.from(document.querySelectorAll<HTMLElement>('.token'));
const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.play-controls button'));

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function shuffleTokens() {
  tokens.forEach((token) => {
    token.style.left = randomBetween(6, 72) + '%';
    token.style.top = randomBetween(8, 68) + '%';
    token.style.transform = 'rotate(' + randomBetween(-10, 10) + 'deg)';
  });
}

function sparkBoard() {
  if (!board) return;
  board.animate(
    [
      { filter: 'saturate(1)', transform: 'scale(1)' },
      { filter: 'saturate(1.6)', transform: 'scale(1.015)' },
      { filter: 'saturate(1)', transform: 'scale(1)' }
    ],
    { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }
  );
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.action === 'shuffle') shuffleTokens();
    if (button.dataset.action === 'spark') sparkBoard();
    if (button.dataset.action === 'read') window.location.href = '/essays/';
  });
});
