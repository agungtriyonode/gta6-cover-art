// The editor's state: what the poster shows, plus undo/redo history and
// the randomiser. State is plain JSON, so a snapshot is one stringify away.

import { LAYOUTS } from './cover.js';

export const CAPTION_IDEAS = [
  'VICE CITY',
  'SUNSET HEIST',
  'NEON NIGHTS',
  'BOULEVARD QUEEN',
  'PALM DREAMS',
  'MIDNIGHT RUN',
  'OCEAN DRIVE',
  'VICE HEAT',
];

export const TAGLINE_IDEAS = [
  'SUNSET HEIST',
  'WELCOME TO VICE CITY',
  'NEON AFTER DARK',
  'EVERY NIGHT A GETAWAY',
  'PALMS AND PAYBACK',
  'DRIVE FAST, LIVE LOUD',
  'THE CITY NEVER SLEEPS',
  'CHASE THE SUNSET',
];

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square · 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait · 1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', label: 'Wide · 1920 × 1080', width: 1920, height: 1080 },
];

// One panel override per layout slot: which photo slot it shows, its grade,
// and how the photo is cropped inside it.
export function defaultPanels(layoutId) {
  const layout = LAYOUTS[layoutId];
  return layout.panels.map((panel) => ({
    photo: panel.photo,
    grade: panel.grade,
    zoom: 1.12,
    focusX: panel.focusX ?? 0.5,
    focusY: panel.focusY ?? 0.5,
  }));
}

export function defaultState() {
  return {
    layout: 'mosaic',
    caption: 'VICE CITY',
    tagline: 'SUNSET HEIST',
    panels: defaultPanels('mosaic'),
    selectedPanel: 0,
    exportSize: 'wide',
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

// Undo/redo over JSON snapshots of the state. Text edits push once per
// committed change (on change, not on every keystroke) so the stack stays
// short and every step is a real edit.
export class StateHistory {
  constructor(state) {
    this.past = [];
    this.future = [];
    this.current = JSON.stringify(state);
  }

  push(state) {
    const snapshot = JSON.stringify(state);
    if (snapshot === this.current) return;
    this.past.push(this.current);
    if (this.past.length > 60) this.past.shift();
    this.future = [];
    this.current = snapshot;
  }

  undo() {
    if (this.past.length === 0) return null;
    this.future.push(this.current);
    this.current = this.past.pop();
    return JSON.parse(this.current);
  }

  redo() {
    if (this.future.length === 0) return null;
    this.past.push(this.current);
    this.current = this.future.pop();
    return JSON.parse(this.current);
  }

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }
}

function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

// A fresh poster in one move: new layout, new words, new photo per panel,
// new grade and crop per panel. Built on Math.random, so no two clicks match.
export function randomiseState(state) {
  const next = cloneState(state);
  const layoutIds = Object.keys(LAYOUTS);
  next.layout = pick(Math.random, layoutIds);
  next.caption = pick(Math.random, CAPTION_IDEAS);
  next.tagline = pick(Math.random, TAGLINE_IDEAS);
  next.panels = defaultPanels(next.layout).map((panel) => ({
    photo: Math.floor(Math.random() * 3),
    grade: pick(Math.random, ['sunset', 'neon', 'noir', 'clean']),
    zoom: 1.0 + Math.random() * 0.6,
    focusX: 0.15 + Math.random() * 0.7,
    focusY: 0.15 + Math.random() * 0.7,
  }));
  next.selectedPanel = 0;
  return next;
}
