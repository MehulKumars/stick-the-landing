// The frog: a small 3D puppet built from spheres and capsules, posed every frame from the physics.
import * as THREE from 'three';
import { FROG_R } from '../shared/leap/types.ts';
import type { Frog } from '../shared/leap/types.ts';

const SKIN = 0x7fdc35;
const SKIN_DARK = 0x4fb02a;
const BELLY = 0xf4f7c9;
const EYE = 0xff3d2e;
const TOE = 0xff9a2c;
const FLANK = 0x2c7be8;
/** The frog is drawn this much bigger than the circle the physics uses, so it reads on a phone. */
const LOOKS_BIGGER = 1.28;

type Leg = { hip: THREE.Group; knee: THREE.Group };

/** Angles are turns about the hip or knee, with 0 meaning the limb hangs straight down. */
const BACK_SITTING = { hip: -1.88, knee: 2.66 };
const BACK_FLYING = { hip: -1.42, knee: 0.12 };
const FRONT_SITTING = 0.35;
const FRONT_FLYING = 1.95;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** The shortest way round from one angle to another. */
function turnTowards(from: number, to: number, share: number): number {
  let gap = to - from;
  while (gap > Math.PI) gap -= Math.PI * 2;
  while (gap < -Math.PI) gap += Math.PI * 2;
  return from + gap * share;
}

export class FrogRig {
  readonly root = new THREE.Group();
  private readonly tilt = new THREE.Group();
  private readonly turn = new THREE.Group();
  private readonly squash = new THREE.Group();
  private readonly eyes: THREE.Group[] = [];
  private readonly pupils: THREE.Mesh[] = [];
  private readonly backLegs: Leg[] = [];
  private readonly frontLegs: THREE.Group[] = [];
  private readonly throat: THREE.Mesh;

  private facing = 1;
  private yaw = -0.5;
  private air = 0;
  private crouch = 0;
  private splat = 0;
  private splatSpeed = 0;
  private pop = 1;
  private blinkIn = 2;
  private blink = 0;
  private lastVx = 1;
  private clock = 0;
  /** Where the player is aiming, in world units (y up), or null. */
  aim: { x: number; y: number; power: number } | null = null;

  constructor() {
    const skin = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.45 });
    const dark = new THREE.MeshStandardMaterial({ color: SKIN_DARK, roughness: 0.5 });
    const belly = new THREE.MeshStandardMaterial({ color: BELLY, roughness: 0.6 });
    const toe = new THREE.MeshStandardMaterial({ color: TOE, roughness: 0.4 });
    const flank = new THREE.MeshStandardMaterial({ color: FLANK, roughness: 0.5 });
    const eye = new THREE.MeshStandardMaterial({ color: EYE, roughness: 0.15 });
    const black = new THREE.MeshStandardMaterial({ color: 0x15110f, roughness: 0.2 });
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ball = new THREE.SphereGeometry(1, 24, 16);

    const part = (material: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const mesh = new THREE.Mesh(ball, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = true;
      return mesh;
    };

    // Body, head, belly, the blue flanks of a red-eyed tree frog.
    this.squash.add(part(skin, -0.02, 0.0, 0, 0.33, 0.25, 0.29));
    this.squash.add(part(skin, 0.17, 0.07, 0, 0.21, 0.19, 0.24));
    this.throat = part(belly, 0.06, -0.09, 0, 0.26, 0.16, 0.24);
    this.squash.add(this.throat);
    for (const side of [-1, 1]) this.squash.add(part(flank, -0.04, -0.03, side * 0.245, 0.17, 0.08, 0.06));

    // Eyes: big red domes on top of the head, with pupils that look where the frog is going.
    for (const side of [-1, 1]) {
      const socket = new THREE.Group();
      socket.position.set(0.2, 0.235, side * 0.135);
      socket.add(part(skin, -0.01, -0.03, 0, 0.115, 0.1, 0.115));
      socket.add(part(eye, 0.015, 0.01, side * 0.012, 0.1, 0.1, 0.1));
      const pupil = part(black, 0, 0, 0, 0.034, 0.068, 0.05);
      pupil.castShadow = false;
      socket.add(pupil);
      const glint = new THREE.Mesh(ball, white);
      glint.position.set(0.05, 0.065, side * 0.05 + 0.03);
      glint.scale.setScalar(0.02);
      socket.add(glint);
      this.squash.add(socket);
      this.eyes.push(socket);
      this.pupils.push(pupil);
    }

    // Legs. Each back leg is a thigh and a shin that fold up when sitting and trail out behind in the air.
    const limb = (radius: number, length: number) => {
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 10), dark);
      mesh.position.y = -length / 2;
      mesh.castShadow = true;
      return mesh;
    };
    const foot = (size: number) => {
      const pad = new THREE.Group();
      pad.add(part(toe, 0.03, 0, 0, size * 1.5, size * 0.5, size));
      for (const spread of [-1, 0, 1])
        pad.add(part(toe, size * 1.9, 0, spread * size * 0.9, size * 0.55, size * 0.4, size * 0.55));
      return pad;
    };
    for (const side of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(-0.17, -0.07, side * 0.2);
      hip.add(limb(0.062, 0.2));
      const knee = new THREE.Group();
      knee.position.y = -0.2;
      knee.add(limb(0.05, 0.22));
      const paw = foot(0.06);
      paw.position.y = -0.24;
      paw.rotation.z = -0.8;
      knee.add(paw);
      hip.add(knee);
      this.squash.add(hip);
      this.backLegs.push({ hip, knee });

      const shoulder = new THREE.Group();
      shoulder.position.set(0.16, -0.1, side * 0.17);
      shoulder.add(limb(0.045, 0.17));
      const hand = foot(0.045);
      hand.position.y = -0.2;
      hand.rotation.z = -0.3;
      shoulder.add(hand);
      this.squash.add(shoulder);
      this.frontLegs.push(shoulder);
    }

    this.turn.add(this.squash);
    this.tilt.add(this.turn);
    this.tilt.scale.setScalar(LOOKS_BIGGER);
    this.root.add(this.tilt);
  }

  /** A hard landing: flatten against the surface and wobble back. */
  land(speed: number): void {
    this.splat = Math.min(1, 0.35 + speed / 22);
    this.splatSpeed = 0;
  }

  /** Reappear at the last perch after a fall. */
  reappear(): void {
    this.pop = 0;
  }

  update(dt: number, frog: Frog, height: number, depth: number, won: boolean): void {
    this.clock += dt;
    const flying = !frog.perched && !won;
    const vx = frog.vx;
    const vy = -frog.vy;
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (flying && Math.abs(vx) > 0.5) this.lastVx = vx;

    this.air = lerp(this.air, flying ? 1 : 0, Math.min(1, dt * (flying ? 16 : 22)));
    this.crouch = lerp(this.crouch, this.aim && !flying ? this.aim.power : 0, Math.min(1, dt * 18));
    this.pop = Math.min(1, this.pop + dt * 5);

    // A damped spring brings the splat back to nothing.
    this.splatSpeed += (-this.splat * 260 - this.splatSpeed * 14) * dt;
    this.splat += this.splatSpeed * dt;

    // Which way is "up" for the frog: out of whatever it is holding, or tipped along its flight.
    const upX = frog.nx;
    let upY = -frog.ny;
    if (upX === 0 && upY === 0) upY = 1;
    let lean = -Math.atan2(upX, upY);
    let headX = this.lastVx >= 0 ? 0.5 : -0.5;
    let headY = 0.6;
    if (this.aim && !flying) {
      headX = this.aim.x;
      headY = this.aim.y;
    }
    if (flying) {
      lean = Math.max(-1.1, Math.min(1.1, Math.atan2(vy, Math.abs(vx) + 4))) * (vx >= 0 ? 1 : -1);
      this.facing = this.lastVx >= 0 ? 1 : -1;
    } else {
      // Sitting: point the head whichever way along the surface suits where the frog is looking.
      const alongX = Math.cos(lean);
      const alongY = Math.sin(lean);
      this.facing = alongX * headX + alongY * headY >= 0 ? 1 : -1;
    }
    this.tilt.rotation.z = turnTowards(this.tilt.rotation.z, lean, Math.min(1, dt * (flying ? 10 : 26)));
    this.yaw = turnTowards(this.yaw, this.facing > 0 ? -0.5 : Math.PI + 0.5, Math.min(1, dt * 14));
    this.turn.rotation.y = this.yaw;

    // Squash and stretch, keeping the feet where they are.
    const stretch = this.air * Math.min(1, speed / 18);
    const breathe = flying ? 0 : Math.sin(this.clock * 3.2) * 0.012;
    const sx = (1 + 0.28 * this.splat + 0.1 * this.crouch + 0.22 * stretch) * this.pop;
    const sy = (1 - 0.32 * this.splat - 0.22 * this.crouch - 0.12 * stretch + breathe) * this.pop;
    const sz = (1 + 0.2 * this.splat + 0.08 * this.crouch - 0.08 * stretch) * this.pop;
    this.squash.scale.set(sx, sy, sz);
    this.squash.position.y = -FROG_R * (1 - sy) * (1 - this.air);
    this.throat.scale.y = 0.16 * (1 + (flying ? 0 : Math.sin(this.clock * 6.4) * 0.07));

    for (const leg of this.backLegs) {
      leg.hip.rotation.z = lerp(BACK_SITTING.hip + 0.25 * this.crouch, BACK_FLYING.hip, this.air);
      leg.knee.rotation.z = lerp(BACK_SITTING.knee, BACK_FLYING.knee, this.air);
    }
    for (const shoulder of this.frontLegs)
      shoulder.rotation.z = lerp(FRONT_SITTING, FRONT_FLYING, this.air);

    // Blink now and then; pupils follow the aim or the flight.
    this.blinkIn -= dt;
    if (this.blinkIn < 0) {
      this.blink = 0.12;
      this.blinkIn = 1.8 + Math.random() * 3.2;
    }
    this.blink = Math.max(0, this.blink - dt);
    let lookX = 0.6;
    let lookY = 0.1;
    if (this.aim && !flying) {
      // Into the frog's own frame: along its body and up from its perch.
      const along = (this.aim.x * Math.cos(lean) + this.aim.y * Math.sin(lean)) * this.facing;
      const up = -this.aim.x * Math.sin(lean) + this.aim.y * Math.cos(lean);
      const size = Math.sqrt(along * along + up * up) || 1;
      lookX = along / size;
      lookY = up / size;
    }
    this.eyes.forEach((socket, index) => {
      socket.scale.y = this.blink > 0 ? 0.15 : 1;
      const side = index === 0 ? -1 : 1;
      this.pupils[index]?.position.set(0.02 + lookX * 0.075, 0.012 + lookY * 0.06, side * 0.05);
    });

    const bob = frog.perched && frog.nx === 0 && frog.ny === 0 ? Math.sin(this.clock * 2.4) * 0.04 : 0;
    this.root.position.set(frog.x, height - frog.y + bob, depth);
  }
}
