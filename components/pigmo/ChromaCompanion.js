import * as THREE from 'three';
import markUrl from './pigmo-mark-dark.png';

const FIT = 0.66;
const INK = 16;

const loadImage = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Pigmo mark failed to load'));
  image.src = url;
});

const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** The robot is black ink in the alpha. Split off the two eyes so they can blink. */
const segmentMark = (image) => {
  const source = document.createElement('canvas');
  source.width = image.width;
  source.height = image.height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const { data, width, height } = sourceContext.getImageData(0, 0, image.width, image.height);
  const alphaAt = (x, y) => data[(y * width + x) * 4 + 3];
  const labels = new Int16Array(width * height);
  const components = [];
  let nextId = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (labels[start] || alphaAt(x, y) <= INK) continue;
      nextId += 1;
      const stack = [x, y];
      labels[start] = nextId;
      let count = 0;
      let sumX = 0;
      let sumY = 0;
      let x0 = x;
      let y0 = y;
      let x1 = x;
      let y1 = y;
      for (let index = 0; index < stack.length; index += 2) {
        const cx = stack[index];
        const cy = stack[index + 1];
        count += 1;
        sumX += cx;
        sumY += cy;
        if (cx < x0) x0 = cx;
        if (cy < y0) y0 = cy;
        if (cx > x1) x1 = cx;
        if (cy > y1) y1 = cy;
        neighbors.forEach(([dx, dy]) => {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
          const next = ny * width + nx;
          if (labels[next] || alphaAt(nx, ny) <= INK) return;
          labels[next] = nextId;
          stack.push(nx, ny);
        });
      }
      components.push({ id: nextId, count, cx: sumX / count, cy: sumY / count, x0, y0, x1, y1 });
    }
  }

  const eyes = components
    .filter((component) => (
      component.count > 80
      && component.count < 900
      && component.cx > width * 0.25
      && component.cx < width * 0.75
      && component.cy > height * 0.45
      && component.cy < height * 0.68
    ))
    .sort((a, b) => a.cx - b.cx);
  if (eyes.length !== 2) throw new Error('Pigmo mark is missing its eyes');

  const eyeIds = new Set(eyes.map((eye) => eye.id));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (labels[index] || alphaAt(x, y) === 0) continue;
      const nearEye = eyes.find((eye) => (
        x >= eye.x0 - 1 && x <= eye.x1 + 1 && y >= eye.y0 - 1 && y <= eye.y1 + 1
        && neighbors.some(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          return nx >= 0 && ny >= 0 && nx < width && ny < height && eyeIds.has(labels[ny * width + nx]);
        })
      ));
      if (nearEye) labels[index] = nearEye.id;
    }
  }

  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alphaAt(x, y) <= INK) continue;
      sumX += x + 0.5;
      sumY += y + 0.5;
      count += 1;
    }
  }
  const cx = sumX / count;
  const cy = sumY / count;
  let maxR = 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alphaAt(x, y) <= INK) continue;
      maxR = Math.max(maxR, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
    }
  }

  const eyeBoxes = eyes.map((eye) => ({
    id: eye.id,
    x0: Math.max(0, eye.x0 - 1),
    y0: Math.max(0, eye.y0 - 1),
    x1: Math.min(width - 1, eye.x1 + 1),
    y1: Math.min(height - 1, eye.y1 + 1),
  }));

  return { data, labels, width, height, cx, cy, maxR, eyeBoxes };
};

const canvasTexture = (canvas) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.premultiplyAlpha = false;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
};

const paintMask = (mark, include) => {
  const { data, width, height } = mark;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const image = context.createImageData(width, height);
  const out = image.data;
  for (let index = 0; index < width * height; index += 1) {
    if (!include(index)) continue;
    const offset = index * 4;
    out[offset] = 255;
    out[offset + 1] = 255;
    out[offset + 2] = 255;
    out[offset + 3] = data[offset + 3];
  }
  context.putImageData(image, 0, 0);
  return canvas;
};

/** The robot mark. Only the eyes blink. Call dispose() when unmounting. */
export class ChromaCompanion {
  constructor(container, { variant = 'positive', name = 'Pigmo', onActivate } = {}) {
    if (!(container instanceof HTMLElement)) throw new TypeError('Expected an HTMLElement');
    this.container = container;
    this.variant = variant;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('role', 'button');
    this.canvas.setAttribute('aria-label', name);
    this.canvas.tabIndex = 0;
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;border-radius:50%;touch-action:manipulation;cursor:pointer;outline:none;background:transparent';
    container.append(this.canvas);

    this.geometries = [];
    this.materials = [];
    this.textures = [];
    this.eyes = [];
    this.cleanups = [];
    const listen = (target, event, fn) => {
      target.addEventListener(event, fn);
      this.cleanups.push(() => target.removeEventListener(event, fn));
    };
    this.activate = () => onActivate?.();
    listen(this.canvas, 'click', this.activate);
    listen(this.canvas, 'keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.activate();
      }
    });
    listen(this.reducedMotion, 'change', () => this.syncMotion());
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    loadImage(markUrl).then((image) => {
      if (this.disposed) return;
      this.build(segmentMark(image));
      this.setVariant(this.variant);
      this.syncMotion();
    });
  }

  keepGeometry(geometry) {
    this.geometries.push(geometry);
    return geometry;
  }

  keepMaterial(material) {
    this.materials.push(material);
    return material;
  }

  build(mark) {
    const scale = FIT / mark.maxR;
    const eyeIds = new Set(mark.eyeBoxes.map((eye) => eye.id));
    const bodyTexture = canvasTexture(paintMask(mark, (index) => mark.data[index * 4 + 3] > 0 && !eyeIds.has(mark.labels[index])));
    this.textures.push(bodyTexture);
    const bodyMaterial = this.keepMaterial(new THREE.MeshBasicMaterial({
      map: bodyTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }));
    const body = new THREE.Mesh(
      this.keepGeometry(new THREE.PlaneGeometry(mark.width * scale, mark.height * scale)),
      bodyMaterial,
    );
    body.position.set((mark.width / 2 - mark.cx) * scale, -((mark.height / 2 - mark.cy) * scale), 0);
    this.scene.add(body);
    this.body = body;

    this.eyes = mark.eyeBoxes.map((box) => {
      const width = box.x1 - box.x0 + 1;
      const height = box.y1 - box.y0 + 1;
      const texture = canvasTexture(paintMask(
        { ...mark, width, height, data: cropAlpha(mark, box) },
        (index) => {
          const x = box.x0 + (index % width);
          const y = box.y0 + Math.floor(index / width);
          return mark.labels[y * mark.width + x] === box.id;
        },
      ));
      this.textures.push(texture);
      const material = this.keepMaterial(new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }));
      const eye = new THREE.Mesh(this.keepGeometry(new THREE.PlaneGeometry(width * scale, height * scale)), material);
      eye.position.set(((box.x0 + box.x1) / 2 - mark.cx) * scale, -(((box.y0 + box.y1) / 2 - mark.cy) * scale), 0.02);
      this.scene.add(eye);
      return eye;
    });
    this.markReady = true;
  }

  setVariant(variant) {
    if (!['positive', 'negative'].includes(variant)) throw new Error('Use positive or negative');
    this.variant = variant;
    if (!this.markReady) return;
    const color = variant === 'positive' ? 0x000000 : 0xffffff;
    this.body.material.color.set(color);
    this.eyes.forEach((eye) => eye.material.color.set(color));
    this.render();
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    this.camera.left = -Math.max(1, aspect);
    this.camera.right = Math.max(1, aspect);
    this.camera.top = Math.max(1, 1 / aspect);
    this.camera.bottom = -Math.max(1, 1 / aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.render();
  }

  syncMotion() {
    cancelAnimationFrame(this.frame);
    this.eyes.forEach((eye) => { eye.scale.y = 1; });
    if (!this.markReady || this.reducedMotion.matches) {
      this.render();
      return;
    }
    const now = performance.now();
    this.nextBlink = now + 900 + Math.random() * 2200;
    this.frame = requestAnimationFrame((time) => this.tick(time));
  }

  tick(now) {
    if (this.disposed) return;
    let blink = 1;
    if (now >= this.nextBlink) {
      const elapsed = now - this.nextBlink;
      const duration = 160;
      if (elapsed < duration) blink = 1 - Math.sin((elapsed / duration) * Math.PI) * 0.92;
      else this.nextBlink = now + 1600 + Math.random() * 4400;
    }
    this.eyes.forEach((eye) => { eye.scale.y = blink; });
    this.render();
    this.frame = requestAnimationFrame((time) => this.tick(time));
  }

  render() {
    if (this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.cleanups.forEach((fn) => fn());
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.renderer.dispose();
    this.canvas.remove();
  }
}

const cropAlpha = (mark, box) => {
  const width = box.x1 - box.x0 + 1;
  const height = box.y1 - box.y0 + 1;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const source = ((box.y0 + y) * mark.width + (box.x0 + x)) * 4;
      const offset = (y * width + x) * 4;
      data[offset + 3] = mark.data[source + 3];
    }
  }
  return data;
};
