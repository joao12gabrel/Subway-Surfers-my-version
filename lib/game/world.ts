import * as THREE from 'three';
import type { BiomeKey } from './types';
import { CHUNK_LEN, LANE_WIDTH } from './rules';

export interface BiomePalette {
  name: string;
  sky: number;
  fog: number;
  ambientSky: number;
  ambientGround: number;
  sun: number;
  ground: number;
  platform: string;
  wallHex: string;
  accentA: string;
  accentB: string;
  buildingA: number;
  buildingB: number;
  trainA: string;
  trainB: string;
  foliage: number;
}

export const BIOMES: Record<BiomeKey, BiomePalette> = {
  classic: {
    name: 'Metro Clássico',
    sky: 0x38bdf8,
    fog: 0x7dd3fc,
    ambientSky: 0xe0f2fe,
    ambientGround: 0x475569,
    sun: 0xfff3d6,
    ground: 0x4b5563,
    platform: '#94a3b8',
    wallHex: '#c25929',
    accentA: '#ec4899',
    accentB: '#06b6d4',
    buildingA: 0xb45309,
    buildingB: 0x3b82f6,
    trainA: '#ea580c',
    trainB: '#16a34a',
    foliage: 0x22c55e,
  },
  tokyo: {
    name: 'Tóquio Neon',
    sky: 0x0f0b29,
    fog: 0x1e164b,
    ambientSky: 0xa78bfa,
    ambientGround: 0x1e1b4b,
    sun: 0xe9d5ff,
    ground: 0x1e1b2e,
    platform: '#312e81',
    wallHex: '#251d47',
    accentA: '#06b6d4',
    accentB: '#f43f5e',
    buildingA: 0x1e1b4b,
    buildingB: 0x3b0764,
    trainA: '#0284c7',
    trainB: '#db2777',
    foliage: 0x2dd4bf,
  },
  canyon: {
    name: 'Cânion Dourado',
    sky: 0xfb923c,
    fog: 0xfdba74,
    ambientSky: 0xffedd5,
    ambientGround: 0x7c2d12,
    sun: 0xfef08a,
    ground: 0x78350f,
    platform: '#d6a472',
    wallHex: '#9a3412',
    accentA: '#f59e0b',
    accentB: '#0d9488',
    buildingA: 0x9a3412,
    buildingB: 0xb45309,
    trainA: '#0f766e',
    trainB: '#ca8a04',
    foliage: 0x15803d,
  },
  arctic: {
    name: 'Expresso Polar',
    sky: 0xbae6fd,
    fog: 0xe0f2fe,
    ambientSky: 0xf0f9ff,
    ambientGround: 0x64748b,
    sun: 0xffffff,
    ground: 0xcbd5e1,
    platform: '#e2e8f0',
    wallHex: '#334155',
    accentA: '#38bdf8',
    accentB: '#f8fafc',
    buildingA: 0x475569,
    buildingB: 0x0284c7,
    trainA: '#0284c7',
    trainB: '#38bdf8',
    foliage: 0x0f766e,
  },
  cyberport: {
    name: 'Porto Espacial',
    sky: 0x070b19,
    fog: 0x111936,
    ambientSky: 0x7dd3fc,
    ambientGround: 0x1e293b,
    sun: 0xfef08a,
    ground: 0x0f172a,
    platform: '#1e293b',
    wallHex: '#172554',
    accentA: '#fde047',
    accentB: '#22d3ee',
    buildingA: 0x1e293b,
    buildingB: 0x0f172a,
    trainA: '#eab308',
    trainB: '#06b6d4',
    foliage: 0x38bdf8,
  },
};

export interface BiomeMaterials {
  ground: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  platform: THREE.MeshStandardMaterial;
  buildingA: THREE.MeshStandardMaterial;
  buildingB: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  trunk: THREE.MeshStandardMaterial;
  trainA: THREE.MeshStandardMaterial;
  trainB: THREE.MeshStandardMaterial;
  trainFrontA: THREE.MeshStandardMaterial;
  trainFrontB: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
}

export interface TrackChunk {
  group: THREE.Group;
  scenery: THREE.Group;
  index: number;
  biomeKey: BiomeKey;
}

export function populateChunkScenery(
  chunk: TrackChunk,
  biomeKey: BiomeKey,
  idx: number,
  bm: BiomeMaterials,
  sharedGeo: {
    groundPlane: THREE.BufferGeometry;
    railBed: THREE.BufferGeometry;
    railBar: THREE.BufferGeometry;
    platform: THREE.BufferGeometry;
    wall: THREE.BufferGeometry;
    upperWall: THREE.BufferGeometry;
    gantryPost: THREE.BufferGeometry;
    gantryBeam: THREE.BufferGeometry;
    catenaryWire: THREE.BufferGeometry;
    building: THREE.BufferGeometry;
    buildingCrown: THREE.BufferGeometry;
    treeTrunk: THREE.BufferGeometry;
    treeTop: THREE.BufferGeometry;
    cactus: THREE.BufferGeometry;
    mesa: THREE.BufferGeometry;
    neonSign: THREE.BufferGeometry;
    neonStrip: THREE.BufferGeometry;
    canopyRoof: THREE.BufferGeometry;
    canopyTruss: THREE.BufferGeometry;
    lampPole: THREE.BufferGeometry;
    lampGlobe: THREE.BufferGeometry;
  },
  sharedMat: {
    railBed: THREE.MeshStandardMaterial;
    railSteel: THREE.MeshStandardMaterial;
    metalDark: THREE.MeshStandardMaterial;
    neonCyan: THREE.MeshBasicMaterial;
    neonPink: THREE.MeshBasicMaterial;
    canopy: THREE.MeshStandardMaterial;
    sodiumLight: THREE.MeshBasicMaterial;
  }
): void {
  while (chunk.scenery.children.length > 0) {
    chunk.scenery.remove(chunk.scenery.children[0]);
  }
  chunk.biomeKey = biomeKey;

  // Extended terrain so world never looks boxed in
  const ground = new THREE.Mesh(sharedGeo.groundPlane, bm.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  chunk.scenery.add(ground);

  // 3 Subway Rail Tracks
  for (let l = -1; l <= 1; l++) {
    const lx = l * LANE_WIDTH;
    const bed = new THREE.Mesh(sharedGeo.railBed, sharedMat.railBed);
    bed.position.set(lx, 0.01, 0);
    chunk.scenery.add(bed);

    const railL = new THREE.Mesh(sharedGeo.railBar, sharedMat.railSteel);
    railL.position.set(lx - 0.88, 0.08, 0);
    const railR = new THREE.Mesh(sharedGeo.railBar, sharedMat.railSteel);
    railR.position.set(lx + 0.88, 0.08, 0);
    chunk.scenery.add(railL, railR);
  }

  // Left & Right Subway Station Platforms with yellow safety tactile strip
  const platL = new THREE.Mesh(sharedGeo.platform, bm.platform);
  platL.position.set(-5.7, 0.24, 0);
  const platR = new THREE.Mesh(sharedGeo.platform, bm.platform);
  platR.position.set(5.7, 0.24, 0);
  platR.rotation.y = Math.PI;
  chunk.scenery.add(platL, platR);

  // Tall Two-Tier Perimeter Walls (graffiti lower wall + continuous upper retaining wall to 9.2m)
  // Keeps high jumps and Jetpack flight strictly framed inside the scenario without exposing outside ground
  const wallL = new THREE.Mesh(sharedGeo.wall, bm.wall);
  wallL.position.set(-7.15, 2.7, 0);
  const wallR = new THREE.Mesh(sharedGeo.wall, bm.wall);
  wallR.position.set(7.15, 2.7, 0);
  const upperL = new THREE.Mesh(sharedGeo.upperWall, sharedMat.canopy);
  upperL.position.set(-7.4, 7.3, 0);
  const upperR = new THREE.Mesh(sharedGeo.upperWall, sharedMat.canopy);
  upperR.position.set(7.4, 7.3, 0);
  chunk.scenery.add(wallL, wallR, upperL, upperR);

  // Side-Only Signal Masts & Cantilever Arms (sky directly above the 3 tracks stays 100% open — zero overhead ceilings/beams to clip through!)
  if (idx % 2 === 0) {
    for (const side of [-1, 1] as const) {
      const post = new THREE.Mesh(sharedGeo.gantryPost, sharedMat.metalDark);
      post.position.set(side * 6.05, 4.9, 0);
      const arm = new THREE.Mesh(sharedGeo.lampGlobe, sharedMat.metalDark);
      arm.scale.set(1.6, 1.3, 1.1);
      arm.position.set(side * 5.45, 9.2, 0);
      chunk.scenery.add(post, arm);

      if (biomeKey === 'tokyo' || biomeKey === 'cyberport') {
        const neonAcc = new THREE.Mesh(
          sharedGeo.lampGlobe,
          idx % 4 === 0 ? sharedMat.neonCyan : sharedMat.neonPink
        );
        neonAcc.scale.set(1.2, 0.9, 1.2);
        neonAcc.position.set(side * 5.2, 8.95, 0);
        chunk.scenery.add(neonAcc);
      }
    }
  }

  // Platform Station Lamp Posts
  if (idx % 3 === 1) {
    for (const side of [-1, 1] as const) {
      const pole = new THREE.Mesh(sharedGeo.lampPole, sharedMat.metalDark);
      pole.position.set(side * 5.65, 2.55, 0);
      const globe = new THREE.Mesh(
        sharedGeo.lampGlobe,
        biomeKey === 'tokyo'
          ? side < 0
            ? sharedMat.neonCyan
            : sharedMat.neonPink
          : biomeKey === 'arctic' || biomeKey === 'cyberport'
            ? sharedMat.neonCyan
            : sharedMat.sodiumLight
      );
      globe.position.set(side * 5.3, 4.75, 0);
      chunk.scenery.add(pole, globe);
    }
  }

  // Continuous City / Neon / Canyon / Arctic / Cyberport Skyline on both sides (dense, tall, zero bare gaps or clipping)
  for (const side of [-1, 1] as const) {
    if (biomeKey === 'classic') {
      for (const zOff of [-8, 8]) {
        const bldg = new THREE.Mesh(
          sharedGeo.building,
          (side < 0 ? zOff < 0 : zOff > 0) ? bm.buildingA : bm.buildingB
        );
        bldg.scale.set(1.15, 1.15 + ((idx + (zOff > 0 ? 1 : 0)) % 3) * 0.25, 1.48);
        bldg.position.set(side * 14.2, 8.5 * bldg.scale.y, zOff);
        const crown = new THREE.Mesh(sharedGeo.buildingCrown, sharedMat.metalDark);
        crown.scale.set(1.15, 1, 1.48);
        crown.position.set(side * 14.2, 17 * bldg.scale.y + 0.35, zOff);
        chunk.scenery.add(bldg, crown);
      }
      for (const zOff of [-9, 5]) {
        const trunk = new THREE.Mesh(sharedGeo.treeTrunk, bm.trunk);
        trunk.position.set(side * 9.15, 1.15, zOff);
        const top = new THREE.Mesh(sharedGeo.treeTop, bm.foliage);
        top.scale.setScalar(0.85);
        top.position.set(side * 9.15, 3.35, zOff);
        chunk.scenery.add(trunk, top);
      }
    } else if (biomeKey === 'tokyo') {
      for (const zOff of [-8, 8]) {
        const bldg = new THREE.Mesh(
          sharedGeo.building,
          (side < 0 ? zOff < 0 : zOff > 0) ? bm.buildingA : bm.buildingB
        );
        bldg.scale.set(1.2, 1.45 + ((idx + (zOff > 0 ? 2 : 0)) % 2) * 0.35, 1.52);
        bldg.position.set(side * 12.6, 8.5 * bldg.scale.y, zOff);
        chunk.scenery.add(bldg);
      }
      // Mounted flush onto the inner building facade at z = ±8 so it never floats in empty air
      const signZ = idx % 2 === 0 ? -8 : 8;
      const sign = new THREE.Mesh(
        sharedGeo.neonSign,
        side < 0 ? sharedMat.neonCyan : sharedMat.neonPink
      );
      sign.position.set(side * 8.42, 7.6, signZ);
      chunk.scenery.add(sign);
    } else if (biomeKey === 'arctic') {
      for (const zOff of [-8, 8]) {
        const glacier = new THREE.Mesh(
          sharedGeo.mesa,
          (side < 0 ? zOff < 0 : zOff > 0) ? bm.buildingA : bm.buildingB
        );
        glacier.scale.set(1.18, 1.35 + ((idx + (zOff > 0 ? 1 : 0)) % 3) * 0.3, 1.42);
        glacier.position.set(side * 14.4, 5.5 * glacier.scale.y, zOff);
        chunk.scenery.add(glacier);
      }
      for (const zOff of [-9, 6]) {
        const trunk = new THREE.Mesh(sharedGeo.treeTrunk, bm.trunk);
        trunk.position.set(side * 9.15, 1.15, zOff);
        const top = new THREE.Mesh(sharedGeo.treeTop, bm.foliage);
        top.scale.setScalar(0.85);
        top.position.set(side * 9.15, 3.35, zOff);
        chunk.scenery.add(trunk, top);
      }
    } else if (biomeKey === 'cyberport') {
      for (const zOff of [-8, 8]) {
        const spire = new THREE.Mesh(
          sharedGeo.building,
          (side < 0 ? zOff < 0 : zOff > 0) ? bm.buildingA : bm.buildingB
        );
        spire.scale.set(1.2, 1.6 + ((idx + (zOff > 0 ? 1 : 0)) % 2) * 0.4, 1.52);
        spire.position.set(side * 12.6, 8.5 * spire.scale.y, zOff);
        chunk.scenery.add(spire);
      }
      const beaconZ = idx % 2 === 0 ? 8 : -8;
      const beacon = new THREE.Mesh(
        sharedGeo.neonSign,
        side < 0 ? sharedMat.neonCyan : sharedMat.sodiumLight
      );
      beacon.position.set(side * 8.42, 7.8, beaconZ);
      chunk.scenery.add(beacon);
    } else {
      for (const zOff of [-8, 8]) {
        const mesa = new THREE.Mesh(
          sharedGeo.mesa,
          (side < 0 ? zOff < 0 : zOff > 0) ? bm.buildingA : bm.buildingB
        );
        mesa.scale.set(1.18, 1.25 + ((idx + (zOff > 0 ? 1 : 0)) % 2) * 0.25, 1.42);
        mesa.position.set(side * 14.4, 5.5 * mesa.scale.y, zOff);
        chunk.scenery.add(mesa);
      }
      for (const zOff of [-8, 6]) {
        const cact = new THREE.Mesh(sharedGeo.cactus, bm.foliage);
        cact.position.set(side * 9.15, 1.7, zOff);
        chunk.scenery.add(cact);
      }
    }
  }
}

// Zero-GC Pooled InstancedMesh Particle System
export class ParticlePool {
  public readonly mesh: THREE.InstancedMesh;
  private readonly capacity: number;
  private readonly pos: Float32Array;
  private readonly vel: Float32Array;
  private readonly life: Float32Array;
  private readonly maxLife: Float32Array;
  private readonly scales: Float32Array;
  private cursor = 0;
  private readonly dummy = new THREE.Object3D();
  private readonly tmpColor = new THREE.Color();

  constructor(scene: THREE.Scene, capacity = 160) {
    this.capacity = capacity;
    const geo = new THREE.OctahedronGeometry(0.16, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    this.pos = new Float32Array(capacity * 3);
    this.vel = new Float32Array(capacity * 3);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity);
    this.scales = new Float32Array(capacity);

    for (let i = 0; i < capacity; i++) {
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.tmpColor.setHex(0xfacc15));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    scene.add(this.mesh);
  }

  public burst(
    x: number,
    y: number,
    z: number,
    colorHex: number,
    count = 8,
    speed = 5,
    baseScale = 1
  ): void {
    this.tmpColor.setHex(colorHex);
    for (let i = 0; i < count; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.capacity;

      const p3 = idx * 3;
      this.pos[p3] = x + (Math.random() - 0.5) * 0.35;
      this.pos[p3 + 1] = y + (Math.random() - 0.5) * 0.35;
      this.pos[p3 + 2] = z + (Math.random() - 0.5) * 0.35;

      this.vel[p3] = (Math.random() - 0.5) * speed * 1.4;
      this.vel[p3 + 1] = Math.random() * speed + 1.4;
      this.vel[p3 + 2] = (Math.random() - 0.2) * speed;

      const ml = 0.28 + Math.random() * 0.28;
      this.life[idx] = ml;
      this.maxLife[idx] = ml;
      this.scales[idx] = baseScale * (0.7 + Math.random() * 0.7);
      this.mesh.setColorAt(idx, this.tmpColor);
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public update(dt: number, trackSpeed: number): void {
    let dirty = false;
    for (let i = 0; i < this.capacity; i++) {
      if (this.life[i] <= 0) continue;
      dirty = true;
      this.life[i] -= dt;
      const p3 = i * 3;

      if (this.life[i] <= 0) {
        this.dummy.scale.setScalar(0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      this.vel[p3 + 1] -= 15 * dt;
      this.pos[p3] += this.vel[p3] * dt;
      this.pos[p3 + 1] += this.vel[p3 + 1] * dt;
      this.pos[p3 + 2] += (this.vel[p3 + 2] + trackSpeed * 0.35) * dt;

      const s = this.scales[i] * (this.life[i] / this.maxLife[i]);
      this.dummy.position.set(this.pos[p3], this.pos[p3 + 1], this.pos[p3 + 2]);
      this.dummy.rotation.set(this.life[i] * 8, this.life[i] * 6, 0);
      this.dummy.scale.setScalar(Math.max(0.01, s));
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    if (dirty) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
