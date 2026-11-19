'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type {
  BiomeKey,
  BoardCustomization,
  CharacterId,
  ComboPopupEvent,
  DebugInfo,
  GameState,
  HoverboardId,
  LevelUnlockSummary,
  PowerUpType,
  RunEndSummary,
  SaveData,
} from '@/lib/game/types';
import {
  CHUNK_LEN,
  COMBO_WINDOW_SECONDS,
  LANE_WIDTH,
  NUM_CHUNKS,
  TRAIN_HEIGHT,
  TRAIN_WIDTH,
  applyAccountMilestones,
  applyRunMissionProgress,
  calculateRunXp,
  canSpawnMovingTrain,
  computeAccountLevel,
  computeActiveMultiplier,
  computeComboBonus,
  computeRampSurfaceY,
  computeRunLevel,
  computeTargetSpeed,
  getAccountXpProgress,
  getActiveDailyMission,
  getCharacterDef,
  getHoverboardDef,
  getLevelProfile,
  getLevelUnlockSummary,
  getNextLevelThreshold,
  getPowerUpDuration,
  getTodayDateKey,
  recordRunToLeaderboard,
  resolveSolidSidePushback,
  rollMysteryBoxReward,
  segmentsOverlapZ,
} from '@/lib/game/rules';
import {
  makeBuildingFacadeTexture,
  makeContactShadowTexture,
  makeGraffitiWallTexture,
  makeMysteryBoxTexture,
  makePlatformTexture,
  makeRampChevronTexture,
  makeStripeTexture,
  makeTrackBedTexture,
  makeTrainFrontTexture,
  makeTrainSideTexture,
} from '@/lib/game/textures';
import {
  type SharedAssets,
  buildPowerUpMesh,
  buildTrainGroup,
  createChaserRig,
  createRunnerRig,
  makeRampGeometry,
} from '@/lib/game/models';
import {
  BIOMES,
  type BiomeMaterials,
  ParticlePool,
  type TrackChunk,
  populateChunkScenery,
} from '@/lib/game/world';
import { soundEngine } from '@/lib/game/audio';
import type { ActivePowerUpBar, HudState } from './GameHUD';

export interface GameController {
  startNewRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  reviveRun: () => void;
  returnToTitle: () => void;
  activateBoard: () => void;
  applyCharacter: (id: CharacterId) => void;
  applyHoverboard: (id: HoverboardId, custom?: BoardCustomization) => void;
  previewBiome: (biome: BiomeKey) => void;
  toggleMute: () => boolean;
}

interface ObstacleEntity {
  type: 'lowBarrier' | 'highBarrier' | 'train' | 'ramp';
  isTrain?: boolean;
  isRamp?: boolean;
  moving?: boolean;
  hornPlayed?: boolean;
  flybyWhooshPlayed?: boolean;
  nearMissAwarded?: boolean;
  lane: number;
  z: number;
  length: number;
  halfLen: number;
  minY: number;
  maxY: number;
  extraSpeed: number;
  mesh: THREE.Object3D;
}

interface CollectibleEntity {
  kind: 'coin' | 'key' | 'mystery' | PowerUpType;
  lane: number;
  baseY: number;
  z: number;
  isSkyCoin?: boolean;
  mesh: THREE.Object3D;
}

interface GameCanvasProps {
  saveRef: React.MutableRefObject<SaveData>;
  isGarageOpenRef: React.MutableRefObject<boolean>;
  controllerRef: React.MutableRefObject<GameController | null>;
  onStateChange: (nextState: GameState) => void;
  onSaveUpdate: (nextSave: SaveData) => void;
  onHudUpdate: (hud: HudState) => void;
  onGameOver: (summary: RunEndSummary) => void;
  onToast: (msg: string) => void;
  onMuteChange: (muted: boolean) => void;
  onDebugUpdate?: (info: DebugInfo) => void;
  onAccountLevelUp?: (info: LevelUnlockSummary) => void;
}

const _tmpSky = new THREE.Color();
const _tmpFog = new THREE.Color();
const _tmpAmbSky = new THREE.Color();
const _tmpAmbGround = new THREE.Color();
const _tmpSun = new THREE.Color();

export default function GameCanvas({
  saveRef,
  isGarageOpenRef,
  controllerRef,
  onStateChange,
  onSaveUpdate,
  onHudUpdate,
  onGameOver,
  onToast,
  onMuteChange,
  onDebugUpdate,
  onAccountLevelUp,
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const callbacksRef = useRef({
    onStateChange,
    onSaveUpdate,
    onHudUpdate,
    onGameOver,
    onToast,
    onMuteChange,
    onDebugUpdate,
    onAccountLevelUp,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStateChange,
      onSaveUpdate,
      onHudUpdate,
      onGameOver,
      onToast,
      onMuteChange,
      onDebugUpdate,
      onAccountLevelUp,
    };
  }, [
    onStateChange,
    onSaveUpdate,
    onHudUpdate,
    onGameOver,
    onToast,
    onMuteChange,
    onDebugUpdate,
    onAccountLevelUp,
  ]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // 1. Detect software WebGL once via probe canvas
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Renderer + Scene + Camera
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.setAttribute('data-testid', 'game-canvas');
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BIOMES.classic.sky);
    scene.fog = new THREE.Fog(BIOMES.classic.fog, 55, 178);

    // Studio Environment Reflection (RoomEnvironment) on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      62,
      (mount.clientWidth || window.innerWidth) / (mount.clientHeight || window.innerHeight),
      0.1,
      230
    );
    camera.position.set(0, 4.8, 8.2);

    // Warm Key + Cool Hemisphere Fill + Back Rim Lighting
    const hemiLight = new THREE.HemisphereLight(
      BIOMES.classic.ambientSky,
      BIOMES.classic.ambientGround,
      0.92
    );
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(BIOMES.classic.sun, 1.15);
    dirLight.position.set(16, 30, 14);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    rimLight.position.set(-14, 14, -18);
    scene.add(rimLight);

    // 3. Shared Geometries, Procedural Textures & Materials
    const maxAniso = isSoftwareGl ? 1 : Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const trackTex = makeTrackBedTexture(maxAniso);
    const hazardTex = makeStripeTexture('#facc15', '#0f172a', maxAniso, true);
    const redWhiteTex = makeStripeTexture('#ef4444', '#f8fafc', maxAniso, true);
    const rampChevronTex = makeRampChevronTexture(maxAniso);
    const mysteryTex = makeMysteryBoxTexture(maxAniso);
    const shadowTex = makeContactShadowTexture();

    const assets: SharedAssets = {
      geo: {
        coin: new THREE.CylinderGeometry(0.45, 0.45, 0.14, 16),
        coinInner: new THREE.CylinderGeometry(0.32, 0.32, 0.17, 6),
        barrierLowBar: new THREE.BoxGeometry(2.34, 0.56, 0.24),
        barrierLowLeg: new THREE.BoxGeometry(0.14, 1.15, 0.16),
        barrierHighBar: new THREE.BoxGeometry(2.44, 0.92, 0.28),
        barrierPost: new THREE.BoxGeometry(0.18, 2.7, 0.18),
        trainBody: new THREE.BoxGeometry(TRAIN_WIDTH, TRAIN_HEIGHT - 0.32, 13.5),
        trainRoof: new THREE.BoxGeometry(TRAIN_WIDTH - 0.18, 0.24, 13.3),
        trainRoofUnit: new THREE.BoxGeometry(1.3, 0.24, 2.2),
        trainFrontFace: new THREE.PlaneGeometry(TRAIN_WIDTH - 0.06, TRAIN_HEIGHT - 0.42),
        trainLight: new THREE.BoxGeometry(0.36, 0.24, 0.12),
        trainBeam: new THREE.ConeGeometry(1.15, 6.2, 12, 1, true),
        trainBogie: new THREE.BoxGeometry(TRAIN_WIDTH - 0.3, 0.42, 2.6),
        trainWheel: new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12),
        rampWedge: makeRampGeometry(),
        rampStripe: new THREE.BoxGeometry(1.96, 0.07, Math.hypot(7.5, TRAIN_HEIGHT)),
        rampRail: new THREE.BoxGeometry(0.1, 0.24, Math.hypot(7.5, TRAIN_HEIGHT)),
        puRing: new THREE.TorusGeometry(0.7, 0.055, 8, 22),
        shadowDisc: new THREE.PlaneGeometry(1.25, 1.25),
      },
      mat: {
        coinGold: new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          roughness: 0.18,
          metalness: 0.82,
          emissive: 0x713f12,
          emissiveIntensity: 0.35,
        }),
        coinEdge: new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.25,
          metalness: 0.85,
        }),
        metalDark: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.55 }),
        metalChrome: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.9 }),
        hazard: new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.55, metalness: 0.1 }),
        redWhite: new THREE.MeshStandardMaterial({ map: redWhiteTex, roughness: 0.55, metalness: 0.1 }),
        rampDeck: new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.25 }),
        rampChevron: new THREE.MeshStandardMaterial({ map: rampChevronTex, roughness: 0.4, metalness: 0.2 }),
        headlight: new THREE.MeshBasicMaterial({ color: 0xfef9c3 }),
        headlightBeam: new THREE.MeshBasicMaterial({
          color: 0xfef9c3,
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
        taillight: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
        mysteryBox: new THREE.MeshStandardMaterial({ map: mysteryTex, roughness: 0.35, metalness: 0.2 }),
        contactShadow: new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.55,
        }),
        puJetpack: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25, metalness: 0.5 }),
        puMagnet: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25, metalness: 0.45 }),
        puSneakers: new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3, metalness: 0.2 }),
        puMult: new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.25, metalness: 0.55 }),
        puPogo: new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.5 }),
        puKey: new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          roughness: 0.15,
          metalness: 0.85,
          emissive: 0x0891b2,
          emissiveIntensity: 0.45,
        }),
        haloCyan: new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.72 }),
        haloGold: new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.72 }),
        haloPink: new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.72 }),
        haloGreen: new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.72 }),
      },
    };
    assets.geo.coin.rotateX(Math.PI / 2);
    assets.geo.coinInner.rotateX(Math.PI / 2);

    const worldGeo = {
      groundPlane: new THREE.PlaneGeometry(80, CHUNK_LEN),
      railBed: new THREE.BoxGeometry(2.38, 0.08, CHUNK_LEN),
      railBar: new THREE.BoxGeometry(0.11, 0.14, CHUNK_LEN),
      platform: new THREE.BoxGeometry(2.1, 0.48, CHUNK_LEN),
      wall: new THREE.BoxGeometry(1.3, 5.4, CHUNK_LEN),
      upperWall: new THREE.BoxGeometry(1.4, 3.8, CHUNK_LEN),
      gantryPost: new THREE.BoxGeometry(0.36, 9.8, 0.36),
      gantryBeam: new THREE.BoxGeometry(12.2, 0.42, 0.42),
      catenaryWire: new THREE.BoxGeometry(0.05, 0.05, CHUNK_LEN),
      building: new THREE.BoxGeometry(6.8, 17, 8.6),
      buildingCrown: new THREE.BoxGeometry(7.1, 0.7, 8.9),
      treeTrunk: new THREE.CylinderGeometry(0.26, 0.38, 2.3, 8),
      treeTop: new THREE.ConeGeometry(1.55, 3.4, 8),
      cactus: new THREE.CylinderGeometry(0.32, 0.36, 3.3, 8),
      mesa: new THREE.BoxGeometry(7.6, 11, 10.5),
      neonSign: new THREE.BoxGeometry(0.4, 5.6, 2.4),
      neonStrip: new THREE.BoxGeometry(11.4, 0.22, 0.46),
      canopyRoof: new THREE.BoxGeometry(12.8, 0.34, CHUNK_LEN * 0.92),
      canopyTruss: new THREE.BoxGeometry(12.8, 0.42, 0.46),
      lampPole: new THREE.CylinderGeometry(0.08, 0.1, 4.4, 8),
      lampGlobe: new THREE.BoxGeometry(0.75, 0.18, 0.32),
    };

    const worldSharedMat = {
      railBed: new THREE.MeshStandardMaterial({
        map: trackTex.map,
        bumpMap: trackTex.bumpMap,
        bumpScale: 0.04,
        roughness: 0.9,
        metalness: 0.05,
      }),
      railSteel: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.24, metalness: 0.85 }),
      metalDark: assets.mat.metalDark,
      neonCyan: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
      neonPink: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
      canopy: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.35 }),
      sodiumLight: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    };

    const biomeMaterials: Record<BiomeKey, BiomeMaterials> = {} as Record<BiomeKey, BiomeMaterials>;
    (Object.keys(BIOMES) as BiomeKey[]).forEach((k) => {
      const b = BIOMES[k];
      const bHexA = '#' + b.buildingA.toString(16).padStart(6, '0');
      const bHexB = '#' + b.buildingB.toString(16).padStart(6, '0');
      const winGlow =
        k === 'tokyo'
          ? '#22d3ee'
          : k === 'canyon'
            ? '#fde68a'
            : k === 'arctic'
              ? '#e0f2fe'
              : k === 'cyberport'
                ? '#fde047'
                : '#fef08a';
      const winGlowB = k === 'tokyo' ? '#f472b6' : k === 'cyberport' ? '#38bdf8' : '#bae6fd';
      biomeMaterials[k] = {
        ground: new THREE.MeshStandardMaterial({ color: b.ground, roughness: 0.94, metalness: 0.02 }),
        wall: new THREE.MeshStandardMaterial({
          map: makeGraffitiWallTexture(b.wallHex, b.accentA, b.accentB, maxAniso),
          roughness: 0.88,
          metalness: 0.04,
        }),
        platform: new THREE.MeshStandardMaterial({
          map: makePlatformTexture(b.platform, '#facc15', maxAniso),
          roughness: 0.82,
          metalness: 0.05,
        }),
        buildingA: new THREE.MeshStandardMaterial({
          map: makeBuildingFacadeTexture(bHexA, winGlow, maxAniso),
          roughness: 0.72,
          metalness: 0.12,
        }),
        buildingB: new THREE.MeshStandardMaterial({
          map: makeBuildingFacadeTexture(bHexB, winGlowB, maxAniso),
          roughness: 0.72,
          metalness: 0.14,
        }),
        foliage: new THREE.MeshStandardMaterial({ color: b.foliage, roughness: 0.86 }),
        trunk: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.92 }),
        trainA: new THREE.MeshStandardMaterial({
          map: makeTrainSideTexture(b.trainA, '#f8fafc', b.accentA, maxAniso, true),
          roughness: 0.32,
          metalness: 0.45,
        }),
        trainB: new THREE.MeshStandardMaterial({
          map: makeTrainSideTexture(b.trainB, '#facc15', b.accentB, maxAniso, false),
          roughness: 0.28,
          metalness: 0.5,
        }),
        trainFrontA: new THREE.MeshStandardMaterial({
          map: makeTrainFrontTexture(b.trainA, 'CENTRAL', maxAniso),
          roughness: 0.3,
          metalness: 0.45,
        }),
        trainFrontB: new THREE.MeshStandardMaterial({
          map: makeTrainFrontTexture(b.trainB, 'EXPRESSO', maxAniso),
          roughness: 0.26,
          metalness: 0.5,
        }),
        roof: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.55, metalness: 0.4 }),
      };
    });

    // 4. Track Chunks
    const chunks: TrackChunk[] = [];
    for (let i = 0; i < NUM_CHUNKS; i++) {
      const group = new THREE.Group();
      const scenery = new THREE.Group();
      group.add(scenery);
      group.position.z = CHUNK_LEN - i * CHUNK_LEN;
      const ch: TrackChunk = { group, scenery, index: i, biomeKey: saveRef.current.selectedBiome };
      populateChunkScenery(
        ch,
        saveRef.current.selectedBiome,
        i,
        biomeMaterials[saveRef.current.selectedBiome],
        worldGeo,
        worldSharedMat
      );
      scene.add(group);
      chunks.push(ch);
    }

    // 5. Player, Chaser & Pooled Particles
    const runnerRig = createRunnerRig(
      getCharacterDef(saveRef.current.selectedCharacter),
      getHoverboardDef(saveRef.current.selectedBoard),
      assets.mat.contactShadow
    );
    scene.add(runnerRig.root);

    const chaserRig = createChaserRig(assets.mat.contactShadow);
    chaserRig.group.position.set(-1.3, 0, 4.4);
    scene.add(chaserRig.group);

    const particles = new ParticlePool(scene, 180);

    // 6. Obstacles & Collectibles Management
    const worldEntitiesGroup = new THREE.Group();
    scene.add(worldEntitiesGroup);
    let activeObstacles: ObstacleEntity[] = [];
    let activeCollectibles: CollectibleEntity[] = [];

    function spawnLowBarrier(lane: number, z: number): void {
      const g = new THREE.Group();
      const plank = new THREE.Mesh(assets.geo.barrierLowBar, assets.mat.redWhite);
      plank.position.y = 0.78;
      const legFL = new THREE.Mesh(assets.geo.barrierLowLeg, assets.mat.metalDark);
      legFL.position.set(-1.02, 0.55, 0.16);
      legFL.rotation.x = -0.22;
      const legBL = legFL.clone();
      legBL.position.z = -0.16;
      legBL.rotation.x = 0.22;
      const legFR = legFL.clone();
      legFR.position.x = 1.02;
      const legBR = legBL.clone();
      legBR.position.x = 1.02;
      const coneL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.26), assets.mat.taillight);
      coneL.position.set(-0.92, 1.12, 0);
      const coneR = coneL.clone();
      coneR.position.x = 0.92;
      g.add(plank, legFL, legBL, legFR, legBR, coneL, coneR);
      g.position.set(lane * LANE_WIDTH, 0, z);
      worldEntitiesGroup.add(g);
      activeObstacles.push({
        type: 'lowBarrier',
        lane,
        z,
        length: 0.55,
        halfLen: 0.28,
        minY: 0,
        maxY: 1.12,
        extraSpeed: 0,
        mesh: g,
      });
    }

    function spawnHighBarrier(lane: number, z: number): void {
      const g = new THREE.Group();
      const bar = new THREE.Mesh(assets.geo.barrierHighBar, assets.mat.hazard);
      bar.position.y = 1.88;
      const pL = new THREE.Mesh(assets.geo.barrierPost, assets.mat.metalDark);
      pL.position.set(-1.14, 1.35, 0);
      const pR = pL.clone();
      pR.position.x = 1.14;
      const beaconL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.28), assets.mat.taillight);
      beaconL.position.set(-0.85, 2.42, 0);
      const beaconR = beaconL.clone();
      beaconR.position.x = 0.85;
      g.add(bar, pL, pR, beaconL, beaconR);
      g.position.set(lane * LANE_WIDTH, 0, z);
      worldEntitiesGroup.add(g);
      activeObstacles.push({
        type: 'highBarrier',
        lane,
        z,
        length: 0.58,
        halfLen: 0.29,
        minY: 1.16,
        maxY: 2.75,
        extraSpeed: 0,
        mesh: g,
      });
    }

    function spawnTrain(lane: number, z: number, moving: boolean, biomeKey: BiomeKey): void {
      const bm = biomeMaterials[biomeKey];
      const trainGroup = buildTrainGroup(
        moving ? bm.trainB : bm.trainA,
        moving ? bm.trainFrontB : bm.trainFrontA,
        bm.roof,
        moving,
        assets
      );
      trainGroup.position.set(lane * LANE_WIDTH, 0, z);
      worldEntitiesGroup.add(trainGroup);
      activeObstacles.push({
        type: 'train',
        isTrain: true,
        moving,
        hornPlayed: false,
        lane,
        z,
        length: 13.5,
        halfLen: 6.75,
        minY: 0,
        maxY: TRAIN_HEIGHT,
        extraSpeed: moving ? 16 : 0,
        mesh: trainGroup,
      });
    }

    function spawnRamp(lane: number, z: number): void {
      const g = new THREE.Group();
      const wedge = new THREE.Mesh(assets.geo.rampWedge, assets.mat.rampDeck);
      const stripe = new THREE.Mesh(assets.geo.rampStripe, assets.mat.rampChevron);
      const slopeAngle = Math.atan2(TRAIN_HEIGHT, 7.5);
      stripe.position.set(0, TRAIN_HEIGHT / 2 + 0.06, 0);
      stripe.rotation.x = slopeAngle;
      const railL = new THREE.Mesh(assets.geo.rampRail, assets.mat.metalDark);
      railL.position.set(-1.08, TRAIN_HEIGHT / 2 + 0.12, 0);
      railL.rotation.x = slopeAngle;
      const railR = railL.clone();
      railR.position.x = 1.08;
      g.add(wedge, stripe, railL, railR);
      g.position.set(lane * LANE_WIDTH, 0, z);
      worldEntitiesGroup.add(g);
      activeObstacles.push({
        type: 'ramp',
        isRamp: true,
        lane,
        z,
        length: 7.5,
        halfLen: 3.75,
        minY: 0,
        maxY: TRAIN_HEIGHT,
        extraSpeed: 0,
        mesh: g,
      });
    }

    function spawnCoin(lane: number, y: number, z: number, isSkyCoin = false): void {
      const g = new THREE.Group();
      const outer = new THREE.Mesh(assets.geo.coin, assets.mat.coinGold);
      const inner = new THREE.Mesh(assets.geo.coinInner, assets.mat.coinEdge);
      g.add(outer, inner);
      g.position.set(lane * LANE_WIDTH, y, z);
      worldEntitiesGroup.add(g);
      activeCollectibles.push({ kind: 'coin', lane, baseY: y, z, isSkyCoin, mesh: g });
    }

    function spawnCoinLine(
      lane: number,
      yStart: number,
      zStart: number,
      count: number,
      stepZ = 2.4,
      yArc = 0,
      isSkyCoin = false
    ): void {
      for (let i = 0; i < count; i++) {
        let y = yStart;
        if (yArc > 0 && count > 1) {
          const t = i / (count - 1);
          y += Math.sin(t * Math.PI) * yArc;
        }
        spawnCoin(lane, y, zStart - i * stepZ, isSkyCoin);
      }
    }

    function spawnPowerUpEntity(
      kind: 'key' | 'mystery' | PowerUpType,
      lane: number,
      y: number,
      z: number
    ): void {
      const mesh = buildPowerUpMesh(kind, assets);
      mesh.position.set(lane * LANE_WIDTH, y, z);
      worldEntitiesGroup.add(mesh);
      activeCollectibles.push({ kind, lane, baseY: y, z, mesh });
    }

    function pickRandomPowerUp(): PowerUpType {
      const pool: PowerUpType[] = ['magnet', 'sneakers', 'multiplier', 'jetpack', 'pogo'];
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function spawnWave(baseZ: number, biomeKey: BiomeKey, distanceM: number, curSpeed: number): number {
      const pattern = Math.floor(Math.random() * 8);
      const lanes = [-1, 0, 1];
      const shuffled = lanes.slice().sort(() => Math.random() - 0.5);
      const [L0, L1, L2] = shuffled;
      const speedPad = Math.max(0, (curSpeed - 24) * 0.45);

      if (pattern === 0) {
        spawnLowBarrier(L0, baseZ);
        spawnHighBarrier(L1, baseZ);
        spawnLowBarrier(L2, baseZ - 14);
        spawnCoinLine(L2, 1.0, baseZ + 2, 5, 2.2, 1.8);
        if (Math.random() < 0.45) {
          spawnPowerUpEntity(pickRandomPowerUp(), L0, 1.15, baseZ - 15);
        }
        return 34 + speedPad;
      } else if (pattern === 1) {
        spawnRamp(L0, baseZ);
        spawnTrain(L0, baseZ - 10.5, false, biomeKey);
        spawnCoinLine(L0, TRAIN_HEIGHT + 0.9, baseZ - 5, 6, 2.1, 0);
        spawnHighBarrier(L1, baseZ - 6);
        spawnCoinLine(L2, 0.95, baseZ - 2, 5, 2.4, 0);
        if (Math.random() < 0.5) {
          spawnPowerUpEntity(pickRandomPowerUp(), L0, TRAIN_HEIGHT + 1.15, baseZ - 12);
        }
        return 36 + speedPad;
      } else if (pattern === 2) {
        if (distanceM > 35 && canSpawnMovingTrain(L0, baseZ - 28, curSpeed, activeObstacles)) {
          spawnTrain(L0, baseZ - 28, true, biomeKey);
        } else {
          spawnLowBarrier(L0, baseZ - 4);
        }
        spawnLowBarrier(L1, baseZ - 6);
        spawnCoinLine(L2, 0.95, baseZ, 6, 2.4, 0);
        return 42 + speedPad;
      } else if (pattern === 3) {
        spawnTrain(L0, baseZ - 8, false, biomeKey);
        spawnTrain(L1, baseZ - 8, false, biomeKey);
        spawnCoinLine(L2, 0.95, baseZ - 1, 6, 2.4, 0);
        spawnLowBarrier(L2, baseZ - 17);
        if (Math.random() < 0.35) {
          spawnPowerUpEntity('mystery', L2, 1.2, baseZ - 24);
        }
        return 38 + speedPad;
      } else if (pattern === 4) {
        spawnLowBarrier(L0, baseZ);
        spawnHighBarrier(L0, baseZ - 13);
        spawnTrain(L1, baseZ - 9, false, biomeKey);
        spawnCoinLine(L0, 1.0, baseZ + 2, 4, 2.0, 1.7);
        if (Math.random() < 0.48) {
          spawnPowerUpEntity(pickRandomPowerUp(), L2, 1.15, baseZ - 9);
        }
        return 36 + speedPad;
      } else if (pattern === 5) {
        // Seamless coupled train cars (0.1m seam) with zero drop trap between cars
        spawnRamp(L1, baseZ);
        spawnTrain(L1, baseZ - 10.5, false, biomeKey);
        spawnTrain(L1, baseZ - 24.1, false, biomeKey);
        spawnCoinLine(L1, TRAIN_HEIGHT + 0.95, baseZ - 5.5, 9, 2.7, 0);
        spawnTrain(L0, baseZ - 14, false, biomeKey);
        spawnLowBarrier(L2, baseZ - 12);
        return 43 + speedPad;
      } else if (pattern === 6) {
        spawnLowBarrier(L0, baseZ);
        spawnHighBarrier(L1, baseZ);
        spawnCoinLine(L2, 0.95, baseZ + 1, 5, 2.4, 0);
        if (Math.random() < 0.18) {
          spawnPowerUpEntity('key', L2, 1.15, baseZ - 13);
        } else {
          spawnPowerUpEntity(pickRandomPowerUp(), L2, 1.15, baseZ - 13);
        }
        return 34 + speedPad;
      } else {
        let maxExtent = 38;
        if (distanceM > 140 && canSpawnMovingTrain(L0, baseZ - 26, curSpeed, activeObstacles)) {
          spawnTrain(L0, baseZ - 26, true, biomeKey);
          maxExtent = 44;
          if (canSpawnMovingTrain(L1, baseZ - 34, curSpeed, activeObstacles)) {
            spawnTrain(L1, baseZ - 34, true, biomeKey);
            maxExtent = 48;
          } else {
            spawnLowBarrier(L1, baseZ - 8);
          }
        } else {
          spawnTrain(L0, baseZ - 10, false, biomeKey);
          spawnLowBarrier(L1, baseZ - 8);
        }
        spawnCoinLine(L2, 0.95, baseZ, 6, 2.5, 0);
        return maxExtent + speedPad;
      }
    }

    function spawnJetpackSkyCoins(zStart: number): void {
      const lane = Math.floor(Math.random() * 3) - 1;
      spawnCoinLine(lane, 5.65, zStart, 7, 2.3, 0, true);
    }

    // 7. Simulation State
    let gameState: GameState = 'title';
    let nextWaveDist = 18;
    let hudSyncAccum = 0;

    const run = {
      activeBiome: saveRef.current.selectedBiome as BiomeKey,
      worldTourAuto: saveRef.current.worldTourAuto,
      nextBiomeDist: 500,
      speed: 22,
      distance: 0,
      score: 0,
      runCoins: 0,
      jumps: 0,
      rolls: 0,
      powerupsCollected: 0,
      boardsUsed: 0,
      mysteryPicked: 0,
      nearMissCount: 0,
      lane: 0,
      prevLane: 0,
      x: 0,
      y: 0,
      vy: 0,
      groundY: 0,
      isRolling: false,
      rollTimer: 0,
      jumpBuffer: 0,
      rollBuffer: 0,
      coyoteTimer: 0,
      squashY: 1,
      animPhase: 0,
      dodgeTimer: 0,
      dodgeDir: 0,
      boardKickflipTimer: 0,
      jumpFlipTimer: 0,
      introChaseTimer: 0,
      stumbleTimer: 0,
      dyingTimer: 0,
      pendingSummary: null as RunEndSummary | null,
      invulnTimer: 0,
      hitstopTimer: 0,
      trauma: 0,
      camX: 0,
      camY: 5.2,
      camZ: 8.5,
      camLookY: 1.85,
      camRoll: 0,
      jetpackExtraTimer: 0,
      lastSpawnedTailZ: -120,
      pu: { jetpack: 0, magnet: 0, sneakers: 0, multiplier: 0, board: 0 },
      comboCount: 0,
      comboBonus: 0,
      comboTimer: 0,
      comboPopup: null as ComboPopupEvent | null,
      comboPopupTimer: 0,
      comboPopupSeq: 0,
      level: 1,
      levelMultiplierBonus: 0,
      shieldActive: false,
      nearMissCooldown: 0,
      completedMissionsInRun: 0,
      deltaJumps: 0,
      deltaRolls: 0,
      deltaPowerups: 0,
      deltaBoards: 0,
      startAccountLevel: computeAccountLevel(saveRef.current.xp),
      lastCelebratedAccountLevel: computeAccountLevel(saveRef.current.xp),
      pendingLevelUpModal: null as LevelUnlockSummary | null,
      levelUpSplashTimer: 0,
      levelUpSplash: null as { level: number; title: string; isMilestone?: boolean } | null,
    };

    function syncBodyState(s: GameState): void {
      gameState = s;
      document.body.dataset.state = s;
      soundEngine.setMusicMode(
        s === 'playing' ? 'run' : s === 'title' ? 'menu' : s === 'paused' ? 'paused' : 'off'
      );
      callbacksRef.current.onStateChange(s);
    }

    function applyBiomeLighting(biomeKey: BiomeKey, instant = false): void {
      run.activeBiome = biomeKey;
      soundEngine.setBiome(biomeKey);
      const b = BIOMES[biomeKey];
      if (instant) {
        scene.background = new THREE.Color(b.sky);
        (scene.fog as THREE.Fog).color.setHex(b.fog);
        hemiLight.color.setHex(b.ambientSky);
        hemiLight.groundColor.setHex(b.ambientGround);
        dirLight.color.setHex(b.sun);
      }
    }

    function rebuildAllChunks(biomeKey: BiomeKey): void {
      chunks.forEach((ch, idx) => {
        ch.group.position.z = CHUNK_LEN - idx * CHUNK_LEN;
        populateChunkScenery(ch, biomeKey, idx, biomeMaterials[biomeKey], worldGeo, worldSharedMat);
      });
    }

    function clearWorldEntities(): void {
      activeObstacles.forEach((o) => worldEntitiesGroup.remove(o.mesh));
      activeCollectibles.forEach((c) => worldEntitiesGroup.remove(c.mesh));
      activeObstacles = [];
      activeCollectibles = [];
    }

    function syncMissions(forceCommit = false): void {
      const hasDelta =
        run.deltaJumps > 0 ||
        run.deltaRolls > 0 ||
        run.deltaPowerups > 0 ||
        run.deltaBoards > 0 ||
        forceCommit;

      if (!hasDelta && run.runCoins === 0 && run.distance < 10) return;

      const res = applyRunMissionProgress(
        saveRef.current,
        {
          coins: run.runCoins,
          dist: run.distance,
          jumps: run.jumps,
          rolls: run.rolls,
          powerups: run.powerupsCollected,
          boards: run.boardsUsed,
        },
        {
          jumps: run.deltaJumps,
          rolls: run.deltaRolls,
          powerups: run.deltaPowerups,
          boards: run.deltaBoards,
        }
      );

      run.deltaJumps = 0;
      run.deltaRolls = 0;
      run.deltaPowerups = 0;
      run.deltaBoards = 0;

      if (res.save !== saveRef.current) {
        saveRef.current = res.save;
        callbacksRef.current.onSaveUpdate(res.save);
      }

      if (res.newlyCompleted.length > 0) {
        run.completedMissionsInRun += res.newlyCompleted.length;
        soundEngine.unlock();
      }
    }

    function registerComboAction(amount = 1): void {
      const charDef = getCharacterDef(saveRef.current.selectedCharacter);
      const scaledAmount = amount * (charDef.perks.comboGainMultiplier ?? 1);
      const prevBonus = run.comboBonus;
      run.comboCount += scaledAmount;
      run.comboTimer = COMBO_WINDOW_SECONDS;
      const nextBonus = computeComboBonus(run.comboCount);
      run.comboBonus = nextBonus;

      if (nextBonus > prevBonus) {
        soundEngine.comboMilestone(nextBonus);
        pushHudSnapshot();
      }
    }

    function pushHudSnapshot(): void {
      const save = saveRef.current;
      const charDef = getCharacterDef(save.selectedCharacter);
      const durBonus = charDef.perks.powerupDurationBonus ?? 0;
      const mult = computeActiveMultiplier(
        save.baseMultiplier,
        run.pu.multiplier > 0,
        run.comboBonus,
        run.levelMultiplierBonus
      );
      const active = getActiveDailyMission(save);
      const liveMetric =
        active.def.type === 'coins'
          ? run.runCoins
          : active.def.type === 'dist'
          ? Math.floor(run.distance)
          : active.state.progress;

      const levelProfile = getLevelProfile(run.level);
      const nextThreshold = getNextLevelThreshold(run.level);
      const span = Math.max(1, nextThreshold - levelProfile.minDistance);
      const levelProgressPct = ((run.distance - levelProfile.minDistance) / span) * 100;

      const bars: ActivePowerUpBar[] = [];
      const defs: { k: keyof typeof run.pu; label: string; max: number; color: string }[] = [
        {
          k: 'jetpack',
          label: 'Jetpack',
          max: getPowerUpDuration('jetpack', save.upgrades, durBonus),
          color: '#ef4444',
        },
        {
          k: 'magnet',
          label: 'Íman',
          max: Math.max(6, getPowerUpDuration('magnet', save.upgrades, durBonus)),
          color: '#3b82f6',
        },
        {
          k: 'sneakers',
          label: 'Super Ténis',
          max: getPowerUpDuration('sneakers', save.upgrades, durBonus),
          color: '#22c55e',
        },
        {
          k: 'multiplier',
          label: '2x Pontos',
          max: Math.max(10, getPowerUpDuration('multiplier', save.upgrades, durBonus)),
          color: '#e879f9',
        },
        {
          k: 'board',
          label: getHoverboardDef(save.selectedBoard).name,
          max: 24,
          color: '#06b6d4',
        },
      ];

      defs.forEach((d) => {
        if (run.pu[d.k] > 0) {
          bars.push({
            key: d.k,
            label: d.label,
            remaining: run.pu[d.k],
            max: d.max,
            color: d.color,
          });
        }
      });

      const liveXp =
        save.xp +
        calculateRunXp({
          distance: run.distance,
          runCoins: run.runCoins,
          completedMissions: run.completedMissionsInRun,
          nearMisses: run.nearMissCount,
        });
      const xpInfo = getAccountXpProgress(liveXp);
      if (xpInfo.level > run.lastCelebratedAccountLevel) {
        const prevCelebrated = run.lastCelebratedAccountLevel;
        run.lastCelebratedAccountLevel = xpInfo.level;
        const levelSummary = getLevelUnlockSummary(xpInfo.level, prevCelebrated, 'live');
        soundEngine.levelUp();
        if (levelSummary.isMilestone) {
          soundEngine.comboMilestone(4);
          particles.burst(run.x, run.y + 1.15, 0, 0xfacc15, 18, 7.8, 1.35);
          particles.burst(run.x, run.y + 1.35, -0.3, 0x22d3ee, 14, 6.8, 1.15);
          particles.burst(run.x, run.y + 1.0, 0.3, 0x34d399, 14, 6.2, 1.1);
        } else {
          particles.burst(run.x, run.y + 1.2, 0, 0x38bdf8, 14, 6.2, 1.1);
        }
      }

      callbacksRef.current.onHudUpdate({
        score: run.score,
        multiplier: mult,
        runCoins: run.runCoins,
        keys: save.keys,
        distance: run.distance,
        boards: save.boards,
        boardActive: run.pu.board > 0,
        boardName: getHoverboardDef(save.selectedBoard).name,
        biome: run.activeBiome,
        stumbleActive: run.stumbleTimer > 0,
        level: run.level,
        levelTitle: levelProfile.title,
        levelProgressPct,
        shieldActive: run.shieldActive,
        characterPowerName: charDef.powerName,
        activeMission: active.def,
        activeMissionProgress: active.def.perRun
          ? Math.max(active.state.progress, liveMetric)
          : active.state.progress,
        completedCount: save.dailyMissions.filter((m) => m.completed).length,
        totalMissions: save.dailyMissions.length,
        powerups: bars,
        comboCount: run.comboCount,
        comboBonus: run.comboBonus,
        comboTimer: run.comboTimer,
        comboMaxTimer: COMBO_WINDOW_SECONDS,
        comboPopup: run.comboPopupTimer > 0 ? run.comboPopup : null,
        accountXp: liveXp,
        accountLevel: xpInfo.level,
        accountXpPct: xpInfo.pct,
        levelUpSplash: run.levelUpSplash,
      });
    }

    function clearNearbyObstacles(radius = 28): void {
      for (let i = activeObstacles.length - 1; i >= 0; i--) {
        if (Math.abs(activeObstacles[i].z) < radius) {
          worldEntitiesGroup.remove(activeObstacles[i].mesh);
          activeObstacles.splice(i, 1);
        }
      }
    }

    function startNewRun(): void {
      soundEngine.init();
      soundEngine.whistle();
      clearWorldEntities();

      const save = saveRef.current;
      const charDef = getCharacterDef(save.selectedCharacter);
      runnerRig.applyCharacter(charDef);
      runnerRig.applyHoverboard(getHoverboardDef(save.selectedBoard), save.customBoard);

      run.activeBiome = save.selectedBiome;
      run.worldTourAuto = save.worldTourAuto;
      run.nextBiomeDist = 500;
      applyBiomeLighting(run.activeBiome, true);
      rebuildAllChunks(run.activeBiome);

      run.speed = 22;
      run.distance = 0;
      run.score = 0;
      run.runCoins = 0;
      run.jumps = 0;
      run.rolls = 0;
      run.powerupsCollected = 0;
      run.boardsUsed = 0;
      run.mysteryPicked = 0;
      run.nearMissCount = 0;
      run.completedMissionsInRun = 0;
      run.deltaJumps = 0;
      run.deltaRolls = 0;
      run.deltaPowerups = 0;
      run.deltaBoards = 0;
      run.lane = 0;
      run.prevLane = 0;
      run.x = 0;
      run.y = 0;
      run.vy = 0;
      run.groundY = 0;
      run.isRolling = false;
      run.rollTimer = 0;
      run.jumpBuffer = 0;
      run.rollBuffer = 0;
      run.coyoteTimer = 0;
      run.squashY = 1;
      run.dodgeTimer = 0;
      run.dodgeDir = 0;
      run.boardKickflipTimer = 0;
      run.jumpFlipTimer = 0;
      run.introChaseTimer = 3.5;
      run.stumbleTimer = 0;
      run.dyingTimer = 0;
      run.pendingSummary = null;
      run.invulnTimer = 0;
      run.hitstopTimer = 0;
      run.trauma = 0;
      run.camX = 0;
      run.camY = 5.0;
      run.camZ = 8.5;
      run.camLookY = 1.85;
      run.camRoll = 0;
      run.jetpackExtraTimer = 0;
      const searchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const testJetpack = Boolean(searchParams?.has('testjetpack'));
      const testLevelUpParam = searchParams?.get('testlevelup');
      const testLevelUpTarget = testLevelUpParam ? Math.max(2, Number(testLevelUpParam) || 0) : 0;

      run.startAccountLevel = computeAccountLevel(save.xp);
      run.lastCelebratedAccountLevel = run.startAccountLevel;
      run.pendingLevelUpModal = null;
      run.levelUpSplash = null;
      run.levelUpSplashTimer = 0;

      run.pu = {
        jetpack: testJetpack ? 4.5 : 0,
        magnet: charDef.perks.magnetStartSeconds ?? 0,
        sneakers: 0,
        multiplier: charDef.perks.start2xSeconds ?? 0,
        board: charDef.perks.freeStartBoard ? 24 : 0,
      };
      run.comboCount = 0;
      run.comboBonus = 0;
      run.comboTimer = 0;
      run.comboPopup = null;
      run.comboPopupTimer = 0;
      run.level = 1;
      run.levelMultiplierBonus = 0;
      run.shieldActive = Boolean(charDef.perks.startShield);
      run.nearMissCooldown = 0;
      soundEngine.setDifficulty(1, run.speed);

      runnerRig.root.position.set(0, 0, 0);
      runnerRig.bodyPivot.rotation.set(0, 0, 0);
      runnerRig.bodyPivot.scale.set(1, 1, 1);
      runnerRig.headGroup.rotation.set(0, 0, 0);
      runnerRig.boardGroup.rotation.set(0, 0, 0);
      runnerRig.boardSpinGroup.rotation.set(0, 0, 0);
      runnerRig.jetpackGroup.visible = run.pu.jetpack > 0;
      runnerRig.boardGroup.visible = run.pu.board > 0;
      runnerRig.magnetAura.visible = run.pu.magnet > 0;
      runnerRig.shieldAura.visible = run.shieldActive;
      runnerRig.root.visible = true;

      // Guarantee open first 48 meters so the game survives without immediate input
      let zCursor = -52;
      for (let i = 0; i < 4; i++) {
        zCursor -= spawnWave(zCursor, run.activeBiome, 0, run.speed);
      }
      run.lastSpawnedTailZ = zCursor;
      nextWaveDist = testJetpack ? 0 : 18;
      syncBodyState('playing');
      pushHudSnapshot();

      if (testLevelUpTarget >= 2) {
        const prevTest = Math.max(1, testLevelUpTarget - 1);
        run.lastCelebratedAccountLevel = testLevelUpTarget;
        const summaryInfo = getLevelUnlockSummary(testLevelUpTarget, prevTest, 'live');
        if (summaryInfo.isMilestone) {
          particles.burst(run.x, run.y + 1.15, 0, 0xfacc15, 18, 7.8, 1.35);
          particles.burst(run.x, run.y + 1.35, -0.3, 0x22d3ee, 14, 6.8, 1.15);
        }
        if (callbacksRef.current.onAccountLevelUp) {
          syncBodyState('paused');
          callbacksRef.current.onAccountLevelUp(summaryInfo);
        }
      }
    }

    function moveLane(dir: -1 | 1): void {
      if (gameState !== 'playing') return;
      const target = Math.max(-1, Math.min(1, run.lane + dir));
      if (target !== run.lane) {
        run.prevLane = run.lane;
        run.lane = target;
        run.dodgeDir = dir;
        run.dodgeTimer = 0.24;
        soundEngine.lane();
        registerComboAction(1);
        if (run.y <= run.groundY + 0.15) {
          const fxColor = run.pu.board > 0 ? getHoverboardDef(saveRef.current.selectedBoard).glowColor : 0xe2e8f0;
          particles.burst(run.x, run.y + 0.18, 0.2, fxColor, 6, 3.4, 0.85);
        }
      }
    }

    function executeJump(): void {
      const charDef = getCharacterDef(saveRef.current.selectedCharacter);
      const boardDef = getHoverboardDef(saveRef.current.selectedBoard);
      const baseJump = run.pu.sneakers > 0 ? 19.6 : 14.8;
      const charJumpBonus = charDef.perks.jumpBonus ?? 0;
      const boardJumpBonus = run.pu.board > 0 ? Math.min(2.2, boardDef.jumpBonus) : 0;
      run.isRolling = false;
      run.rollTimer = 0;
      run.vy = baseJump + charJumpBonus + boardJumpBonus;
      run.coyoteTimer = 0;
      run.jumpBuffer = 0;
      run.squashY = 1.22;
      if (run.pu.board > 0) {
        run.boardKickflipTimer = 0.44;
      } else if (run.pu.sneakers > 0) {
        run.jumpFlipTimer = 0.52;
      }
      run.jumps += 1;
      run.deltaJumps += 1;
      soundEngine.jump(run.pu.sneakers > 0);
      registerComboAction(1);
      particles.burst(run.x, run.y + 0.12, 0.1, run.pu.board > 0 ? boardDef.glowColor : 0xf8fafc, 6, 3.2, 0.85);
    }

    function requestJump(): void {
      if (gameState !== 'playing' || run.pu.jetpack > 0) return;
      if (run.y <= run.groundY + 0.08 || run.coyoteTimer > 0) {
        executeJump();
      } else {
        run.jumpBuffer = 0.13;
      }
    }

    function requestRoll(): void {
      if (gameState !== 'playing' || run.pu.jetpack > 0) return;
      if (run.y > run.groundY + 0.12) {
        run.vy = -28;
      }
      if (!run.isRolling) {
        run.rolls += 1;
        run.deltaRolls += 1;
        registerComboAction(1);
      }
      run.isRolling = true;
      run.rollTimer = 0.62;
      run.squashY = 0.78;
      soundEngine.roll();
    }

    function activateBoard(): void {
      if (gameState !== 'playing' || run.pu.board > 0) return;
      const save = saveRef.current;
      if (save.boards <= 0) {
        return;
      }
      const nextSave: SaveData = { ...save, boards: save.boards - 1 };
      saveRef.current = nextSave;
      callbacksRef.current.onSaveUpdate(nextSave);

      run.pu.board = 24;
      run.boardsUsed += 1;
      run.deltaBoards += 1;
      runnerRig.boardGroup.visible = true;
      soundEngine.hoverboardActivate();
      particles.burst(run.x, run.y + 0.3, 0, getHoverboardDef(save.selectedBoard).glowColor, 12, 5, 1.1);
      pushHudSnapshot();
    }

    function absorbWithShieldOrBoard(): boolean {
      if (run.shieldActive) {
        run.shieldActive = false;
        runnerRig.shieldAura.visible = false;
        run.invulnTimer = 2.2;
        run.hitstopTimer = 0.05;
        run.trauma = 0.55;
        clearNearbyObstacles(30);
        soundEngine.shieldBreak();
        particles.burst(run.x, run.y + 1.0, 0, 0x38bdf8, 20, 7.5, 1.3);
        pushHudSnapshot();
        return true;
      }
      if (run.pu.board > 0) {
        run.pu.board = 0;
        runnerRig.boardGroup.visible = false;
        run.invulnTimer = 1.9;
        run.hitstopTimer = 0.055;
        run.trauma = 0.7;
        clearNearbyObstacles(28);
        soundEngine.boardBreak();
        particles.burst(run.x, run.y + 0.8, 0, 0x22d3ee, 20, 7, 1.3);
        pushHudSnapshot();
        return true;
      }
      return false;
    }

    function handleCollisionImpact(reason: string, headOnTrain = false): void {
      if (run.invulnTimer > 0) return;
      if (absorbWithShieldOrBoard()) return;

      // Subway Surfers 2-hit system: 1st hit = stumble + slowdown + Inspector & Dog rush up; 2nd hit = Game Over!
      if (run.stumbleTimer <= 0) {
        run.stumbleTimer = 8.0;
        run.invulnTimer = 1.35;
        run.hitstopTimer = 0.055;
        run.trauma = 0.65;
        run.speed = Math.max(14.5, run.speed * 0.66);
        if (headOnTrain) {
          clearNearbyObstacles(15);
        }
        soundEngine.stumble();
        particles.burst(run.x, run.y + 1.0, 0, 0xf87171, 14, 5.8, 1.1);
        pushHudSnapshot();
        return;
      }

      // 2nd hit while Inspector & Dog are right behind you -> GTA 5 Capture Game Over!
      triggerCrash(reason);
    }

    function triggerCrash(reason: string): void {
      if (run.invulnTimer > 0) return;
      if (absorbWithShieldOrBoard()) return;

      soundEngine.gtaWasted();
      run.hitstopTimer = 0.04;
      run.trauma = 0.95;
      particles.burst(run.x, run.y + 1.0, 0, 0xfb923c, 22, 7.5, 1.35);

      syncMissions(true);

      let save = saveRef.current;
      let mysteryOpened = null;
      if (run.mysteryPicked > 0) {
        mysteryOpened = rollMysteryBoxReward();
        if (mysteryOpened.kind === 'coins') {
          save = { ...save, coins: save.coins + mysteryOpened.amount };
        } else if (mysteryOpened.kind === 'boards') {
          save = { ...save, boards: save.boards + mysteryOpened.amount };
        } else {
          save = { ...save, keys: save.keys + mysteryOpened.amount };
        }
      }

      const finalScore = Math.floor(run.score);
      const isNewBest = finalScore > save.bestScore;
      const xpGained = calculateRunXp({
        distance: run.distance,
        runCoins: run.runCoins,
        completedMissions: run.completedMissionsInRun,
        nearMisses: run.nearMissCount,
      });
      const prevAccLvl = computeAccountLevel(save.xp);
      const nextXp = save.xp + xpGained;
      const nextAccLvl = computeAccountLevel(nextXp);

      let updatedSave: SaveData = {
        ...save,
        coins: save.coins + run.runCoins,
        xp: nextXp,
        bestScore: isNewBest ? finalScore : save.bestScore,
      };
      const milestoneRes = applyAccountMilestones(updatedSave);
      updatedSave = milestoneRes.save;
      if (milestoneRes.newlyUnlocked.length > 0) {
        soundEngine.levelUp();
      }
      updatedSave = recordRunToLeaderboard(updatedSave, {
        score: finalScore,
        distance: Math.floor(run.distance),
        coins: run.runCoins,
        characterId: updatedSave.selectedCharacter,
        date: getTodayDateKey(),
      });
      saveRef.current = updatedSave;
      callbacksRef.current.onSaveUpdate(updatedSave);

      run.pendingSummary = {
        score: finalScore,
        distance: Math.floor(run.distance),
        runCoins: run.runCoins,
        bestScore: Math.floor(updatedSave.bestScore),
        isNewBest,
        reason,
        mysteryOpened,
        completedMissionsCount: run.completedMissionsInRun,
        levelReached: run.level,
        xpGained,
        accountLevelAfter: nextAccLvl,
        leveledUpAccount: nextAccLvl > prevAccLvl,
        unlockedMilestones: milestoneRes.newlyUnlocked,
      };
      if (nextAccLvl > run.startAccountLevel) {
        run.pendingLevelUpModal = getLevelUnlockSummary(nextAccLvl, run.startAccountLevel, 'summary');
      }
      run.dyingTimer = 1.35;
      syncBodyState('dying');
    }

    function reviveRun(): void {
      const save = saveRef.current;
      if (save.keys <= 0) return;
      const nextSave: SaveData = { ...save, keys: save.keys - 1 };
      saveRef.current = nextSave;
      callbacksRef.current.onSaveUpdate(nextSave);

      clearNearbyObstacles(36);
      run.y = 0;
      run.vy = 0;
      run.groundY = 0;
      run.stumbleTimer = 0;
      run.introChaseTimer = 0;
      run.dyingTimer = 0;
      run.pendingSummary = null;
      run.invulnTimer = 2.6;
      runnerRig.bodyPivot.rotation.set(0, 0, 0);
      runnerRig.bodyPivot.position.y = 0;
      soundEngine.powerup();
      syncBodyState('playing');
      pushHudSnapshot();
    }

    // Expose imperative methods
    controllerRef.current = {
      startNewRun,
      pauseRun: () => {
        if (gameState === 'playing') syncBodyState('paused');
      },
      resumeRun: () => {
        if (gameState === 'paused') {
          run.invulnTimer = Math.max(run.invulnTimer, 1.4);
          syncBodyState('playing');
        }
      },
      reviveRun,
      returnToTitle: () => {
        clearWorldEntities();
        syncBodyState('title');
      },
      activateBoard,
      applyCharacter: (id: CharacterId) => {
        runnerRig.applyCharacter(getCharacterDef(id));
      },
      applyHoverboard: (id: HoverboardId, custom?: BoardCustomization) => {
        runnerRig.applyHoverboard(getHoverboardDef(id), custom ?? saveRef.current.customBoard);
      },
      previewBiome: (biome: BiomeKey) => {
        applyBiomeLighting(biome, true);
        rebuildAllChunks(biome);
      },
      toggleMute: () => {
        soundEngine.init();
        soundEngine.setMuted(!soundEngine.muted);
        callbacksRef.current.onMuteChange(soundEngine.muted);
        return soundEngine.muted;
      },
    };

    // 8. Unified Input Listeners (Keyboard + Touch Swipes + Blur Hygiene)
    const keysDown = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      keysDown.add(e.code);

      if (gameState === 'title') {
        if ((e.code === 'Space' || e.code === 'Enter') && !isGarageOpenRef.current) {
          e.preventDefault();
          startNewRun();
        }
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (gameState === 'playing') syncBodyState('paused');
        else if (gameState === 'paused') syncBodyState('playing');
        return;
      }

      if (e.code === 'KeyM') {
        soundEngine.init();
        soundEngine.setMuted(!soundEngine.muted);
        callbacksRef.current.onMuteChange(soundEngine.muted);
        return;
      }

      if (gameState !== 'playing') return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLane(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveLane(1);
      else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault();
        requestJump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        requestRoll();
      } else if (
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        e.code === 'KeyH' ||
        e.code === 'KeyE'
      ) {
        activateBoard();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
    };

    const clearInputs = () => {
      keysDown.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearInputs);

    let touchStartX = 0;
    let touchStartY = 0;
    let swipeHandled = false;
    let lastTapTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (gameState !== 'playing') return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      swipeHandled = false;
      const now = performance.now();
      if (now - lastTapTime < 280) {
        activateBoard();
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing' || swipeHandled) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 28 || Math.abs(dy) > 28) {
        swipeHandled = true;
        if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
        else if (dy < 0) requestJump();
        else requestRoll();
      }
    };

    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });

    // Mouse-drag swipe support for desktop trackpads/mice
    let mouseDragging = false;
    let mouseSwipeHandled = false;
    let mouseStartX = 0;
    let mouseStartY = 0;
    const onMouseDown = (e: MouseEvent) => {
      if (gameState !== 'playing' || e.button !== 0) return;
      mouseDragging = true;
      mouseSwipeHandled = false;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDragging || mouseSwipeHandled || gameState !== 'playing') return;
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      if (Math.abs(dx) > 32 || Math.abs(dy) > 32) {
        mouseSwipeHandled = true;
        if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1);
        else if (dy < 0) requestJump();
        else requestRoll();
      }
    };
    const onMouseUp = () => {
      mouseDragging = false;
    };
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // 9. Simulation Update + Render Loop (Software-WebGL paced via afterDraw)
    let lastTimeMs = performance.now();
    const startTimeMs = lastTimeMs;
    const clock = { elapsedTime: 0 };
    let frameId = 0;
    let disposed = false;

    function updatePlaying(dt: number): void {
      if (run.hitstopTimer > 0) {
        run.hitstopTimer = Math.max(0, run.hitstopTimer - dt);
        run.trauma = Math.max(0, run.trauma - dt * 1.4);
        particles.update(dt, run.speed);
        return;
      }

      const save = saveRef.current;
      const charDef = getCharacterDef(save.selectedCharacter);
      const boardDef = getHoverboardDef(save.selectedBoard);
      const targetSpeed =
        computeTargetSpeed(run.distance, run.level) + (run.pu.board > 0 ? boardDef.speedBonus : 0);
      run.speed = THREE.MathUtils.damp(run.speed, targetSpeed, 2.2, dt);

      const activeSpeed = run.pu.jetpack > 0 ? run.speed * 1.38 : run.speed;
      const dz = activeSpeed * dt;

      run.distance += dz * 0.45;
      const nextLevel = computeRunLevel(run.distance);
      if (nextLevel > run.level) {
        run.level = nextLevel;
        const levelMultGain = 1 + (charDef.perks.levelMultiplierBonus ?? 0);
        run.levelMultiplierBonus += levelMultGain;
        run.score += nextLevel * 25;
        clearNearbyObstacles(18);
        soundEngine.levelUp();
        if (nextLevel % 5 === 0) {
          particles.burst(run.x, run.y + 1.15, 0, 0xfacc15, 18, 7.6, 1.3);
          particles.burst(run.x, run.y + 1.35, -0.25, 0x22d3ee, 14, 6.4, 1.1);
        } else {
          particles.burst(run.x, run.y + 1.2, 0, 0x34d399, 16, 6.5, 1.2);
        }
        pushHudSnapshot();
      }
      soundEngine.setDifficulty(run.level, activeSpeed);

      const mult = computeActiveMultiplier(
        save.baseMultiplier,
        run.pu.multiplier > 0,
        run.comboBonus,
        run.levelMultiplierBonus
      );
      run.score += dz * 0.55 * mult;

      // World Tour auto biome transition across unlocked biomes
      if (run.worldTourAuto && run.distance >= run.nextBiomeDist) {
        run.nextBiomeDist += 500;
        const pool = save.unlockedBiomes.length > 0 ? save.unlockedBiomes : (['classic'] as BiomeKey[]);
        const nextIdx = (pool.indexOf(run.activeBiome) + 1) % pool.length;
        const nextKey = pool[nextIdx];
        applyBiomeLighting(nextKey, false);
        soundEngine.biomeChange();
      }

      // Smooth atmospheric transition with dynamic sunset/twilight shift based on run level & speed
      const bmDef = BIOMES[run.activeBiome];
      _tmpSky.setHex(bmDef.sky);
      _tmpFog.setHex(bmDef.fog);
      _tmpAmbSky.setHex(bmDef.ambientSky);
      _tmpAmbGround.setHex(bmDef.ambientGround);
      _tmpSun.setHex(bmDef.sun);

      const sunsetFactor = Math.min(1, Math.max(0, (run.level - 1) * 0.22 + (activeSpeed - 22) * 0.015));
      if (sunsetFactor > 0 && run.activeBiome === 'classic') {
        const sunsetSky = new THREE.Color(0xf97316);
        const sunsetFog = new THREE.Color(0xfb923c);
        const sunsetSun = new THREE.Color(0xfde047);
        _tmpSky.lerp(sunsetSky, sunsetFactor * 0.65);
        _tmpFog.lerp(sunsetFog, sunsetFactor * 0.65);
        _tmpSun.lerp(sunsetSun, sunsetFactor * 0.7);
      }

      (scene.background as THREE.Color).lerp(_tmpSky, dt * 1.6);
      (scene.fog as THREE.Fog).color.lerp(_tmpFog, dt * 1.6);
      hemiLight.color.lerp(_tmpAmbSky, dt * 1.6);
      hemiLight.groundColor.lerp(_tmpAmbGround, dt * 1.6);
      dirLight.color.lerp(_tmpSun, dt * 1.6);

      // Tick timers (Jetpack waits until sky coins ahead are cleared, then gives smooth buffered landing)
      (Object.keys(run.pu) as (keyof typeof run.pu)[]).forEach((k) => {
        if (run.pu[k] > 0) {
          run.pu[k] = Math.max(0, run.pu[k] - dt);
          if (k === 'jetpack' && run.pu.jetpack === 0) {
            const hasSkyCoinsAhead = activeCollectibles.some((c) => c.isSkyCoin && c.z < 1.2);
            if (hasSkyCoinsAhead && run.jetpackExtraTimer < 4.5) {
              run.pu.jetpack = 0.08;
              run.jetpackExtraTimer += dt;
            } else {
              runnerRig.jetpackGroup.visible = false;
              run.jetpackExtraTimer = 0;
              run.vy = -5.5;
              run.invulnTimer = Math.max(run.invulnTimer, 1.35);
              clearNearbyObstacles(16);
            }
          }
          if (k === 'board' && run.pu.board === 0) runnerRig.boardGroup.visible = false;
          if (k === 'magnet' && run.pu.magnet === 0) runnerRig.magnetAura.visible = false;
        }
      });
      if (run.levelUpSplashTimer > 0) {
        run.levelUpSplashTimer = Math.max(0, run.levelUpSplashTimer - dt);
        if (run.levelUpSplashTimer === 0) run.levelUpSplash = null;
      }
      if (run.introChaseTimer > 0) run.introChaseTimer = Math.max(0, run.introChaseTimer - dt);
      if (run.stumbleTimer > 0) {
        run.stumbleTimer = Math.max(0, run.stumbleTimer - dt);
      }
      if (run.invulnTimer > 0) run.invulnTimer = Math.max(0, run.invulnTimer - dt);
      if (run.nearMissCooldown > 0) run.nearMissCooldown = Math.max(0, run.nearMissCooldown - dt);
      if (run.trauma > 0) run.trauma = Math.max(0, run.trauma - dt * 1.6);
      if (run.jumpBuffer > 0) run.jumpBuffer = Math.max(0, run.jumpBuffer - dt);
      if (run.coyoteTimer > 0) run.coyoteTimer = Math.max(0, run.coyoteTimer - dt);
      if (run.dodgeTimer > 0) run.dodgeTimer = Math.max(0, run.dodgeTimer - dt);
      if (run.boardKickflipTimer > 0) run.boardKickflipTimer = Math.max(0, run.boardKickflipTimer - dt);
      if (run.jumpFlipTimer > 0) run.jumpFlipTimer = Math.max(0, run.jumpFlipTimer - dt);
      if (run.comboPopupTimer > 0) {
        run.comboPopupTimer = Math.max(0, run.comboPopupTimer - dt);
        if (run.comboPopupTimer === 0) run.comboPopup = null;
      }
      if (run.comboTimer > 0) {
        run.comboTimer = Math.max(0, run.comboTimer - dt);
        if (run.comboTimer === 0) {
          run.comboCount = 0;
          run.comboBonus = 0;
        }
      }

      // Treadmill track recycling
      let minChunkZ = Infinity;
      for (let i = 0; i < chunks.length; i++) {
        chunks[i].group.position.z += dz;
        if (chunks[i].group.position.z < minChunkZ) minChunkZ = chunks[i].group.position.z;
      }
      for (let i = 0; i < chunks.length; i++) {
        const ch = chunks[i];
        if (ch.group.position.z > CHUNK_LEN + 10) {
          ch.group.position.z = minChunkZ - CHUNK_LEN;
          minChunkZ = ch.group.position.z;
          if (ch.biomeKey !== run.activeBiome) {
            populateChunkScenery(
              ch,
              run.activeBiome,
              ch.index,
              biomeMaterials[run.activeBiome],
              worldGeo,
              worldSharedMat
            );
          }
        }
      }

      // Advance wave tail cursor & spawn sky coins / ground waves without overlaps or empty post-jetpack horizon
      run.lastSpawnedTailZ += dz;
      nextWaveDist -= dz;
      if (run.pu.jetpack > 2.6 && nextWaveDist <= 0) {
        spawnJetpackSkyCoins(-82);
        nextWaveDist = 20;
      }
      if (run.pu.jetpack <= 2.6 && run.lastSpawnedTailZ > -134) {
        const baseZ = Math.min(-126, run.lastSpawnedTailZ - 8);
        const waveSpan = spawnWave(baseZ, run.activeBiome, run.distance, activeSpeed);
        run.lastSpawnedTailZ = baseZ - waveSpan;
        nextWaveDist = Math.max(10, waveSpan * 0.45);
      }

      // Smooth exponential lane follow & lean (strictly bounded inside track corridor)
      const targetX = run.lane * LANE_WIDTH;
      const prevX = run.x;
      run.x = THREE.MathUtils.clamp(THREE.MathUtils.damp(run.x, targetX, 16, dt), -LANE_WIDTH - 0.35, LANE_WIDTH + 0.35);
      const bankTilt = THREE.MathUtils.clamp(((prevX - run.x) / Math.max(dt, 0.001)) * 0.014, -0.36, 0.36);

      if (run.isRolling) {
        run.rollTimer -= dt;
        if (run.rollTimer <= 0) run.isRolling = false;
      }

      // Obstacles & Swept-Z Anti-Tunneling + Solid Lateral Separation
      let supportY = 0;
      const pMinZ = -0.38;
      const pMaxZ = 0.38;

      for (let i = activeObstacles.length - 1; i >= 0; i--) {
        const o = activeObstacles[i];
        const prevObjMinZ = o.z - o.halfLen;
        const stepZ = (activeSpeed + o.extraSpeed) * dt;
        o.z += stepZ;
        o.mesh.position.z = o.z;

        if (o.moving && !o.hornPlayed && o.z > -48 && o.z < -20) {
          o.hornPlayed = true;
          soundEngine.trainHorn();
        }

        // Distinct aerodynamic whoosh when a moving train rushes past on an adjacent track
        if (o.moving && !o.flybyWhooshPlayed && o.z > -3 && o.z < 4 && Math.abs(o.lane - run.lane) === 1) {
          o.flybyWhooshPlayed = true;
          soundEngine.whooshEscape(activeSpeed + o.extraSpeed);
        }

        if (o.z - o.halfLen > 24) {
          worldEntitiesGroup.remove(o.mesh);
          activeObstacles.splice(i, 1);
          continue;
        }

        // Near-miss close-call bonus when narrowly dodging past an obstacle or vaulting a barrier
        if (!o.nearMissAwarded && !o.isRamp && o.z > 0.45 && o.z < 2.2) {
          const clearedBarrier = o.lane === run.lane && o.type === 'lowBarrier' && run.y > 1.1;
          const tightAdjacentDodge = Math.abs(o.lane - run.lane) === 1 && run.dodgeTimer > 0.04;
          if ((clearedBarrier || tightAdjacentDodge) && run.nearMissCooldown === 0) {
            o.nearMissAwarded = true;
            run.nearMissCooldown = 0.55;
            run.nearMissCount += 1;
            run.score += 15 * mult;
            registerComboAction(1);
            soundEngine.nearMiss(activeSpeed);
            particles.burst(run.x, run.y + 0.9, 0.2, 0x38bdf8, 5, 4.2, 0.7);
          }
        }

        if (run.pu.jetpack > 0) continue;

        const objMaxZ = o.z + o.halfLen;
        const laneCenterX = o.lane * LANE_WIDTH;
        const halfW = o.isTrain || o.isRamp ? 1.12 : 1.14;
        const objMinX = laneCenterX - halfW;
        const objMaxX = laneCenterX + halfW;
        const pMinX = run.x - 0.38;
        const pMaxX = run.x + 0.38;

        if (segmentsOverlapZ(prevObjMinZ, objMaxZ, pMinZ, pMaxZ) && objMaxX >= pMinX && objMinX <= pMaxX) {
          const pMinY = run.y;
          const pMaxY = run.y + (run.isRolling ? 0.85 : 1.75);

          if (o.isRamp) {
            const rampY = computeRampSurfaceY(objMaxZ, o.length, TRAIN_HEIGHT);
            if (run.y >= rampY - 0.85) {
              supportY = Math.max(supportY, rampY);
            } else if (Math.abs(run.x - laneCenterX) > 0.45 || run.lane !== o.lane) {
              // Solid ramp side wall pushback prevents sideways clipping into ramp/train behind
              const push = resolveSolidSidePushback(run.x, laneCenterX, halfW, run.prevLane);
              run.x = push.pushedX;
              run.lane = push.targetLane;
              handleCollisionImpact('Apanhado pelo Polícia após bater na lateral da rampa!', false);
              if (gameState !== 'playing') return;
            }
          } else if (o.isTrain) {
            if (run.y >= TRAIN_HEIGHT - 0.58 && run.vy <= 4) {
              supportY = Math.max(supportY, TRAIN_HEIGHT);
            } else if (pMinY < TRAIN_HEIGHT - 0.58) {
              const grazingSide =
                (Math.abs(run.x - laneCenterX) > 0.62 && objMaxZ > pMaxZ + 0.12) ||
                (run.prevLane !== o.lane && Math.abs(run.x - laneCenterX) > 0.52);
              if (grazingSide) {
                // Always enforce solid lateral separation even during invuln so runner never ghosts inside a train
                const push = resolveSolidSidePushback(run.x, laneCenterX, halfW, run.prevLane);
                run.x = push.pushedX;
                run.lane = push.targetLane;
                handleCollisionImpact('Apanhado pelo Polícia após bater no comboio!', false);
              } else if (run.invulnTimer > 0) {
                // Clear obstacle instead of letting an invulnerable runner clip through a solid train front
                worldEntitiesGroup.remove(o.mesh);
                activeObstacles.splice(i, 1);
              } else {
                handleCollisionImpact('Colisão fatal com um comboio!', true);
              }
              if (gameState !== 'playing') return;
            }
          } else if (pMaxY > o.minY + 0.05 && pMinY < o.maxY - 0.05) {
            const switchingIntoEdge = Math.abs(run.x - laneCenterX) > 0.55 && o.type !== 'highBarrier';
            if (switchingIntoEdge) {
              const push = resolveSolidSidePushback(run.x, laneCenterX, halfW, run.prevLane);
              run.x = push.pushedX;
              run.lane = push.targetLane;
              handleCollisionImpact('Apanhado pelo Polícia após tropeçar!', false);
            } else if (run.invulnTimer > 0) {
              worldEntitiesGroup.remove(o.mesh);
              activeObstacles.splice(i, 1);
            } else {
              handleCollisionImpact('Apanhado pelo Polícia após bater numa barreira!', true);
            }
            if (gameState !== 'playing') return;
          }
        }
      }

      const wasGrounded = run.y <= run.groundY + 0.05;
      run.groundY = Math.min(TRAIN_HEIGHT, supportY);
      if (wasGrounded && run.y > run.groundY + 0.08 && run.vy <= 0) {
        run.coyoteTimer = 0.1;
      }

      if (run.pu.jetpack > 0) {
        run.y = THREE.MathUtils.damp(run.y, 5.4, 5.8, dt);
        run.vy = 0;
        if (Math.random() < 0.65) {
          particles.burst(run.x, run.y + 0.45, 0.35, 0xfb923c, 2, 2.2, 0.9);
        }
      } else {
        const wasInAir = run.y > run.groundY + 0.08;
        run.vy += -42 * dt;
        run.y += run.vy * dt;
        if (run.y > 5.8) {
          run.y = 5.8;
          if (run.vy > 0) run.vy = 0;
        }
        if (run.y <= run.groundY) {
          if (wasInAir && run.vy < -5) {
            run.squashY = 0.78;
            if (run.groundY >= TRAIN_HEIGHT - 0.25) {
              soundEngine.trainRoofClang();
            } else {
              soundEngine.land();
            }
            particles.burst(run.x, run.groundY + 0.12, 0, 0xe2e8f0, 5, 3, 0.75);
          }
          run.y = run.groundY;
          run.vy = 0;
          if (run.jumpBuffer > 0) {
            executeJump();
          }
        }
      }

      // Collectibles & Magnet Pull
      const magnetActive = run.pu.magnet > 0;
      const elapsed = clock.elapsedTime;
      for (let i = activeCollectibles.length - 1; i >= 0; i--) {
        const c = activeCollectibles[i];
        c.z += dz;
        c.mesh.position.z = c.z;
        c.mesh.rotation.y += dt * 3.5;

        if (c.kind !== 'coin') {
          c.mesh.position.y = c.baseY + Math.sin(elapsed * 4 + i) * 0.14;
        }

        if (c.z > 18) {
          worldEntitiesGroup.remove(c.mesh);
          activeCollectibles.splice(i, 1);
          continue;
        }

        const magnetRange = 24 + (charDef.perks.magnetRadiusBonus ?? 0) * 14;
        if (c.kind === 'coin' && magnetActive && c.z > -magnetRange && c.z < 5) {
          const pullRate = 13 + (charDef.perks.magnetRadiusBonus ?? 0) * 6;
          c.mesh.position.x = THREE.MathUtils.damp(c.mesh.position.x, run.x, pullRate, dt);
          c.mesh.position.y = THREE.MathUtils.damp(c.mesh.position.y, run.y + 1.0, pullRate, dt);
        }

        const dx = c.mesh.position.x - run.x;
        const dy = c.mesh.position.y - (run.y + (run.isRolling ? 0.5 : 1.0));
        const distZ = c.mesh.position.z;
        const capRad = c.kind === 'coin' && magnetActive ? 3.5 : 1.9;

        if (dx * dx + dy * dy + distZ * distZ < capRad) {
          if (c.kind === 'coin') {
            const coinGain =
              charDef.perks.doubleCoinChance && Math.random() < charDef.perks.doubleCoinChance
                ? 2
                : 1;
            run.runCoins += coinGain;
            run.score += 10 * mult * coinGain;
            registerComboAction(1);
            soundEngine.coin(coinGain > 1);
            particles.burst(
              c.mesh.position.x,
              c.mesh.position.y,
              c.mesh.position.z,
              coinGain > 1 ? 0x38bdf8 : 0xfacc15,
              coinGain > 1 ? 6 : 4,
              3.2,
              0.75
            );
          } else if (c.kind === 'key') {
            const nextSave = { ...saveRef.current, keys: saveRef.current.keys + 1 };
            saveRef.current = nextSave;
            callbacksRef.current.onSaveUpdate(nextSave);
            registerComboAction(2);
            soundEngine.powerup();
            particles.burst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 0x22d3ee, 10, 4.5, 1);
          } else if (c.kind === 'mystery') {
            run.mysteryPicked += 1;
            registerComboAction(2);
            soundEngine.powerup();
            particles.burst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 0xa855f7, 12, 5, 1.1);
          } else {
            run.powerupsCollected += 1;
            run.deltaPowerups += 1;
            registerComboAction(2);
            soundEngine.powerup(c.kind);
            particles.burst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 0x4ade80, 12, 5, 1.1);

            const durBonus = charDef.perks.powerupDurationBonus ?? 0;
            if (c.kind === 'jetpack') {
              run.pu.jetpack = getPowerUpDuration('jetpack', saveRef.current.upgrades, durBonus);
              run.jetpackExtraTimer = 0;
              runnerRig.jetpackGroup.visible = true;
              run.isRolling = false;
              nextWaveDist = 0;
            } else if (c.kind === 'magnet') {
              run.pu.magnet = getPowerUpDuration('magnet', saveRef.current.upgrades, durBonus);
              runnerRig.magnetAura.visible = true;
            } else if (c.kind === 'sneakers') {
              run.pu.sneakers = getPowerUpDuration('sneakers', saveRef.current.upgrades, durBonus);
            } else if (c.kind === 'multiplier') {
              run.pu.multiplier = getPowerUpDuration('multiplier', saveRef.current.upgrades, durBonus);
            } else if (c.kind === 'pogo') {
              run.vy = 24.5;
              run.isRolling = false;
              run.jumpFlipTimer = 0.62;
            }
          }
          worldEntitiesGroup.remove(c.mesh);
          activeCollectibles.splice(i, 1);
        }
      }

      // Runner squash-and-stretch, dodge whip-bank, hoverboard surf/carve/kickflip, and parkour gait
      run.squashY = THREE.MathUtils.damp(run.squashY, 1, 14, dt);
      const invSquashXZ = 1 / Math.sqrt(Math.max(0.5, run.squashY));
      runnerRig.bodyPivot.scale.set(invSquashXZ, run.squashY, invSquashXZ);

      runnerRig.root.position.set(run.x, run.y, 0);
      runnerRig.shadowDisc.position.y = Math.max(0.02, run.groundY - run.y + 0.025);
      const shadowScale = THREE.MathUtils.clamp(1 - (run.y - run.groundY) * 0.08, 0.35, 1);
      runnerRig.shadowDisc.scale.setScalar(shadowScale);

      const shoeHex =
        run.pu.sneakers > 0 ? 0x4ade80 : getCharacterDef(saveRef.current.selectedCharacter).shoeColor;
      runnerRig.shoeMatL.color.setHex(shoeHex);
      runnerRig.shoeMatR.color.setHex(shoeHex);
      runnerRig.root.visible = !(run.invulnTimer > 0 && Math.floor(run.invulnTimer * 18) % 2 === 0);

      if (runnerRig.magnetAura.visible) {
        runnerRig.magnetAura.rotation.z += dt * 4;
      }
      if (runnerRig.shieldAura.visible) {
        runnerRig.shieldAura.rotation.y += dt * 1.8;
      }

      // Dodge & lane-change impulse curves
      const dodgeProg = run.dodgeTimer > 0 ? run.dodgeTimer / 0.24 : 0;
      const dodgeSwing = Math.sin(dodgeProg * Math.PI);
      const dodgeYaw = -run.dodgeDir * 0.42 * dodgeSwing;
      const dodgeLift = run.y <= run.groundY + 0.08 && !run.isRolling ? dodgeSwing * 0.22 : 0;

      // Reset neutral limb offsets each frame before applying active pose
      runnerRig.legL.position.set(-0.18, 0.8, 0);
      runnerRig.legR.position.set(0.18, 0.8, 0);
      runnerRig.legL.rotation.set(0, 0, 0);
      runnerRig.legR.rotation.set(0, 0, 0);
      runnerRig.armL.rotation.set(0, 0, 0);
      runnerRig.armR.rotation.set(0, 0, 0);
      runnerRig.headGroup.rotation.set(0, -run.dodgeDir * 0.35 * dodgeSwing, bankTilt * 0.4);

      run.animPhase += dt * activeSpeed * 0.68;

      if (run.pu.jetpack > 0) {
        runnerRig.bodyPivot.rotation.set(0.32, dodgeYaw * 0.6, bankTilt * 1.25);
        runnerRig.bodyPivot.position.y = 0;
        runnerRig.legL.rotation.x = 0.35;
        runnerRig.legR.rotation.x = 0.22;
        runnerRig.armL.rotation.set(-2.3, 0, -0.25);
        runnerRig.armR.rotation.set(-2.3, 0, 0.25);
        runnerRig.flameL.scale.y = 0.8 + Math.random() * 0.65;
        runnerRig.flameR.scale.y = 0.8 + Math.random() * 0.65;
      } else if (run.pu.board > 0) {
        // Hoverboard Surfing & Skate Tricks
        const boardHover = Math.sin(elapsed * 7.5) * 0.045;
        const kickflipProg = run.boardKickflipTimer > 0 ? 1 - run.boardKickflipTimer / 0.44 : 0;
        const kickflipAngle = kickflipProg > 0 ? kickflipProg * Math.PI * 2 : 0;

        runnerRig.boardGroup.position.y = 0.22 + boardHover + dodgeLift * 0.6;
        runnerRig.boardGroup.rotation.set(
          run.vy > 1 ? -0.18 : run.vy < -3 ? 0.14 : 0,
          -bankTilt * 0.52,
          bankTilt * 1.75
        );
        runnerRig.boardSpinGroup.rotation.set(0, 0, kickflipAngle);

        if (run.isRolling) {
          // Low aero rail-grab crouch on the hoverboard
          runnerRig.bodyPivot.rotation.set(-0.52, 0.72 + dodgeYaw * 0.4, bankTilt * 1.35);
          runnerRig.bodyPivot.position.y = -0.24 + boardHover;
          runnerRig.legL.position.set(-0.14, 0.8, -0.16);
          runnerRig.legR.position.set(0.14, 0.8, 0.16);
          runnerRig.legL.rotation.x = -0.58;
          runnerRig.legR.rotation.x = 0.54;
          runnerRig.armL.rotation.set(0.75, 0, -0.35);
          runnerRig.armR.rotation.set(-0.2, 0, 0.85);
        } else {
          // Sideways surfer/skateboarder stance with dynamic carve balance
          runnerRig.bodyPivot.rotation.set(0.1, 0.72 + dodgeYaw * 0.55, bankTilt * 1.45);
          runnerRig.bodyPivot.position.y = 0.22 + boardHover + dodgeLift;
          runnerRig.legL.position.set(-0.14, 0.8, -0.18);
          runnerRig.legR.position.set(0.14, 0.8, 0.18);
          runnerRig.legL.rotation.x = run.y > run.groundY + 0.15 ? -0.45 : -0.26;
          runnerRig.legR.rotation.x = run.y > run.groundY + 0.15 ? 0.42 : 0.26;
          runnerRig.armL.rotation.set(-0.22, 0, -0.72 + bankTilt * 0.85);
          runnerRig.armR.rotation.set(0.22, 0, 0.72 + bankTilt * 0.85);
        }

        if (Math.random() < 0.58) {
          const trail = save.customBoard.trail;
          const customGlow = save.customBoard.glowHex
            ? parseInt(save.customBoard.glowHex.replace('#', ''), 16)
            : boardDef.glowColor;
          const trailHex =
            trail === 'plasma'
              ? 0xc084fc
              : trail === 'ice'
                ? 0x7dd3fc
                : trail === 'gold_spark'
                  ? [0xfde047, 0xfacc15, 0xfef08a, 0xf59e0b][Math.floor(elapsed * 14) % 4]
                  : trail === 'rainbow'
                    ? [0xf43f5e, 0xfacc15, 0x34d399, 0x38bdf8, 0xc084fc][
                        Math.floor(elapsed * 10) % 5
                      ]
                    : customGlow;
          particles.burst(run.x, run.y + 0.2, 1.05, trailHex, 1, 2.4, 0.72);
        }
      } else if (run.isRolling) {
        // True 360-degree forward parkour somersault roll
        const rollProg = 1 - Math.max(0, run.rollTimer) / 0.62;
        runnerRig.bodyPivot.rotation.set(-rollProg * Math.PI * 2, dodgeYaw * 0.4, bankTilt * 0.9);
        runnerRig.bodyPivot.position.y = -0.32;
        runnerRig.legL.rotation.x = -0.95;
        runnerRig.legR.rotation.x = -0.95;
        runnerRig.armL.rotation.x = -1.2;
        runnerRig.armR.rotation.x = -1.2;
        if (Math.random() < 0.35) {
          particles.burst(run.x, run.y + 0.15, 0.2, 0xe2e8f0, 1, 2.0, 0.65);
        }
      } else if (run.y > run.groundY + 0.15) {
        // Athletic jump pose + mid-air front flip on Super Sneakers / Pogo
        const flipProg = run.jumpFlipTimer > 0 ? 1 - run.jumpFlipTimer / 0.56 : 0;
        const flipAngle = flipProg > 0 ? -flipProg * Math.PI * 2 : 0.12;
        runnerRig.bodyPivot.rotation.set(flipAngle, dodgeYaw, bankTilt * 1.18);
        runnerRig.bodyPivot.position.y = 0;
        runnerRig.legL.rotation.x = -0.68;
        runnerRig.legR.rotation.x = 0.52;
        runnerRig.armL.rotation.set(-0.95, 0, -0.35 - run.dodgeDir * dodgeSwing * 0.3);
        runnerRig.armR.rotation.set(-0.95, 0, 0.35 - run.dodgeDir * dodgeSwing * 0.3);
      } else {
        // High-energy sprint gait with expressive lane-dodge cut & shoulder sway
        runnerRig.bodyPivot.rotation.set(0.16 + dodgeSwing * 0.08, dodgeYaw, bankTilt * 1.15);
        runnerRig.bodyPivot.position.y = Math.abs(Math.sin(run.animPhase)) * 0.12 + dodgeLift;
        runnerRig.legL.rotation.x = Math.sin(run.animPhase) * 0.96;
        runnerRig.legR.rotation.x = -Math.sin(run.animPhase) * 0.96;
        runnerRig.armL.rotation.set(-Math.sin(run.animPhase) * 0.9, 0, -0.15 - dodgeSwing * 0.35);
        runnerRig.armR.rotation.set(Math.sin(run.animPhase) * 0.9, 0, 0.15 + dodgeSwing * 0.35);
      }

      // Chaser Inspector & Guard Dog animation (close on 1st stumble or intro chase)
      const chaserTargetZ = run.stumbleTimer > 0 ? 2.65 : run.introChaseTimer > 0 ? 3.5 : 16.5;
      chaserRig.group.position.z = THREE.MathUtils.damp(chaserRig.group.position.z, chaserTargetZ, 4.2, dt);
      chaserRig.group.position.x = THREE.MathUtils.damp(chaserRig.group.position.x, run.x * 0.85, 6.5, dt);
      chaserRig.legL.rotation.x = Math.sin(run.animPhase * 1.1) * 0.82;
      chaserRig.legR.rotation.x = -Math.sin(run.animPhase * 1.1) * 0.82;
      chaserRig.armL.rotation.x = -Math.sin(run.animPhase * 1.1) * 0.7;
      chaserRig.armR.rotation.x = Math.sin(run.animPhase * 1.1) * 0.65;

      const dogPhase = run.animPhase * 1.45;
      chaserRig.dogGroup.position.y = Math.abs(Math.sin(dogPhase)) * 0.16;
      chaserRig.dogLegFL.rotation.x = Math.sin(dogPhase) * 0.85;
      chaserRig.dogLegFR.rotation.x = -Math.sin(dogPhase) * 0.85;
      chaserRig.dogLegBL.rotation.x = -Math.sin(dogPhase) * 0.85;
      chaserRig.dogLegBR.rotation.x = Math.sin(dogPhase) * 0.85;
      chaserRig.dogTail.rotation.z = Math.sin(dogPhase * 2) * 0.45;

      particles.update(dt, activeSpeed);

      // Clamped Camera Tracking (smooth Z, Y, and lookAt damping — prevents scenery snap on Jetpack exit)
      run.camX = THREE.MathUtils.damp(run.camX, run.x * 0.62, 8.5, dt);
      const desiredCamY =
        run.pu.jetpack > 0
          ? 7.35
          : THREE.MathUtils.clamp(4.75 + run.y * 0.4, 4.75, 7.25);
      run.camY = THREE.MathUtils.damp(run.camY, desiredCamY, 6.2, dt);
      const desiredCamZ = run.pu.jetpack > 0 ? 9.3 : 8.45;
      run.camZ = THREE.MathUtils.damp(run.camZ, desiredCamZ, 5.2, dt);
      const desiredLookY = THREE.MathUtils.clamp(run.y * 0.46 + 1.85, 1.85, 4.6);
      run.camLookY = THREE.MathUtils.damp(run.camLookY, desiredLookY, 6.2, dt);
      run.camRoll = THREE.MathUtils.damp(run.camRoll, -bankTilt * 0.14, 9, dt);

      const shakeMag = run.trauma * run.trauma * 0.42;
      const shakeX = shakeMag > 0.001 ? (Math.random() - 0.5) * shakeMag : 0;
      const shakeY = shakeMag > 0.001 ? (Math.random() - 0.5) * shakeMag : 0;

      camera.position.set(
        run.camX + shakeX,
        run.camY + shakeY,
        run.camZ
      );
      camera.lookAt(run.camX * 0.74, run.camLookY, -11.5);
      camera.rotation.z += run.camRoll;

      const targetFov = THREE.MathUtils.clamp(
        61 + (run.speed - 22) * 0.46 + (run.pu.jetpack > 0 ? 3.2 : 0),
        61,
        71
      );
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4.5, dt);
        camera.updateProjectionMatrix();
      }

      // Throttled HUD + Mission Sync (~10 Hz)
      hudSyncAccum += dt;
      if (hudSyncAccum >= 0.1) {
        hudSyncAccum = 0;
        syncMissions(false);
        pushHudSnapshot();
      }
    }

    function updateDying(dt: number): void {
      run.dyingTimer = Math.max(0, run.dyingTimer - dt);
      const progress = 1 - run.dyingTimer / 1.35;

      // Runner collapses back in dramatic slow motion
      runnerRig.root.visible = true;
      runnerRig.boardGroup.visible = false;
      runnerRig.jetpackGroup.visible = false;
      runnerRig.bodyPivot.rotation.x = THREE.MathUtils.lerp(0, -1.35, Math.min(1, progress * 1.6));
      runnerRig.bodyPivot.position.y = THREE.MathUtils.lerp(0.1, 0.32, Math.min(1, progress * 1.6));
      runnerRig.legL.rotation.x = 0.45;
      runnerRig.legR.rotation.x = -0.35;
      runnerRig.armL.rotation.set(-1.3, 0, -0.6);
      runnerRig.armR.rotation.set(-1.1, 0, 0.6);

      // Inspector & Dog rush in for the arrest
      chaserRig.group.position.z = THREE.MathUtils.damp(chaserRig.group.position.z, 1.25, 6, dt);
      chaserRig.group.position.x = THREE.MathUtils.damp(chaserRig.group.position.x, run.x - 0.55, 6, dt);
      particles.update(dt * 0.25, 4);

      // GTA 5 dramatic pull-back & Dutch-tilt camera
      camera.position.set(
        THREE.MathUtils.damp(camera.position.x, run.x + 1.15, 3.2, dt),
        THREE.MathUtils.damp(camera.position.y, Math.max(3.6, run.y + 3.2), 3.2, dt),
        THREE.MathUtils.damp(camera.position.z, 9.8, 3.2, dt)
      );
      camera.lookAt(run.x, run.y + 1.0, 0);
      camera.rotation.z = THREE.MathUtils.lerp(0, 0.13, progress);

      if (run.dyingTimer === 0 && run.pendingSummary) {
        const finalSummary = run.pendingSummary;
        const pendingLevelModal = run.pendingLevelUpModal;
        run.pendingSummary = null;
        run.pendingLevelUpModal = null;
        syncBodyState('gameover');
        callbacksRef.current.onGameOver(finalSummary);
        if (pendingLevelModal && callbacksRef.current.onAccountLevelUp) {
          callbacksRef.current.onAccountLevelUp(pendingLevelModal);
        }
      }
    }

    function updateTitleStage(elapsed: number): void {
      runnerRig.root.position.set(0, 0, 0);
      runnerRig.root.visible = true;
      runnerRig.bodyPivot.scale.set(1, 1, 1);
      runnerRig.bodyPivot.rotation.set(0, Math.sin(elapsed * 1.1) * 0.18, 0);
      runnerRig.bodyPivot.position.y = Math.sin(elapsed * 2.4) * 0.04;
      runnerRig.headGroup.rotation.set(0, Math.sin(elapsed * 0.9) * 0.14, 0);
      runnerRig.legL.position.set(-0.18, 0.8, 0);
      runnerRig.legR.position.set(0.18, 0.8, 0);
      runnerRig.legL.rotation.set(0, 0, 0);
      runnerRig.legR.rotation.set(0, 0, 0);
      runnerRig.armL.rotation.set(0, 0, -0.14);
      runnerRig.armR.rotation.set(0, 0, 0.14);
      runnerRig.boardGroup.rotation.set(0, 0, 0);
      runnerRig.boardSpinGroup.rotation.set(0, 0, 0);
      runnerRig.jetpackGroup.visible = false;
      runnerRig.boardGroup.visible = false;
      runnerRig.magnetAura.visible = false;
      runnerRig.shieldAura.visible = false;

      chaserRig.group.position.set(-1.35, 0, 4.4);
      chaserRig.dogGroup.position.y = Math.abs(Math.sin(elapsed * 3.5)) * 0.05;
      chaserRig.dogTail.rotation.z = Math.sin(elapsed * 8) * 0.4;

      camera.position.set(Math.sin(elapsed * 0.42) * 3.6, 3.65, 6.8);
      camera.lookAt(0, 1.45, -4);
      if (Math.abs(camera.fov - 62) > 0.1) {
        camera.fov = 62;
        camera.updateProjectionMatrix();
      }
    }

    function afterDraw(cb: () => void): void {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      let polls = 0;
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        polls += 1;
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED && polls < 24) {
          frameId = window.setTimeout(poll, 8);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 8);
    }

    let frameCount = 0;
    let lastFpsCalcMs = performance.now();
    let currentFps = 60;
    let debugSyncAccum = 0;

    function tick(): void {
      if (disposed) return;
      const nowMs = performance.now();
      const dt = Math.min((nowMs - lastTimeMs) / 1000, 0.05);
      lastTimeMs = nowMs;
      clock.elapsedTime = (nowMs - startTimeMs) / 1000;
      const elapsed = clock.elapsedTime;

      frameCount++;
      if (nowMs - lastFpsCalcMs >= 500) {
        currentFps = Math.round((frameCount * 1000) / (nowMs - lastFpsCalcMs));
        frameCount = 0;
        lastFpsCalcMs = nowMs;
      }

      debugSyncAccum += dt;
      if (debugSyncAccum >= 0.2 && callbacksRef.current.onDebugUpdate) {
        debugSyncAccum = 0;
        let nearestDist = 999;
        for (const o of activeObstacles) {
          if (o.z < nearestDist && o.z > -2) {
            nearestDist = o.z;
          }
        }
        callbacksRef.current.onDebugUpdate({
          fps: currentFps,
          frameTimeMs: dt * 1000,
          x: run.x,
          y: run.y,
          z: 0,
          lane: run.lane,
          speed: gameState === 'playing' ? computeTargetSpeed(run.distance) : 0,
          distance: run.distance,
          obstacleCount: activeObstacles.length,
          nearestObstacleDist: nearestDist,
          invulnTimer: run.invulnTimer,
          stumbleTimer: run.stumbleTimer,
          jetpackTimer: run.pu.jetpack,
        });
      }

      if (gameState === 'playing') {
        updatePlaying(dt);
      } else if (gameState === 'dying') {
        updateDying(dt);
      } else if (gameState === 'title') {
        updateTitleStage(elapsed);
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    // Boot directly into gameplay if ?autostart=1 is present
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      startNewRun();
    } else {
      syncBodyState('title');
      pushHudSnapshot();
    }

    tick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearInputs);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      particles.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [controllerRef, isGarageOpenRef, saveRef]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full z-0"
      aria-label="Cenário 3D de Rail Rushers"
    />
  );
}
