const elements = Object.fromEntries(
  ['source', 'preview', 'picture', 'outline', 'corners', 'divider', 'status', 'scene-label',
    'edit', 'compare', 'upload', 'photo-upload', 'sample', 'sample-mask', 'undo', 'reselect',
    'export', 'layouts', 'materials'].map(id => [id, document.getElementById(id)])
);
const materialButtons = [...elements.materials.querySelectorAll('[data-material]')];
const layoutButtons = [...elements.layouts.querySelectorAll('[data-layout]')];
const comparisonLabels = [...elements.picture.querySelectorAll('.compare-label')];
const samplePhoto = elements.source.getAttribute('src');
const sampleCorners = [[115, 58], [618, 99], [617, 398], [115, 421]]
  .map(([x, y]) => ({ x: x / 768, y: y / 512 }));
const textures = new Map();
const previewContext = elements.preview.getContext('2d');
const original = document.createElement('canvas');
const originalContext = original.getContext('2d', { willReadFrequently: true });
const lighting = document.createElement('canvas');
const lightContext = lighting.getContext('2d', { willReadFrequently: true });
const limit = (value, min, max) => Math.max(min, Math.min(max, value));
const cross = (a, b, c) => (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);

let state;
let pictureVersion = 0;
let cornerDrag = null;
let renderJob = 0;
let draggedMaterial = null;

function readPixels(image, width = image.naturalWidth, height = image.naturalHeight) {
  const buffer = document.createElement('canvas');
  buffer.width = width;
  buffer.height = height;
  const context = buffer.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

function makeSeamlessTexture(source) {
  const overlap = Math.round(Math.min(source.width, source.height) * 0.15);
  const width = source.width - overlap;
  const height = source.height - overlap;
  const output = new ImageData(width, height);
  const smooth = t => t * t * (3 - 2 * t);
  for (let y = 0; y < height; y++) {
    const blendY = smooth(Math.min(1, y / overlap));
    const top = y * source.width * 4;
    const otherRow = y < overlap ? top + height * source.width * 4 : top;
    for (let x = 0; x < width; x++) {
      const offset = x * 4;
      const otherOffset = x < overlap ? offset + width * 4 : offset;
      const blendX = smooth(Math.min(1, x / overlap));
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const topColor = source.data[top + offset + channel] * blendX
          + source.data[top + otherOffset + channel] * (1 - blendX);
        const bottomColor = source.data[otherRow + offset + channel] * blendX
          + source.data[otherRow + otherOffset + channel] * (1 - blendX);
        output.data[index + channel] = bottomColor + (topColor - bottomColor) * blendY;
      }
      output.data[index + 3] = 255;
    }
  }
  return output;
}

function validQuad(points) {
  if (points.length !== 4) return false;
  const turns = points.map((point, i) => cross(point, points[(i + 1) % 4], points[(i + 2) % 4]));
  return turns.every(turn => turn > 0.0003) || turns.every(turn => turn < -0.0003);
}

// Keep consecutive corners in top-left, top-right, bottom-right, bottom-left order.
function orderQuad(points) {
  const left = points.reduce((best, point, i) => point.x + point.y < points[best].x + points[best].y ? i : best, 0);
  const ordered = points.slice(left).concat(points.slice(0, left));
  return cross(...ordered.slice(0, 3)) > 0 ? ordered : [ordered[0], ordered[3], ordered[2], ordered[1]];
}

function inverseProjection([topLeft, topRight, bottomRight, bottomLeft]) {
  // Map the unit square onto the four selected corners, then invert that homography.
  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const sX = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const sY = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (sX * dy2 - dx2 * sY) / determinant;
  const h = (dx1 * sY - sX * dy1) / determinant;
  const a = topRight.x * (1 + g) - topLeft.x;
  const b = bottomLeft.x * (1 + h) - topLeft.x;
  const c = topLeft.x;
  const d = topRight.y * (1 + g) - topLeft.y;
  const e = bottomLeft.y * (1 + h) - topLeft.y;
  const f = topLeft.y;
  // The common determinant cancels in homogeneous coordinates.
  return [
    e - f * h, c * h - b, b * f - c * e,
    f * g - d, a - c * g, c * d - a * f,
    d * h - e * g, b * g - a * h, a * e - b * d
  ];
}

function renderMaterial() {
  const material = textures.get(state.material);
  if (!material || !validQuad(state.points)) return;
  const isExtended = state.layout === 'extend';
  const texture = isExtended ? (material.seamless ??= makeSeamlessTexture(material.source)) : material.source;
  const { width, height } = original;
  const points = state.points.map(p => ({ x: p.x * width, y: p.y * height }));
  const [a, b, c, d, e, f, g, h, j] = inverseProjection(points);
  const x0 = Math.floor(Math.min(...points.map(point => point.x)));
  const y0 = Math.floor(Math.min(...points.map(point => point.y)));
  const x1 = Math.min(width, Math.ceil(Math.max(...points.map(point => point.x))));
  const y1 = Math.min(height, Math.ceil(Math.max(...points.map(point => point.y))));
  const paint = originalContext.getImageData(x0, y0, x1 - x0, y1 - y0);
  const tw = texture.width;
  const th = texture.height;
  const length = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  const planeWidth = (length(points[0], points[1]) + length(points[3], points[2])) / 2;
  const planeHeight = (length(points[0], points[3]) + length(points[1], points[2])) / 2;
  const ratio = planeWidth / planeHeight;
  const isTiled = state.layout === 'tile';
  // Scale both axes uniformly relative to the photo so a larger region shows
  // more texture rather than magnifying the same portion of the material.
  const texturePixelsPerPhotoPixel = Math.min(tw, th) / (Math.min(width, height) * 0.38);
  const repeatsX = isExtended ? planeWidth * texturePixelsPerPhotoPixel / tw
    : isTiled ? limit(Math.round(ratio * 2), 1, 6) : 1;
  const repeatsY = isExtended ? planeHeight * texturePixelsPerPhotoPixel / th : isTiled ? 2 : 1;
  const originU = isExtended ? (1 - repeatsX) / 2 : 0;
  const originV = isExtended ? (1 - repeatsY) / 2 : 0;
  const cellRatio = ratio * repeatsY / repeatsX;
  const cropWidth = Math.min(tw, th * cellRatio);
  const cropHeight = Math.min(th, tw / cellRatio);
  const textureLeft = (tw - cropWidth) / 2;
  const textureTop = (th - cropHeight) / 2;
  const rawTexture = texture.data;
  const occlusion = state.mask?.data;
  const light = state.lighting.data;

  for (let y = y0; y < y1; y++) {
    const rowU = b * (y + 0.5) + c;
    const rowV = e * (y + 0.5) + f;
    const rowW = h * (y + 0.5) + j;
    for (let x = x0; x < x1; x++) {
      const w = g * (x + 0.5) + rowW;
      const u = (a * (x + 0.5) + rowU) / w;
      const v = (d * (x + 0.5) + rowV) / w;
      if (!(u >= 0 && u < 1 && v >= 0 && v < 1)) continue;

      const originalIndex = (y * width + x) * 4;
      const opacity = occlusion ? 1 - occlusion[originalIndex] / 255 : 1;
      if (opacity <= 0) continue;

      const textureU = originU + u * repeatsX;
      const textureV = originV + v * repeatsY;
      const tileX = Math.floor(textureU);
      const tileY = Math.floor(textureV);
      const localX = textureU - tileX;
      const localY = textureV - tileY;
      const grout = isTiled && ((tileX > 0 && localX < 0.011) || (tileY > 0 && localY < 0.011));
      const sampleX = isTiled && tileX % 2 ? 1 - localX : localX;
      const sampleY = isTiled && tileY % 2 ? 1 - localY : localY;
      const tx = Math.min(tw - 1, Math.floor(textureLeft + sampleX * cropWidth));
      const ty = Math.min(th - 1, Math.floor(textureTop + sampleY * cropHeight));
      const index = (ty * tw + tx) * 4;
      const shade = limit(1 + (light[originalIndex] * 0.21 + light[originalIndex + 1] * 0.72
        + light[originalIndex + 2] * 0.07 - 185) / 370, 0.68, 1.13);
      const paintIndex = ((y - y0) * paint.width + x - x0) * 4;
      for (let channel = 0; channel < 3; channel++) {
        const color = (grout ? 117 : rawTexture[index + channel]) * shade;
        const dest = paintIndex + channel;
        paint.data[dest] += (color - paint.data[dest]) * opacity;
      }
      paint.data[paintIndex + 3] = 255;
    }
  }

  previewContext.drawImage(original, 0, 0);
  previewContext.putImageData(paint, x0, y0);
}

function scheduleRender() {
  cancelAnimationFrame(renderJob);
  renderJob = requestAnimationFrame(renderMaterial);
}

function setSplit(position) {
  state.split = limit(position, 0, 1);
  const percent = Math.round(state.split * 100);
  elements.picture.style.setProperty('--split', `${state.split * 100}%`);
  elements.divider.setAttribute('aria-valuenow', percent);
  elements.divider.setAttribute('aria-valuetext', `${percent}% 原图`);
}

function drawRegion() {
  const shouldDraw = state.editing || draggedMaterial;
  const points = state.points;
  const bounds = elements.picture.getBoundingClientRect();
  const pairs = shouldDraw ? points.map(p => `${p.x * bounds.width},${p.y * bounds.height}`) : [];
  if (points.length === 4 && shouldDraw) pairs.push(pairs[0]);
  elements.outline.setAttribute('points', pairs.join(' '));

  elements.corners.querySelectorAll('button').forEach(button => {
    const point = points[Number(button.dataset.index)];
    button.style.left = `${point.x * 100}%`;
    button.style.top = `${point.y * 100}%`;
  });
}

function rebuildPins() {
  const pins = state.editing ? state.points.map((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'corner';
    button.dataset.index = index;
    button.textContent = index + 1;
    button.setAttribute('aria-label', `角点 ${index + 1}，可用方向键移动`);
    return button;
  }) : [];
  elements.corners.replaceChildren(...pins);
}

function update(message) {
  const hasQuad = validQuad(state.points);
  const hasFinish = hasQuad && Boolean(state.material);
  const showComparison = hasFinish && state.comparing && !state.editing;
  elements.preview.hidden = !hasFinish;
  elements.picture.classList.toggle('editing', state.editing);
  elements.picture.classList.toggle('comparing', showComparison);
  elements.edit.setAttribute('aria-pressed', String(state.editing));
  elements.compare.setAttribute('aria-pressed', String(showComparison));
  elements.edit.disabled = false;
  elements.compare.disabled = !hasFinish || state.editing;
  elements.export.disabled = !hasFinish || state.editing;
  elements.divider.hidden = !showComparison;
  comparisonLabels.forEach(label => { label.hidden = !showComparison; });
  materialButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.material === state.material)));
  layoutButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layout === state.layout)));
  elements.undo.hidden = !state.editing || state.points.length === 0;
  elements.reselect.hidden = !state.editing || state.points.length === 0;
  elements.sample.hidden = state.sample;
  rebuildPins();
  drawRegion();

  if (message) {
    elements.status.textContent = message;
  } else if (state.editing && hasQuad) {
    elements.status.textContent = '可拖动四个角微调，完成后选一款石材。';
  } else if (state.editing) {
    elements.status.textContent = `已选 ${state.points.length}/4 个角。沿墙面或地面边缘依次点选四角，避开遮挡物。`;
  } else if (hasFinish) {
    const material = materialButtons.find(button => button.dataset.material === state.material);
    const name = material.querySelector('.material-name').textContent;
    const layout = layoutButtons.find(button => button.dataset.layout === state.layout).textContent;
    elements.status.textContent = showComparison ? '拖动中线，比较原图和试铺效果。' : `已应用 ${name} · ${layout}`;
  } else {
    elements.status.textContent = hasQuad ? '拖入或点选一款石材，即可试铺。' : '点击「选区域」，为照片圈定一个平面。';
  }
  if (hasFinish) scheduleRender();
}

function imagePoint(event) {
  const bounds = elements.picture.getBoundingClientRect();
  return {
    x: limit((event.clientX - bounds.left) / bounds.width, 0, 1),
    y: limit((event.clientY - bounds.top) / bounds.height, 0, 1)
  };
}

function addCorner(event) {
  if (!state.editing || state.points.length >= 4 || event.target.closest('.corner')) return;
  const point = imagePoint(event);
  const next = [...state.points, point];
  if (state.points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 0.018)) {
    update('这个点离已有角点太近，请沿边缘继续选点。');
    return;
  }
  if (next.length === 4 && !validQuad(next)) {
    update('四角需沿同一方向围成一个平面。可以撤销后重新选点。');
    return;
  }
  state.points = next.length === 4 ? orderQuad(next) : next;
  if (next.length === 4) {
    setSplit(next.reduce((total, corner) => total + corner.x, 0) / 4);
  }
  update();
}

function moveCorner(index, point) {
  const next = [...state.points];
  next[index] = point;
  if (next.length === 4 && !validQuad(next)) return;
  state.points = next;
  drawRegion();
  if (state.material) scheduleRender();
}

function applyMaterial(id) {
  if (!state || !textures.has(id)) return;
  if (!validQuad(state.points)) {
    state.editing = true;
    update('先沿边缘依次点选四个角，再选石材。');
    elements.picture.scrollIntoView({ block: 'nearest' });
    return;
  }
  state.material = id;
  state.editing = false;
  update();
  elements.picture.scrollIntoView({ block: 'nearest' });
}

function pointInRegion(point) {
  if (!state || !validQuad(state.points)) return false;
  const points = state.points;
  const signs = points.map((p, i) => cross(p, points[(i + 1) % 4], point));
  return signs.every(sign => sign >= 0) || signs.every(sign => sign <= 0);
}

function clearDrag() {
  draggedMaterial = null;
  elements.picture.classList.remove('drop-ready');
  if (state) drawRegion();
}

async function openPhoto(url, label, isSample) {
  const version = ++pictureVersion;
  const image = new Image();
  image.src = url;
  await image.decode();
  if (version !== pictureVersion) return;
  const limitSize = Math.min(1, 1800 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * limitSize));
  const height = Math.max(1, Math.round(image.naturalHeight * limitSize));
  original.width = elements.preview.width = width;
  original.height = elements.preview.height = height;
  originalContext.drawImage(image, 0, 0, width, height);

  lighting.width = width;
  lighting.height = height;
  const reduced = document.createElement('canvas');
  reduced.width = Math.max(1, Math.round(width * 0.025));
  reduced.height = Math.max(1, Math.round(height * 0.025));
  reduced.getContext('2d').drawImage(original, 0, 0, reduced.width, reduced.height);
  lightContext.drawImage(reduced, 0, 0, width, height);
  const maskImage = elements['sample-mask'];

  state = {
    sample: isSample,
    editing: !isSample,
    comparing: true,
    layout: 'extend',
    points: isSample ? [...sampleCorners] : [],
    material: isSample ? 'fyn' : null,
    mask: isSample ? readPixels(maskImage, width, height) : null,
    lighting: lightContext.getImageData(0, 0, width, height)
  };
  elements.source.src = url;
  elements.source.alt = label;
  elements['scene-label'].textContent = label;
  elements.picture.style.setProperty('--photo-ratio', width / height);
  setSplit(0.48);
  update();
}

function openSample() {
  return openPhoto(samplePhoto, '样板客厅', true);
}

function showPhotoError() {
  elements.status.textContent = '无法读取这张照片。请换用 JPG、PNG 或 WebP 图片。';
}

elements.upload.addEventListener('click', () => elements['photo-upload'].click());
elements['photo-upload'].addEventListener('change', async ({ target }) => {
  const photo = target.files[0];
  target.value = '';
  if (!photo) return;
  const previousUrl = elements.source.src;
  const url = URL.createObjectURL(photo);
  try {
    await openPhoto(url, '我的空间', false);
    if (elements.source.src === url && previousUrl.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
  } catch {
    showPhotoError();
  } finally {
    if (elements.source.src !== url) URL.revokeObjectURL(url);
  }
});

elements.sample.addEventListener('click', async () => {
  const previousUrl = elements.source.src;
  try {
    await openSample();
    if (previousUrl.startsWith('blob:') && elements.source.src !== previousUrl) URL.revokeObjectURL(previousUrl);
  } catch {
    showPhotoError();
  }
});

elements.edit.addEventListener('click', () => {
  state.editing = !state.editing;
  update();
});
elements.compare.addEventListener('click', () => {
  state.comparing = !state.comparing;
  update();
});
elements.undo.addEventListener('click', () => {
  state.points = state.points.slice(0, -1);
  update();
});
elements.reselect.addEventListener('click', () => {
  state.points = [];
  update();
});

elements.picture.addEventListener('click', addCorner);
elements.corners.addEventListener('pointerdown', event => {
  const pin = event.target.closest('.corner');
  if (!pin) return;
  event.preventDefault();
  pin.setPointerCapture(event.pointerId);
  cornerDrag = Number(pin.dataset.index);
});
elements.corners.addEventListener('pointermove', event => {
  if (cornerDrag !== null) moveCorner(cornerDrag, imagePoint(event));
});
elements.corners.addEventListener('lostpointercapture', () => { cornerDrag = null; });
const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
elements.corners.addEventListener('keydown', event => {
  const delta = arrows[event.key];
  if (!delta || !event.target.matches('.corner')) return;
  event.preventDefault();
  const index = Number(event.target.dataset.index);
  const point = state.points[index];
  const step = event.shiftKey ? 0.02 : 0.004;
  moveCorner(index, {
    x: limit(point.x + delta[0] * step, 0, 1),
    y: limit(point.y + delta[1] * step, 0, 1)
  });
});

elements.divider.addEventListener('pointerdown', event => {
  event.preventDefault();
  elements.divider.setPointerCapture(event.pointerId);
  setSplit(imagePoint(event).x);
});
elements.divider.addEventListener('pointermove', event => {
  if (elements.divider.hasPointerCapture(event.pointerId)) setSplit(imagePoint(event).x);
});
elements.divider.addEventListener('keydown', event => {
  const positions = { ArrowLeft: state.split - 0.025, ArrowRight: state.split + 0.025, Home: 0, End: 1 };
  if (!Object.hasOwn(positions, event.key)) return;
  event.preventDefault();
  setSplit(positions[event.key]);
});

materialButtons.forEach(button => {
  const id = button.dataset.material;
  button.addEventListener('click', () => applyMaterial(id));
  button.addEventListener('dragstart', event => {
    if (!state || !validQuad(state.points)) {
      event.preventDefault();
      if (state) applyMaterial(id);
      return;
    }
    draggedMaterial = id;
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'copy';
    drawRegion();
  });
  button.addEventListener('dragend', clearDrag);
});
elements.picture.addEventListener('dragover', event => {
  const isTarget = draggedMaterial && pointInRegion(imagePoint(event));
  elements.picture.classList.toggle('drop-ready', Boolean(isTarget));
  if (!isTarget) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});
elements.picture.addEventListener('dragleave', () => elements.picture.classList.remove('drop-ready'));
elements.picture.addEventListener('drop', event => {
  if (!draggedMaterial || !pointInRegion(imagePoint(event))) return;
  event.preventDefault();
  const id = draggedMaterial;
  clearDrag();
  applyMaterial(id);
});

layoutButtons.forEach(button => button.addEventListener('click', () => {
  if (!state) return;
  state.layout = button.dataset.layout;
  update();
}));

elements.export.addEventListener('click', () => {
  cancelAnimationFrame(renderJob);
  renderMaterial();
  elements.preview.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '方圆石光-空间试铺.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
});

new ResizeObserver(() => {
  if (state) drawRegion();
}).observe(elements.picture);

async function start() {
  await Promise.all([
    elements['sample-mask'].decode(),
    ...materialButtons.map(async button => {
      const image = button.querySelector('img');
      await image.decode();
      textures.set(button.dataset.material, { source: readPixels(image) });
    })
  ]);
  await openSample();
  elements.upload.disabled = false;
}

start().catch(() => {
  elements.status.textContent = '演示素材加载失败，请刷新页面后重试。';
});
