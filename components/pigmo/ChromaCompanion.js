import * as THREE from 'three';
import markUrl from './pigmo-mark-light.png';

const FIT = 0.92;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const loadImage = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Pigmo mark failed to load'));
  image.src = url;
});

const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Split the flower artwork into a petal field, a smile, and two eyes. */
const segmentMark = (image) => {
  const source = document.createElement('canvas');
  source.width = image.width;
  source.height = image.height;
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const { data, width, height } = sourceContext.getImageData(0, 0, image.width, image.height);
  const bg = data[0];
  const lumaAt = (x, y) => {
    const index = (y * width + x) * 4;
    return (data[index] + data[index + 1] + data[index + 2]) / 3;
  };

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (lumaAt(x, y) < bg - 12) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const L = new Float32Array(cw * ch);
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) L[y * cw + x] = lumaAt(x + minX, y + minY);
  }

  const exterior = new Uint8Array(cw * ch);
  const queue = [];
  const visitExterior = (x, y) => {
    if (x < 0 || y < 0 || x >= cw || y >= ch) return;
    const index = y * cw + x;
    if (exterior[index] || L[index] < bg - 18) return;
    exterior[index] = 1;
    queue.push(x, y);
  };
  for (let x = 0; x < cw; x += 1) {
    visitExterior(x, 0);
    visitExterior(x, ch - 1);
  }
  for (let y = 0; y < ch; y += 1) {
    visitExterior(0, y);
    visitExterior(cw - 1, y);
  }
  for (let index = 0; index < queue.length; index += 2) {
    const x = queue[index];
    const y = queue[index + 1];
    neighbors.forEach(([dx, dy]) => visitExterior(x + dx, y + dy));
  }

  const seen = new Uint8Array(cw * ch);
  const components = [];
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const start = y * cw + x;
      if (exterior[start] || seen[start] || L[start] < 190) continue;
      const cells = [];
      const stack = [x, y];
      seen[start] = 1;
      let sumX = 0;
      let sumY = 0;
      let x0 = x;
      let y0 = y;
      let x1 = x;
      let y1 = y;
      for (let index = 0; index < stack.length; index += 2) {
        const cx = stack[index];
        const cy = stack[index + 1];
        cells.push(cx, cy);
        sumX += cx;
        sumY += cy;
        if (cx < x0) x0 = cx;
        if (cy < y0) y0 = cy;
        if (cx > x1) x1 = cx;
        if (cy > y1) y1 = cy;
        neighbors.forEach(([dx, dy]) => {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) return;
          const next = ny * cw + nx;
          if (exterior[next] || seen[next] || L[next] < 190) return;
          seen[next] = 1;
          stack.push(nx, ny);
        });
      }
      const count = cells.length / 2;
      if (count >= 8) {
        components.push({ cells, count, cx: sumX / count, cy: sumY / count, x0, y0, x1, y1 });
      }
    }
  }
  components.sort((a, b) => b.count - a.count);
  const smile = components[0];
  const eyes = components.slice(1, 3).sort((a, b) => a.cx - b.cx);
  if (!smile || eyes.length < 2) throw new Error('Pigmo mark is missing its face');

  const face = new Uint8Array(cw * ch);
  const paintComponent = (component, kind) => {
    const mark = new Uint8Array(cw * ch);
    for (let index = 0; index < component.cells.length; index += 2) {
      mark[component.cells[index + 1] * cw + component.cells[index]] = 1;
    }
    for (let index = 0; index < component.cells.length; index += 2) {
      const x = component.cells[index];
      const y = component.cells[index + 1];
      neighbors.forEach(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) return;
        const next = ny * cw + nx;
        if (exterior[next] || mark[next] || L[next] <= 70) return;
        mark[next] = 1;
      });
    }
    for (let index = 0; index < mark.length; index += 1) {
      if (mark[index]) face[index] = kind;
    }
  };
  eyes.forEach((eye, index) => paintComponent(eye, index + 2));
  paintComponent(smile, 1);

  const eyeBoxes = eyes.map((eye) => ({
    x0: Math.max(0, eye.x0 - 2),
    y0: Math.max(0, eye.y0 - 2),
    x1: Math.min(cw - 1, eye.x1 + 2),
    y1: Math.min(ch - 1, eye.y1 + 2),
  }));

  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const index = y * cw + x;
      if (exterior[index]) continue;
      if ((bg - L[index]) / bg <= 0.08 && !face[index]) continue;
      sumX += x + 0.5;
      sumY += y + 0.5;
      count += 1;
    }
  }
  const cx = sumX / count;
  const cy = sumY / count;
  let maxR = 1;
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const index = y * cw + x;
      if (exterior[index]) continue;
      if ((bg - L[index]) / bg <= 0.08 && !face[index]) continue;
      maxR = Math.max(maxR, Math.hypot(x + 0.5 - cx, y + 0.5 - cy));
    }
  }

  return { L, exterior, face, cw, ch, bg, cx, cy, maxR, eyeBoxes };
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

const paintCanvas = (width, height, draw) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const image = context.createImageData(width, height);
  draw(image.data);
  context.putImageData(image, 0, 0);
  return canvas;
};

const paintBody = (mark, body, faceColor) => paintCanvas(mark.cw, mark.ch, (out) => {
  const { L, exterior, face, cw, ch, bg, eyeBoxes } = mark;
  for (let y = 0; y < ch; y += 1) {
    for (let x = 0; x < cw; x += 1) {
      const index = y * cw + x;
      const offset = index * 4;
      if (exterior[index]) continue;
      const covered = eyeBoxes.some((box) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1);
      if (covered) {
        out[offset] = body[0];
        out[offset + 1] = body[1];
        out[offset + 2] = body[2];
        out[offset + 3] = 255;
        continue;
      }
      if (!face[index]) {
        out[offset] = body[0];
        out[offset + 1] = body[1];
        out[offset + 2] = body[2];
        out[offset + 3] = Math.round(clamp01((bg - L[index]) / bg) * 255);
        continue;
      }
      const weight = clamp01((L[index] - 60) / (bg - 60));
      out[offset] = Math.round(faceColor[0] * weight + body[0] * (1 - weight));
      out[offset + 1] = Math.round(faceColor[1] * weight + body[1] * (1 - weight));
      out[offset + 2] = Math.round(faceColor[2] * weight + body[2] * (1 - weight));
      out[offset + 3] = 255;
    }
  }
});

const paintEye = (mark, eyeIndex, faceColor) => {
  const box = mark.eyeBoxes[eyeIndex];
  const width = box.x1 - box.x0 + 1;
  const height = box.y1 - box.y0 + 1;
  return paintCanvas(width, height, (out) => {
    for (let y = box.y0; y <= box.y1; y += 1) {
      for (let x = box.x0; x <= box.x1; x += 1) {
        if (mark.face[y * mark.cw + x] !== eyeIndex + 2) continue;
        const weight = clamp01((mark.L[y * mark.cw + x] - 60) / (mark.bg - 60));
        const offset = ((y - box.y0) * width + (x - box.x0)) * 4;
        out[offset] = faceColor[0];
        out[offset + 1] = faceColor[1];
        out[offset + 2] = faceColor[2];
        out[offset + 3] = Math.round(weight * 255);
      }
    }
  });
};

/** The flower mark. Only the eyes blink. Call dispose() when unmounting. */
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
    this.ready = loadImage(markUrl).then((image) => {
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

  keepTexture(texture) {
    this.textures.push(texture);
    return texture;
  }

  build(mark) {
    const scale = FIT / mark.maxR;
    const pack = (body, face) => ({
      body: this.keepTexture(canvasTexture(paintBody(mark, body, face))),
      eyes: [0, 1].map((index) => this.keepTexture(canvasTexture(paintEye(mark, index, face)))),
    });
    this.packs = {
      positive: pack([0, 0, 0], [255, 255, 255]),
      negative: pack([255, 255, 255], [0, 0, 0]),
    };

    const bodyMaterial = this.keepMaterial(new THREE.MeshBasicMaterial({
      map: this.packs.positive.body,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    }));
    const body = new THREE.Mesh(this.keepGeometry(new THREE.PlaneGeometry(mark.cw * scale, mark.ch * scale)), bodyMaterial);
    body.position.set((mark.cw / 2 - mark.cx) * scale, -((mark.ch / 2 - mark.cy) * scale), 0);
    this.scene.add(body);
    this.body = body;

    this.eyes = mark.eyeBoxes.map((box, index) => {
      const width = box.x1 - box.x0 + 1;
      const height = box.y1 - box.y0 + 1;
      const material = this.keepMaterial(new THREE.MeshBasicMaterial({
        map: this.packs.positive.eyes[index],
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
    const pack = this.packs[variant];
    this.body.material.map = pack.body;
    this.body.material.needsUpdate = true;
    this.eyes.forEach((eye, index) => {
      eye.material.map = pack.eyes[index];
      eye.material.needsUpdate = true;
    });
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
