import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCOUNT_MILESTONES,
  BIOME_DEFS,
  CHARACTERS,
  DAILY_MISSIONS,
  DAILY_STREAK_REWARDS,
  HOVERBOARDS,
  SKATE_PAINTS,
  SKATE_PATTERNS,
  SKATE_TRAILS,
  applyAccountMilestones,
  applyRunMissionProgress,
  calculateRunXp,
  canSpawnMovingTrain,
  claimDailyStreakReward,
  computeAccountLevel,
  computeActiveMultiplier,
  computeComboBonus,
  computeRampSurfaceY,
  computeRunLevel,
  computeTargetSpeed,
  createDefaultSave,
  evaluateDailyStreakState,
  generateProceduralMissionBatch,
  getAccountLevelXpSpan,
  getAccountXpProgress,
  getActiveDailyMission,
  getLevelProfile,
  getLevelUnlockSummary,
  getMilestoneForLevel,
  getNextAccountMilestone,
  getPowerUpDuration,
  getTotalXpForAccountLevel,
  getUpgradeCost,
  normalizeSaveData,
  purchaseBoardConsumable,
  purchaseOrSelectBiome,
  purchaseOrSelectCharacter,
  purchaseOrSelectHoverboard,
  purchaseUpgrade,
  recordRunToLeaderboard,
  resolveSolidSidePushback,
  rollMysteryBoxReward,
  segmentsOverlapZ,
} from './rules';
import {
  BIOME_CALM_CHORDS,
  computeAmbientIntensity,
  computeMusicBpm,
  computeSpeedIntensity,
  soundEngine,
} from './audio';

test('default save starts with Leo unlocked and enough starter coins for Maya', () => {
  const save = createDefaultSave('2026-11-18');
  assert.equal(save.selectedCharacter, 'leo');
  assert.deepEqual(save.unlockedCharacters, ['leo']);
  assert.ok(CHARACTERS.length >= 3);
  assert.equal(save.coins, 180);
  assert.equal(save.dailyMissions.length, DAILY_MISSIONS.length);
  assert.deepEqual(save.leaderboard, []);
  assert.equal(save.dailyStreak.streakCount, 0);
});

test('unlocking and selecting a character deducts coins and equips it', () => {
  const save = createDefaultSave('2026-11-18');
  const res1 = purchaseOrSelectCharacter(save, 'maya');
  assert.equal(res1.outcome, 'unlocked');
  assert.equal(res1.save.coins, 30);
  assert.equal(res1.save.selectedCharacter, 'maya');
  assert.ok(res1.save.unlockedCharacters.includes('maya'));

  const res2 = purchaseOrSelectCharacter(res1.save, 'beat');
  assert.equal(res2.outcome, 'insufficient');
  assert.equal(res2.save.selectedCharacter, 'maya');

  const res3 = purchaseOrSelectCharacter(res1.save, 'leo');
  assert.equal(res3.outcome, 'selected');
  assert.equal(res3.save.coins, 30);
  assert.equal(res3.save.selectedCharacter, 'leo');
});

test('daily missions progress, complete, and award coins and multiplier', () => {
  const save = createDefaultSave('2026-11-18');
  const activeBefore = getActiveDailyMission(save);
  assert.equal(activeBefore.def.id, 'dm_coins_30');

  const step1 = applyRunMissionProgress(
    save,
    { coins: 50, dist: 500, jumps: 4, rolls: 2, powerups: 3, boards: 0 },
    { jumps: 4, rolls: 2, powerups: 3, boards: 0 }
  );
  // Should complete dm_coins_30 (+80), dm_dist_500 (+100), dm_powerups_3 (+120 & +1 key)
  assert.equal(step1.newlyCompleted.length, 3);
  assert.equal(step1.save.coins, 180 + 80 + 100 + 120);
  assert.equal(step1.save.keys, 3);
  assert.equal(step1.save.baseMultiplier, 4);
});

test('unlocking hoverboards and upgrades updates save cleanly', () => {
  const save = { ...createDefaultSave('2026-11-18'), coins: 500 };
  const boardRes = purchaseOrSelectHoverboard(save, 'blaze');
  assert.equal(boardRes.outcome, 'unlocked');
  assert.equal(boardRes.save.selectedBoard, 'blaze');
  assert.equal(boardRes.save.coins, 300);

  const upgRes = purchaseUpgrade(boardRes.save, 'magnet');
  assert.equal(upgRes.purchased, true);
  assert.equal(upgRes.save.upgrades.magnet, 2);
  assert.equal(upgRes.save.coins, 300 - getUpgradeCost(1));

  const consRes = purchaseBoardConsumable(upgRes.save, 50);
  assert.equal(consRes.purchased, true);
  assert.equal(consRes.save.boards, 4);
});

test('normalizeSaveData resets daily missions when date changes', () => {
  const normalized = normalizeSaveData(
    {
      coins: -50,
      dailyDate: '2026-11-17',
      dailyMissions: [{ id: 'dm_coins_30', progress: 50, completed: true }],
      unlockedCharacters: ['kira'],
      selectedCharacter: 'unknown' as never,
      baseMultiplier: 999,
    },
    '2026-11-18'
  );
  assert.equal(normalized.coins, 0);
  assert.equal(normalized.dailyMissions[0].completed, false);
  assert.equal(normalized.dailyMissions[0].progress, 0);
  assert.ok(normalized.unlockedCharacters.includes('leo'));
  assert.ok(normalized.unlockedCharacters.includes('kira'));
  assert.equal(normalized.selectedCharacter, 'leo');
  assert.equal(normalized.baseMultiplier, 30);
});

test('speed, multiplier, power-up duration, and ramp surface math', () => {
  assert.equal(computeTargetSpeed(0), 20);
  assert.ok(computeTargetSpeed(1000) > 26 && computeTargetSpeed(1000) < 35);
  assert.equal(computeTargetSpeed(10000), 40);
  assert.equal(computeActiveMultiplier(5, false), 5);
  assert.equal(computeActiveMultiplier(5, true), 10);
  assert.equal(computeActiveMultiplier(5, true, 2), 14);
  assert.equal(computeComboBonus(0), 0);
  assert.equal(computeComboBonus(5), 1);
  assert.equal(computeComboBonus(12), 2);
  assert.equal(computeComboBonus(22), 3);
  assert.equal(computeComboBonus(35), 4);
  assert.ok(getPowerUpDuration('jetpack', { jetpack: 3, magnet: 1, sneakers: 1, multiplier: 1 }) > 9);
  assert.equal(computeRampSurfaceY(0, 7.5, 3.15), 0);
  assert.equal(computeRampSurfaceY(7.5, 7.5, 3.15), 3.15);
  assert.ok(Math.abs(computeRampSurfaceY(3.75, 7.5, 3.15) - 1.575) < 0.001);
});

test('canSpawnMovingTrain blocks overlapping static/moving hazards in same lane', () => {
  const obs = [{ lane: 0, z: -40, halfLen: 0.5, extraSpeed: 0 }];
  assert.equal(canSpawnMovingTrain(0, -140, 24, obs), true);
  assert.equal(canSpawnMovingTrain(0, -50, 24, obs), false);
  assert.equal(canSpawnMovingTrain(1, -50, 24, obs), true);
});

test('rollMysteryBoxReward returns valid reward tiers', () => {
  assert.equal(rollMysteryBoxReward(0.1).kind, 'coins');
  assert.equal(rollMysteryBoxReward(0.7).kind, 'boards');
  assert.equal(rollMysteryBoxReward(0.95).kind, 'keys');
});

test('recordRunToLeaderboard retains top 5 runs sorted descending by score', () => {
  let save = createDefaultSave('2026-11-18');
  const scores = [120, 950, 400, 1400, 620, 800, 310];
  scores.forEach((sc, i) => {
    save = recordRunToLeaderboard(
      save,
      { score: sc, distance: sc / 2, coins: 10 + i, characterId: 'leo', date: '2026-11-18' },
      `id_${i}`
    );
  });
  assert.equal(save.leaderboard.length, 5);
  assert.deepEqual(
    save.leaderboard.map((r) => r.score),
    [1400, 950, 800, 620, 400]
  );
  // 0-score run is ignored
  const unchanged = recordRunToLeaderboard(save, {
    score: 0,
    distance: 0,
    coins: 0,
    characterId: 'leo',
    date: '2026-11-18',
  });
  assert.equal(unchanged.leaderboard.length, 5);
});

test('daily streak rewards consecutive days and resets if a day is missed', () => {
  const day1Save = createDefaultSave('2026-11-18');
  const claim1 = claimDailyStreakReward(day1Save, '2026-11-18');
  assert.ok(claim1);
  assert.equal(claim1.claimedDay, 1);
  assert.equal(claim1.rewardCoins, DAILY_STREAK_REWARDS[0]);
  assert.equal(claim1.save.coins, 180 + DAILY_STREAK_REWARDS[0]);

  // Same day cannot claim twice
  assert.equal(claimDailyStreakReward(claim1.save, '2026-11-18'), null);

  // Next consecutive day unlocks Day 2 reward
  const claim2 = claimDailyStreakReward(claim1.save, '2026-11-19');
  assert.ok(claim2);
  assert.equal(claim2.claimedDay, 2);
  assert.equal(claim2.rewardCoins, DAILY_STREAK_REWARDS[1]);

  // Skipping a day resets streak back to 0 (ready for Day 1 again)
  const skipped = evaluateDailyStreakState(claim2.save.dailyStreak, '2026-11-21');
  assert.equal(skipped.streakCount, 0);
  assert.equal(skipped.claimedToday, false);
});

test('computeMusicBpm and computeAmbientIntensity scale smoothly with level and speed', () => {
  assert.equal(computeMusicBpm(10), 130);
  assert.equal(computeMusicBpm(20), 130);
  assert.ok(computeMusicBpm(34) > 135 && computeMusicBpm(34) < 146);
  assert.equal(computeMusicBpm(48), 150);
  assert.equal(computeMusicBpm(80), 150);
  assert.ok(computeAmbientIntensity(1, 22) < computeAmbientIntensity(4, 34));
  assert.ok(computeAmbientIntensity(6, 46) <= 1.0);

  // Speed-based music cross-fade intensity from calm (0) to action (1)
  assert.equal(computeSpeedIntensity(22), 0);
  assert.ok(computeSpeedIntensity(28.5) > 0.4 && computeSpeedIntensity(28.5) < 0.6);
  assert.equal(computeSpeedIntensity(35), 1.0);
  assert.equal(computeSpeedIntensity(50), 1.0);

  // Biome calm chords defined for all 5 biomes
  assert.equal(Object.keys(BIOME_CALM_CHORDS).length, 5);
  assert.ok(BIOME_CALM_CHORDS.classic.length >= 4);
  assert.ok(BIOME_CALM_CHORDS.tokyo.length >= 4);
  assert.ok(BIOME_CALM_CHORDS.canyon.length >= 4);
  assert.ok(BIOME_CALM_CHORDS.arctic.length >= 4);
  assert.ok(BIOME_CALM_CHORDS.cyberport.length >= 4);

  // SoundEngine environmental methods callable without error in headless environments
  assert.doesNotThrow(() => soundEngine.whooshEscape(28));
  assert.doesNotThrow(() => soundEngine.trainRoofClang());
  assert.doesNotThrow(() => soundEngine.nearMiss(32));
});

test('expanded 7-character roster and level progression work deterministically', () => {
  assert.equal(CHARACTERS.length, 7);
  assert.ok(CHARACTERS.every((c) => Boolean(c.powerName && c.powerDesc)));
  assert.equal(computeRunLevel(0), 1);
  assert.equal(computeRunLevel(220), 2);
  assert.equal(computeRunLevel(480), 3);
  assert.equal(computeRunLevel(1200), 5);
  assert.ok(getLevelProfile(3).speedBonus > getLevelProfile(1).speedBonus);
  assert.equal(computeActiveMultiplier(2, true, 1, 2), 10);
  const baseDur = getPowerUpDuration('jetpack', { jetpack: 1, magnet: 1, sneakers: 1, multiplier: 1 });
  const boostedDur = getPowerUpDuration('jetpack', { jetpack: 1, magnet: 1, sneakers: 1, multiplier: 1 }, 0.2);
  assert.ok(boostedDur > baseDur);
});

test('account XP, level gating, key early unlocks, 5 biomes, and 7 skates work as designed', () => {
  assert.equal(HOVERBOARDS.length, 7);
  assert.equal(BIOME_DEFS.length, 5);
  assert.equal(computeAccountLevel(0), 1);

  const lvl2Xp = getTotalXpForAccountLevel(2);
  const lvl3Xp = getTotalXpForAccountLevel(3);
  assert.equal(lvl2Xp, 250);
  assert.equal(computeAccountLevel(lvl2Xp - 1), 1);
  assert.equal(computeAccountLevel(lvl2Xp), 2);
  assert.equal(computeAccountLevel(lvl3Xp), 3);

  const xpProg = getAccountXpProgress(lvl2Xp + 80);
  assert.equal(xpProg.level, 2);
  assert.equal(xpProg.currentLevelXp, 80);
  assert.equal(xpProg.nextLevelXp, getAccountLevelXpSpan(2));

  // Initial XP gain should require more than a single short starter run to level up
  const gained = calculateRunXp({ distance: 400, runCoins: 40, completedMissions: 1, nearMisses: 2 });
  assert.ok(gained >= 80 && gained < lvl2Xp);

  // Level-locked character blocks coin purchase at Level 1, allows Keys or coins at Level 2+
  const lowLevelSave = { ...createDefaultSave('2026-11-18'), coins: 2000, keys: 5, xp: 0 };
  const blocked = purchaseOrSelectCharacter(lowLevelSave, 'kira', 'coins');
  assert.equal(blocked.outcome, 'level_locked');

  const keyUnlocked = purchaseOrSelectCharacter(lowLevelSave, 'kira', 'keys');
  assert.equal(keyUnlocked.outcome, 'unlocked');
  assert.equal(keyUnlocked.save.keys, 2);
  assert.equal(keyUnlocked.save.selectedCharacter, 'kira');

  const highLevelSave = { ...createDefaultSave('2026-11-18'), coins: 2000, keys: 5, xp: lvl2Xp };
  const coinUnlocked = purchaseOrSelectBiome(highLevelSave, 'arctic', 'coins');
  assert.equal(coinUnlocked.outcome, 'unlocked');
  assert.equal(coinUnlocked.save.selectedBiome, 'arctic');
  assert.ok(coinUnlocked.save.unlockedBiomes.includes('arctic'));

  const norm = normalizeSaveData(
    {
      xp: 450,
      customBoard: { paintHex: '#06b6d4', glowHex: '#e879f9', pattern: 'flames', trail: 'rainbow' },
      unlockedBiomes: ['arctic'],
      selectedBiome: 'arctic',
    },
    '2026-11-18'
  );
  assert.equal(norm.xp, 450);
  assert.equal(norm.customBoard.pattern, 'flames');
  assert.equal(norm.customBoard.trail, 'rainbow');
  assert.equal(norm.selectedBiome, 'arctic');
  assert.ok(norm.unlockedBiomes.includes('classic'));
  assert.ok(norm.unlockedBiomes.includes('arctic'));
});

test('exponential XP curve increases span strictly for each higher level', () => {
  const spans = Array.from({ length: 15 }, (_, idx) => getAccountLevelXpSpan(idx + 1));
  for (let i = 1; i < spans.length; i++) {
    assert.ok(
      spans[i] > spans[i - 1],
      `Expected level ${i + 1} XP span (${spans[i]}) > level ${i} XP span (${spans[i - 1]})`
    );
  }
  const lvl10Xp = getTotalXpForAccountLevel(10);
  assert.equal(computeAccountLevel(lvl10Xp), 10);
  assert.equal(computeAccountLevel(lvl10Xp - 1), 9);
});

test('procedural mission generator cycles infinitely with scaling goals and persists through normalizeSaveData', () => {
  const starterSave = createDefaultSave('2026-11-18');
  assert.equal(starterSave.missionIndex, 0);
  assert.equal(starterSave.completedMissionsTotal, 0);

  // Complete all 6 starter missions in one big run
  const rollover = applyRunMissionProgress(
    starterSave,
    { coins: 120, dist: 600, jumps: 20, rolls: 15, powerups: 5, boards: 2 },
    { jumps: 20, rolls: 15, powerups: 5, boards: 2 }
  );

  assert.equal(rollover.newlyCompleted.length, DAILY_MISSIONS.length);
  assert.equal(rollover.batchCompleted, true);
  assert.equal(rollover.nextCycleTier, 1);
  assert.equal(rollover.save.missionIndex, 1);
  assert.equal(rollover.save.completedMissionsTotal, DAILY_MISSIONS.length);
  assert.equal(rollover.save.dailyMissions.length, 6);
  assert.ok(rollover.save.dailyMissions.every((m) => !m.completed && m.progress === 0 && Boolean(m.def)));

  // Tier 2 procedural batch should have higher goals than Tier 1
  const tier1 = generateProceduralMissionBatch(1);
  const tier2 = generateProceduralMissionBatch(2);
  assert.equal(tier1.length, 6);
  assert.equal(tier2.length, 6);
  const t1Coins = tier1.find((m) => m.type === 'coins')!;
  const t2Coins = tier2.find((m) => m.type === 'coins')!;
  assert.ok(t2Coins.goal > t1Coins.goal);
  assert.ok(t2Coins.rewardCoins > t1Coins.rewardCoins);

  // Active mission resolves procedural definition and normalizes cleanly
  const active = getActiveDailyMission(rollover.save);
  assert.equal(active.def.tier, 1);
  const reloaded = normalizeSaveData(rollover.save, '2026-11-18');
  assert.equal(reloaded.missionIndex, 1);
  assert.equal(reloaded.dailyMissions[0].def?.id, rollover.save.dailyMissions[0].def?.id);
});

test('5-level account milestones award permanent multiplier, coins, keys, exclusive visuals, and are idempotent', () => {
  assert.ok(ACCOUNT_MILESTONES.some((m) => m.level === 5));
  assert.ok(ACCOUNT_MILESTONES.some((m) => m.level === 10));
  assert.ok(SKATE_TRAILS.some((t) => t.id === 'gold_spark' && t.requiredLevel === 5));
  assert.ok(SKATE_PATTERNS.some((p) => p.id === 'imperial' && p.requiredLevel === 10));
  assert.ok(SKATE_PAINTS.some((p) => p.id === 'royal_titanium' && p.requiredLevel === 10));

  assert.equal(getMilestoneForLevel(3), null);
  assert.equal(getNextAccountMilestone(1).level, 5);
  assert.equal(getNextAccountMilestone(5).level, 10);
  assert.ok(getMilestoneForLevel(25) !== null);

  const lvl10Save = {
    ...createDefaultSave('2026-11-18'),
    xp: getTotalXpForAccountLevel(10),
  };

  const firstApply = applyAccountMilestones(lvl10Save);
  assert.deepEqual(
    firstApply.newlyUnlocked.map((m) => m.level),
    [5, 10]
  );
  assert.deepEqual(firstApply.save.claimedMilestones, [5, 10]);
  assert.equal(firstApply.save.baseMultiplier, 1 + 1 + 2);
  assert.equal(firstApply.save.coins, 180 + 150 + 350);
  assert.equal(firstApply.save.keys, 2 + 2 + 3);

  // Calling again at the same level grants nothing extra
  const secondApply = applyAccountMilestones(firstApply.save);
  assert.equal(secondApply.newlyUnlocked.length, 0);
  assert.equal(secondApply.save.baseMultiplier, firstApply.save.baseMultiplier);
  assert.equal(secondApply.save.coins, firstApply.save.coins);
});

test('getLevelUnlockSummary collects newly unlocked characters, boards, biomes, cosmetics, and milestone bonuses', () => {
  const lvl2 = getLevelUnlockSummary(2, 1, 'summary');
  assert.equal(lvl2.level, 2);
  assert.equal(lvl2.isMilestone, false);
  assert.equal(lvl2.milestone, null);
  assert.equal(lvl2.nextLevelXpSpan, getAccountLevelXpSpan(2));
  assert.ok(lvl2.unlockedCharacters.some((c) => c.startsWith('Kira')));
  assert.ok(lvl2.unlockedBiomes.includes('Expresso Polar'));
  assert.ok(lvl2.unlockedBoards.includes('Cyber Pulse'));

  const lvl5 = getLevelUnlockSummary(5, 4, 'summary');
  assert.equal(lvl5.isMilestone, true);
  assert.equal(lvl5.milestone?.level, 5);
  assert.equal(lvl5.milestone?.permanentMultiplierBonus, 1);
  assert.ok(lvl5.unlockedCharacters.some((c) => c.startsWith('Atlas')));
  assert.ok(lvl5.unlockedBoards.some((b) => b.includes('Titã')));
  assert.ok(lvl5.unlockedCosmetics.some((c) => c.includes('Faísca Dourada')));
});

test('swept-Z collision prevents barrier tunneling and solid side pushback keeps runner outside trains', () => {
  // Fast frame where obstacle jumps from z=-1.5 to z=+1.5 across player [-0.38, +0.38]
  assert.equal(segmentsOverlapZ(-1.5 - 0.28, 1.5 + 0.28, -0.38, 0.38), true);
  // Obstacle completely ahead of player
  assert.equal(segmentsOverlapZ(-10, -4, -0.38, 0.38), false);
  // Obstacle already behind player at start of step
  assert.equal(segmentsOverlapZ(0.8, 4.2, -0.38, 0.38), false);

  // Side pushback out of center lane train (x=0, halfW=1.12) while coming from left lane (-1)
  const pushLeft = resolveSolidSidePushback(-0.9, 0, 1.12, -1);
  assert.ok(pushLeft.pushedX <= -(1.12 + 0.38));
  assert.equal(pushLeft.targetLane, -1);

  // Side pushback out of right lane train (x=3.1, halfW=1.12) while coming from center lane (0)
  const pushRight = resolveSolidSidePushback(2.25, 3.1, 1.12, 0);
  assert.ok(pushRight.pushedX <= 3.1 - (1.12 + 0.38));
  assert.equal(pushRight.targetLane, 0);

  // Moving train cannot spawn directly overlapping an existing static obstacle
  const nearStatic = [{ lane: 0, z: -135, halfLen: 0.5, extraSpeed: 0 }];
  assert.equal(canSpawnMovingTrain(0, -140, 24, nearStatic), false);
});


