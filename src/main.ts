import './styles.css';
import { Game } from './game/Game';

const appRoot = document.querySelector<HTMLElement>('#app');

if (!appRoot) throw new Error('UNBROKEN could not mount: #app is missing.');

appRoot.innerHTML = `
  <section class="arena-shell" aria-label="UNBROKEN live arena">
    <div class="arena-frame" id="arena-frame" tabindex="0">
      <div class="canvas-mount" id="canvas-mount" aria-hidden="true"></div>

      <div class="hud" aria-live="off">
        <div class="boss-readout">
          <div class="boss-line">
            <span id="boss-label">HEIR // V.01</span>
            <span id="mutation-label"></span>
          </div>
          <div class="boss-health" role="meter" aria-label="Boss integrity" aria-valuemin="0" aria-valuemax="100">
            <div class="boss-health__fill" id="boss-health-fill"></div>
          </div>
          <div class="timer" id="timer">00:45</div>
        </div>

        <div class="live-readout">
          <span><i class="signal signal--live"></i><b id="live-count">LIVE 2,431</b></span>
          <span><i class="signal signal--queue"></i><b id="queue-count">QUEUE 184</b></span>
        </div>

        <div class="player-readout">
          <span class="challenger" id="challenger-label">CHALLENGER 027</span>
          <span class="integrity" id="integrity" aria-label="Three integrity remaining">
            <i></i><i></i><i></i>
          </span>
          <span class="dash-status" id="dash-status">DASH READY</span>
        </div>

        <div class="pressure-readout" id="pressure-readout">FINAL SIGNAL</div>
        <div class="countdown-readout" id="countdown-readout"></div>
        <div class="combat-callout" id="combat-callout"></div>
        <div class="spectator-badge" id="spectator-badge">SPECTATOR FEED // DESKTOP REQUIRED TO CHALLENGE</div>
      </div>

      <div class="state-overlay state-overlay--visible" id="state-overlay">
        <div class="state-overlay__content">
          <p class="eyebrow" id="overlay-eyebrow">GLOBAL ARENA // SIMULATION 001</p>
          <h1 id="overlay-title">UNBROKEN</h1>
          <p class="overlay-copy" id="overlay-copy">One arena. One challenger. Every victory teaches HEIR.</p>
          <div class="control-legend" id="control-legend" aria-label="Controls">
            <span><kbd>WASD</kbd> MOVE</span>
            <span><kbd>MOUSE</kbd> AIM + FIRE</span>
            <span><kbd>SPACE</kbd> DASH</span>
          </div>
          <button class="enter-button" id="enter-button" type="button">ENTER ARENA</button>
          <p class="overlay-note" id="overlay-note">Two versions. About five minutes. Audio starts on entry.</p>
        </div>
      </div>

      <div class="hit-flash" id="hit-flash"></div>
    </div>

    <div class="utility-strip">
      <p id="status-line">V.01 // BASELINE SEED // 0 DEFEATS</p>
      <div class="utility-actions">
        <button class="utility-button" id="mute-button" type="button" aria-pressed="false">MUTE [M]</button>
        <a class="utility-link" href="?spectator=1">SPECTATOR VIEW</a>
        <a class="utility-link utility-link--project" href="./project/">PROJECT / DEVLOG</a>
      </div>
    </div>
    <aside class="mobile-feed" aria-label="Mobile spectator scoreboard">
      <p class="mobile-feed__eyebrow">READ-ONLY GLOBAL FEED</p>
      <div class="mobile-feed__headline">
        <strong id="mobile-boss">HEIR // V.37</strong>
        <strong id="mobile-timer">00:45</strong>
      </div>
      <dl>
        <div><dt>CHALLENGER</dt><dd id="mobile-challenger">CHALLENGER 405</dd></div>
        <div><dt>INTEGRITY</dt><dd id="mobile-integrity">3 / 3</dd></div>
        <div><dt>QUEUE</dt><dd id="mobile-queue">972</dd></div>
        <div><dt>VIEWERS</dt><dd id="mobile-live">18,204</dd></div>
      </dl>
      <p class="mobile-feed__mutation" id="mobile-mutation">DASH CATCH // Locks one visible strike on the predicted dash endpoint.</p>
      <p class="mobile-feed__note">Open on desktop to enter the arena. Touch controls are not part of this slice.</p>
    </aside>
    <p class="sr-only" id="live-region" aria-live="polite"></p>
  </section>
`;

const game = new Game({
  frame: document.querySelector<HTMLElement>('#arena-frame')!,
  mount: document.querySelector<HTMLElement>('#canvas-mount')!,
});

await game.init();

const qaRun = new URLSearchParams(window.location.search).get('debug') === 'run';
const qaIntegrityTimer = qaRun
  ? window.setInterval(() => window.__UNBROKEN__?.setPlayerIntegrity(3), 100)
  : undefined;

document.querySelector<HTMLButtonElement>('#enter-button')!.addEventListener('click', () => void game.enter());
document.querySelector<HTMLButtonElement>('#mute-button')!.addEventListener('click', () => game.toggleMute());

window.addEventListener('beforeunload', () => {
  if (qaIntegrityTimer !== undefined) window.clearInterval(qaIntegrityTimer);
  game.destroy();
});
