// Wires the editor: photo slots, layout and panel controls, caption, undo
// and redo, randomise, and PNG export. The preview canvas always shows the
// same poster drawPoster paints for export, so the maker sees the real cover.

import { drawPoster, panelAt, LAYOUTS, GRADE_NAMES } from './cover.js';
import { DEMO_PHOTOS, paintDemoPhotos } from './photos.js';
import {
  defaultState, defaultPanels, cloneState, StateHistory,
  randomiseState, EXPORT_SIZES,
} from './state.js';
import { readShotScene, markShotReady } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusLine = $('status');

let state = defaultState();
const history = new StateHistory(state);
// One image per photo slot: a demo canvas, or a photo the user loaded.
let slotImages = [];
let slotLabels = [];

function exportSize() {
  return EXPORT_SIZES.find((s) => s.id === state.exportSize) ?? EXPORT_SIZES[2];
}

function sizePreviewCanvas() {
  const size = exportSize();
  const scale = 720 / Math.max(size.width, size.height);
  preview.width = Math.round(size.width * scale);
  preview.height = Math.round(size.height * scale);
}

function redraw() {
  drawPoster(preview, state, slotImages, state.selectedPanel);
}

function syncPanelControls() {
  const layout = LAYOUTS[state.layout];
  const panelSelect = $('panelSelect');
  panelSelect.innerHTML = '';
  layout.panels.forEach((panel, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `Panel ${index + 1}`;
    panelSelect.appendChild(option);
  });
  panelSelect.value = String(state.selectedPanel);
  const panel = state.panels[state.selectedPanel] ?? {};
  $('panelPhoto').value = String(panel.photo ?? 0);
  $('panelGrade').value = panel.grade ?? 'sunset';
  $('panelZoom').value = String(panel.zoom ?? 1.12);
  $('panelFocusX').value = String(panel.focusX ?? 0.5);
  $('panelFocusY').value = String(panel.focusY ?? 0.5);
  $('zoomValue').textContent = `${Math.round((panel.zoom ?? 1.12) * 100)}%`;
}

function syncControls() {
  document.querySelectorAll('input[name="layout"]').forEach((radio) => {
    radio.checked = radio.value === state.layout;
  });
  $('caption').value = state.caption;
  $('tagline').value = state.tagline;
  document.querySelectorAll('[data-export-size]').forEach((button) => {
    button.classList.toggle('active', button.dataset.exportSize === state.exportSize);
  });
  $('undo').disabled = !history.canUndo;
  $('redo').disabled = !history.canRedo;
  syncPanelControls();
  document.querySelectorAll('[data-slot-label]').forEach((el) => {
    el.textContent = slotLabels[Number(el.dataset.slotLabel)] ?? '';
  });
}

function commit() {
  history.push(state);
  syncControls();
  redraw();
}

function setStatus(text) {
  statusLine.textContent = text;
}

// --- Photo slots -----------------------------------------------------------

function loadDemoPhotos() {
  const painted = paintDemoPhotos();
  slotImages = DEMO_PHOTOS.map((demo) => painted[demo.id]);
  slotLabels = DEMO_PHOTOS.map((demo) => `Demo · ${demo.label}`);
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read that image'));
    };
    image.src = url;
  });
}

function wirePhotoSlots() {
  document.querySelectorAll('input[data-slot-file]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      const slot = Number(input.dataset.slotFile);
      try {
        slotImages[slot] = await loadImageFile(file);
        slotLabels[slot] = file.name;
        setStatus(`Photo ${slot + 1} loaded: ${file.name}`);
        syncControls();
        redraw();
      } catch {
        setStatus('That file could not be read as a photo.');
      }
    });
  });
  document.querySelectorAll('[data-slot-demo]').forEach((button) => {
    button.addEventListener('click', () => {
      const slot = Number(button.dataset.slotDemo);
      const painted = paintDemoPhotos();
      slotImages[slot] = painted[DEMO_PHOTOS[slot].id];
      slotLabels[slot] = `Demo · ${DEMO_PHOTOS[slot].label}`;
      setStatus(`Photo ${slot + 1} back to the demo picture.`);
      syncControls();
      redraw();
    });
  });
  $('loadDemos').addEventListener('click', () => {
    loadDemoPhotos();
    setStatus('Demo photos loaded into all three slots.');
    syncControls();
    redraw();
  });
}

// --- Layout, panels, caption ----------------------------------------------

function wireLayout() {
  document.querySelectorAll('input[name="layout"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.layout = radio.value;
      state.panels = defaultPanels(state.layout);
      state.selectedPanel = 0;
      setStatus(`Layout: ${LAYOUTS[state.layout].label}`);
      commit();
    });
  });
  $('panelSelect').addEventListener('change', (event) => {
    state.selectedPanel = Number(event.target.value);
    setStatus(`Panel ${state.selectedPanel + 1} selected.`);
    syncControls();
    redraw();
  });
  preview.addEventListener('click', (event) => {
    const rect = preview.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * preview.width;
    const y = ((event.clientY - rect.top) / rect.height) * preview.height;
    const hit = panelAt(state, x, y, preview.width, preview.height);
    if (hit >= 0) {
      state.selectedPanel = hit;
      setStatus(`Panel ${hit + 1} selected.`);
      syncControls();
      redraw();
    }
  });
}

function wirePanelControls() {
  const panel = () => state.panels[state.selectedPanel];
  $('panelPhoto').addEventListener('change', (event) => {
    panel().photo = Number(event.target.value);
    commit();
  });
  $('panelGrade').addEventListener('change', (event) => {
    panel().grade = event.target.value;
    commit();
  });
  const liveZoom = (event) => {
    panel().zoom = Number(event.target.value);
    $('zoomValue').textContent = `${Math.round(panel().zoom * 100)}%`;
    redraw();
  };
  $('panelZoom').addEventListener('input', liveZoom);
  $('panelZoom').addEventListener('change', commit);
  $('panelFocusX').addEventListener('input', (event) => {
    panel().focusX = Number(event.target.value);
    redraw();
  });
  $('panelFocusX').addEventListener('change', commit);
  $('panelFocusY').addEventListener('input', (event) => {
    panel().focusY = Number(event.target.value);
    redraw();
  });
  $('panelFocusY').addEventListener('change', commit);
}

function wireCaption() {
  $('caption').addEventListener('input', (event) => {
    state.caption = event.target.value;
    redraw();
  });
  $('caption').addEventListener('change', commit);
  $('tagline').addEventListener('input', (event) => {
    state.tagline = event.target.value;
    redraw();
  });
  $('tagline').addEventListener('change', commit);
}

// --- Undo, redo, randomise, export ----------------------------------------

function wireActions() {
  $('undo').addEventListener('click', () => {
    const previous = history.undo();
    if (previous) {
      state = previous;
      setStatus('Undone.');
      syncControls();
      redraw();
    }
  });
  $('redo').addEventListener('click', () => {
    const next = history.redo();
    if (next) {
      state = next;
      setStatus('Redone.');
      syncControls();
      redraw();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
    event.preventDefault();
    if (event.shiftKey) $('redo').click();
    else $('undo').click();
  });
  $('randomise').addEventListener('click', () => {
    state = randomiseState(state);
    setStatus('Randomised — new layout, photos, grades and words.');
    commit();
  });
  document.querySelectorAll('[data-export-size]').forEach((button) => {
    button.addEventListener('click', () => {
      state.exportSize = button.dataset.exportSize;
      sizePreviewCanvas();
      setStatus(`Export size: ${exportSize().label}`);
      syncControls();
      redraw();
    });
  });
  $('export').addEventListener('click', () => {
    const size = exportSize();
    const offscreen = document.createElement('canvas');
    offscreen.width = size.width;
    offscreen.height = size.height;
    drawPoster(offscreen, state, slotImages, -1);
    offscreen.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — the browser could not make the PNG.');
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-city-cover-${size.width}x${size.height}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Saved vice-city-cover-${size.width}x${size.height}.png`);
    }, 'image/png');
  });
}

// --- Boot ------------------------------------------------------------------

function boot() {
  loadDemoPhotos();
  wirePhotoSlots();
  wireLayout();
  wirePanelControls();
  wireCaption();
  wireActions();
  sizePreviewCanvas();

  const scene = readShotScene();
  if (scene) {
    state.layout = LAYOUTS[scene.layout] ? scene.layout : 'mosaic';
    state.panels = defaultPanels(state.layout);
    state.caption = scene.caption;
    state.tagline = scene.tagline;
    state.exportSize = scene.size;
    state.selectedPanel = -1;
    if (scene.kind === 'cover') {
      document.body.classList.add('shot-cover');
      preview.width = window.innerWidth;
      preview.height = window.innerHeight;
      preview.classList.add('cover-shot');
    } else {
      sizePreviewCanvas();
    }
    syncControls();
    redraw();
    markShotReady();
    return;
  }

  syncControls();
  redraw();
  setStatus('Ready — load your photos, or start from the demo pictures.');
}

boot();
