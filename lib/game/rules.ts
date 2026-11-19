import type {
  BiomeKey,
  BiomeUnlockDef,
  BoardCustomization,
  CharacterDef,
  CharacterId,
  DailyMissionProgress,
  DailyStreakState,
  HoverboardDef,
  HoverboardId,
  LeaderboardEntry,
  LevelMilestoneDef,
  LevelProfile,
  LevelUnlockSummary,
  MissionDef,
  MissionMetric,
  MysteryReward,
  ObstacleBox,
  PowerUpType,
  SaveData,
  SkatePattern,
  SkateTrail,
  UpgradeKey,
} from './types';

export const STORAGE_KEY = 'rail_rushers_pro_save_v2';
export const LANE_WIDTH = 3.1;
export const TRAIN_HEIGHT = 3.15;
export const TRAIN_WIDTH = 2.48;
export const CHUNK_LEN = 32;
export const NUM_CHUNKS = 8;
export const MAX_UPGRADE_LEVEL = 5;
export const MAX_BASE_MULTIPLIER = 30;
export const MAX_LEADERBOARD_ENTRIES = 5;
export const DAILY_STREAK_REWARDS = [50, 75, 100, 150, 200, 300, 500] as const;
export const COMBO_WINDOW_SECONDS = 2.4;

export const BIOME_ORDER: BiomeKey[] = ['classic', 'tokyo', 'canyon', 'arctic', 'cyberport'];

export const BIOME_DEFS: BiomeUnlockDef[] = [
  { id: 'classic', label: 'Metro', dot: '#38bdf8', requiredLevel: 1, coinCost: 0, keyCost: 0 },
  { id: 'tokyo', label: 'Tóquio Neon', dot: '#e879f9', requiredLevel: 1, coinCost: 0, keyCost: 0 },
  { id: 'canyon', label: 'Cânion', dot: '#fb923c', requiredLevel: 1, coinCost: 0, keyCost: 0 },
  { id: 'arctic', label: 'Expresso Polar', dot: '#7dd3fc', requiredLevel: 2, coinCost: 280, keyCost: 3 },
  { id: 'cyberport', label: 'Porto Espacial', dot: '#fde047', requiredLevel: 4, coinCost: 520, keyCost: 5 },
];

export const DEFAULT_BOARD_CUSTOMIZATION: BoardCustomization = {
  paintHex: null,
  glowHex: null,
  pattern: 'classic',
  trail: 'match',
};

export const SKATE_PAINTS: { id: string; label: string; hex: string | null; requiredLevel?: number }[] = [
  { id: 'default', label: 'Original', hex: null },
  { id: 'cyan', label: 'Ciano Turbo', hex: '#06b6d4' },
  { id: 'crimson', label: 'Carmesim', hex: '#e11d48' },
  { id: 'lime', label: 'Lima Neon', hex: '#65a30d' },
  { id: 'violet', label: 'Ultra Violeta', hex: '#7c3aed' },
  { id: 'gold', label: 'Ouro Cromado', hex: '#eab308' },
  { id: 'stealth', label: 'Carbono Negro', hex: '#1e293b' },
  { id: 'royal_titanium', label: 'Platina Real', hex: '#6366f1', requiredLevel: 10 },
  { id: 'cosmic_ruby', label: 'Rubi Cósmico', hex: '#be123c', requiredLevel: 20 },
];

export const SKATE_GLOWS: { id: string; label: string; hex: string | null; requiredLevel?: number }[] = [
  { id: 'default', label: 'Original', hex: null },
  { id: 'ice', label: 'Azul Gelo', hex: '#38bdf8' },
  { id: 'emerald', label: 'Esmeralda', hex: '#34d399' },
  { id: 'magenta', label: 'Magenta', hex: '#e879f9' },
  { id: 'solar', label: 'Laranja Solar', hex: '#fb923c' },
  { id: 'gold', label: 'Dourado', hex: '#fde047' },
  { id: 'aurora', label: 'Aurora Sónica', hex: '#2dd4bf', requiredLevel: 15 },
];

export const SKATE_PATTERNS: { id: SkatePattern; label: string; requiredLevel?: number }[] = [
  { id: 'classic', label: 'Faixa Pro' },
  { id: 'flames', label: 'Chamas' },
  { id: 'lightning', label: 'Raio' },
  { id: 'star', label: 'Estrela' },
  { id: 'cyber', label: 'Cyber Grid' },
  { id: 'imperial', label: 'Coroa Imperial', requiredLevel: 10 },
];

export const SKATE_TRAILS: { id: SkateTrail; label: string; requiredLevel?: number }[] = [
  { id: 'match', label: 'Cor do Skate' },
  { id: 'plasma', label: 'Plasma Roxo' },
  { id: 'rainbow', label: 'Arco-Íris' },
  { id: 'ice', label: 'Cristal Gelo' },
  { id: 'gold_spark', label: 'Faísca Dourada', requiredLevel: 5 },
];

export const XP_BASE_SPAN = 250;
export const XP_GROWTH_FACTOR = 1.36;

export const ACCOUNT_MILESTONES: LevelMilestoneDef[] = [
  {
    level: 5,
    title: 'Corredor Veterano',
    desc: '+1x Multiplicador Permanente e Rasto Faísca Dourada exclusivo.',
    permanentMultiplierBonus: 1,
    rewardCoins: 150,
    rewardKeys: 2,
    exclusiveVisualLabel: 'Rasto Faísca Dourada',
  },
  {
    level: 10,
    title: 'Mestre dos Trilhos',
    desc: '+2x Multiplicador Permanente, Pintura Platina Real e Gráfico Coroa Imperial.',
    permanentMultiplierBonus: 2,
    rewardCoins: 350,
    rewardKeys: 3,
    exclusiveVisualLabel: 'Coroa Imperial & Platina Real',
  },
  {
    level: 15,
    title: 'Lenda Sónica',
    desc: '+2x Multiplicador Permanente e Brilho Aurora Sónica exclusivo.',
    permanentMultiplierBonus: 2,
    rewardCoins: 600,
    rewardKeys: 4,
    exclusiveVisualLabel: 'Brilho Aurora Sónica',
  },
  {
    level: 20,
    title: 'Titã Imortal',
    desc: '+3x Multiplicador Permanente e Pintura Rubi Cósmico exclusiva.',
    permanentMultiplierBonus: 3,
    rewardCoins: 1000,
    rewardKeys: 5,
    exclusiveVisualLabel: 'Pintura Rubi Cósmico',
  },
];

export const PROCEDURAL_MISSION_BATCH_SIZE = 6;

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'leo',
    name: 'Leo',
    tagline: 'Surfista dos Trilhos · Inicial',
    powerName: 'Turbo Clássico',
    powerDesc: '+20% duração em todos os power-ups',
    cost: 0,
    hoodieColor: 0x2563eb,
    pantsColor: 0x1e293b,
    hatColor: 0xf97316,
    accentColor: 0xfacc15,
    shoeColor: 0xf8fafc,
    skinColor: 0xf6c08e,
    accessory: 'cap',
    badgeHex: '#2563eb',
    perks: { powerupDurationBonus: 0.2 },
  },
  {
    id: 'maya',
    name: 'Maya',
    tagline: 'Skater Urbana · Gorro & Óculos',
    powerName: 'Íman Inicial',
    powerDesc: 'Arranca com 6s de Íman e raio +35%',
    cost: 150,
    hoodieColor: 0x0d9488,
    pantsColor: 0x312e81,
    hatColor: 0xe11d48,
    accentColor: 0x2dd4bf,
    shoeColor: 0x38bdf8,
    skinColor: 0xd99b66,
    accessory: 'beanie',
    badgeHex: '#0d9488',
    perks: { magnetStartSeconds: 6, magnetRadiusBonus: 0.35 },
  },
  {
    id: 'beat',
    name: 'Beat',
    tagline: 'Mestre do Som · Mochila Boombox',
    powerName: 'Ritmo Combo',
    powerDesc: 'Carrega o Combo 2x mais rápido',
    cost: 350,
    hoodieColor: 0xd97706,
    pantsColor: 0x18181b,
    hatColor: 0x7c3aed,
    accentColor: 0xfde047,
    shoeColor: 0xfef08a,
    skinColor: 0x8d5524,
    accessory: 'boombox',
    badgeHex: '#d97706',
    perks: { comboGainMultiplier: 2 },
  },
  {
    id: 'kira',
    name: 'Kira',
    tagline: 'Corredora Neon · Visor Cyber',
    powerName: 'Salto Cyber',
    powerDesc: 'Saltos mais altos e inicia com Prancha grátis',
    cost: 600,
    requiredLevel: 2,
    keyCost: 3,
    hoodieColor: 0x4f46e5,
    pantsColor: 0x0f172a,
    hatColor: 0x06b6d4,
    accentColor: 0xf43f5e,
    shoeColor: 0x22d3ee,
    skinColor: 0xffd1aa,
    accessory: 'visor',
    badgeHex: '#06b6d4',
    perks: { jumpBonus: 1.4, freeStartBoard: true },
  },
  {
    id: 'vex',
    name: 'Vex',
    tagline: 'Rei do Asfalto · Coroa Dourada',
    powerName: 'Toque Dourado',
    powerDesc: '30% de chance das moedas valerem x2',
    cost: 850,
    requiredLevel: 3,
    keyCost: 4,
    hoodieColor: 0x7e22ce,
    pantsColor: 0x111827,
    hatColor: 0xfacc15,
    accentColor: 0xfbbf24,
    shoeColor: 0xfde047,
    skinColor: 0xe6b082,
    accessory: 'crown',
    badgeHex: '#9333ea',
    perks: { doubleCoinChance: 0.3 },
  },
  {
    id: 'zara',
    name: 'Zara',
    tagline: 'Guardiã Elétrica · Auscultadores',
    powerName: 'Escudo Sónico',
    powerDesc: 'Começa cada corrida com Escudo protetor',
    cost: 1100,
    requiredLevel: 4,
    keyCost: 5,
    hoodieColor: 0xe11d48,
    pantsColor: 0x0f172a,
    hatColor: 0x22d3ee,
    accentColor: 0x38bdf8,
    shoeColor: 0xf43f5e,
    skinColor: 0x9c6137,
    accessory: 'headphones',
    badgeHex: '#e11d48',
    perks: { startShield: true },
  },
  {
    id: 'atlas',
    name: 'Atlas',
    tagline: 'Titã Aero · Asas Turbinadas',
    powerName: 'Fúria Estelar',
    powerDesc: 'Arranca com 2x Pontos (10s) e +2x por Nível',
    cost: 1400,
    requiredLevel: 5,
    keyCost: 7,
    hoodieColor: 0x0284c7,
    pantsColor: 0x090d16,
    hatColor: 0xf8fafc,
    accentColor: 0x38bdf8,
    shoeColor: 0xfacc15,
    skinColor: 0xf3c6a0,
    accessory: 'jetwing',
    badgeHex: '#0284c7',
    perks: { start2xSeconds: 10, levelMultiplierBonus: 1 },
  },
];

export const HOVERBOARDS: HoverboardDef[] = [
  {
    id: 'dart',
    name: 'Sky Dart',
    perk: 'Prancha equilibrada para desvio rápido',
    cost: 0,
    requiredLevel: 1,
    deckColor: 0x06b6d4,
    trimColor: 0xf43f5e,
    glowColor: 0x22d3ee,
    speedBonus: 0,
    jumpBonus: 0,
  },
  {
    id: 'blaze',
    name: 'Blaze Turbo',
    perk: '+12% velocidade de impulso',
    cost: 200,
    requiredLevel: 1,
    keyCost: 2,
    deckColor: 0xea580c,
    trimColor: 0xfacc15,
    glowColor: 0xfb923c,
    speedBonus: 2.5,
    jumpBonus: 0,
  },
  {
    id: 'frost',
    name: 'Vortex Glacial',
    perk: 'Estabilidade gelada + salto ágil',
    cost: 360,
    requiredLevel: 2,
    keyCost: 3,
    deckColor: 0x0284c7,
    trimColor: 0xe0f2fe,
    glowColor: 0x7dd3fc,
    speedBonus: 2.0,
    jumpBonus: 1.2,
  },
  {
    id: 'cyber',
    name: 'Cyber Pulse',
    perk: 'Salto mais alto durante a prancha',
    cost: 420,
    requiredLevel: 2,
    keyCost: 3,
    deckColor: 0x4f46e5,
    trimColor: 0x2dd4bf,
    glowColor: 0xa78bfa,
    speedBonus: 1.0,
    jumpBonus: 1.8,
  },
  {
    id: 'royal',
    name: 'Coroa Dourada',
    perk: 'Velocidade & salto aprimorados',
    cost: 750,
    requiredLevel: 3,
    keyCost: 4,
    deckColor: 0xeab308,
    trimColor: 0xfef9c3,
    glowColor: 0xfde047,
    speedBonus: 3.0,
    jumpBonus: 2.0,
  },
  {
    id: 'carbon',
    name: 'Fantom Carbono',
    perk: 'Motor duplo stealth + alta resposta',
    cost: 950,
    requiredLevel: 4,
    keyCost: 5,
    deckColor: 0x1e293b,
    trimColor: 0xf43f5e,
    glowColor: 0xfb7185,
    speedBonus: 3.5,
    jumpBonus: 1.6,
  },
  {
    id: 'titan',
    name: 'Titã Sónico',
    perk: 'Impulso máximo + salto supersónico',
    cost: 1300,
    requiredLevel: 5,
    keyCost: 6,
    deckColor: 0x0f172a,
    trimColor: 0x38bdf8,
    glowColor: 0x22d3ee,
    speedBonus: 4.2,
    jumpBonus: 2.4,
  },
];

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: 'dm_coins_30',
    title: 'Caçador de Moedas',
    desc: 'Colete 50 moedas em uma corrida',
    type: 'coins',
    goal: 50,
    rewardCoins: 80,
    perRun: true,
  },
  {
    id: 'dm_dist_500',
    title: 'Maratona nos Trilhos',
    desc: 'Corra por 500 metros em uma corrida',
    type: 'dist',
    goal: 500,
    rewardCoins: 100,
    perRun: true,
  },
  {
    id: 'dm_powerups_3',
    title: 'Energia Máxima',
    desc: 'Colete 3 power-ups hoje',
    type: 'powerups',
    goal: 3,
    rewardCoins: 120,
    rewardKeys: 1,
    perRun: false,
  },
  {
    id: 'dm_jumps_15',
    title: 'Acrobata Urbano',
    desc: 'Salte 15 vezes hoje',
    type: 'jumps',
    goal: 15,
    rewardCoins: 75,
    perRun: false,
  },
  {
    id: 'dm_rolls_10',
    title: 'Deslize Rápido',
    desc: 'Deslize 10 vezes hoje',
    type: 'rolls',
    goal: 10,
    rewardCoins: 75,
    perRun: false,
  },
  {
    id: 'dm_coins_100',
    title: 'Cofre Cheio',
    desc: 'Colete 100 moedas em uma corrida',
    type: 'coins',
    goal: 100,
    rewardCoins: 160,
    rewardKeys: 1,
    perRun: true,
  },
];

export const LEVEL_PROFILES: LevelProfile[] = [
  { level: 1, title: 'Aquecimento', minDistance: 0, speedBonus: 0, trafficDensity: 1.0, ambientIntensity: 0.2 },
  { level: 2, title: 'Ritmo Urbano', minDistance: 220, speedBonus: 1.8, trafficDensity: 1.15, ambientIntensity: 0.42 },
  { level: 3, title: 'Expresso', minDistance: 480, speedBonus: 3.6, trafficDensity: 1.32, ambientIntensity: 0.62 },
  { level: 4, title: 'Turbo', minDistance: 800, speedBonus: 5.4, trafficDensity: 1.48, ambientIntensity: 0.8 },
  { level: 5, title: 'Hipervelocidade', minDistance: 1180, speedBonus: 7.2, trafficDensity: 1.65, ambientIntensity: 0.94 },
];

export function computeRunLevel(distanceMeters: number): number {
  const dist = Math.max(0, distanceMeters);
  if (dist < 220) return 1;
  if (dist < 480) return 2;
  if (dist < 800) return 3;
  if (dist < 1180) return 4;
  if (dist < 1600) return 5;
  return 5 + Math.floor((dist - 1180) / 420);
}

export function getLevelProfile(level: number): LevelProfile {
  const cleanLevel = Math.max(1, Math.floor(level));
  if (cleanLevel <= LEVEL_PROFILES.length) {
    return LEVEL_PROFILES[cleanLevel - 1];
  }
  const extra = cleanLevel - LEVEL_PROFILES.length;
  return {
    level: cleanLevel,
    title: `Lendário ${cleanLevel}`,
    minDistance: 1180 + extra * 420,
    speedBonus: Math.min(14, 7.2 + extra * 1.4),
    trafficDensity: Math.min(2.1, 1.65 + extra * 0.12),
    ambientIntensity: 1.0,
  };
}

export function getNextLevelThreshold(level: number): number {
  return getLevelProfile(level + 1).minDistance;
}

export function getTodayDateKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

export function evaluateDailyStreakState(
  rawStreak: Partial<DailyStreakState> | null | undefined,
  todayKey = getTodayDateKey()
): DailyStreakState {
  const count = Math.max(0, Math.floor(Number(rawStreak?.streakCount) || 0));
  const lastClaim = typeof rawStreak?.lastClaimDate === 'string' ? rawStreak.lastClaimDate : null;

  if (lastClaim === todayKey && count > 0) {
    return { streakCount: count, lastClaimDate: lastClaim, claimedToday: true };
  }
  if (lastClaim === getPreviousDateKey(todayKey) && count > 0) {
    return { streakCount: count, lastClaimDate: lastClaim, claimedToday: false };
  }
  return { streakCount: 0, lastClaimDate: lastClaim, claimedToday: false };
}

export function generateProceduralMission(slotIndex: number, tier: number): MissionDef {
  const cleanTier = Math.max(1, Math.floor(tier));
  const cleanSlot = Math.max(0, Math.floor(slotIndex));
  const templates: {
    type: MissionMetric;
    perRun: boolean;
    titles: string[];
    makeGoal: (t: number) => number;
    makeDesc: (goal: number) => string;
    rewardCoins: (t: number) => number;
  }[] = [
    {
      type: 'coins',
      perRun: true,
      titles: ['Cofre Turbinado', 'Febre do Ouro', 'Saque Sónico'],
      makeGoal: (t) => 90 + t * 35,
      makeDesc: (g) => `Colete ${g} moedas em uma corrida`,
      rewardCoins: (t) => 90 + t * 35,
    },
    {
      type: 'jumps',
      perRun: false,
      titles: ['Salto Infinito', 'Voo nos Trilhos', 'Aéreo Pro'],
      makeGoal: (t) => 20 + t * 10,
      makeDesc: (g) => `Salte ${g} vezes para desviar de obstáculos`,
      rewardCoins: (t) => 85 + t * 30,
    },
    {
      type: 'dist',
      perRun: true,
      titles: ['Corrida Sónica', 'Sem Travões', 'Expresso Imparável'],
      makeGoal: (t) => 650 + t * 250,
      makeDesc: (g) => `Corra ${g} metros em uma corrida`,
      rewardCoins: (t) => 110 + t * 40,
    },
    {
      type: 'rolls',
      perRun: false,
      titles: ['Deslize Ninja', 'Reflexo Baixo', 'Mestre da Esquiva'],
      makeGoal: (t) => 14 + t * 7,
      makeDesc: (g) => `Deslize ${g} vezes por baixo de barreiras`,
      rewardCoins: (t) => 85 + t * 30,
    },
    {
      type: 'powerups',
      perRun: false,
      titles: ['Sobrecarga Neon', 'Energia Pura', 'Caçador de Turbo'],
      makeGoal: (t) => 4 + t * 2,
      makeDesc: (g) => `Colete ${g} power-ups nas pistas`,
      rewardCoins: (t) => 115 + t * 35,
    },
    {
      type: 'boards',
      perRun: false,
      titles: ['Surfista Pro', 'Domínio da Prancha', 'Hover Rush'],
      makeGoal: (t) => 2 + Math.floor(t / 2),
      makeDesc: (g) => `Ative ${g} hoverboards durante corridas`,
      rewardCoins: (t) => 100 + t * 35,
    },
  ];

  const tplIdx = (cleanSlot + cleanTier - 1) % templates.length;
  const tpl = templates[tplIdx];
  const goal = tpl.makeGoal(cleanTier);
  const title = `${tpl.titles[(cleanTier + cleanSlot) % tpl.titles.length]} ${cleanTier > 1 ? `Nv ${cleanTier}` : ''}`.trim();
  const rewardKeys = cleanSlot % 3 === 2 ? (cleanTier >= 3 ? 2 : 1) : undefined;

  return {
    id: `proc_t${cleanTier}_s${cleanSlot}_${tpl.type}`,
    title,
    desc: tpl.makeDesc(goal),
    type: tpl.type,
    goal,
    rewardCoins: tpl.rewardCoins(cleanTier),
    ...(rewardKeys ? { rewardKeys } : {}),
    perRun: tpl.perRun,
    tier: cleanTier,
  };
}

export function generateProceduralMissionBatch(
  tier: number,
  count = PROCEDURAL_MISSION_BATCH_SIZE
): MissionDef[] {
  const cleanTier = Math.max(1, Math.floor(tier));
  const cleanCount = Math.max(1, Math.floor(count));
  return Array.from({ length: cleanCount }, (_, idx) => generateProceduralMission(idx, cleanTier));
}

export function getMissionDefForEntry(
  entry: DailyMissionProgress | undefined,
  indexFallback = 0
): MissionDef {
  if (entry?.def) return entry.def;
  if (entry) {
    const found = DAILY_MISSIONS.find((m) => m.id === entry.id);
    if (found) return found;
  }
  return DAILY_MISSIONS[indexFallback] ?? DAILY_MISSIONS[0];
}

export function createDailyMissionProgressList(cycleTier = 0): DailyMissionProgress[] {
  const defs = cycleTier <= 0 ? DAILY_MISSIONS : generateProceduralMissionBatch(cycleTier);
  return defs.map((m) => ({
    id: m.id,
    progress: 0,
    completed: false,
    def: m,
  }));
}

export function getAccountLevelXpSpan(level: number): number {
  const cleanLevel = Math.max(1, Math.floor(level));
  return Math.round(XP_BASE_SPAN * Math.pow(XP_GROWTH_FACTOR, cleanLevel - 1));
}

export function getTotalXpForAccountLevel(level: number): number {
  const cleanLevel = Math.max(1, Math.floor(level));
  let total = 0;
  for (let lvl = 1; lvl < cleanLevel; lvl++) {
    total += getAccountLevelXpSpan(lvl);
  }
  return total;
}

export function computeAccountLevel(xp: number): number {
  const cleanXp = Math.max(0, Math.floor(xp));
  let level = 1;
  let accumulated = 0;
  while (level < 200) {
    const span = getAccountLevelXpSpan(level);
    if (cleanXp < accumulated + span) {
      return level;
    }
    accumulated += span;
    level += 1;
  }
  return level;
}

export function getAccountXpProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  pct: number;
} {
  const cleanXp = Math.max(0, Math.floor(xp));
  const level = computeAccountLevel(cleanXp);
  const currentThreshold = getTotalXpForAccountLevel(level);
  const span = Math.max(1, getAccountLevelXpSpan(level));
  const intoLevel = Math.max(0, cleanXp - currentThreshold);
  return {
    level,
    currentLevelXp: intoLevel,
    nextLevelXp: span,
    pct: Math.min(100, Math.max(0, Math.round((intoLevel / span) * 100))),
  };
}

export function getMilestoneForLevel(level: number): LevelMilestoneDef | null {
  const cleanLevel = Math.floor(level);
  if (cleanLevel < 5 || cleanLevel % 5 !== 0) return null;
  const preset = ACCOUNT_MILESTONES.find((m) => m.level === cleanLevel);
  if (preset) return preset;
  return {
    level: cleanLevel,
    title: `Marco Lendário Nv ${cleanLevel}`,
    desc: `+2x Multiplicador Permanente e Cofre de Prestígio Nível ${cleanLevel}.`,
    permanentMultiplierBonus: 2,
    rewardCoins: 500 + cleanLevel * 30,
    rewardKeys: 3,
    exclusiveVisualLabel: `Emblema Prestígio Nv ${cleanLevel}`,
  };
}

export function getNextAccountMilestone(level: number): LevelMilestoneDef {
  const cleanLevel = Math.max(1, Math.floor(level));
  const nextMilestoneLevel = Math.floor(cleanLevel / 5) * 5 + 5;
  return (
    getMilestoneForLevel(nextMilestoneLevel) ?? {
      level: nextMilestoneLevel,
      title: `Marco Nv ${nextMilestoneLevel}`,
      desc: '+2x Multiplicador Permanente.',
      permanentMultiplierBonus: 2,
      rewardCoins: 500,
      rewardKeys: 3,
      exclusiveVisualLabel: `Emblema Nv ${nextMilestoneLevel}`,
    }
  );
}

export function applyAccountMilestones(save: SaveData): {
  save: SaveData;
  newlyUnlocked: LevelMilestoneDef[];
} {
  const accountLevel = computeAccountLevel(save.xp);
  const claimedSet = new Set(save.claimedMilestones ?? []);
  const newlyUnlocked: LevelMilestoneDef[] = [];
  let coinsGain = 0;
  let keysGain = 0;
  let multGain = 0;

  for (let lvl = 5; lvl <= accountLevel; lvl += 5) {
    if (claimedSet.has(lvl)) continue;
    const milestone = getMilestoneForLevel(lvl);
    if (!milestone) continue;
    claimedSet.add(lvl);
    newlyUnlocked.push(milestone);
    coinsGain += milestone.rewardCoins;
    keysGain += milestone.rewardKeys;
    multGain += milestone.permanentMultiplierBonus;
  }

  if (newlyUnlocked.length === 0) {
    return { save, newlyUnlocked: [] };
  }

  return {
    save: {
      ...save,
      coins: save.coins + coinsGain,
      keys: save.keys + keysGain,
      baseMultiplier: Math.min(MAX_BASE_MULTIPLIER, save.baseMultiplier + multGain),
      claimedMilestones: Array.from(claimedSet).sort((a, b) => a - b),
    },
    newlyUnlocked,
  };
}

export function getLevelUnlockSummary(
  level: number,
  previousLevel = Math.max(1, level - 1),
  source: 'live' | 'summary' = 'live'
): LevelUnlockSummary {
  const cleanLevel = Math.max(1, Math.floor(level));
  const cleanPrev = Math.max(1, Math.min(cleanLevel - 1, Math.floor(previousLevel)));
  const isNewlyReached = (req?: number) => {
    const r = req ?? 1;
    return r > cleanPrev && r <= cleanLevel;
  };

  const unlockedCharacters = CHARACTERS.filter((c) => isNewlyReached(c.requiredLevel)).map(
    (c) => `${c.name} (${c.powerName})`
  );
  const unlockedBoards = HOVERBOARDS.filter((b) => isNewlyReached(b.requiredLevel)).map(
    (b) => b.name
  );
  const unlockedBiomes = BIOME_DEFS.filter((b) => isNewlyReached(b.requiredLevel)).map(
    (b) => b.label
  );

  const unlockedCosmetics: string[] = [];
  SKATE_PAINTS.forEach((p) => {
    if (isNewlyReached(p.requiredLevel)) unlockedCosmetics.push(`Pintura ${p.label}`);
  });
  SKATE_GLOWS.forEach((g) => {
    if (isNewlyReached(g.requiredLevel)) unlockedCosmetics.push(`Brilho ${g.label}`);
  });
  SKATE_PATTERNS.forEach((p) => {
    if (isNewlyReached(p.requiredLevel)) unlockedCosmetics.push(`Gráfico ${p.label}`);
  });
  SKATE_TRAILS.forEach((t) => {
    if (isNewlyReached(t.requiredLevel)) unlockedCosmetics.push(`Rasto ${t.label}`);
  });

  // Check highest milestone unlocked within (cleanPrev, cleanLevel]
  let milestone: LevelMilestoneDef | null = null;
  for (let lvl = cleanPrev + 1; lvl <= cleanLevel; lvl++) {
    const m = getMilestoneForLevel(lvl);
    if (m) milestone = m;
  }

  return {
    level: cleanLevel,
    previousLevel: cleanPrev,
    nextLevelXpSpan: getAccountLevelXpSpan(cleanLevel),
    isMilestone: milestone !== null,
    milestone,
    unlockedCharacters,
    unlockedBoards,
    unlockedBiomes,
    unlockedCosmetics,
    source,
  };
}

export function calculateRunXp(params: {
  distance: number;
  runCoins: number;
  completedMissions: number;
  nearMisses?: number;
}): number {
  const distXp = Math.max(0, params.distance) * 0.14;
  const coinXp = Math.max(0, params.runCoins) * 0.45;
  const missionXp = Math.max(0, params.completedMissions) * 30;
  const nearXp = Math.max(0, params.nearMisses ?? 0) * 6;
  return Math.max(10, Math.round(distXp + coinXp + missionXp + nearXp));
}

export function createDefaultSave(todayKey = getTodayDateKey()): SaveData {
  return {
    bestScore: 0,
    coins: 180,
    keys: 2,
    boards: 3,
    mysteryBoxes: 0,
    xp: 0,
    baseMultiplier: 1,
    missionIndex: 0,
    completedMissionsTotal: 0,
    claimedMilestones: [],
    dailyDate: todayKey,
    dailyMissions: createDailyMissionProgressList(0),
    dailyStreak: {
      streakCount: 0,
      lastClaimDate: null,
      claimedToday: false,
    },
    leaderboard: [],
    selectedCharacter: 'leo',
    unlockedCharacters: ['leo'],
    selectedBoard: 'dart',
    unlockedBoards: ['dart'],
    customBoard: { ...DEFAULT_BOARD_CUSTOMIZATION },
    selectedBiome: 'classic',
    unlockedBiomes: ['classic', 'tokyo', 'canyon'],
    worldTourAuto: true,
    upgrades: {
      jetpack: 1,
      magnet: 1,
      sneakers: 1,
      multiplier: 1,
    },
  };
}

const VALID_MISSION_METRICS: MissionMetric[] = ['coins', 'jumps', 'rolls', 'dist', 'boards', 'powerups'];

function sanitizeMissionDef(rawDef: unknown): MissionDef | undefined {
  if (!rawDef || typeof rawDef !== 'object') return undefined;
  const d = rawDef as Partial<MissionDef>;
  if (
    typeof d.id !== 'string' ||
    typeof d.title !== 'string' ||
    typeof d.desc !== 'string' ||
    !VALID_MISSION_METRICS.includes(d.type as MissionMetric) ||
    typeof d.goal !== 'number' ||
    d.goal <= 0
  ) {
    return undefined;
  }
  return {
    id: d.id,
    title: d.title,
    desc: d.desc,
    type: d.type as MissionMetric,
    goal: Math.max(1, Math.floor(d.goal)),
    rewardCoins: Math.max(10, Math.floor(Number(d.rewardCoins) || 50)),
    ...(typeof d.rewardKeys === 'number' && d.rewardKeys > 0
      ? { rewardKeys: Math.floor(d.rewardKeys) }
      : {}),
    perRun: Boolean(d.perRun),
    ...(typeof d.tier === 'number' && d.tier >= 1 ? { tier: Math.floor(d.tier) } : {}),
  };
}

export function normalizeSaveData(
  raw: Partial<SaveData> | null | undefined,
  todayKey = getTodayDateKey()
): SaveData {
  const base = createDefaultSave(todayKey);
  if (!raw || typeof raw !== 'object') return base;

  const unlockedChars = Array.isArray(raw.unlockedCharacters)
    ? Array.from(
        new Set([
          'leo' as CharacterId,
          ...raw.unlockedCharacters.filter((id): id is CharacterId =>
            CHARACTERS.some((c) => c.id === id)
          ),
        ])
      )
    : base.unlockedCharacters;

  const selectedCharacter =
    raw.selectedCharacter && unlockedChars.includes(raw.selectedCharacter)
      ? raw.selectedCharacter
      : 'leo';

  const unlockedBoards = Array.isArray(raw.unlockedBoards)
    ? Array.from(
        new Set([
          'dart' as HoverboardId,
          ...raw.unlockedBoards.filter((id): id is HoverboardId =>
            HOVERBOARDS.some((b) => b.id === id)
          ),
        ])
      )
    : base.unlockedBoards;

  const selectedBoard =
    raw.selectedBoard && unlockedBoards.includes(raw.selectedBoard)
      ? raw.selectedBoard
      : 'dart';

  const unlockedBiomes = Array.isArray(raw.unlockedBiomes)
    ? Array.from(
        new Set([
          'classic' as BiomeKey,
          'tokyo' as BiomeKey,
          'canyon' as BiomeKey,
          ...raw.unlockedBiomes.filter((id): id is BiomeKey => BIOME_ORDER.includes(id)),
        ])
      )
    : base.unlockedBiomes;

  const selectedBiome =
    raw.selectedBiome && unlockedBiomes.includes(raw.selectedBiome)
      ? raw.selectedBiome
      : base.selectedBiome;

  const customBoard: BoardCustomization = {
    paintHex:
      raw.customBoard && typeof raw.customBoard.paintHex === 'string'
        ? raw.customBoard.paintHex
        : null,
    glowHex:
      raw.customBoard && typeof raw.customBoard.glowHex === 'string'
        ? raw.customBoard.glowHex
        : null,
    pattern:
      raw.customBoard && SKATE_PATTERNS.some((p) => p.id === raw.customBoard!.pattern)
        ? raw.customBoard.pattern
        : 'classic',
    trail:
      raw.customBoard && SKATE_TRAILS.some((t) => t.id === raw.customBoard!.trail)
        ? raw.customBoard.trail
        : 'match',
  };

  let missionIndex = Math.max(0, Math.floor(Number(raw.missionIndex) || 0));
  const sameDay = raw.dailyDate === todayKey && Array.isArray(raw.dailyMissions);

  let dailyMissions: DailyMissionProgress[];
  if (sameDay && missionIndex >= 1) {
    const validProcEntries = raw.dailyMissions!
      .map((entry) => {
        if (!entry) return null;
        const cleanDef = sanitizeMissionDef(entry.def);
        if (!cleanDef) return null;
        return {
          id: cleanDef.id,
          progress: Math.max(0, Math.min(cleanDef.goal, Math.floor(Number(entry.progress) || 0))),
          completed: Boolean(entry.completed),
          def: cleanDef,
        } as DailyMissionProgress;
      })
      .filter((x): x is DailyMissionProgress => x !== null);

    dailyMissions =
      validProcEntries.length > 0
        ? validProcEntries
        : createDailyMissionProgressList(missionIndex);
  } else if (sameDay) {
    dailyMissions = DAILY_MISSIONS.map((def) => {
      const existing = raw.dailyMissions!.find((entry) => entry && entry.id === def.id);
      return {
        id: def.id,
        progress: Math.max(0, Math.min(def.goal, Math.floor(Number(existing?.progress) || 0))),
        completed: Boolean(existing?.completed),
        def,
      };
    });
  } else {
    missionIndex = 0;
    dailyMissions = createDailyMissionProgressList(0);
  }

  if (dailyMissions.every((m) => m.completed)) {
    missionIndex = Math.max(1, missionIndex + 1);
    dailyMissions = createDailyMissionProgressList(missionIndex);
  }

  const dailyStreak = evaluateDailyStreakState(raw.dailyStreak, todayKey);

  const rawBoard = Array.isArray(raw.leaderboard) ? raw.leaderboard : [];
  const leaderboard: LeaderboardEntry[] = rawBoard
    .filter((entry): entry is LeaderboardEntry => Boolean(entry && typeof entry.score === 'number'))
    .map((entry, idx) => ({
      id: typeof entry.id === 'string' && entry.id ? entry.id : `run_${idx}`,
      score: Math.max(0, Math.floor(Number(entry.score) || 0)),
      distance: Math.max(0, Math.floor(Number(entry.distance) || 0)),
      coins: Math.max(0, Math.floor(Number(entry.coins) || 0)),
      characterId: CHARACTERS.some((c) => c.id === entry.characterId) ? entry.characterId : 'leo',
      date: typeof entry.date === 'string' && entry.date ? entry.date : todayKey,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.distance - a.distance)
    .slice(0, MAX_LEADERBOARD_ENTRIES);

  const claimedMilestones = Array.isArray(raw.claimedMilestones)
    ? Array.from(
        new Set(
          raw.claimedMilestones
            .map((n) => Math.floor(Number(n)))
            .filter((n) => Number.isFinite(n) && n >= 5 && n % 5 === 0)
        )
      ).sort((a, b) => a - b)
    : [];

  return {
    bestScore: Math.max(0, Number(raw.bestScore) || 0),
    coins: Math.max(0, Math.floor(Number(raw.coins) || 0)),
    keys: Math.max(0, Math.floor(Number(raw.keys) || 0)),
    boards: Math.max(0, Math.floor(Number(raw.boards) || 0)),
    mysteryBoxes: Math.max(0, Math.floor(Number(raw.mysteryBoxes) || 0)),
    xp: Math.max(0, Math.floor(Number(raw.xp) || 0)),
    baseMultiplier: Math.min(
      MAX_BASE_MULTIPLIER,
      Math.max(1, Math.floor(Number(raw.baseMultiplier) || 1))
    ),
    missionIndex,
    completedMissionsTotal: Math.max(0, Math.floor(Number(raw.completedMissionsTotal) || 0)),
    claimedMilestones,
    dailyDate: todayKey,
    dailyMissions,
    dailyStreak,
    leaderboard,
    selectedCharacter,
    unlockedCharacters: unlockedChars,
    selectedBoard,
    unlockedBoards,
    customBoard,
    selectedBiome,
    unlockedBiomes,
    worldTourAuto: typeof raw.worldTourAuto === 'boolean' ? raw.worldTourAuto : true,
    upgrades: {
      jetpack: clampUpgradeLevel(raw.upgrades?.jetpack),
      magnet: clampUpgradeLevel(raw.upgrades?.magnet),
      sneakers: clampUpgradeLevel(raw.upgrades?.sneakers),
      multiplier: clampUpgradeLevel(raw.upgrades?.multiplier),
    },
  };
}

function clampUpgradeLevel(val: unknown): number {
  const n = Math.floor(Number(val) || 1);
  return Math.max(1, Math.min(MAX_UPGRADE_LEVEL, n));
}

export function getActiveDailyMission(save: SaveData): {
  def: MissionDef;
  state: DailyMissionProgress;
  index: number;
} {
  const list = save.dailyMissions.length > 0 ? save.dailyMissions : createDailyMissionProgressList(0);
  const firstPendingIdx = list.findIndex((m) => !m.completed);
  const idx = firstPendingIdx >= 0 ? firstPendingIdx : list.length - 1;
  const state = list[idx];
  return {
    def: getMissionDefForEntry(state, idx),
    state,
    index: idx,
  };
}

export function applyRunMissionProgress(
  save: SaveData,
  runMetrics: {
    coins: number;
    dist: number;
    jumps: number;
    rolls: number;
    powerups: number;
    boards: number;
  },
  deltaMetrics: {
    jumps: number;
    rolls: number;
    powerups: number;
    boards: number;
  }
): {
  save: SaveData;
  newlyCompleted: MissionDef[];
  batchCompleted?: boolean;
  nextCycleTier?: number;
} {
  let coinsBonus = 0;
  let keysBonus = 0;
  let multBonus = 0;
  const newlyCompleted: MissionDef[] = [];

  const nextMissions = save.dailyMissions.map((entry, idx) => {
    const def = getMissionDefForEntry(entry, idx);
    if (!def || entry.completed) return entry;

    const nextProgress = def.perRun
      ? Math.max(entry.progress, Math.floor(runMetrics[def.type]))
      : Math.min(def.goal, entry.progress + Math.floor(deltaMetrics[def.type as keyof typeof deltaMetrics] || 0));

    if (nextProgress >= def.goal) {
      coinsBonus += def.rewardCoins;
      keysBonus += def.rewardKeys || 0;
      multBonus += 1;
      newlyCompleted.push(def);
      return { id: def.id, progress: def.goal, completed: true, def };
    }
    return { id: def.id, progress: nextProgress, completed: false, def };
  });

  if (newlyCompleted.length === 0 && nextMissions.every((m, i) => m.progress === save.dailyMissions[i].progress)) {
    return { save, newlyCompleted: [] };
  }

  const allCompleted = nextMissions.length > 0 && nextMissions.every((m) => m.completed);
  const nextMissionIndex = allCompleted ? Math.max(1, save.missionIndex + 1) : save.missionIndex;
  const finalMissions = allCompleted
    ? createDailyMissionProgressList(nextMissionIndex)
    : nextMissions;

  return {
    save: {
      ...save,
      coins: save.coins + coinsBonus,
      keys: save.keys + keysBonus,
      baseMultiplier: Math.min(MAX_BASE_MULTIPLIER, save.baseMultiplier + multBonus),
      missionIndex: nextMissionIndex,
      completedMissionsTotal: (save.completedMissionsTotal ?? 0) + newlyCompleted.length,
      dailyMissions: finalMissions,
    },
    newlyCompleted,
    ...(allCompleted ? { batchCompleted: true, nextCycleTier: nextMissionIndex } : {}),
  };
}

export function getCharacterDef(id: CharacterId): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

export function getHoverboardDef(id: HoverboardId): HoverboardDef {
  return HOVERBOARDS.find((b) => b.id === id) ?? HOVERBOARDS[0];
}

export function getBiomeDef(id: BiomeKey): BiomeUnlockDef {
  return BIOME_DEFS.find((b) => b.id === id) ?? BIOME_DEFS[0];
}

export function getUpgradeCost(level: number): number {
  return level * 80;
}

export function purchaseOrSelectCharacter(
  save: SaveData,
  charId: CharacterId,
  currency: 'coins' | 'keys' = 'coins'
): { save: SaveData; outcome: 'selected' | 'unlocked' | 'insufficient' | 'level_locked' } {
  const def = getCharacterDef(charId);
  if (save.unlockedCharacters.includes(charId)) {
    return {
      save: { ...save, selectedCharacter: charId },
      outcome: 'selected',
    };
  }
  const accountLevel = computeAccountLevel(save.xp);
  if (currency === 'keys') {
    const keyPrice = def.keyCost ?? 999;
    if (save.keys < keyPrice) return { save, outcome: 'insufficient' };
    return {
      save: {
        ...save,
        keys: save.keys - keyPrice,
        unlockedCharacters: [...save.unlockedCharacters, charId],
        selectedCharacter: charId,
      },
      outcome: 'unlocked',
    };
  }
  if (accountLevel < (def.requiredLevel ?? 1)) {
    return { save, outcome: 'level_locked' };
  }
  if (save.coins < def.cost) {
    return { save, outcome: 'insufficient' };
  }
  return {
    save: {
      ...save,
      coins: save.coins - def.cost,
      unlockedCharacters: [...save.unlockedCharacters, charId],
      selectedCharacter: charId,
    },
    outcome: 'unlocked',
  };
}

export function purchaseOrSelectHoverboard(
  save: SaveData,
  boardId: HoverboardId,
  currency: 'coins' | 'keys' = 'coins'
): { save: SaveData; outcome: 'selected' | 'unlocked' | 'insufficient' | 'level_locked' } {
  const def = getHoverboardDef(boardId);
  if (save.unlockedBoards.includes(boardId)) {
    return {
      save: { ...save, selectedBoard: boardId },
      outcome: 'selected',
    };
  }
  const accountLevel = computeAccountLevel(save.xp);
  if (currency === 'keys') {
    const keyPrice = def.keyCost ?? 999;
    if (save.keys < keyPrice) return { save, outcome: 'insufficient' };
    return {
      save: {
        ...save,
        keys: save.keys - keyPrice,
        unlockedBoards: [...save.unlockedBoards, boardId],
        selectedBoard: boardId,
      },
      outcome: 'unlocked',
    };
  }
  if (accountLevel < (def.requiredLevel ?? 1)) {
    return { save, outcome: 'level_locked' };
  }
  if (save.coins < def.cost) {
    return { save, outcome: 'insufficient' };
  }
  return {
    save: {
      ...save,
      coins: save.coins - def.cost,
      unlockedBoards: [...save.unlockedBoards, boardId],
      selectedBoard: boardId,
    },
    outcome: 'unlocked',
  };
}

export function purchaseOrSelectBiome(
  save: SaveData,
  biomeId: BiomeKey,
  currency: 'coins' | 'keys' = 'coins'
): { save: SaveData; outcome: 'selected' | 'unlocked' | 'insufficient' | 'level_locked' } {
  const def = getBiomeDef(biomeId);
  if (save.unlockedBiomes.includes(biomeId)) {
    return {
      save: { ...save, selectedBiome: biomeId },
      outcome: 'selected',
    };
  }
  const accountLevel = computeAccountLevel(save.xp);
  if (currency === 'keys') {
    if (save.keys < def.keyCost) return { save, outcome: 'insufficient' };
    return {
      save: {
        ...save,
        keys: save.keys - def.keyCost,
        unlockedBiomes: [...save.unlockedBiomes, biomeId],
        selectedBiome: biomeId,
      },
      outcome: 'unlocked',
    };
  }
  if (accountLevel < def.requiredLevel) {
    return { save, outcome: 'level_locked' };
  }
  if (save.coins < def.coinCost) {
    return { save, outcome: 'insufficient' };
  }
  return {
    save: {
      ...save,
      coins: save.coins - def.coinCost,
      unlockedBiomes: [...save.unlockedBiomes, biomeId],
      selectedBiome: biomeId,
    },
    outcome: 'unlocked',
  };
}

export function purchaseUpgrade(
  save: SaveData,
  key: UpgradeKey
): { save: SaveData; purchased: boolean } {
  const cur = save.upgrades[key];
  if (cur >= MAX_UPGRADE_LEVEL) return { save, purchased: false };
  const cost = getUpgradeCost(cur);
  if (save.coins < cost) return { save, purchased: false };
  return {
    save: {
      ...save,
      coins: save.coins - cost,
      upgrades: { ...save.upgrades, [key]: cur + 1 },
    },
    purchased: true,
  };
}

export function purchaseBoardConsumable(
  save: SaveData,
  cost = 50
): { save: SaveData; purchased: boolean } {
  if (save.coins < cost) return { save, purchased: false };
  return {
    save: {
      ...save,
      coins: save.coins - cost,
      boards: save.boards + 1,
    },
    purchased: true,
  };
}

export function recordRunToLeaderboard(
  save: SaveData,
  run: Omit<LeaderboardEntry, 'id'>,
  entryId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
): SaveData {
  const cleanScore = Math.max(0, Math.floor(run.score));
  if (cleanScore <= 0) return save;

  const nextEntry: LeaderboardEntry = {
    id: entryId,
    score: cleanScore,
    distance: Math.max(0, Math.floor(run.distance)),
    coins: Math.max(0, Math.floor(run.coins)),
    characterId: run.characterId,
    date: run.date,
  };

  const nextBoard = [...save.leaderboard, nextEntry]
    .sort((a, b) => b.score - a.score || b.distance - a.distance)
    .slice(0, MAX_LEADERBOARD_ENTRIES);

  return {
    ...save,
    leaderboard: nextBoard,
  };
}

export function getNextStreakDayAndReward(streak: DailyStreakState): {
  activeDayNumber: number;
  cycleDayIndex: number;
  rewardCoins: number;
} {
  const activeDayNumber = streak.claimedToday ? Math.max(1, streak.streakCount) : streak.streakCount + 1;
  const cycleDayIndex = (activeDayNumber - 1) % DAILY_STREAK_REWARDS.length;
  return {
    activeDayNumber,
    cycleDayIndex,
    rewardCoins: DAILY_STREAK_REWARDS[cycleDayIndex],
  };
}

export function claimDailyStreakReward(
  save: SaveData,
  todayKey = getTodayDateKey()
): { save: SaveData; claimedDay: number; rewardCoins: number } | null {
  const evaluated = evaluateDailyStreakState(save.dailyStreak, todayKey);
  if (evaluated.claimedToday) return null;

  const nextCount = evaluated.streakCount + 1;
  const rewardCoins = DAILY_STREAK_REWARDS[(nextCount - 1) % DAILY_STREAK_REWARDS.length];

  return {
    save: {
      ...save,
      coins: save.coins + rewardCoins,
      dailyStreak: {
        streakCount: nextCount,
        lastClaimDate: todayKey,
        claimedToday: true,
      },
    },
    claimedDay: nextCount,
    rewardCoins,
  };
}

export function computeComboBonus(comboCount: number): number {
  if (comboCount >= 35) return 4;
  if (comboCount >= 22) return 3;
  if (comboCount >= 12) return 2;
  if (comboCount >= 5) return 1;
  return 0;
}

export function getComboMilestoneLabel(comboCount: number, comboBonus: number): string {
  if (comboBonus >= 4 || comboCount >= 35) return 'COMBO LENDÁRIO!';
  if (comboBonus >= 3 || comboCount >= 22) return 'SUPER RUSH!';
  if (comboBonus >= 2 || comboCount >= 12) return 'TURBO COMBO!';
  return 'COMBO ATIVO!';
}

export function computeTargetSpeed(distanceMeters: number, level = computeRunLevel(distanceMeters)): number {
  const dist = Math.max(0, distanceMeters);
  // Smooth asymptotic curve starting at 20m/s and leveling off smoothly around 36-39m/s
  const base = 20 + 17 * (dist / (dist + 520));
  const profile = getLevelProfile(level);
  return Math.min(40, base + profile.speedBonus * 0.35);
}

export function getPowerUpDuration(
  kind: PowerUpType,
  upgrades: Record<UpgradeKey, number>,
  durationBonus = 0
): number {
  const scale = 1 + Math.max(0, durationBonus);
  switch (kind) {
    case 'jetpack':
      return (8.0 + upgrades.jetpack * 1.5) * scale;
    case 'magnet':
      return (8.5 + upgrades.magnet * 1.6) * scale;
    case 'sneakers':
      return (8.5 + upgrades.sneakers * 1.6) * scale;
    case 'multiplier':
      return (10 + upgrades.multiplier * 1.8) * scale;
    case 'pogo':
      return 2.0;
  }
}

export function computeActiveMultiplier(
  baseMultiplier: number,
  has2xPowerUp: boolean,
  comboBonus = 0,
  levelBonus = 0
): number {
  return (baseMultiplier + Math.max(0, comboBonus) + Math.max(0, levelBonus)) * (has2xPowerUp ? 2 : 1);
}

export function computeRampSurfaceY(objMaxZ: number, rampLength: number, trainHeight: number): number {
  const ratio = Math.max(0, Math.min(1, objMaxZ / Math.max(0.001, rampLength)));
  return ratio * trainHeight;
}

export function segmentsOverlapZ(
  prevObjMinZ: number,
  curObjMaxZ: number,
  pMinZ: number,
  pMaxZ: number
): boolean {
  const sweptMinZ = Math.min(prevObjMinZ, curObjMaxZ);
  return curObjMaxZ >= pMinZ && sweptMinZ <= pMaxZ;
}

export function resolveSolidSidePushback(
  playerX: number,
  laneCenterX: number,
  halfW: number,
  fallbackLane: number,
  playerHalfW = 0.38
): { pushedX: number; targetLane: number } {
  const offset = playerX - laneCenterX;
  const fallbackX = fallbackLane * LANE_WIDTH;
  const sideDir =
    Math.abs(offset) > 0.04
      ? Math.sign(offset)
      : fallbackX !== laneCenterX
        ? Math.sign(fallbackX - laneCenterX)
        : laneCenterX >= 0
          ? -1
          : 1;
  const rawX = laneCenterX + sideDir * (halfW + playerHalfW + 0.06);
  const clampedX = Math.max(-LANE_WIDTH - 0.35, Math.min(LANE_WIDTH + 0.35, rawX));
  const candidateLane = Math.max(-1, Math.min(1, Math.round(laneCenterX / LANE_WIDTH) + sideDir));
  return {
    pushedX: clampedX,
    targetLane: fallbackLane !== Math.round(laneCenterX / LANE_WIDTH) ? fallbackLane : candidateLane,
  };
}

export function canSpawnMovingTrain(
  lane: number,
  zCenter: number,
  curSpeed: number,
  obstacles: ObstacleBox[]
): boolean {
  const backZ = zCenter - 6.75;
  const frontZ = zCenter + 6.75;
  const tArrive = -frontZ / (curSpeed + 16);
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.lane !== lane) continue;
    const oBack = o.z - o.halfLen;
    const oFront = o.z + o.halfLen;
    // Prevent direct spatial overlap at spawn time
    if (oFront >= backZ - 8 && oBack <= frontZ + 8) return false;
    if (o.extraSpeed === 0) {
      const tObsPass = (-oBack + 9) / Math.max(10, curSpeed);
      if (tArrive <= tObsPass + 0.65) return false;
    } else {
      if (Math.abs(o.z - zCenter) < 26) return false;
    }
  }
  return true;
}

export function rollMysteryBoxReward(rng = Math.random()): MysteryReward {
  if (rng < 0.55) {
    const coins = rng < 0.25 ? 100 : 250;
    return { kind: 'coins', amount: coins, label: `+${coins} Moedas` };
  }
  if (rng < 0.85) {
    return { kind: 'boards', amount: 2, label: '+2 Hoverboards' };
  }
  return { kind: 'keys', amount: 1, label: '+1 Chave' };
}
