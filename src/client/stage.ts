// The 3D stage: a little diorama of bark, moss, stone and water, lit and shadowed, with the game played
// on a flat plane through the middle of it. Nothing in here decides anything; it only shows the physics.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tileAt } from '../shared/leap/sim.ts';
import { BOARD_H, BOARD_W } from '../shared/leap/types.ts';
import type { Frog, Happening, Level, Point, Tile } from '../shared/leap/types.ts';
import { FrogRig } from './frog.ts';

/** How thick the scenery is, front to back, in tiles. The frog moves through the middle of it. */
const DEPTH = 1.3;
const FROG_Z = 0.16;
const FIELD_OF_VIEW = 24;

const SKY = [0xf6f3b4, 0xd3f0b6, 0x96dcb9, 0x3fae9d] as const;
const HAZE = 0xbfe9c6;
const BARK = [0x7a4a2a, 0x6d4024, 0x85532f, 0x643a20] as const;
const MOSS = [0x7edb52, 0x62c943, 0x98e566] as const;
const STONE = [0x9fc6d8, 0x8db7cc, 0xaed0df] as const;

/** A steady pseudo-random number, so scenery never flickers between frames or reloads. */
function grain(a: number, b: number): number {
  let n = Math.imul(a + 1, 374761393) ^ Math.imul(b + 7, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function pick<T>(list: readonly T[], roll: number, fallback: T): T {
  return list[Math.floor(roll * list.length)] ?? fallback;
}

type Spark = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  age: number;
  size: number;
  r: number;
  g: number;
  b: number;
  gravity: number;
  drag: number;
};

const MOST_SPARKS = 420;
const MOST_DOTS = 44;

export class Stage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW, 1, 1, 200);
  private readonly sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
  private readonly rig = new FrogRig();
  private world = new THREE.Group();
  private level: Level | null = null;
  private width = 1;
  private height = 1;
  private topInset = 0;
  private bottomInset = 0;
  private clock = 0;
  private reducedMotion = false;

  // Shared shapes and paints, made once.
  private readonly blockShape = new RoundedBoxGeometry(1, 1, DEPTH, 3, 0.1);
  private readonly mossShape = new RoundedBoxGeometry(1.05, 0.26, DEPTH + 0.08, 3, 0.11);
  private readonly stoneShape = new RoundedBoxGeometry(1, 1, DEPTH, 4, 0.2);
  private readonly barkPaint = new THREE.MeshStandardMaterial({ roughness: 0.92 });
  private readonly mossPaint = new THREE.MeshStandardMaterial({ roughness: 0.85 });
  private readonly stonePaint = new THREE.MeshStandardMaterial({ roughness: 0.12, metalness: 0.05 });
  private readonly thornShape: THREE.BufferGeometry;
  private readonly thornPaint = new THREE.MeshStandardMaterial({ color: 0x8a2452, roughness: 0.55, flatShading: true });

  // Per-level things that move.
  private barkMesh: THREE.InstancedMesh | null = null;
  private mossMesh: THREE.InstancedMesh | null = null;
  private readonly barkAt = new Map<number, number>();
  private readonly mossAt = new Map<number, number>();
  private readonly nudges: { cell: number; nx: number; ny: number; age: number }[] = [];
  private readonly mushrooms = new Map<number, { cap: THREE.Group; age: number }>();
  private readonly webs = new Map<number, { net: THREE.Group; age: number }>();
  private flower: { head: THREE.Group; glow: THREE.Sprite; light: THREE.PointLight } | null = null;
  private water: THREE.Mesh | null = null;
  private waterTop = -100;
  private readonly ripples: { ring: THREE.Mesh; age: number }[] = [];
  private bloom = 0;
  private won = false;

  // Aim line.
  private readonly dots: THREE.InstancedMesh;
  private readonly landing: THREE.Mesh;

  // Particles.
  private readonly sparks: Spark[] = [];
  private readonly sparkShape = new THREE.BufferGeometry();
  private readonly sparkPaint: THREE.ShaderMaterial;
  private trailIn = 0;

  // Scenery behind the board.
  private readonly swaying: { thing: THREE.Object3D; base: number; reach: number; speed: number; phase: number }[] = [];
  private readonly rays: THREE.Mesh[] = [];
  private readonly pollen: THREE.Points;

  // Camera.
  private readonly eye = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private distance = 50;
  private shake = 0;
  private zoom = 0;
  private driftX = 0;
  private driftY = 0;
  private closeUp = false;
  private readonly nowLook = new THREE.Vector3();
  private nowDistance = 0;

  constructor(canvas: HTMLCanvasElement, reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.scene.fog = new THREE.Fog(HAZE, 52, 96);

    this.scene.add(new THREE.HemisphereLight(0xfff6d8, 0x3f8f72, 1.25));
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -10;
    this.sun.shadow.camera.right = 10;
    this.sun.shadow.camera.top = 13;
    this.sun.shadow.camera.bottom = -13;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 70;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    const fill = new THREE.DirectionalLight(0x9fe8ff, 0.5);
    fill.position.set(14, 4, 10);
    this.scene.add(fill);

    // Thorns: a knot of bramble bristling with spikes.
    const core = new THREE.IcosahedronGeometry(0.36, 0);
    const spikes: THREE.BufferGeometry[] = [core];
    for (let i = 0; i < 16; i++) {
      // Points spread evenly over a ball.
      const up = 1 - (2 * (i + 0.5)) / 16;
      const round = Math.sqrt(1 - up * up);
      const turn = i * 2.39996;
      const out = new THREE.Vector3(Math.cos(turn) * round, up, Math.sin(turn) * round);
      const spike = new THREE.ConeGeometry(0.085, 0.34, 5);
      spike.translate(0, 0.17, 0);
      spike.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), out));
      spike.translate(out.x * 0.3, out.y * 0.3, out.z * 0.3);
      spikes.push(spike);
    }
    this.thornShape = mergeGeometries(spikes.map((shape) => shape.toNonIndexed())) ?? core;

    // The aim line: a string of beads and a ring where it lands.
    this.dots = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x14352a, fog: false }),
      MOST_DOTS
    );
    this.dots.count = 0;
    this.dots.frustumCulled = false;
    this.landing = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.05, 8, 28),
      new THREE.MeshBasicMaterial({ color: 0x14352a, fog: false })
    );
    this.landing.visible = false;
    this.scene.add(this.dots, this.landing);

    // Particles: one draw call of soft round points.
    this.sparkShape.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOST_SPARKS * 3), 3));
    this.sparkShape.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(MOST_SPARKS * 3), 3));
    this.sparkShape.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(MOST_SPARKS), 1));
    this.sparkShape.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(MOST_SPARKS), 1));
    this.sparkShape.setDrawRange(0, 0);
    this.sparkPaint = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 600 } },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        attribute float aAlpha;
        uniform float uScale;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 seen = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uScale / -seen.z;
          gl_Position = projectionMatrix * seen;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float far = length(gl_PointCoord - 0.5);
          if (far > 0.5) discard;
          gl_FragColor = vec4(vColor, smoothstep(0.5, 0.3, far) * vAlpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const sparkCloud = new THREE.Points(this.sparkShape, this.sparkPaint);
    sparkCloud.frustumCulled = false;
    this.scene.add(sparkCloud);

    this.pollen = this.growBackdrop();
    this.scene.add(this.rig.root, this.world);
  }

  // ---------- Scenery that is always there ----------

  private growBackdrop(): THREE.Points {
    // Sky: a tall gradient far behind everything.
    const paper = document.createElement('canvas');
    paper.width = 4;
    paper.height = 256;
    const ink = paper.getContext('2d');
    if (ink) {
      const wash = ink.createLinearGradient(0, 0, 0, 256);
      SKY.forEach((colour, index) => wash.addColorStop(index / (SKY.length - 1), `#${colour.toString(16).padStart(6, '0')}`));
      ink.fillStyle = wash;
      ink.fillRect(0, 0, 4, 256);
    }
    const skyPaint = new THREE.CanvasTexture(paper);
    skyPaint.colorSpace = THREE.SRGBColorSpace;
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 150),
      new THREE.MeshBasicMaterial({ map: skyPaint, fog: false, depthWrite: false })
    );
    sky.position.set(BOARD_W / 2, BOARD_H / 2, -60);
    this.scene.add(sky);

    // A soft sun behind the leaves, and slanting rays of light.
    const glowPaper = document.createElement('canvas');
    glowPaper.width = 128;
    glowPaper.height = 128;
    const glowInk = glowPaper.getContext('2d');
    if (glowInk) {
      const halo = glowInk.createRadialGradient(64, 64, 0, 64, 64, 64);
      halo.addColorStop(0, 'rgba(255,255,255,1)');
      halo.addColorStop(0.35, 'rgba(255,255,255,0.45)');
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      glowInk.fillStyle = halo;
      glowInk.fillRect(0, 0, 128, 128);
    }
    this.haloPaint = new THREE.CanvasTexture(glowPaper);
    const sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.haloPaint, color: 0xfff2b0, opacity: 0.7, transparent: true, blending: THREE.AdditiveBlending, fog: false, depthWrite: false })
    );
    sunGlow.position.set(-3, BOARD_H + 6, -50);
    sunGlow.scale.setScalar(34);
    this.scene.add(sunGlow);
    for (let i = 0; i < 4; i++) {
      const ray = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6 + grain(i, 1) * 2.4, 46),
        new THREE.MeshBasicMaterial({
          color: 0xfffbd6,
          transparent: true,
          opacity: 0.1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      );
      ray.position.set(-3 + i * 3.8 + grain(i, 2) * 2, BOARD_H / 2 + 2, -5 - i * 1.5);
      ray.rotation.z = -0.42;
      this.rays.push(ray);
      this.scene.add(ray);
    }

    // Three layers of trunks and leaves, each hazier than the one in front.
    const leaf = new THREE.Shape();
    leaf.moveTo(0, 0);
    leaf.bezierCurveTo(0.62, 0.3, 0.62, 1.15, 0, 1.7);
    leaf.bezierCurveTo(-0.62, 1.15, -0.62, 0.3, 0, 0);
    const leafShape = new THREE.ShapeGeometry(leaf, 10);
    const layers = [
      { z: -30, colour: 0xa9dfb6, count: 22, size: 9 },
      { z: -17, colour: 0x74c79b, count: 20, size: 6.5 },
      { z: -7, colour: 0x3f9f80, count: 16, size: 4.2 },
    ];
    layers.forEach((layer, index) => {
      const paint = new THREE.MeshBasicMaterial({ color: layer.colour, side: THREE.DoubleSide });
      for (let i = 0; i < 5; i++) {
        const trunk = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + grain(i, 30 + index) * 2.2, 90), paint);
        trunk.position.set(-22 + i * 11 + grain(i, 40 + index) * 6, 8, layer.z - 0.5);
        this.scene.add(trunk);
      }
      for (let i = 0; i < layer.count; i++) {
        const frond = new THREE.Mesh(leafShape, paint);
        // Mostly round the edges and the top, so the middle of the board stays calm.
        const edge = grain(i, 50 + index) < 0.5 ? -1 : 1;
        const spread = 16 + Math.abs(layer.z) * 0.9;
        frond.position.set(
          BOARD_W / 2 + edge * (3.4 + grain(i, 60 + index) * spread),
          -4 + grain(i, 70 + index) * 34,
          layer.z + grain(i, 80 + index)
        );
        frond.rotation.z = (grain(i, 90 + index) - 0.5) * 3.4 - edge * 0.9;
        frond.scale.setScalar(layer.size * (0.6 + grain(i, 100 + index) * 0.8));
        this.scene.add(frond);
        this.swaying.push({ thing: frond, base: frond.rotation.z, reach: 0.05, speed: 0.5 + grain(i, 110) * 0.6, phase: i });
      }
    });

    // Vines hanging just behind the board.
    const vinePaint = new THREE.MeshBasicMaterial({ color: 0x2f8a68 });
    for (let i = 0; i < 6; i++) {
      const vine = new THREE.Group();
      const length = 7 + grain(i, 200) * 12;
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, length, 5), vinePaint);
      cord.position.y = -length / 2;
      vine.add(cord);
      for (let j = 0; j < Math.floor(length / 1.4); j++) {
        const frond = new THREE.Mesh(leafShape, vinePaint);
        frond.position.set(0, -1 - j * 1.4, 0);
        frond.rotation.z = (j % 2 === 0 ? 1 : -1) * (1.9 + grain(i * 9 + j, 201) * 0.5);
        frond.scale.setScalar(0.42 + grain(i * 9 + j, 202) * 0.3);
        vine.add(frond);
      }
      vine.position.set(-3 + i * 2.8 + grain(i, 203) * 1.6, BOARD_H + 8, -2.6 - grain(i, 204) * 2.4);
      this.scene.add(vine);
      this.swaying.push({ thing: vine, base: 0, reach: 0.035, speed: 0.7 + grain(i, 205) * 0.5, phase: i * 1.7 });
    }

    // Bamboo at the sides: the edges of the board, and too smooth to hold.
    const cane = new THREE.MeshStandardMaterial({ color: 0xd3ea86, roughness: 0.3 });
    const joint = new THREE.MeshStandardMaterial({ color: 0x9cc257, roughness: 0.4 });
    for (const x of [-0.34, BOARD_W + 0.34]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 46, 14), cane);
      pole.position.set(x, 10, 0);
      pole.castShadow = true;
      pole.receiveShadow = true;
      this.scene.add(pole);
      for (let y = -8; y < 32; y += 2.1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.04, 6, 16), joint);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, y + grain(Math.round(y * 10), x > 0 ? 1 : 2) * 0.5, 0);
        this.scene.add(ring);
      }
    }

    // Motes drifting in the light.
    const count = 70;
    const places = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      places[i * 3] = -4 + grain(i, 300) * 18;
      places[i * 3 + 1] = -2 + grain(i, 301) * 24;
      places[i * 3 + 2] = -6 + grain(i, 302) * 8;
    }
    const motes = new THREE.BufferGeometry();
    motes.setAttribute('position', new THREE.BufferAttribute(places, 3));
    const pollen = new THREE.Points(
      motes,
      new THREE.PointsMaterial({
        color: 0xfffbd0,
        size: 0.13,
        map: this.haloPaint,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      })
    );
    pollen.frustumCulled = false;
    this.scene.add(pollen);
    return pollen;
  }

  private haloPaint: THREE.Texture = new THREE.Texture();

  // ---------- Building a level ----------

  load(level: Level): void {
    this.scene.remove(this.world);
    this.world.traverse((thing) => {
      if (thing instanceof THREE.InstancedMesh) thing.dispose();
    });
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.level = level;
    this.barkAt.clear();
    this.mossAt.clear();
    this.nudges.length = 0;
    this.mushrooms.clear();
    this.webs.clear();
    this.ripples.length = 0;
    this.flower = null;
    this.water = null;
    this.waterTop = -100;
    this.bloom = 0;
    this.won = false;
    this.zoom = 0;
    this.sparks.length = 0;
    this.aimAt(null, null);

    const h = level.h;
    const cellsOf = (kind: Tile) => {
      const found: number[] = [];
      level.tiles.forEach((tile, cell) => {
        if (tile === kind) found.push(cell);
      });
      return found;
    };
    const place = new THREE.Matrix4();
    const tint = new THREE.Color();

    // Bark, with moss on every top that is open to the sky.
    const bark = cellsOf('#');
    if (bark.length > 0) {
      const mossy = bark.filter((cell) => {
        const above = tileAt(level, cell % level.w, Math.floor(cell / level.w) - 1);
        return above !== '#' && above !== 'o' && above !== 'M' && above !== '^';
      });
      this.barkMesh = new THREE.InstancedMesh(this.blockShape, this.barkPaint, bark.length);
      this.mossMesh = new THREE.InstancedMesh(this.mossShape, this.mossPaint, Math.max(1, mossy.length));
      this.mossMesh.count = mossy.length;
      bark.forEach((cell, index) => {
        this.barkAt.set(cell, index);
        this.barkMesh?.setMatrixAt(index, place.makeTranslation((cell % level.w) + 0.5, h - Math.floor(cell / level.w) - 0.5, 0));
        this.barkMesh?.setColorAt(index, tint.setHex(pick(BARK, grain(cell, 1), BARK[0])));
      });
      mossy.forEach((cell, index) => {
        this.mossAt.set(cell, index);
        this.mossMesh?.setMatrixAt(index, place.makeTranslation((cell % level.w) + 0.5, h - Math.floor(cell / level.w) - 0.07, 0));
        this.mossMesh?.setColorAt(index, tint.setHex(pick(MOSS, grain(cell, 2), MOSS[0])));
      });
      for (const mesh of [this.barkMesh, this.mossMesh]) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.world.add(mesh);
      }
      this.sprout(mossy, level);
    } else {
      this.barkMesh = null;
      this.mossMesh = null;
    }

    const stone = cellsOf('o');
    if (stone.length > 0) {
      const mesh = new THREE.InstancedMesh(this.stoneShape, this.stonePaint, stone.length);
      stone.forEach((cell, index) => {
        mesh.setMatrixAt(index, place.makeTranslation((cell % level.w) + 0.5, h - Math.floor(cell / level.w) - 0.5, 0));
        mesh.setColorAt(index, tint.setHex(pick(STONE, grain(cell, 3), STONE[0])));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.world.add(mesh);
    }

    const thorns = cellsOf('^');
    if (thorns.length > 0) {
      const mesh = new THREE.InstancedMesh(this.thornShape, this.thornPaint, thorns.length * 2);
      const spin = new THREE.Quaternion();
      const size = new THREE.Vector3();
      thorns.forEach((cell, index) => {
        // Two knots a tile, one nearer and one further, so a row of thorns reads as a hedge.
        for (let layer = 0; layer < 2; layer++) {
          spin.setFromEuler(new THREE.Euler(grain(cell, 4 + layer) * 6, grain(cell, 6 + layer) * 6, grain(cell, 8 + layer) * 6));
          size.setScalar(1.18 + grain(cell, 10 + layer) * 0.14);
          place.compose(
            new THREE.Vector3((cell % level.w) + 0.5, h - Math.floor(cell / level.w) - 0.5, layer === 0 ? 0.3 : -0.34),
            spin,
            size
          );
          mesh.setMatrixAt(index * 2 + layer, place);
        }
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.world.add(mesh);
    }

    for (const cell of cellsOf('M')) this.plantMushroom(level, cell);
    for (const cell of cellsOf('W')) this.spinWeb(level, cell);
    this.plantFlower(level);

    const pond = cellsOf('~');
    if (pond.length > 0) {
      const top = Math.min(...pond.map((cell) => Math.floor(cell / level.w)));
      this.waterTop = h - top - 0.18;
      this.water = new THREE.Mesh(
        new THREE.BoxGeometry(60, 12, 9),
        new THREE.MeshStandardMaterial({ color: 0x27b0b4, transparent: true, opacity: 0.78, roughness: 0.08 })
      );
      this.water.position.set(level.w / 2, this.waterTop - 6, -3.7);
      this.water.receiveShadow = true;
      this.world.add(this.water);
      const pad = new THREE.MeshStandardMaterial({ color: 0x4fbf5a, roughness: 0.7 });
      for (let i = 0; i < 7; i++) {
        const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 14, 1, false, 0.5, 5.6), pad);
        leaf.position.set(-2 + grain(i, 400) * 14, this.waterTop + 0.02, -1.6 - grain(i, 401) * 4.5);
        leaf.scale.setScalar(0.6 + grain(i, 402) * 0.8);
        leaf.rotation.y = grain(i, 403) * 6;
        this.world.add(leaf);
      }
    }

    this.frame();
  }

  /** Grass, ferns and the odd small flower on the moss. */
  private sprout(mossy: number[], level: Level): void {
    const blade = new THREE.ConeGeometry(0.05, 0.3, 4);
    blade.translate(0, 0.15, 0);
    const paint = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const tufts = new THREE.InstancedMesh(blade, paint, mossy.length * 5);
    const place = new THREE.Matrix4();
    const tint = new THREE.Color();
    const spin = new THREE.Quaternion();
    let count = 0;
    for (const cell of mossy) {
      const blades = 2 + Math.floor(grain(cell, 20) * 4);
      for (let i = 0; i < blades; i++) {
        // Keep clear of the middle strip, where the frog lands.
        const front = grain(cell, 30 + i) < 0.5;
        const z = front ? 0.38 + grain(cell, 40 + i) * 0.22 : -0.3 - grain(cell, 40 + i) * 0.3;
        spin.setFromEuler(new THREE.Euler((grain(cell, 50 + i) - 0.5) * 0.5, 0, (grain(cell, 60 + i) - 0.5) * 0.7));
        place.compose(
          new THREE.Vector3((cell % level.w) + 0.12 + grain(cell, 70 + i) * 0.76, level.h - Math.floor(cell / level.w) + 0.04, z),
          spin,
          new THREE.Vector3(1, 0.6 + grain(cell, 80 + i) * 1.1, 1)
        );
        tufts.setMatrixAt(count, place);
        tufts.setColorAt(count, tint.setHex(pick(MOSS, grain(cell, 90 + i), MOSS[0])).offsetHSL(0, 0, 0.06));
        count += 1;
      }
    }
    tufts.count = count;
    tufts.castShadow = true;
    this.world.add(tufts);
  }

  private plantMushroom(level: Level, cell: number): void {
    const x = cell % level.w;
    const y = Math.floor(cell / level.w);
    const whole = new THREE.Group();
    whole.position.set(x + 0.5, level.h - y - 0.5, 0);
    // Grow out of whatever solid thing it touches: the ground, or a wall beside it.
    const holds = (tile: Tile) => tile === '#' || tile === 'o';
    if (!holds(tileAt(level, x, y + 1))) {
      if (holds(tileAt(level, x + 1, y))) whole.rotation.z = Math.PI / 2;
      else if (holds(tileAt(level, x - 1, y))) whole.rotation.z = -Math.PI / 2;
      else if (holds(tileAt(level, x, y - 1))) whole.rotation.z = Math.PI;
    }
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.27, 0.62, 14),
      new THREE.MeshStandardMaterial({ color: 0xffeccc, roughness: 0.7 })
    );
    stem.position.y = -0.2;
    stem.castShadow = true;
    whole.add(stem);
    const cap = new THREE.Group();
    cap.position.y = 0.06;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xff5637, roughness: 0.35 })
    );
    dome.scale.set(1, 0.82, 1.05);
    dome.castShadow = true;
    cap.add(dome);
    const under = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.5, 0.07, 24),
      new THREE.MeshStandardMaterial({ color: 0xffd9b0, roughness: 0.8 })
    );
    under.scale.z = 1.05;
    under.position.y = -0.03;
    cap.add(under);
    const dot = new THREE.MeshStandardMaterial({ color: 0xfff6e6, roughness: 0.5 });
    const spots = [
      { x: 0, y: 0.44, z: 0.05, size: 0.13 },
      { x: -0.3, y: 0.3, z: 0.3, size: 0.09 },
      { x: 0.32, y: 0.28, z: 0.26, size: 0.1 },
      { x: 0.05, y: 0.25, z: 0.5, size: 0.08 },
      { x: -0.42, y: 0.18, z: -0.05, size: 0.08 },
      { x: 0.44, y: 0.14, z: -0.1, size: 0.07 },
    ];
    for (const at of spots) {
      const spot = new THREE.Mesh(new THREE.SphereGeometry(at.size, 10, 8), dot);
      spot.position.set(at.x, at.y, at.z);
      spot.scale.y = 0.45;
      cap.add(spot);
    }
    whole.add(cap);
    this.world.add(whole);
    this.mushrooms.set(cell, { cap: whole, age: 9 });
  }

  private spinWeb(level: Level, cell: number): void {
    const net = new THREE.Group();
    net.position.set((cell % level.w) + 0.5, level.h - Math.floor(cell / level.w) - 0.5, 0);
    const silk = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false });
    for (const radius of [0.16, 0.31, 0.46]) net.add(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.013, 5, 8), silk));
    for (let i = 0; i < 8; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.02, 4), silk);
      spoke.rotation.z = (i * Math.PI) / 8 + Math.PI / 16;
      net.add(spoke);
    }
    // Threads running off to somewhere out of sight, so it hangs from something.
    for (const [dx, dy] of [
      [-1, 1],
      [1, 1],
      [-1, -0.6],
      [1, -0.6],
    ]) {
      const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 5, 3), silk);
      thread.position.set((dx ?? 0) * 1.9, (dy ?? 0) * 1.9, -1.4);
      thread.rotation.z = Math.atan2(-(dx ?? 0), dy ?? 1);
      thread.rotation.x = 0.55 * (dy ?? 1);
      net.add(thread);
    }
    this.world.add(net);
    this.webs.set(cell, { net, age: 9 });
  }

  private plantFlower(level: Level): void {
    const whole = new THREE.Group();
    whole.position.set(level.flower.x, level.h - level.flower.y, 0);
    const green = new THREE.MeshStandardMaterial({ color: 0x3fae55, roughness: 0.6 });
    const under = tileAt(level, Math.floor(level.flower.x), Math.floor(level.flower.y) + 1);
    const hangs = under !== '#' && under !== 'o';
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, hangs ? 30 : 0.6, 8), green);
    stem.position.y = hangs ? 15 : -0.3;
    whole.add(stem);
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), green);
      leaf.scale.set(1, 0.22, 0.5);
      leaf.position.set(side * 0.18, hangs ? 0.45 : -0.4, 0.05);
      leaf.rotation.z = side * (hangs ? -0.5 : 0.5);
      whole.add(leaf);
    }
    const head = new THREE.Group();
    head.position.z = 0.12;
    const petal = new THREE.MeshStandardMaterial({ color: 0xff4f9a, roughness: 0.4, emissive: 0xff2d7e, emissiveIntensity: 0.35 });
    const inner = new THREE.MeshStandardMaterial({ color: 0xff9cc6, roughness: 0.4, emissive: 0xff5fa2, emissiveIntensity: 0.3 });
    for (let ring = 0; ring < 2; ring++) {
      const count = ring === 0 ? 7 : 5;
      for (let i = 0; i < count; i++) {
        const leafy = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), ring === 0 ? petal : inner);
        const turn = (i / count) * Math.PI * 2 + ring * 0.4;
        const reach = ring === 0 ? 0.27 : 0.16;
        leafy.scale.set(ring === 0 ? 0.13 : 0.1, ring === 0 ? 0.23 : 0.16, 0.05);
        leafy.position.set(Math.sin(turn) * reach, Math.cos(turn) * reach, ring * 0.05);
        leafy.rotation.z = -turn;
        leafy.castShadow = true;
        head.add(leafy);
      }
    }
    const heart = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 14, 10),
      new THREE.MeshStandardMaterial({ color: 0xffd640, roughness: 0.4, emissive: 0xffb300, emissiveIntensity: 0.6 })
    );
    heart.position.z = 0.1;
    head.add(heart);
    whole.add(head);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.haloPaint, color: 0xff7ab8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    glow.scale.setScalar(2.6);
    glow.position.z = -0.2;
    whole.add(glow);
    const light = new THREE.PointLight(0xff6aa8, 6, 5, 1.6);
    light.position.z = 1;
    whole.add(light);
    this.world.add(whole);
    this.flower = { head, glow, light };
  }

  // ---------- Size and camera ----------

  resize(width: number, height: number, topInset: number, bottomInset: number): void {
    this.width = width;
    this.height = height;
    this.topInset = topInset;
    this.bottomInset = bottomInset;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.sparkPaint.uniforms['uScale'] = {
      value: (height * this.renderer.getPixelRatio()) / (2 * Math.tan((FIELD_OF_VIEW * Math.PI) / 360)),
    };
    this.frame();
  }

  /** Pulls the camera back until the whole board fits between the bars at the top and bottom. */
  private frame(): void {
    const level = this.level;
    if (!level) return;
    const half = Math.tan((FIELD_OF_VIEW * Math.PI) / 360);
    const clear = Math.max(80, this.height - this.topInset - this.bottomInset);
    // The board plus a little air, in tiles, against the room there is for it, in pixels.
    const byHeight = ((level.h + 1.1) / clear) * this.height;
    const byWidth = ((level.w + 1.5) / this.width) * this.height;
    this.distance = Math.max(byHeight, byWidth) / (2 * half);
    const tilesPerPixel = (2 * half * this.distance) / this.height;
    this.look.set(level.w / 2, level.h / 2 + ((this.topInset - this.bottomInset) / 2) * tilesPerPixel, 0);
    this.sun.position.set(this.look.x - 9, this.look.y + 17, 15);
    this.sun.target.position.copy(this.look);
  }

  /** Behind the level map the camera sits close to the frog; in play it shows the whole board. */
  showCloseUp(on: boolean): void {
    this.closeUp = on;
  }

  /** How many pixels a tile takes on screen, for turning a drag into a hop. */
  pixelsPerTile(): number {
    return this.height / (2 * Math.tan((FIELD_OF_VIEW * Math.PI) / 360) * this.distance * 1.03);
  }

  /** Where a spot on the board is on screen, in pixels from the canvas's top-left corner. */
  screenOf(x: number, y: number): Point {
    const level = this.level;
    const spot = new THREE.Vector3(x, (level?.h ?? 0) - y, FROG_Z).project(this.camera);
    return { x: ((spot.x + 1) / 2) * this.width, y: ((1 - spot.y) / 2) * this.height };
  }

  // ---------- Things the game tells the stage ----------

  /** The dotted arc while aiming. `pull` is the hop being aimed (world units, y up) and its strength, 0–1. */
  aimAt(points: Point[] | null, lands: Point | null, pull: { x: number; y: number; power: number } | null = null): void {
    this.rig.aim = pull;
    const level = this.level;
    if (!points || !level) {
      this.dots.count = 0;
      this.landing.visible = false;
      return;
    }
    const place = new THREE.Matrix4();
    const count = Math.min(MOST_DOTS, points.length);
    for (let i = 0; i < count; i++) {
      const point = points[i];
      if (!point) continue;
      const size = 0.11 * (1 - (i / count) * 0.5);
      place.makeScale(size, size, size).setPosition(point.x, level.h - point.y, FROG_Z);
      this.dots.setMatrixAt(i, place);
    }
    this.dots.count = count;
    this.dots.instanceMatrix.needsUpdate = true;
    this.landing.visible = lands !== null;
    if (lands) this.landing.position.set(lands.x, level.h - lands.y, FROG_Z);
  }

  /** Something happened in the physics: answer it with particles, a nudge of the scenery, a shake. */
  react(event: Happening): void {
    const level = this.level;
    if (!level) return;
    const x = event.x;
    const y = level.h - event.y;
    const nx = event.nx;
    const ny = -event.ny;
    const hard = Math.min(1, event.speed / 20);
    switch (event.type) {
      case 'stick':
        this.rig.land(event.speed);
        if (event.cell >= 0) this.nudges.push({ cell: event.cell, nx, ny, age: 0 });
        this.spray(10 + Math.round(hard * 10), x - nx * 0.3, y - ny * 0.3, nx, ny, 2.2 + hard * 3.2, [0x9be86a, 0x6fcf48, 0xe9ffd2], 0.13, 0.55, 9);
        this.spray(5, x - nx * 0.3, y - ny * 0.3, nx, ny, 1.2, [0xffffff, 0xfff4cf], 0.2, 0.5, 1);
        this.shake = Math.max(this.shake, 0.05 + hard * 0.12);
        break;
      case 'settle':
        this.rig.land(4);
        break;
      case 'bounce':
        this.spray(6, x - nx * 0.3, y - ny * 0.3, nx, ny, 2 + hard * 2, [0xd6f3ff, 0xffffff], 0.1, 0.4, 12);
        break;
      case 'boing': {
        const mushroom = this.mushrooms.get(event.cell);
        if (mushroom) mushroom.age = 0;
        this.spray(16, x - nx * 0.25, y - ny * 0.25, nx, ny, 4.5, [0xfff3d6, 0xffd27a, 0xff8f6b], 0.14, 0.7, 5);
        this.shake = Math.max(this.shake, 0.1);
        break;
      }
      case 'web': {
        const web = this.webs.get(event.cell);
        if (web) web.age = 0;
        this.rig.land(8);
        this.burst(12, x, y, 2.4, [0xffffff, 0xe6fbff], 0.1, 0.5, 2);
        break;
      }
      case 'ouch':
        this.burst(22, x, y, 5.5, [0xb02a5f, 0x7a1f48, 0xff5d8f], 0.17, 0.6, 14);
        this.shake = Math.max(this.shake, 0.28);
        this.rig.reappear();
        break;
      case 'splash': {
        const surface = this.waterTop > -50 ? this.waterTop : y;
        for (let i = 0; i < 26; i++) {
          this.addSpark(x + (Math.random() - 0.5) * 0.5, surface, FROG_Z, (Math.random() - 0.5) * 4.4, 4 + Math.random() * 6.5, (Math.random() - 0.5) * 2, 0.5 + Math.random() * 0.4, 0.12 + Math.random() * 0.12, i % 3 === 0 ? 0xffffff : 0xa9f1f0, 22, 0.6);
        }
        if (this.waterTop > -50) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.4, 0.03, 6, 28),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, fog: false })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.set(x, this.waterTop + 0.03, FROG_Z);
          this.world.add(ring);
          this.ripples.push({ ring, age: 0 });
        }
        this.shake = Math.max(this.shake, 0.16);
        this.rig.reappear();
        break;
      }
      case 'lost':
        this.rig.reappear();
        break;
      case 'win':
        this.won = true;
        this.burst(70, x, y, 7.5, [0xff5fa2, 0xffd640, 0xffffff, 0xff9cc6, 0x9be86a], 0.2, 1.3, 7);
        this.shake = Math.max(this.shake, 0.18);
        break;
    }
  }

  /** A puff at the frog's feet as it leaves. */
  kick(frog: Frog, vx: number, vy: number): void {
    const level = this.level;
    if (!level) return;
    const speed = Math.sqrt(vx * vx + vy * vy) || 1;
    for (let i = 0; i < 7; i++) {
      this.addSpark(
        frog.x - frog.nx * 0.25,
        level.h - frog.y + frog.ny * 0.25,
        FROG_Z,
        (-vx / speed) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 1.6,
        (vy / speed) * (1 + Math.random() * 2) + (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.2,
        0.3 + Math.random() * 0.25,
        0.16 + Math.random() * 0.1,
        i % 2 === 0 ? 0xffffff : 0xdff8c8,
        2,
        3
      );
    }
  }

  private burst(count: number, x: number, y: number, speed: number, colours: readonly number[], size: number, life: number, gravity: number): void {
    for (let i = 0; i < count; i++) {
      const turn = Math.random() * Math.PI * 2;
      const push = speed * (0.35 + Math.random() * 0.65);
      this.addSpark(x, y, FROG_Z, Math.cos(turn) * push, Math.sin(turn) * push, (Math.random() - 0.5) * push * 0.6, life * (0.6 + Math.random() * 0.5), size * (0.6 + Math.random() * 0.8), pick(colours, Math.random(), 0xffffff), gravity, 1.6);
    }
  }

  /** Particles thrown off a surface: mostly along it, a little away from it. */
  private spray(count: number, x: number, y: number, nx: number, ny: number, speed: number, colours: readonly number[], size: number, life: number, gravity: number): void {
    for (let i = 0; i < count; i++) {
      const side = (Math.random() - 0.5) * 2;
      const away = 0.25 + Math.random() * 0.9;
      const push = speed * (0.4 + Math.random() * 0.6);
      this.addSpark(
        x + -ny * side * 0.2,
        y + nx * side * 0.2,
        FROG_Z + (Math.random() - 0.5) * 0.5,
        (-ny * side + nx * away) * push,
        (nx * side + ny * away) * push,
        (Math.random() - 0.5) * push * 0.7,
        life * (0.6 + Math.random() * 0.5),
        size * (0.6 + Math.random() * 0.8),
        pick(colours, Math.random(), 0xffffff),
        gravity,
        2.4
      );
    }
  }

  private addSpark(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, colour: number, gravity: number, drag: number): void {
    if (this.sparks.length >= MOST_SPARKS) this.sparks.shift();
    const tint = new THREE.Color(colour);
    this.sparks.push({ x, y, z, vx, vy, vz, life, age: 0, size, r: tint.r, g: tint.g, b: tint.b, gravity, drag });
  }

  // ---------- Every frame ----------

  update(dt: number, frog: Frog, won: boolean): void {
    const level = this.level;
    if (!level) return;
    this.clock += dt;
    const still = this.reducedMotion ? 0 : 1;
    this.rig.update(dt, frog, level.h, FROG_Z, won);

    // A streak of light behind the frog in the air.
    if (!frog.perched && !won) {
      this.trailIn -= dt;
      if (this.trailIn <= 0) {
        this.trailIn = 0.012;
        this.addSpark(frog.x + (Math.random() - 0.5) * 0.2, level.h - frog.y + (Math.random() - 0.5) * 0.2, FROG_Z - 0.25, 0, 0, 0, 0.38, 0.34, Math.random() < 0.3 ? 0xffffff : 0xc9ff7a, 0, 0);
      }
    }

    // Bark gives a little when the frog lands on it.
    if (this.barkMesh) {
      const place = new THREE.Matrix4();
      for (let i = this.nudges.length - 1; i >= 0; i--) {
        const nudge = this.nudges[i];
        if (!nudge) continue;
        nudge.age += dt;
        const t = Math.min(1, nudge.age / 0.32);
        const give = Math.sin(t * Math.PI) * (1 - t) * 0.16;
        const x = (nudge.cell % level.w) + 0.5 - nudge.nx * give;
        const y = level.h - Math.floor(nudge.cell / level.w) - 0.5 - nudge.ny * give;
        const barkIndex = this.barkAt.get(nudge.cell);
        if (barkIndex !== undefined) this.barkMesh.setMatrixAt(barkIndex, place.makeTranslation(x, y, 0));
        const mossIndex = this.mossAt.get(nudge.cell);
        if (mossIndex !== undefined) this.mossMesh?.setMatrixAt(mossIndex, place.makeTranslation(x, y + 0.43, 0));
        if (t >= 1) this.nudges.splice(i, 1);
      }
      this.barkMesh.instanceMatrix.needsUpdate = true;
      if (this.mossMesh) this.mossMesh.instanceMatrix.needsUpdate = true;
    }

    for (const mushroom of this.mushrooms.values()) {
      mushroom.age += dt;
      const wobble = Math.exp(-mushroom.age * 7) * Math.cos(mushroom.age * 26);
      mushroom.cap.scale.set(1 + wobble * 0.22, 1 - wobble * 0.3, 1 + wobble * 0.22);
    }
    for (const web of this.webs.values()) {
      web.age += dt;
      const wobble = Math.exp(-web.age * 5) * Math.cos(web.age * 22);
      web.net.scale.setScalar(1 + wobble * 0.18);
      web.net.rotation.z = Math.sin(this.clock * 0.9 + web.net.position.x) * 0.04 * still;
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i];
      if (!ripple) continue;
      ripple.age += dt;
      const t = ripple.age / 0.9;
      ripple.ring.scale.setScalar(1 + t * 4.5);
      if (ripple.ring.material instanceof THREE.MeshBasicMaterial) ripple.ring.material.opacity = Math.max(0, 0.9 * (1 - t));
      if (t >= 1) {
        this.world.remove(ripple.ring);
        this.ripples.splice(i, 1);
      }
    }
    if (this.water) this.water.position.y = this.waterTop - 6 + Math.sin(this.clock * 1.3) * 0.04 * still;

    // The flower breathes, and opens wide when the frog reaches it.
    if (this.flower) {
      if (this.won) this.bloom = Math.min(1, this.bloom + dt * 2.2);
      const open = 1 + this.bloom * 0.9 + Math.sin(this.bloom * Math.PI) * 0.5;
      const pulse = 1 + Math.sin(this.clock * 3) * 0.05 * still;
      this.flower.head.scale.setScalar(open * pulse);
      this.flower.head.rotation.z = this.clock * 0.25 * still + this.bloom * 2.5;
      this.flower.glow.scale.setScalar((2.5 + Math.sin(this.clock * 3) * 0.3 * still) * (1 + this.bloom * 1.6));
      this.flower.light.intensity = 6 + this.bloom * 5;
    }

    // Leaves sway, rays shimmer, motes rise.
    for (const sway of this.swaying)
      sway.thing.rotation.z = sway.base + Math.sin(this.clock * sway.speed + sway.phase) * sway.reach * still;
    this.rays.forEach((ray, index) => {
      if (ray.material instanceof THREE.MeshBasicMaterial)
        ray.material.opacity = 0.07 + 0.05 * Math.sin(this.clock * 0.5 + index * 1.9) * still;
    });
    const motes = this.pollen.geometry.getAttribute('position');
    for (let i = 0; i < motes.count; i++) {
      let y = motes.getY(i) + dt * (0.25 + grain(i, 310) * 0.4) * still;
      if (y > 23) y = -2;
      motes.setY(i, y);
      motes.setX(i, motes.getX(i) + Math.sin(this.clock * 0.7 + i) * dt * 0.2 * still);
    }
    motes.needsUpdate = true;

    this.stirSparks(dt);
    this.aimCamera(dt, frog);
    this.renderer.render(this.scene, this.camera);
  }

  private stirSparks(dt: number): void {
    const places = this.sparkShape.getAttribute('position');
    const colours = this.sparkShape.getAttribute('aColor');
    const sizes = this.sparkShape.getAttribute('aSize');
    const alphas = this.sparkShape.getAttribute('aAlpha');
    let alive = 0;
    for (let i = 0; i < this.sparks.length; i++) {
      const spark = this.sparks[i];
      if (!spark) continue;
      spark.age += dt;
      if (spark.age >= spark.life) continue;
      spark.vy -= spark.gravity * dt;
      const slow = Math.max(0, 1 - spark.drag * dt);
      spark.vx *= slow;
      spark.vy *= slow;
      spark.vz *= slow;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.z += spark.vz * dt;
      const t = spark.age / spark.life;
      places.setXYZ(alive, spark.x, spark.y, spark.z);
      colours.setXYZ(alive, spark.r, spark.g, spark.b);
      sizes.setX(alive, spark.size * (1 - t * 0.5));
      alphas.setX(alive, 1 - t * t);
      this.sparks[alive] = spark;
      alive += 1;
    }
    this.sparks.length = alive;
    this.sparkShape.setDrawRange(0, alive);
    places.needsUpdate = true;
    colours.needsUpdate = true;
    sizes.needsUpdate = true;
    alphas.needsUpdate = true;
  }

  private aimCamera(dt: number, frog: Frog): void {
    const level = this.level;
    if (!level) return;
    // The camera leans a little towards the frog, so the layers of the scene slide past each other.
    const wantX = (frog.x - level.w / 2) * 0.16;
    const wantY = (level.h / 2 - frog.y) * 0.08;
    const ease = this.reducedMotion ? 1 : Math.min(1, dt * 2.5);
    this.driftX += (wantX - this.driftX) * ease;
    this.driftY += (wantY - this.driftY) * ease;
    this.zoom += ((this.won ? 1 : 0) - this.zoom) * Math.min(1, dt * 2.2);
    this.shake = Math.max(0, this.shake - dt * 1.4);
    const jolt = this.reducedMotion ? 0 : this.shake;
    // Close up, the frog sits to the right of the top third of the screen, beside the game's name.
    const wantDistance = this.closeUp ? 15 : this.distance * (1 - this.zoom * 0.07);
    const wantLookX = this.closeUp ? frog.x - 0.75 : this.look.x + this.driftX * 0.25;
    const wantLookY = this.closeUp ? level.h - frog.y - 2.15 : this.look.y + this.driftY * 0.25;
    const glide = this.reducedMotion || this.nowDistance === 0 ? 1 : Math.min(1, dt * 4.5);
    this.nowDistance += (wantDistance - this.nowDistance) * glide;
    this.nowLook.x += (wantLookX - this.nowLook.x) * glide;
    this.nowLook.y += (wantLookY - this.nowLook.y) * glide;
    const d = this.nowDistance;
    const sway = this.closeUp ? 0 : 1;
    this.eye.set(
      this.nowLook.x - d * 0.085 + this.driftX * 0.75 * sway + (Math.random() - 0.5) * jolt,
      this.nowLook.y + d * 0.2 + this.driftY * 0.75 * sway + (Math.random() - 0.5) * jolt,
      d
    );
    this.camera.position.copy(this.eye);
    this.camera.lookAt(this.nowLook.x, this.nowLook.y, 0);
  }
}
