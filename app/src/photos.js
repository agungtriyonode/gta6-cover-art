// Procedural demo photos for Neon Vice Cover Studio.
//
// The app never ships a photo file: every demo "photo" is painted here on an
// offscreen canvas with the 2D API, so the repository stays text-only and the
// editor always has three pictures to fill its panels with, even offline.
// Each painter draws at 1200 x 900 and returns the canvas. A tiny seeded
// random generator keeps every painting identical on every load, so a
// screenshot taken today matches one taken tomorrow.

// A small deterministic generator (mulberry32): same seed, same picture.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function skyGradient(ctx, width, height, stops) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  for (const [at, color] of stops) gradient.addColorStop(at, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function glowingSun(ctx, x, y, radius, core, halo) {
  ctx.save();
  ctx.shadowColor = halo;
  ctx.shadowBlur = radius * 1.6;
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function birds(ctx, points) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 8, 32, 0.85)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const [x, y, size] of points) {
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.7, x, y);
    ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.7, x + size, y);
    ctx.stroke();
  }
  ctx.restore();
}

function palmTree(ctx, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk: a gentle curve leaning right.
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -90, 44, -168);
  ctx.stroke();
  // Fronds: seven arcs fanning out of the crown.
  ctx.lineWidth = 9;
  const crownX = 44;
  const crownY = -168;
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (0.08 + (i / 6) * 0.84);
    const length = 95 - Math.abs(i - 3) * 9;
    const tipX = crownX + Math.cos(angle) * length;
    const tipY = crownY - Math.sin(angle) * length * 0.62;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + Math.cos(angle) * length * 0.55,
      crownY - Math.sin(angle) * length * 0.95,
      tipX,
      tipY + 26,
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Pier at sunset: a wooden pier walks out into a pink sea under a low sun.
export function paintPierSunset() {
  const W = 1200;
  const H = 900;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const horizon = H * 0.6;
  skyGradient(ctx, W, H, [
    [0, '#1b1040'],
    [0.42, '#7b2d8b'],
    [0.58, '#ff7e5f'],
    [0.62, '#feb47b'],
  ]);
  glowingSun(ctx, W * 0.66, horizon - H * 0.06, H * 0.085, '#fff3c4', '#ff9a5c');
  // Sea.
  const sea = ctx.createLinearGradient(0, horizon, 0, H);
  sea.addColorStop(0, '#4b2373');
  sea.addColorStop(1, '#12082b');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, W, H - horizon);
  // Sun's reflection: a stack of shrinking light bars on the water.
  ctx.fillStyle = 'rgba(255, 190, 120, 0.55)';
  const random = seededRandom(7);
  for (let i = 0; i < 14; i += 1) {
    const y = horizon + 12 + i * 18;
    const w = 190 - i * 11 + random() * 30;
    ctx.fillRect(W * 0.66 - w / 2, y, w, 5);
  }
  // Pier deck: a dark trapezoid walking from the bottom edge to the horizon.
  ctx.fillStyle = '#160a26';
  ctx.beginPath();
  ctx.moveTo(W * 0.08, H);
  ctx.lineTo(W * 0.42, horizon);
  ctx.lineTo(W * 0.58, horizon);
  ctx.lineTo(W * 0.92, H);
  ctx.closePath();
  ctx.fill();
  // Planks and posts along the deck.
  ctx.strokeStyle = 'rgba(255, 170, 120, 0.28)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i += 1) {
    const t = i / 8;
    const y = horizon + (H - horizon) * t * t;
    const leftX = W * 0.42 - (W * 0.42 - W * 0.08) * t;
    const rightX = W * 0.58 + (W * 0.92 - W * 0.58) * t;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#160a26';
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const y = horizon + (H - horizon) * t * t;
    const postH = 26 + t * 66;
    const leftX = W * 0.42 - (W * 0.42 - W * 0.08) * t;
    const rightX = W * 0.58 + (W * 0.92 - W * 0.58) * t;
    ctx.fillRect(leftX - 5, y - postH, 10, postH);
    ctx.fillRect(rightX - 5, y - postH, 10, postH);
  }
  birds(ctx, [
    [W * 0.2, H * 0.2, 16],
    [W * 0.3, H * 0.15, 12],
    [W * 0.82, H * 0.28, 14],
  ]);
  return canvas;
}

// Neon boulevard: a wet street at night, lit windows and glowing signs.
export function paintNeonBoulevard() {
  const W = 1200;
  const H = 900;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  skyGradient(ctx, W, H, [
    [0, '#0b0620'],
    [0.55, '#2a1052'],
    [0.72, '#57206e'],
  ]);
  const random = seededRandom(21);
  // Skyline: dark blocks with a scatter of lit windows.
  let x = 0;
  while (x < W) {
    const bw = 90 + random() * 130;
    const bh = 180 + random() * 260;
    ctx.fillStyle = '#120a2e';
    ctx.fillRect(x, H * 0.66 - bh, bw, bh);
    for (let wy = H * 0.66 - bh + 16; wy < H * 0.66 - 14; wy += 26) {
      for (let wx = x + 12; wx < x + bw - 12; wx += 26) {
        if (random() < 0.34) {
          ctx.fillStyle = random() < 0.5 ? 'rgba(255, 214, 120, 0.9)' : 'rgba(120, 230, 255, 0.85)';
          ctx.fillRect(wx, wy, 12, 16);
        }
      }
    }
    x += bw + 8;
  }
  // Street: a dark trapezoid widening toward the viewer, with wet shine.
  const street = ctx.createLinearGradient(0, H * 0.66, 0, H);
  street.addColorStop(0, '#1a1030');
  street.addColorStop(1, '#05030c');
  ctx.fillStyle = street;
  ctx.beginPath();
  ctx.moveTo(W * 0.34, H * 0.66);
  ctx.lineTo(W * 0.66, H * 0.66);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();
  // Neon signs: glowing bars on the buildings, with reflections below.
  const signs = [
    { x: W * 0.08, y: H * 0.3, w: 34, h: 190, color: '#ff2e88' },
    { x: W * 0.2, y: H * 0.38, w: 30, h: 130, color: '#22d3ee' },
    { x: W * 0.74, y: H * 0.26, w: 34, h: 210, color: '#a3e635' },
    { x: W * 0.87, y: H * 0.36, w: 30, h: 150, color: '#ff2e88' },
  ];
  for (const sign of signs) {
    ctx.save();
    ctx.shadowColor = sign.color;
    ctx.shadowBlur = 34;
    ctx.fillStyle = sign.color;
    ctx.fillRect(sign.x, sign.y, sign.w, sign.h);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sign.x + sign.w * 0.32, sign.y + 10, sign.w * 0.36, sign.h - 20);
    // Wet reflection on the street.
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.shadowColor = sign.color;
    ctx.shadowBlur = 22;
    ctx.fillStyle = sign.color;
    ctx.fillRect(sign.x - 6, H * 0.68, sign.w + 12, H * 0.24);
    ctx.restore();
  }
  // Centre dashes running down the street.
  ctx.fillStyle = 'rgba(255, 220, 130, 0.75)';
  for (let i = 0; i < 5; i += 1) {
    const t = i / 4;
    const y = H * 0.68 + (H - H * 0.68) * t * t;
    const w = 6 + t * 26;
    ctx.fillRect(W / 2 - w / 2, y, w, 10 + t * 22);
  }
  palmTree(ctx, W * 0.03, H * 0.98, 1.05, '#07030f');
  palmTree(ctx, W * 0.97, H * 0.98, 0.9, '#07030f');
  return canvas;
}

// Palm beach: a bright shore with a leaning palm and a calm sea.
export function paintPalmBeach() {
  const W = 1200;
  const H = 900;
  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  skyGradient(ctx, W, H, [
    [0, '#7ec8e3'],
    [0.45, '#cfeecf'],
    [0.55, '#ffd9a0'],
  ]);
  glowingSun(ctx, W * 0.8, H * 0.16, H * 0.07, '#fffbe8', '#ffe9a8');
  // Sea band with a few white wave arcs.
  const sea = ctx.createLinearGradient(0, H * 0.5, 0, H * 0.68);
  sea.addColorStop(0, '#1e7f9e');
  sea.addColorStop(1, '#0d4d6e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, H * 0.5, W, H * 0.18);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const random = seededRandom(42);
  for (let i = 0; i < 7; i += 1) {
    const y = H * (0.52 + random() * 0.13);
    const x = random() * W * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 40, y - 10, x + 90, y);
    ctx.stroke();
  }
  // Sand.
  const sand = ctx.createLinearGradient(0, H * 0.68, 0, H);
  sand.addColorStop(0, '#f2d5a0');
  sand.addColorStop(1, '#dfa866');
  ctx.fillStyle = sand;
  ctx.fillRect(0, H * 0.68, W, H * 0.32);
  ctx.fillStyle = 'rgba(120, 70, 20, 0.18)';
  for (let i = 0; i < 26; i += 1) {
    ctx.beginPath();
    ctx.arc(random() * W, H * (0.72 + random() * 0.26), 2 + random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  palmTree(ctx, W * 0.16, H * 0.99, 1.25, '#14532d');
  palmTree(ctx, W * 0.88, H * 0.99, 0.85, '#0f3d22');
  return canvas;
}

// The three demo photos, in slot order.
export const DEMO_PHOTOS = [
  { id: 'pier', label: 'Pier Sunset', paint: paintPierSunset },
  { id: 'boulevard', label: 'Neon Boulevard', paint: paintNeonBoulevard },
  { id: 'beach', label: 'Palm Beach', paint: paintPalmBeach },
];

// Paints every demo photo once and returns them keyed by id.
export function paintDemoPhotos() {
  const photos = {};
  for (const demo of DEMO_PHOTOS) photos[demo.id] = demo.paint();
  return photos;
}
