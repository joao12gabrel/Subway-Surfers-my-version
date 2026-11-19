import * as THREE from 'three';
import type { BoardCustomization, CharacterDef, HoverboardDef, PowerUpType } from './types';
import { TRAIN_HEIGHT, TRAIN_WIDTH } from './rules';
import { makeSkateDeckTexture } from './textures';

export interface RunnerRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  shoeMatL: THREE.MeshStandardMaterial;
  shoeMatR: THREE.MeshStandardMaterial;
  jetpackGroup: THREE.Group;
  flameL: THREE.Mesh;
  flameR: THREE.Mesh;
  magnetAura: THREE.Mesh;
  shieldAura: THREE.Mesh;
  boardGroup: THREE.Group;
  boardSpinGroup: THREE.Group;
  boardDeckMat: THREE.MeshStandardMaterial;
  boardTrimMat: THREE.MeshBasicMaterial;
  boardFlameMat: THREE.MeshBasicMaterial;
  shadowDisc: THREE.Mesh;
  applyCharacter: (def: CharacterDef) => void;
  applyHoverboard: (def: HoverboardDef, custom?: BoardCustomization) => void;
}

export interface ChaserRig {
  group: THREE.Group;
  inspectorGroup: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  dogGroup: THREE.Group;
  dogLegFL: THREE.Mesh;
  dogLegFR: THREE.Mesh;
  dogLegBL: THREE.Mesh;
  dogLegBR: THREE.Mesh;
  dogTail: THREE.Mesh;
}

export interface SharedAssets {
  geo: {
    coin: THREE.BufferGeometry;
    coinInner: THREE.BufferGeometry;
    barrierLowBar: THREE.BufferGeometry;
    barrierLowLeg: THREE.BufferGeometry;
    barrierHighBar: THREE.BufferGeometry;
    barrierPost: THREE.BufferGeometry;
    trainBody: THREE.BufferGeometry;
    trainRoof: THREE.BufferGeometry;
    trainRoofUnit: THREE.BufferGeometry;
    trainFrontFace: THREE.BufferGeometry;
    trainLight: THREE.BufferGeometry;
    trainBeam: THREE.BufferGeometry;
    trainBogie: THREE.BufferGeometry;
    trainWheel: THREE.BufferGeometry;
    rampWedge: THREE.BufferGeometry;
    rampStripe: THREE.BufferGeometry;
    rampRail: THREE.BufferGeometry;
    puRing: THREE.BufferGeometry;
    shadowDisc: THREE.BufferGeometry;
  };
  mat: {
    coinGold: THREE.MeshStandardMaterial;
    coinEdge: THREE.MeshStandardMaterial;
    metalDark: THREE.MeshStandardMaterial;
    metalChrome: THREE.MeshStandardMaterial;
    hazard: THREE.MeshStandardMaterial;
    redWhite: THREE.MeshStandardMaterial;
    rampDeck: THREE.MeshStandardMaterial;
    rampChevron: THREE.MeshStandardMaterial;
    headlight: THREE.MeshBasicMaterial;
    headlightBeam: THREE.MeshBasicMaterial;
    taillight: THREE.MeshBasicMaterial;
    mysteryBox: THREE.MeshStandardMaterial;
    contactShadow: THREE.MeshBasicMaterial;
    puJetpack: THREE.MeshStandardMaterial;
    puMagnet: THREE.MeshStandardMaterial;
    puSneakers: THREE.MeshStandardMaterial;
    puMult: THREE.MeshStandardMaterial;
    puPogo: THREE.MeshStandardMaterial;
    puKey: THREE.MeshStandardMaterial;
    haloCyan: THREE.MeshBasicMaterial;
    haloGold: THREE.MeshBasicMaterial;
    haloPink: THREE.MeshBasicMaterial;
    haloGreen: THREE.MeshBasicMaterial;
  };
}

export function createRunnerRig(
  initialChar: CharacterDef,
  initialBoard: HoverboardDef,
  shadowMat: THREE.MeshBasicMaterial
): RunnerRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const matHoodie = new THREE.MeshStandardMaterial({ color: initialChar.hoodieColor, roughness: 0.78, metalness: 0.05 });
  const matPants = new THREE.MeshStandardMaterial({ color: initialChar.pantsColor, roughness: 0.85, metalness: 0.05 });
  const matSkin = new THREE.MeshStandardMaterial({ color: initialChar.skinColor, roughness: 0.65, metalness: 0.0 });
  const matHat = new THREE.MeshStandardMaterial({ color: initialChar.hatColor, roughness: 0.35, metalness: 0.1 });
  const matAccent = new THREE.MeshStandardMaterial({ color: initialChar.accentColor, roughness: 0.25, metalness: 0.45 });
  const shoeMatL = new THREE.MeshStandardMaterial({ color: initialChar.shoeColor, roughness: 0.35, metalness: 0.1 });
  const shoeMatR = new THREE.MeshStandardMaterial({ color: initialChar.shoeColor, roughness: 0.35, metalness: 0.1 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.2 });

  // 1. Torso & hoodie collar + backpack
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.74, 0.36), matHoodie);
  torso.position.y = 1.18;
  const chestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.38), matAccent);
  chestStripe.position.y = 1.18;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.14, 12), matHat);
  collar.position.y = 1.56;

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.54, 0.22), matDark);
  backpack.position.set(0, 1.2, 0.26);
  const sprayCan = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 10), matAccent);
  sprayCan.position.set(0.16, 1.24, 0.36);
  bodyPivot.add(torso, chestStripe, collar, backpack, sprayCan);

  // 2. Head group with eyes + character-specific accessories
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.82;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.44), matSkin);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.04), matDark);
  eyeL.position.set(-0.11, 0.03, -0.22);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.11;
  headGroup.add(head, eyeL, eyeR);

  // Accessory: Cap
  const capGroup = new THREE.Group();
  const capCrown = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.48), matHat);
  capCrown.position.y = 0.22;
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.26), matAccent);
  capBrim.position.set(0, 0.16, 0.28);
  capGroup.add(capCrown, capBrim);

  // Accessory: Beanie + Shades (Maya)
  const beanieGroup = new THREE.Group();
  const beanieDome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65), matHat);
  beanieDome.position.y = 0.16;
  const beanieCuff = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.055, 8, 16), matAccent);
  beanieCuff.rotation.x = Math.PI / 2;
  beanieCuff.position.y = 0.16;
  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.12), matDark);
  shades.position.set(0, 0.04, -0.22);
  beanieGroup.add(beanieDome, beanieCuff, shades);

  // Accessory: Headband + Boombox (Beat)
  const boomboxGroup = new THREE.Group();
  const headband = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.48), matHat);
  headband.position.y = 0.16;
  const afro = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), matDark);
  afro.position.y = 0.24;
  boomboxGroup.add(headband, afro);

  // Accessory: Cyber Visor + Helmet (Kira)
  const visorGroup = new THREE.Group();
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.24, 0.5), matHat);
  helmet.position.y = 0.2;
  const visorStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.12, 0.12),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee })
  );
  visorStrip.position.set(0, 0.04, -0.23);
  visorGroup.add(helmet, visorStrip);

  // Accessory: Golden Street Crown (Vex)
  const crownGroup = new THREE.Group();
  const crownBand = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.12, 8), matHat);
  crownBand.position.y = 0.27;
  const crownSpire1 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), matAccent);
  crownSpire1.position.set(-0.14, 0.39, 0);
  const crownSpire2 = crownSpire1.clone();
  crownSpire2.position.set(0, 0.42, -0.14);
  const crownSpire3 = crownSpire1.clone();
  crownSpire3.position.set(0.14, 0.39, 0);
  const vexShades = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.1), matDark);
  vexShades.position.set(0, 0.04, -0.22);
  crownGroup.add(crownBand, crownSpire1, crownSpire2, crownSpire3, vexShades);

  // Accessory: Studio Headphones + Neon Band (Zara)
  const headphonesGroup = new THREE.Group();
  const hpBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.045, 8, 16, Math.PI),
    matHat
  );
  hpBand.position.y = 0.06;
  const hpCupL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), matAccent);
  hpCupL.rotation.z = Math.PI / 2;
  hpCupL.position.set(-0.27, 0.02, 0);
  const hpCupR = hpCupL.clone();
  hpCupR.position.x = 0.27;
  headphonesGroup.add(hpBand, hpCupL, hpCupR);

  // Accessory: Aero Wings + Cyber Visor (Atlas)
  const wingHeadGroup = new THREE.Group();
  const atlasHelmet = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.48), matHat);
  atlasHelmet.position.y = 0.2;
  const atlasVisor = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  atlasVisor.position.set(0, 0.04, -0.22);
  wingHeadGroup.add(atlasHelmet, atlasVisor);

  headGroup.add(capGroup, beanieGroup, boomboxGroup, visorGroup, crownGroup, headphonesGroup, wingHeadGroup);
  bodyPivot.add(headGroup);

  // Back aero wings for Atlas (mounted on bodyPivot)
  const backWingGroup = new THREE.Group();
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35, roughness: 0.25 });
  const backWingL = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.06), wingMat);
  backWingL.position.set(-0.48, 1.34, 0.32);
  backWingL.rotation.z = 0.28;
  const backWingR = backWingL.clone();
  backWingR.position.x = 0.48;
  backWingR.rotation.z = -0.28;
  backWingGroup.add(backWingL, backWingR);
  backWingGroup.visible = false;
  bodyPivot.add(backWingGroup);

  // 3. Articulated arms with hands & sleeves
  const makeArm = (side: -1 | 1) => {
    const g = new THREE.Group();
    g.position.set(side * 0.44, 1.46, 0);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.46, 0.22), matHoodie);
    sleeve.position.y = -0.22;
    const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.2), matAccent);
    wrist.position.y = -0.46;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), matSkin);
    hand.position.y = -0.54;
    g.add(sleeve, wrist, hand);
    return g;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);
  bodyPivot.add(armL, armR);

  // 4. Articulated legs with oversized Subway Surfers sneakers + white toe caps
  const matToeCap = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const makeLeg = (side: -1 | 1, sMat: THREE.MeshStandardMaterial) => {
    const g = new THREE.Group();
    g.position.set(side * 0.18, 0.8, 0);
    const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.58, 0.24), matPants);
    legMesh.position.y = -0.29;
    const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.38), sMat);
    shoeUpper.position.set(0, -0.64, -0.05);
    const toeCap = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.12, 0.12), matToeCap);
    toeCap.position.set(0, -0.66, -0.24);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.45), matAccent);
    sole.position.set(0, -0.73, -0.08);
    g.add(legMesh, shoeUpper, toeCap, sole);
    return g;
  };
  const legL = makeLeg(-1, shoeMatL);
  const legR = makeLeg(1, shoeMatR);
  bodyPivot.add(legL, legR);

  // 5. Jetpack assembly (twin chrome tanks + rocket cones)
  const jetpackGroup = new THREE.Group();
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.25, metalness: 0.5 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.85 });
  const tankL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.56, 12), tankMat);
  tankL.position.set(-0.15, 1.2, 0.34);
  const tankR = tankL.clone();
  tankR.position.x = 0.15;
  const nozzleL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 10), nozzleMat);
  nozzleL.position.set(-0.15, 0.88, 0.34);
  const nozzleR = nozzleL.clone();
  nozzleR.position.x = 0.15;
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xfb923c });
  const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.58, 8), flameMat);
  flameL.rotation.x = Math.PI;
  flameL.position.set(-0.15, 0.56, 0.34);
  const flameR = flameL.clone();
  flameR.position.x = 0.15;
  jetpackGroup.add(tankL, tankR, nozzleL, nozzleR, flameL, flameR);
  jetpackGroup.visible = false;
  bodyPivot.add(jetpackGroup);

  // 6. Magnet Aura Ring & Energy Shield Sphere
  const magnetAura = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.045, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.75 })
  );
  magnetAura.rotation.x = Math.PI / 2;
  magnetAura.position.y = 1.15;
  magnetAura.visible = false;
  bodyPivot.add(magnetAura);

  const shieldAura = new THREE.Mesh(
    new THREE.SphereGeometry(1.12, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.22,
      wireframe: true,
    })
  );
  shieldAura.position.y = 1.15;
  shieldAura.visible = false;
  bodyPivot.add(shieldAura);

  // 7. HD Hoverboard assembly (sculpted deck + procedural 512x1024 graphic texture + 4 turbine pods + dual rear thrusters)
  const boardGroup = new THREE.Group();
  const boardSpinGroup = new THREE.Group();
  boardGroup.add(boardSpinGroup);

  const boardDeckMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.35,
    emissive: initialBoard.glowColor,
    emissiveIntensity: 0.16,
  });
  const boardTrimMat = new THREE.MeshBasicMaterial({ color: initialBoard.trimColor });
  const boardFlameMat = new THREE.MeshBasicMaterial({
    color: initialBoard.glowColor,
    transparent: true,
    opacity: 0.88,
  });
  const carbonBumperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65, metalness: 0.45 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.085, 1.58), boardDeckMat);
  const deckLowerTrim = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.032, 1.54), boardTrimMat);
  deckLowerTrim.position.y = -0.04;

  const noseKick = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.075, 0.42), boardDeckMat);
  noseKick.position.set(0, 0.08, -0.92);
  noseKick.rotation.x = -0.34;
  const noseBumper = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.12), carbonBumperMat);
  noseBumper.position.set(0, 0.15, -1.12);
  noseBumper.rotation.x = -0.34;

  const tailKick = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.075, 0.4), boardDeckMat);
  tailKick.position.set(0, 0.07, 0.91);
  tailKick.rotation.x = 0.3;

  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 1.72), boardTrimMat);
  railL.position.set(-0.39, 0, 0);
  const railR = railL.clone();
  railR.position.x = 0.39;

  // 4 HD corner hover-turbine pods with metallic housings & glowing rings
  const podOffsets: [number, number][] = [
    [-0.25, -0.5],
    [0.25, -0.5],
    [-0.25, 0.5],
    [0.25, 0.5],
  ];
  const podHousingGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.07, 14);
  const podGlowGeo = new THREE.TorusGeometry(0.13, 0.025, 8, 16);
  podOffsets.forEach(([px, pz]) => {
    const housing = new THREE.Mesh(podHousingGeo, nozzleMat);
    housing.position.set(px, -0.065, pz);
    const glowRing = new THREE.Mesh(podGlowGeo, boardFlameMat);
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.set(px, -0.1, pz);
    boardSpinGroup.add(housing, glowRing);
  });

  // Dual rear plasma thrusters + stabilizer fins
  for (const sx of [-0.18, 0.18]) {
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.115, 0.24, 12), nozzleMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(sx, -0.01, 1.04);
    const jetExhaust = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.44, 10), boardFlameMat);
    jetExhaust.rotation.x = Math.PI / 2;
    jetExhaust.position.set(sx, -0.01, 1.32);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.26), boardTrimMat);
    fin.position.set(sx * 1.85, 0.1, 0.85);
    fin.rotation.z = sx < 0 ? 0.28 : -0.28;
    boardSpinGroup.add(thruster, jetExhaust, fin);
  }

  boardSpinGroup.add(
    deck,
    deckLowerTrim,
    noseKick,
    noseBumper,
    tailKick,
    railL,
    railR
  );
  boardGroup.position.y = 0.22;
  boardGroup.visible = false;
  root.add(boardGroup);

  // 8. Soft radial contact shadow
  const shadowDisc = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.025;
  root.add(shadowDisc);

  function applyCharacter(def: CharacterDef): void {
    matHoodie.color.setHex(def.hoodieColor);
    matPants.color.setHex(def.pantsColor);
    matHat.color.setHex(def.hatColor);
    matAccent.color.setHex(def.accentColor);
    matSkin.color.setHex(def.skinColor);
    shoeMatL.color.setHex(def.shoeColor);
    shoeMatR.color.setHex(def.shoeColor);

    capGroup.visible = def.accessory === 'cap';
    beanieGroup.visible = def.accessory === 'beanie';
    boomboxGroup.visible = def.accessory === 'boombox';
    visorGroup.visible = def.accessory === 'visor';
    crownGroup.visible = def.accessory === 'crown';
    headphonesGroup.visible = def.accessory === 'headphones';
    wingHeadGroup.visible = def.accessory === 'jetwing';
    backWingGroup.visible = def.accessory === 'jetwing';

    // Beat carries a larger boombox backpack
    backpack.scale.set(def.accessory === 'boombox' ? 1.35 : 1, 1, def.accessory === 'boombox' ? 1.35 : 1);
  }

  let currentDeckTex: THREE.CanvasTexture | null = null;
  function applyHoverboard(def: HoverboardDef, custom?: BoardCustomization): void {
    const deckHex = custom?.paintHex ?? '#' + def.deckColor.toString(16).padStart(6, '0');
    const trimHex = '#' + def.trimColor.toString(16).padStart(6, '0');
    const glowHex = custom?.glowHex ?? '#' + def.glowColor.toString(16).padStart(6, '0');
    const pattern = custom?.pattern ?? 'classic';

    if (typeof document !== 'undefined') {
      const nextTex = makeSkateDeckTexture(deckHex, trimHex, glowHex, pattern, 4);
      if (currentDeckTex) currentDeckTex.dispose();
      currentDeckTex = nextTex;
      boardDeckMat.map = nextTex;
      boardDeckMat.color.setHex(0xffffff);
      boardDeckMat.needsUpdate = true;
    } else {
      boardDeckMat.color.set(deckHex);
    }

    boardDeckMat.emissive.set(glowHex);
    boardTrimMat.color.set(trimHex);
    boardFlameMat.color.set(glowHex);
  }

  applyCharacter(initialChar);
  applyHoverboard(initialBoard);

  return {
    root,
    bodyPivot,
    headGroup,
    armL,
    armR,
    legL,
    legR,
    shoeMatL,
    shoeMatR,
    jetpackGroup,
    flameL,
    flameR,
    magnetAura,
    shieldAura,
    boardGroup,
    boardSpinGroup,
    boardDeckMat,
    boardTrimMat,
    boardFlameMat,
    shadowDisc,
    applyCharacter,
    applyHoverboard,
  };
}

export function createChaserRig(shadowMat: THREE.MeshBasicMaterial): ChaserRig {
  const group = new THREE.Group();
  const inspectorGroup = new THREE.Group();
  group.add(inspectorGroup);

  const coatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.72, metalness: 0.1 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6c08e, roughness: 0.65 });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.15 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.85 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.45 });

  const coat = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.92, 0.48), coatMat);
  coat.position.y = 1.24;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.5), bootMat);
  belt.position.y = 0.88;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.53), goldMat);
  buckle.position.y = 0.88;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.46), skinMat);
  head.position.y = 1.94;
  const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.08), hatMat);
  mustache.position.set(0, 1.84, -0.25);
  const hat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.58), hatMat);
  hat.position.y = 2.22;
  const hatBadge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.08), goldMat);
  hatBadge.position.set(0, 2.22, -0.29);

  const armGeo = new THREE.BoxGeometry(0.22, 0.62, 0.22);
  const armL = new THREE.Group();
  armL.position.set(-0.56, 1.56, 0);
  const armLMesh = new THREE.Mesh(armGeo, coatMat);
  armLMesh.position.y = -0.28;
  armL.add(armLMesh);

  const armR = new THREE.Group();
  armR.position.set(0.56, 1.56, 0);
  const armRMesh = new THREE.Mesh(armGeo, coatMat);
  armRMesh.position.y = -0.28;
  const flashlight = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.34, 8), goldMat);
  flashlight.rotation.x = Math.PI / 2;
  flashlight.position.set(0, -0.56, -0.15);
  armR.add(armRMesh, flashlight);

  const legGeo = new THREE.BoxGeometry(0.28, 0.72, 0.28);
  const legL = new THREE.Group();
  legL.position.set(-0.22, 0.78, 0);
  const legLMesh = new THREE.Mesh(legGeo, hatMat);
  legLMesh.position.y = -0.36;
  const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.38), bootMat);
  bootL.position.set(0, -0.7, -0.05);
  legL.add(legLMesh, bootL);

  const legR = new THREE.Group();
  legR.position.set(0.22, 0.78, 0);
  const legRMesh = new THREE.Mesh(legGeo, hatMat);
  legRMesh.position.y = -0.36;
  const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.38), bootMat);
  bootR.position.set(0, -0.7, -0.05);
  legR.add(legRMesh, bootR);

  const inspShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), shadowMat);
  inspShadow.rotation.x = -Math.PI / 2;
  inspShadow.position.y = 0.025;

  inspectorGroup.add(coat, belt, buckle, head, mustache, hat, hatBadge, armL, armR, legL, legR, inspShadow);

  // Guard Dog (composite 9-part rig)
  const dogGroup = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
  const earMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });

  const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.88), furMat);
  dogBody.position.y = 0.48;
  const dogHead = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.42), furMat);
  dogHead.position.set(0, 0.68, -0.48);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), earMat);
  snout.position.set(0, 0.62, -0.72);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.14), collarMat);
  collar.position.set(0, 0.56, -0.36);
  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.12), earMat);
  earL.position.set(-0.2, 0.78, -0.45);
  const earR = earL.clone();
  earR.position.x = 0.2;
  const dogTail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.36), earMat);
  dogTail.position.set(0, 0.62, 0.54);
  dogTail.rotation.x = 0.55;

  const dLegGeo = new THREE.BoxGeometry(0.13, 0.32, 0.13);
  const dogLegFL = new THREE.Mesh(dLegGeo, furMat);
  dogLegFL.position.set(-0.14, 0.16, -0.28);
  const dogLegFR = new THREE.Mesh(dLegGeo, furMat);
  dogLegFR.position.set(0.14, 0.16, -0.28);
  const dogLegBL = new THREE.Mesh(dLegGeo, furMat);
  dogLegBL.position.set(-0.14, 0.16, 0.28);
  const dogLegBR = new THREE.Mesh(dLegGeo, furMat);
  dogLegBR.position.set(0.14, 0.16, 0.28);

  const dogShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), shadowMat);
  dogShadow.rotation.x = -Math.PI / 2;
  dogShadow.position.y = 0.025;

  dogGroup.add(
    dogBody,
    dogHead,
    snout,
    collar,
    earL,
    earR,
    dogTail,
    dogLegFL,
    dogLegFR,
    dogLegBL,
    dogLegBR,
    dogShadow
  );
  dogGroup.position.set(1.05, 0, 0.35);
  group.add(dogGroup);

  return {
    group,
    inspectorGroup,
    legL,
    legR,
    armL,
    armR,
    dogGroup,
    dogLegFL,
    dogLegFR,
    dogLegBL,
    dogLegBR,
    dogTail,
  };
}

export function buildTrainGroup(
  sideMat: THREE.MeshStandardMaterial,
  frontMat: THREE.MeshStandardMaterial,
  roofMat: THREE.MeshStandardMaterial,
  moving: boolean,
  assets: SharedAssets
): THREE.Group {
  const g = new THREE.Group();

  const body = new THREE.Mesh(assets.geo.trainBody, sideMat);
  body.position.y = (TRAIN_HEIGHT - 0.32) / 2 + 0.18;

  const roof = new THREE.Mesh(assets.geo.trainRoof, roofMat);
  roof.position.y = TRAIN_HEIGHT - 0.06;

  // Roof AC pods (adds industrial silhouette)
  const ac1 = new THREE.Mesh(assets.geo.trainRoofUnit, assets.mat.metalDark);
  ac1.position.set(0, TRAIN_HEIGHT + 0.12, -3.4);
  const ac2 = ac1.clone();
  ac2.position.z = 3.4;

  // Front & rear cab faceplates with windshield + destination LED
  const frontFace = new THREE.Mesh(assets.geo.trainFrontFace, frontMat);
  frontFace.position.set(0, TRAIN_HEIGHT * 0.52, 6.77);

  // Dual headlights (bright on moving trains, dim amber on parked)
  const lightMat = moving ? assets.mat.headlight : assets.mat.taillight;
  const hlL = new THREE.Mesh(assets.geo.trainLight, lightMat);
  hlL.position.set(-0.78, 0.88, 6.82);
  const hlR = hlL.clone();
  hlR.position.x = 0.78;

  // Undercarriage bogies
  const bogieFront = new THREE.Mesh(assets.geo.trainBogie, assets.mat.metalDark);
  bogieFront.position.set(0, 0.22, 4.4);
  const bogieBack = bogieFront.clone();
  bogieBack.position.z = -4.4;

  g.add(body, roof, ac1, ac2, frontFace, hlL, hlR, bogieFront, bogieBack);

  // Express warning beacons & soft translucent headlight beams on oncoming moving trains
  if (moving) {
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.2, 10),
      assets.mat.taillight
    );
    beacon.position.set(0, TRAIN_HEIGHT + 0.16, 5.8);
    const beamL = new THREE.Mesh(assets.geo.trainBeam, assets.mat.headlightBeam);
    beamL.rotation.x = -Math.PI / 2;
    beamL.position.set(-0.78, 0.72, 9.8);
    const beamR = beamL.clone();
    beamR.position.x = 0.78;
    g.add(beacon, beamL, beamR);
  }

  return g;
}

export function buildPowerUpMesh(kind: PowerUpType | 'key' | 'mystery', assets: SharedAssets): THREE.Group {
  const g = new THREE.Group();

  if (kind === 'key') {
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.84, 0.12), assets.mat.puKey);
    const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.12), assets.mat.puKey);
    bit1.position.set(0.14, -0.32, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.075, 8, 16), assets.mat.puKey);
    ring.position.y = 0.52;
    const halo = new THREE.Mesh(assets.geo.puRing, assets.mat.haloCyan);
    g.add(shaft, bit1, ring, halo);
    return g;
  }

  if (kind === 'mystery') {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.95), assets.mat.mysteryBox);
    const ribbonA = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 1.0), assets.mat.coinGold);
    const ribbonB = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.0, 1.0), assets.mat.coinGold);
    const halo = new THREE.Mesh(assets.geo.puRing, assets.mat.haloGold);
    g.add(crate, ribbonA, ribbonB, halo);
    return g;
  }

  if (kind === 'magnet') {
    // Composite U-shaped horseshoe magnet
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.13, 10, 18, Math.PI),
      assets.mat.puMagnet
    );
    arch.position.y = 0.12;
    const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 0.22), assets.mat.metalChrome);
    tipL.position.set(-0.36, -0.05, 0);
    const tipR = tipL.clone();
    tipR.position.x = 0.36;
    const halo = new THREE.Mesh(assets.geo.puRing, assets.mat.haloCyan);
    g.add(arch, tipL, tipR, halo);
    return g;
  }

  if (kind === 'sneakers') {
    // Winged green-gold sneaker silhouette
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.82), assets.mat.coinGold);
    sole.position.y = -0.18;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.68), assets.mat.puSneakers);
    upper.position.set(0, 0.05, -0.03);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.18), assets.mat.puSneakers);
    tongue.position.set(0, 0.24, 0.16);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), assets.mat.coinGold);
    wingL.position.set(-0.34, 0.1, 0.1);
    wingL.rotation.z = 0.35;
    const wingR = wingL.clone();
    wingR.position.x = 0.34;
    wingR.rotation.z = -0.35;
    const halo = new THREE.Mesh(assets.geo.puRing, assets.mat.haloGreen);
    g.add(sole, upper, tongue, wingL, wingR, halo);
    return g;
  }

  if (kind === 'multiplier') {
    // 2x Golden-Magenta Star Badge
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.18, 6), assets.mat.puMult);
    disc.rotation.x = Math.PI / 2;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), assets.mat.coinGold);
    const halo = new THREE.Mesh(assets.geo.puRing, assets.mat.haloPink);
    g.add(disc, core, halo);
    return g;
  }

  if (kind === 'pogo') {
    // Spring-loaded Pogo Stick
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.05, 10), assets.mat.puPogo);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.1), assets.mat.metalChrome);
    handle.position.y = 0.48;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.16), assets.mat.coinGold);
    foot.position.y = -0.22;
    const halo = new THREE.Mesh(assets.geo.puRing, assets.mat.haloGreen);
    g.add(stem, handle, foot, halo);
    return g;
  }

  // Default: Jetpack (twin rocket tanks + winglet)
  const tankL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.72, 10), assets.mat.puJetpack);
  tankL.position.x = -0.18;
  const tankR = tankL.clone();
  tankR.position.x = 0.18;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.22), assets.mat.metalChrome);
  const coneL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 10), assets.mat.coinGold);
  coneL.position.set(-0.18, 0.45, 0);
  const coneR = coneL.clone();
  coneR.position.x = 0.18;
  const halo = new THREE.Mesh(assets.geo.puRing, assets.mat.haloPink);
  g.add(tankL, tankR, bridge, coneL, coneR, halo);
  return g;
}

export function makeRampGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(7.5, 0);
  shape.lineTo(7.5, TRAIN_HEIGHT);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: TRAIN_WIDTH - 0.18, bevelEnabled: false });
  geo.translate(0, 0, -(TRAIN_WIDTH - 0.18) / 2);
  geo.rotateY(Math.PI / 2);
  geo.translate(0, 0, 3.75);
  return geo;
}
