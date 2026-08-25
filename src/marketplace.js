const interactiveSelector = '.event-card, .owned-ticket, .ticket-float, .market-listing, .purchase-card';

function addTilt(element) {
  if (element.dataset.tiltReady) return;
  element.dataset.tiltReady = 'true';
  element.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    element.style.setProperty('--tilt-x', `${x * 8}deg`);
    element.style.setProperty('--tilt-y', `${y * -8}deg`);
  });
  element.addEventListener('pointerleave', () => {
    element.style.setProperty('--tilt-x', '0deg');
    element.style.setProperty('--tilt-y', '0deg');
  });
}

function addJourneyControls(app) {
  app.querySelector('.organizer-link')?.remove();
  app.querySelector('.journey-nav')?.remove();
  const page = app.querySelector('main');
  if (!page || page.classList.contains('dashboard')) return;

  const controls = document.createElement('div');
  controls.className = 'journey-nav';
  controls.innerHTML = `
    <button class="journey-back" aria-label="Back to events">← Explore</button>
    <span><i></i> Polygon Amoy · Demo marketplace</span>
    <button class="journey-next" aria-label="View my tickets">My collection →</button>`;
  controls.querySelector('.journey-back').onclick = () => window.go?.('home');
  controls.querySelector('.journey-next').onclick = () => window.go?.('tickets');
  document.body.appendChild(controls);
}

function addBlockchainExplainer(app) {
  const home = app.querySelector('main > .hero');
  if (!home || app.querySelector('.blockchain-explainer')) return;
  const section = document.createElement('section');
  section.className = 'blockchain-explainer';
  section.innerHTML = `<div class="blockchain-copy"><span class="eyebrow">HOW BLOCKTIX USES BLOCKCHAIN</span><h2>Every ticket has a <em>verifiable life.</em></h2><p>BlockTix represents each ticket as a unique ERC-721 token. The chain records who owns it, while the ticket contract enforces the price, supply limit, and one-time entry status.</p><small>Demo note: the interface simulates these steps until the contract is deployed and connected to a wallet.</small></div><div class="chain-flow"><article><b>01</b><h3>Mint</h3><p>Payment mints one ticket NFT to the buyer wallet.</p></article><article><b>02</b><h3>Own</h3><p>The wallet address proves current ticket ownership.</p></article><article><b>03</b><h3>Verify</h3><p>A short-lived entry challenge validates the pass.</p></article><article><b>04</b><h3>Redeem</h3><p>The contract marks the token used—once only.</p></article></div>`;
  home.parentElement.appendChild(section);
}

function enhance() {
  document.querySelectorAll(interactiveSelector).forEach(addTilt);
  const app = document.getElementById('app');
  if (app) { addJourneyControls(app); addBlockchainExplainer(app); }
}

new MutationObserver(enhance).observe(document.getElementById('app'), { childList: true, subtree: true });
enhance();
