/**
 * Tablets love to "help": pinch-zoom, double-tap-zoom, pull-to-refresh, long-press menus,
 * text selection magnifiers... none of which a 4-year-old should trigger by accident.
 * The CSS in index.html (touch-action: none, user-select: none) does most of the work;
 * these listeners catch the cases CSS can't, especially on iPad Safari.
 */
export function preventBrowserGestures(): void {
  const block = (e: Event) => e.preventDefault();
  const opts: AddEventListenerOptions = { passive: false };

  // iPad Safari pinch-zoom gestures.
  document.addEventListener('gesturestart', block, opts);
  document.addEventListener('gesturechange', block, opts);
  document.addEventListener('gestureend', block, opts);

  // Long-press / right-click menu.
  document.addEventListener('contextmenu', block, opts);

  // Dragging a finger should never scroll or bounce the page.
  document.addEventListener('touchmove', block, opts);

  // Double-tap / double-click zoom and accidental text selection.
  document.addEventListener('dblclick', block, opts);
  document.addEventListener('selectstart', block, opts);

  // Ctrl + mouse wheel / trackpad pinch zoom on desktop.
  document.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    opts,
  );
}
