import * as THREE from 'three';

const FRAME = 1.78;

/** A transparent, monochrome flower head. Call dispose() when unmounting. */
export class ChromaCompanion {
  constructor(container, { variant = 'positive', name = 'Pigmo', onActivate } = {}) {
    if (!(container instanceof HTMLElement)) throw new TypeError('Expected an HTMLElement');
    this.container = container;
    this.variant = variant;
    this.hovered = false;
    this.focused = false;
    this.pointer = new THREE.Vector2();
    this.eyeTarget = new THREE.Vector2();
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
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;border-radius:50%;touch-action:manipulation;cursor:pointer;outline:none';
    container.append(this.canvas);
    this.head = new THREE.Group();
    this.scene.add(this.head);
    this.ink = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    this.faceInk = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.geometries = new Set();
    this.petals = [];
    // One mirror-symmetric module; six exact rotations generate the D6 silhouette.
    const petal = new THREE.Shape();
    petal.moveTo(-0.29, 0.70);
    petal.lineTo(0.29, 0.70);
    petal.lineTo(0.49, 1.04);
    petal.quadraticCurveTo(0.54, 1.15, 0.45, 1.24);
    petal.lineTo(0.09, 1.56);
    petal.quadraticCurveTo(0, 1.65, -0.09, 1.56);
    petal.lineTo(-0.45, 1.24);
    petal.quadraticCurveTo(-0.54, 1.15, -0.49, 1.04);
    petal.closePath();
    const petalGeometry = this.keep(new THREE.ShapeGeometry(petal, 32));
    for (let i = 0; i < 6; i++) {
      const mesh = new THREE.Mesh(petalGeometry, this.ink);
      mesh.rotation.z = i * Math.PI / 3;
      this.head.add(mesh);
      this.petals.push(mesh);
    }
    // A circular center connects the shorter petals into a friendly flower head.
    this.center = new THREE.Mesh(this.keep(new THREE.CircleGeometry(0.81, 96)), this.ink);
    this.center.position.z = 0.01;
    this.head.add(this.center);
    this.face = new THREE.Group();
    this.face.position.z = 0.05;
    this.head.add(this.face);
    const eyeGeometry = this.keep(new THREE.CircleGeometry(0.09, 32));
    this.eyes = [-1, 1].map(sign => {
      const eye = new THREE.Mesh(eyeGeometry, this.faceInk);
      eye.position.set(sign * 0.245, 0.12, 0);
      this.face.add(eye);
      return eye;
    });
    this.smile = new THREE.Mesh(this.smileGeometry(0.11), this.faceInk);
    this.face.add(this.smile);
    this.smileLevel = 0.11;
    this.raycaster = new THREE.Raycaster();
    this.cleanups = [];
    const listen = (target, event, fn) => {
      target.addEventListener(event, fn);
      this.cleanups.push(() => target.removeEventListener(event, fn));
    };
    listen(window, 'pointermove', e => this.track(e));
    listen(document, 'pointerleave', () => this.resetPointer());
    listen(window, 'blur', () => this.resetPointer());
    listen(this.canvas, 'pointerleave', () => { this.hovered = false; });
    listen(this.canvas, 'focus', () => { this.focused = true; });
    listen(this.canvas, 'blur', () => { this.focused = false; });
    this.activate = () => { this.bounceAt = performance.now(); onActivate?.(); };
    listen(this.canvas, 'click', this.activate);
    listen(this.canvas, 'keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.activate(); }
    });
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.setVariant(variant);
    this.resize();
    this.started = performance.now();
    this.previous = this.started;
    this.nextBlink = this.started + 3200;
    this.tick(this.started);
  }

  keep(geometry) { this.geometries.add(geometry); return geometry; }

  smileGeometry(depth) {
    const extra = (depth - 0.11) * 0.9;
    const shape = new THREE.Shape();
    shape.moveTo(-0.32, -0.10);
    shape.lineTo(0.32, -0.10);
    shape.bezierCurveTo(0.32, -0.51 - extra, -0.32, -0.51 - extra, -0.32, -0.10);
    const opening = new THREE.Path();
    opening.moveTo(-0.235, -0.18);
    opening.bezierCurveTo(-0.205, -0.405 - extra, 0.205, -0.405 - extra, 0.235, -0.18);
    opening.closePath();
    shape.holes.push(opening);
    return this.keep(new THREE.ShapeGeometry(shape, 40));
  }

  setVariant(variant) {
    if (!['positive', 'negative'].includes(variant)) throw new Error('Use positive or negative');
    this.variant = variant;
    this.ink.color.set(variant === 'positive' ? 0x000000 : 0xffffff);
    this.faceInk.color.set(variant === 'positive' ? 0xffffff : 0x000000);
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
  }

  resetPointer() { this.eyeTarget.set(0, 0); this.hovered = false; }

  track(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const dy = -(event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    this.eyeTarget.set(dx, dy).clampLength(0, 1).multiplyScalar(0.085);
    this.pointer.set(dx, dy);
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.hovered = this.raycaster.intersectObjects([...this.petals, this.center], false).length > 0;
  }

  tick(now) {
    if (this.disposed) return;
    const dt = Math.min((now - this.previous) / 1000, 0.05);
    this.previous = now;
    const blend = this.reducedMotion.matches ? 1 : 1 - Math.exp(-12 * dt);
    const active = this.hovered || this.focused;
    const reduced = this.reducedMotion.matches;
    const target = reduced ? new THREE.Vector2() : this.eyeTarget;
    this.eyes.forEach((eye, i) => {
      eye.position.x = THREE.MathUtils.lerp(eye.position.x, (i ? 1 : -1) * 0.245 + target.x, blend);
      eye.position.y = THREE.MathUtils.lerp(eye.position.y, 0.12 + target.y, blend);
    });
    let blink = 1;
    if (!reduced && now >= this.nextBlink) {
      const elapsed = now - this.nextBlink;
      if (elapsed < 180) blink = Math.max(0.08, Math.abs(elapsed - 90) / 90);
      else this.nextBlink = now + 3200 + Math.random() * 2400;
    }
    this.eyes.forEach(eye => { eye.scale.y = blink; });
    const scale = reduced ? 1 : active ? 1.045 : 1;
    const bounce = !reduced && this.bounceAt ? Math.max(0, 1 - (now - this.bounceAt) / 450) * Math.sin((now - this.bounceAt) / 450 * Math.PI) * 0.10 : 0;
    const nextScale = THREE.MathUtils.lerp(this.head.scale.x, scale + bounce, blend);
    this.head.scale.setScalar(nextScale);
    // Radial expansion keeps all six petals symmetric, even during hover.
    this.petals.forEach(petal => petal.scale.setScalar(THREE.MathUtils.lerp(petal.scale.x, !reduced && active ? 1.035 : 1, blend)));
    const level = THREE.MathUtils.lerp(this.smileLevel, active && !reduced ? 0.17 : 0.11, blend);
    if (Math.abs(level - this.smileLevel) > 0.0006) {
      const old = this.smile.geometry;
      this.smile.geometry = this.smileGeometry(level);
      this.geometries.delete(old);
      old.dispose();
      this.smileLevel = level;
    }
    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(time => this.tick(time));
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.cleanups.forEach(fn => fn());
    this.geometries.forEach(g => g.dispose());
    this.ink.dispose(); this.faceInk.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
