// Native CSS owns modern mobile geometry, including the first paint. Never
// translate or resize the app from a transient visualViewport measurement.
(() => {
  const root = document.documentElement;
  const mobile = window.matchMedia('(max-width: 899px)');
  const nativeHeight = Boolean(window.CSS?.supports?.('height', '100dvh'));
  const restoration = window.history?.scrollRestoration;
  const sync = () => {
    if (document.visibilityState === 'hidden') return;
    if (restoration !== undefined) window.history.scrollRestoration = mobile.matches ? 'manual' : restoration;
    // Height-only fallback for pre-dvh browsers. No offsets, width correction,
    // scroll resets, polling, or handlers attached to every sheet gesture.
    const height = mobile.matches && !nativeHeight && Number.isFinite(window.innerHeight) && window.innerHeight > 0
      ? `${window.innerHeight}px` : '';
    if (root.style.getPropertyValue('--legacy-app-height') !== height) {
      if (height) root.style.setProperty('--legacy-app-height', height);
      else root.style.removeProperty('--legacy-app-height');
      window.dispatchEvent(new Event('dolce:viewportchange'));
    }
  };
  for (const type of ['resize', 'pageshow', 'orientationchange']) window.addEventListener(type, sync, {passive: true});
  document.addEventListener('visibilitychange', sync);
  mobile.addEventListener('change', sync);
  sync();
})();
