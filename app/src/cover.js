// The poster itself: panel layouts, colour grades and the renderer that
// paints a whole cover onto any canvas at any size.
//
// A cover is a mosaic of photo panels with thin light seams, a warm or neon
// grade over each panel, and one big bold caption with a tagline across the
// foot. The same function draws the editor preview and the exported PNG, so
// what the maker sees is exactly what the PNG holds.

// Panel rectangles are fractions of the cover: [x, y, width, height].
// Each panel names the photo slot it shows and its grade by default.
export const LAYOUTS = {
  mosaic: {
    label: 'Mosaic · 6 panels',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 0.52, photo: 0, grade: 'sunset' },
      { x: 0.62, y: 0, w: 0.38, h: 0.26, photo: 1, grade: 'neon' },
      { x: 0.62, y: 0.26, w: 0.38, h: 0.26, photo: 2, grade: 'sunset', focusY: 0.72 },
      { x: 0, y: 0.52, w: 0.34, h: 0.48, photo: 2, grade: 'neon', focusY: 0.68 },
      { x: 0.34, y: 0.52, w: 0.33, h: 0.48, photo: 1, grade: 'sunset' },
      { x: 0.67, y: 0.52, w: 0.33, h: 0.48, photo: 0, grade: 'neon' },
    ],
  },
  strip: {
    label: 'Strip · 5 panels',
    panels: [
      { x: 0, y: 0, w: 0.55, h: 0.62, photo: 0, grade: 'sunset' },
      { x: 0.55, y: 0, w: 0.45, h: 0.31, photo: 1, grade: 'neon' },
      { x: 0.55, y: 0.31, w: 0.45, h: 0.31, photo: 2, grade: 'sunset', focusY: 0.72 },
      { x: 0, y: 0.62, w: 0.5, h: 0.38, photo: 1, grade: 'neon' },
      { x: 0.5, y: 0.62, w: 0.5, h: 0.38, photo: 2, grade: 'sunset', focusY: 0.68 },
    ],
  },
  duo: {
    label: 'Duo · 4 panels',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.58, photo: 0, grade: 'sunset' },
      { x: 0.5, y: 0, w: 0.5, h: 0.58, photo: 1, grade: 'neon' },
      { x: 0, y: 0.58, w: 0.5, h: 0.42, photo: 2, grade: 'neon', focusY: 0.68 },
      { x: 0.5, y: 0.58, w: 0.5, h: 0.42, photo: 0, grade: 'sunset' },
    ],
  },
};

export const GRADE_NAMES = ['sunset', 'neon', 'noir', 'clean'];

// A grade is a wash of colour laid over a panel with a blend mode, plus a
// vignette that darkens the panel's corners so the mosaic reads as one poster.
function applyGrade(ctx, x, y, w, h, grade) {
  ctx.save();
  if (grade === 'sunset') {
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, 'rgba(255, 122, 61, 0.28)');
    wash.addColorStop(0.55, 'rgba(255, 61, 129, 0.16)');
    wash.addColorStop(1, 'rgba(90, 30, 140, 0.3)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
  } else if (grade === 'neon') {
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, 'rgba(255, 46, 136, 0.3)');
    wash.addColorStop(1, 'rgba(34, 211, 238, 0.3)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 0, 128, 0.25)';
    ctx.fillRect(x, y, w, h * 0.5);
  } else if (grade === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(120, 140, 200, 0.22)';
    ctx.fillRect(x, y, w, h);
  }
  // Vignette, every grade.
  ctx.globalCompositeOperation = 'source-over';
  const vignette = ctx.createRadialGradient(
    x + w / 2, y + h / 2, Math.min(w, h) * 0.42,
    x + w / 2, y + h / 2, Math.max(w, h) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(8, 4, 18, 0)');
  vignette.addColorStop(1, 'rgba(8, 4, 18, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Draws one photo into a panel, cover-fit, at a zoom with a focus point.
// focusX/focusY run 0..1: 0 shows the photo's left/top edge, 1 its right/bottom.
function drawPanelPhoto(ctx, photo, px, py, pw, ph, zoom, focusX, focusY) {
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = px + (pw - dw) * focusX;
  const dy = py + (ph - dh) * focusY;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

// The caption band: a dark gradient rising from the foot, the big caption in
// heavy capitals with a warm fill and a dark outline, and the tagline under it.
function drawCaptionBand(ctx, W, H, caption, tagline) {
  const bandTop = H * 0.74;
  const band = ctx.createLinearGradient(0, bandTop, 0, H);
  band.addColorStop(0, 'rgba(8, 4, 18, 0)');
  band.addColorStop(0.45, 'rgba(8, 4, 18, 0.62)');
  band.addColorStop(1, 'rgba(8, 4, 18, 0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, W, H - bandTop);

  const text = caption.trim().toUpperCase();
  if (text) {
    let size = H * 0.115;
    const family = `'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `900 ${size}px ${family}`;
    try {
      ctx.letterSpacing = `${Math.round(size * 0.05)}px`;
    } catch {
      // Older engines ignore letterSpacing; the caption still draws.
    }
    while (ctx.measureText(text).width > W * 0.9 && size > 14) {
      size -= 2;
      ctx.font = `900 ${size}px ${family}`;
    }
    const fill = ctx.createLinearGradient(0, H - size * 1.35, 0, H - size * 0.15);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(1, '#ffd98a');
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.22;
    ctx.shadowOffsetY = size * 0.04;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = '#160423';
    ctx.strokeText(text, W / 2, H - H * 0.085);
    ctx.fillStyle = fill;
    ctx.fillText(text, W / 2, H - H * 0.085);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Ignore.
    }
  }

  const sub = tagline.trim().toUpperCase();
  if (sub) {
    const size = Math.max(12, H * 0.028);
    ctx.font = `700 ${size}px 'Helvetica Neue', Arial, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(size * 0.42)}px`;
    } catch {
      // Ignore.
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8ad8';
    ctx.fillText(sub, W / 2, H - H * 0.028);
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // Ignore.
    }
  }
}

// Paints the whole poster. `state` holds layout, caption, tagline and one
// panel override per layout slot ({ photo, grade, zoom, focusX, focusY }).
// `images` is an array of photo canvases/images by slot index. When
// `highlight` is a panel index, that panel gets a bright outline (editor only).
export function drawPoster(canvas, state, images, highlight = -1) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.mosaic;
  const gutter = Math.max(3, Math.round(Math.min(W, H) * 0.006));

  ctx.fillStyle = '#0d0714';
  ctx.fillRect(0, 0, W, H);

  layout.panels.forEach((panel, index) => {
    const override = state.panels[index] ?? {};
    const px = panel.x * W + gutter / 2;
    const py = panel.y * H + gutter / 2;
    const pw = panel.w * W - gutter;
    const ph = panel.h * H - gutter;
    const photoIndex = override.photo ?? panel.photo;
    const photo = images[photoIndex];
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    if (photo) {
      drawPanelPhoto(
        ctx, photo, px, py, pw, ph,
        override.zoom ?? 1.12,
        override.focusX ?? 0.5,
        override.focusY ?? 0.5,
      );
    } else {
      ctx.fillStyle = '#241534';
      ctx.fillRect(px, py, pw, ph);
    }
    applyGrade(ctx, px, py, pw, ph, override.grade ?? panel.grade);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.002);
    ctx.strokeRect(px, py, pw, ph);
    if (index === highlight) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.008);
      ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
    }
  });

  drawCaptionBand(ctx, W, H, state.caption, state.tagline);
}

// The panel under a point on a canvas of the poster's size, or -1.
export function panelAt(state, x, y, W, H) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.mosaic;
  for (let i = 0; i < layout.panels.length; i += 1) {
    const p = layout.panels[i];
    if (x >= p.x * W && x < (p.x + p.w) * W && y >= p.y * H && y < (p.y + p.h) * H) return i;
  }
  return -1;
}
