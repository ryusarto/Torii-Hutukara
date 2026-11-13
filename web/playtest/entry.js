/* Brief, local device identification. No analytics or persistent identifier. */
(() => {
  'use strict';
  const root = document.documentElement;
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 1 &&
    (matchMedia('(pointer:coarse)').matches || /Macintosh/.test(navigator.userAgent));
  // Prefer the layout actually selected by the game, including its test override.
  const mobile = root.classList.contains('mobile121') ||
    !root.classList.contains('desktop121') && uaMobile;
  const device = mobile ? 'mobile' : 'pc';
  const build = window.TORII_PLAYTEST_BUILD;
  root.dataset.playtestDevice = device;
  window.ToriiPlaytest = Object.freeze({ ...build, device });

  const notice = document.createElement('div');
  notice.id = 'playtestEntry';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.textContent = `${mobile ? 'MOBILE' : 'PC'} · Alpha ${build.version}`;
  document.body.appendChild(notice);
  // It appears once per page entry, never again on rotation, focus or input changes.
  setTimeout(() => {
    notice.classList.add('leaving');
    setTimeout(() => notice.remove(), 250);
  }, 4000);
})();
