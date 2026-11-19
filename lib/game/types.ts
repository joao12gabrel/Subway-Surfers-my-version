export type GameState = 'title' | 'playing' | 'paused' | 'dying' | 'gameover';

export type BiomeKey = 'classic' | 'tokyo' | 'canyon' | 'arctic' | 'cyberport';

export type CharacterId = 'leo' | 'maya' | 'beat' | 'kira' | 'vex' | 'zara' | 'atlas';

export type HoverboardId =
  | 'dart'
  | 'blaze'
  | 'frost'
  | 'cyber'
  | 'royal'
  | 'carbon'
  | 'titan';

export type SkatePattern = 'classic' | 'flames' | 'lightning' | 'star' | 'cyber' | 'imperial';
export type SkateTrail = 'match' | 'plasma' | 'rainbow' | 'ice' | 'gold_spark';

export interface BoardCustomization {
  paintHex: string | null;
  glowHex: string | null;
  pattern: SkatePattern;
  trail: SkateTrail;
}

export type PowerUpType = 'jetpack' | 'magnet' | 'sneakers' | 'multiplier' | 'pogo';

export type UpgradeKey = 'jetpack' | 'magnet' | 'sneakers' | 'multiplier';

export type CharacterAccessory =
  | 'cap'
  | 'beanie'
  | 'boombox'
  | 'visor'
  | 'crown'
  | 'headphones'
  | 'jetwing';

export interface CharacterPerks {
  powerupDurationBonus?: number;
  magnetStartSeconds?: number;
  magnetRadiusBonus?: number;
  comboGainMultiplier?: number;
  jumpBonus?: number;
  freeStartBoard?: boolean;
  doubleCoinChance?: number;
  startShield?: boolean;
  start2xSeconds?: number;
  levelMultiplierBonus?: number;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  tagline: string;
  powerName: string;
  powerDesc: string;
  cost: number;
  requiredLevel?: number;
  keyCost?: number;
  hoodieColor: number;
  pantsColor: number;
  hatColor: number;
  accentColor: number;
  shoeColor: number;
  skinColor: number;
  accessory: CharacterAccessory;
  badgeHex: string;
  perks: CharacterPerks;
}

export interface HoverboardDef {
  id: HoverboardId;
  name: string;
  perk: string;
  cost: number;
  requiredLevel?: number;
  keyCost?: number;
  deckColor: number;
  trimColor: number;
  glowColor: number;
  speedBonus: number;
  jumpBonus: number;
}

export interface BiomeUnlockDef {
  id: BiomeKey;
  label: string;
  dot: string;
  requiredLevel: number;
  coinCost: number;
  keyCost: number;
}

export type MissionMetric = 'coins' | 'jumps' | 'rolls' | 'dist' | 'boards' | 'powerups';

export interface MissionDef {
  id: string;
  title: string;
  desc: string;
  type: MissionMetric;
  goal: number;
  rewardCoins: number;
  rewardKeys?: number;
  perRun: boolean;
  tier?: number;
}

export interface DailyMissionProgress {
  id: string;
  progress: number;
  completed: boolean;
  def?: MissionDef;
}

export interface LevelMilestoneDef {
  level: number;
  title: string;
  desc: string;
  permanentMultiplierBonus: number;
  rewardCoins: number;
  rewardKeys: number;
  exclusiveVisualLabel: string;
}

export interface LevelUnlockSummary {
  level: number;
  previousLevel: number;
  nextLevelXpSpan: number;
  isMilestone: boolean;
  milestone: LevelMilestoneDef | null;
  unlockedCharacters: string[];
  unlockedBoards: string[];
  unlockedBiomes: string[];
  unlockedCosmetics: string[];
  source: 'live' | 'summary';
}

export interface LeaderboardEntry {
  id: string;
  score: number;
  distance: number;
  coins: number;
  characterId: CharacterId;
  date: string;
}

export interface DailyStreakState {
  streakCount: number;
  lastClaimDate: string | null;
  claimedToday: boolean;
}

export interface ComboPopupEvent {
  id: number;
  label: string;
  sublabel: string;
  comboBonus: number;
  comboCount: number;
}

export interface LevelProfile {
  level: number;
  title: string;
  minDistance: number;
  speedBonus: number;
  trafficDensity: number;
  ambientIntensity: number;
}

export interface SaveData {
  bestScore: number;
  coins: number;
  keys: number;
  boards: number;
  mysteryBoxes: number;
  xp: number;
  baseMultiplier: number;
  missionIndex: number;
  completedMissionsTotal: number;
  claimedMilestones: number[];
  dailyDate: string;
  dailyMissions: DailyMissionProgress[];
  dailyStreak: DailyStreakState;
  leaderboard: LeaderboardEntry[];
  selectedCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
  selectedBoard: HoverboardId;
  unlockedBoards: HoverboardId[];
  customBoard: BoardCustomization;
  selectedBiome: BiomeKey;
  unlockedBiomes: BiomeKey[];
  worldTourAuto: boolean;
  upgrades: Record<UpgradeKey, number>;
}

export interface MysteryReward {
  kind: 'coins' | 'keys' | 'boards';
  amount: number;
  label: string;
}

export interface RunEndSummary {
  score: number;
  distance: number;
  runCoins: number;
  bestScore: number;
  isNewBest: boolean;
  reason: string;
  mysteryOpened: MysteryReward | null;
  completedMissionsCount: number;
  levelReached?: number;
  xpGained?: number;
  accountLevelAfter?: number;
  leveledUpAccount?: boolean;
  unlockedMilestones?: LevelMilestoneDef[];
}

export interface ObstacleBox {
  lane: number;
  z: number;
  halfLen: number;
  extraSpeed: number;
}

export interface DebugInfo {
  fps: number;
  frameTimeMs: number;
  x: number;
  y: number;
  z: number;
  lane: number;
  speed: number;
  distance: number;
  obstacleCount: number;
  nearestObstacleDist: number;
  invulnTimer: number;
  stumbleTimer: number;
  jetpackTimer: number;
}

