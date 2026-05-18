const agentButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-action="agent-mode"]'));
const dock = document.querySelector<HTMLElement>('.desktop-dock');
const closeDock = document.querySelector<HTMLButtonElement>('[data-action="close-dock"]');

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

closeDock?.addEventListener('click', () => {
  dock?.classList.add('is-hidden');
});
