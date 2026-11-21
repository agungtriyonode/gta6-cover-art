// Fixed scenes for screenshots: ?shot=editor shows the editor with demo
// photos loaded; ?shot=cover shows the finished cover alone, full-bleed.
// `layout`, `caption` and `tagline` come from the query. window.__shotReady
// is set once the scene is painted, so a screenshot tool knows when to shoot.

export function readShotScene() {
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (!shot) return null;
  return {
    kind: shot,
    layout: query.get('layout') ?? 'mosaic',
    caption: query.get('caption') ?? 'VICE CITY',
    tagline: query.get('tagline') ?? 'SUNSET HEIST',
    size: query.get('size') ?? 'wide',
  };
}

export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
