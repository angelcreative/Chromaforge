import * as THREE from 'three';

const FRAME = 1.16;

/** Valley-to-tip radii of one petal, every 3°, traced from the Pigmo mark. */
const PETAL = [0.508, 0.574, 0.799, 0.829, 0.845, 0.870, 0.895, 0.921, 0.960, 1, 1];

const EYE_X = 0.155;
const EYE_Y = 0.122;
const EYE_R = 0.055;

const petalRadius = (angle) => {
  const turn = Math.PI * 2;
  let a = angle % turn;
  if (a < 0) a += turn;
  const sector = Math.PI / 3;
  const local = a % sector;
  const fromValley = Math.min(local, sector - local);
  const t = Math.min(fromValley / (Math.PI / 60), PETAL.length - 1);
  const i = Math.floor(t);
  const f = t - i;
  return PETAL[i] * (1 - f) + PETAL[Math.min(i + 1, PETAL.length - 1)] * f;
};

const flowerGeometry = () => {
  const shape = new THREE.Shape();
  const steps = 192;
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const radius = petalRadius(angle);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return new THREE.ShapeGeometry(shape);
};

/** Thick smile traced from the mark. Outer path is counter-clockwise, the hole clockwise. */
const smileGeometry = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-0.194, -0.068);
  shape.lineTo(0.194, -0.068);
  shape.bezierCurveTo(0.194, -0.11, 0.186, -0.15, 0.163, -0.175);
  shape.bezierCurveTo(0.132, -0.21, 0.08, -0.252, 0, -0.252);
  shape.bezierCurveTo(-0.08, -0.252, -0.132, -0.21, -0.163, -0.175);
  shape.bezierCurveTo(-0.186, -0.15, -0.194, -0.11, -0.194, -0.068);
  const hole = new THREE.Path();
  hole.moveTo(0.158, -0.112);
  hole.lineTo(-0.158, -0.112);
  hole.bezierCurveTo(-0.158, -0.15, -0.12, -0.19, -0.07, -0.21);
  hole.bezierCurveTo(-0.03, -0.222, 0.03, -0.222, 0.07, -0.21);
  hole.bezierCurveTo(0.12, -0.19, 0.158, -0.15, 0.158, -0.112);
  shape.holes.push(hole);
  return new THREE.ShapeGeometry(shape, 16);
};

/** A transparent flower mark. Only the eyes blink. Call dispose() when unmounting. */
export class ChromaCompanion {
  constructor(container, { variant = 'positive', name = 'Pigmo', onActivate } = {}) {
    if (!(container instanceof HTMLElement)) throw new TypeError('Expected an HTMLElement');
    this.container = container;
    this.variant = variant;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-FRAME, FRAME, FRAME, -FRAME, 0.1, 20);
    this.camera.position.z = 5;
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('role', 'button');
    this.canvas.setAttribute('aria-label', name);
    this.canvas.tabIndex = 0;
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;border-radius:50%;touch-action:manipulation;cursor:pointer;outline:none;background:transparent';
    container.append(this.canvas);

    this.ink = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    this.faceInk = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.geometries = [];

    const keep = (geometry) => {
      this.geometries.push(geometry);
      return geometry;
    };

    const flower = new THREE.Mesh(keep(flowerGeometry()), this.ink);
    this.scene.add(flower);

    const face = new THREE.Group();
    face.position.z = 0.02;
    this.scene.add(face);
    const eyeGeometry = keep(new THREE.CircleGeometry(EYE_R, 32));
    this.eyes = [-1, 1].map((sign) => {
      const eye = new THREE.Mesh(eyeGeometry, this.faceInk);
      eye.position.set(sign * EYE_X, EYE_Y, 0);
      face.add(eye);
      return eye;
    });
    face.add(new THREE.Mesh(keep(smileGeometry()), this.faceInk));

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
    this.onMotion = () => this.syncMotion();
    listen(this.reducedMotion, 'change', this.onMotion);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.setVariant(variant);
    this.resize();
    this.syncMotion();
  }

  setVariant(variant) {
    if (!['positive', 'negative'].includes(variant)) throw new Error('Use positive or negative');
    this.variant = variant;
    this.ink.color.set(variant === 'positive' ? 0x000000 : 0xffffff);
    this.faceInk.color.set(variant === 'positive' ? 0xffffff : 0x000000);
    this.render();
  }

  resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    this.camera.left = -FRAME * Math.max(1, aspect);
    this.camera.right = FRAME * Math.max(1, aspect);
    this.camera.top = FRAME * Math.max(1, 1 / aspect);
    this.camera.bottom = -FRAME * Math.max(1, 1 / aspect);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.render();
  }

  syncMotion() {
    cancelAnimationFrame(this.frame);
    this.eyes.forEach((eye) => { eye.scale.y = 1; });
    if (this.reducedMotion.matches) {
      this.render();
      return;
    }
    const now = performance.now();
    this.previous = now;
    this.nextBlink = now + 1400 + Math.random() * 2600;
    this.frame = requestAnimationFrame((time) => this.tick(time));
  }

  tick(now) {
    if (this.disposed) return;
    this.previous = now;
    let blink = 1;
    if (now >= this.nextBlink) {
      const elapsed = now - this.nextBlink;
      const duration = 150;
      if (elapsed < duration) {
        const close = Math.sin((elapsed / duration) * Math.PI);
        blink = 1 - close * 0.92;
      } else {
        this.nextBlink = now + 1800 + Math.random() * 4200;
      }
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
    this.ink.dispose();
    this.faceInk.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
