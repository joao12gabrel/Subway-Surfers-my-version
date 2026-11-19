'use client';

import React, { useState } from 'react';
import {
  Award,
  Bug,
  CalendarDays,
  Check,
  Crown,
  Flame,
  Globe,
  KeyRound,
  Lock,
  Palette,
  Play,
  ShoppingBag,
  Sparkles,
  Target,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { BiomeKey, SaveData } from '@/lib/game/types';
import {
  BIOME_DEFS,
  CHARACTERS,
  DAILY_STREAK_REWARDS,
  getAccountXpProgress,
  getActiveDailyMission,
  getBiomeDef,
  getCharacterDef,
  getHoverboardDef,
  getNextAccountMilestone,
  getNextStreakDayAndReward,
} from '@/lib/game/rules';
import { soundEngine } from '@/lib/game/audio';
import type { GarageTab } from './ShopAndRosterModal';

interface TitleOverlayProps {
  save: SaveData;
  muted: boolean;
  isDevMode: boolean;
  onToggleMute: () => void;
  onToggleDevMode: () => void;
  onStartRun: () => void;
  onOpenGarage: (tab: GarageTab) => void;
  onSelectOrUnlockBiome: (biome: BiomeKey, currency: 'coins' | 'keys') => boolean;
  onToggleWorldTour: (enabled: boolean) => void;
  onClaimDailyStreak: () => void;
}

export default function TitleOverlay({
  save,
  muted,
  isDevMode,
  onToggleMute,
  onToggleDevMode,
  onStartRun,
  onOpenGarage,
  onSelectOrUnlockBiome,
  onToggleWorldTour,
  onClaimDailyStreak,
}: TitleOverlayProps) {
  const [mobilePanel, setMobilePanel] = useState<'streak' | 'leaderboard'>('streak');
  const [pendingLockedBiome, setPendingLockedBiome] = useState<BiomeKey | null>(null);

  const activeChar = getCharacterDef(save.selectedCharacter);
  const activeBoard = getHoverboardDef(save.selectedBoard);
  const activeMission = getActiveDailyMission(save);
  const completedCount = save.dailyMissions.filter((m) => m.completed).length;
  const missionPct = Math.min(
    100,
    Math.round((activeMission.state.progress / Math.max(1, activeMission.def.goal)) * 100)
  );
  const accountXp = getAccountXpProgress(save.xp);
  const nextMilestone = getNextAccountMilestone(accountXp.level);

  const { activeDayNumber, cycleDayIndex, rewardCoins } = getNextStreakDayAndReward(save.dailyStreak);
  const completedInCycle = save.dailyStreak.claimedToday
    ? ((activeDayNumber - 1) % DAILY_STREAK_REWARDS.length) + 1
    : cycleDayIndex;

  const lockedDef = pendingLockedBiome ? getBiomeDef(pendingLockedBiome) : null;
  const lockedCanCoins =
    lockedDef &&
    accountXp.level >= lockedDef.requiredLevel &&
    save.coins >= lockedDef.coinCost;
  const lockedCanKeys = lockedDef && save.keys >= lockedDef.keyCost;

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top Safe Region: Street Emblem + Runner Loadout + Account Level XP + Wallet & Sound Toggle */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="pointer-events-auto">
            <svg
              viewBox="0 0 340 84"
              className="w-48 sm:w-80 h-auto drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]"
              role="img"
              aria-label="Rail Rushers"
            >
              <polygon points="10,16 326,6 318,74 4,80" fill="#0f172a" stroke="#facc15" strokeWidth="4" />
              <polygon points="16,22 318,13 312,67 12,73" fill="#1e293b" />
              <text
                x="28"
                y="55"
                fill="#facc15"
                stroke="#090d16"
                strokeWidth="6"
                paintOrder="stroke fill"
                fontFamily="var(--font-display), sans-serif"
                fontWeight="900"
                fontSize="36"
                letterSpacing="1"
              >
                RAIL RUSHERS
              </text>
              <rect x="28" y="61" width="94" height="4.5" rx="2" fill="#22d3ee" />
            </svg>

            {/* Equipped Loadout + Account XP Strip */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-950/88 border border-white/15 rounded-xl px-3 py-1 shadow-lg text-xs font-bold text-slate-100">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                  style={{ backgroundColor: activeChar.badgeHex }}
                  aria-hidden="true"
                />
                <span>{activeChar.name}</span>
                <span className="text-slate-500" aria-hidden="true">
                  ·
                </span>
                <span className="text-cyan-300">{activeBoard.name}</span>
                <span className="hidden sm:inline text-emerald-300">⚡ {activeChar.powerName}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono-num font-black text-[11px]">
                  {save.baseMultiplier}x
                </span>
              </div>

              <div
                data-testid="account-xp-pill"
                className="inline-flex items-center gap-2 bg-slate-950/88 border border-indigo-400/35 rounded-xl px-2.5 py-1 shadow-lg text-[11px] font-bold text-indigo-100"
              >
                <Award className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span className="font-mono-num font-extrabold text-indigo-200">
                  Nv {accountXp.level}
                </span>
                <div className="w-14 sm:w-20 h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{ width: `${Math.max(6, accountXp.pct)}%` }}
                  />
                </div>
                <span className="hidden sm:inline font-mono-num text-[10px] text-slate-300">
                  {accountXp.currentLevelXp}/{accountXp.nextLevelXp} XP
                </span>
                <span
                  data-testid="next-milestone-badge"
                  title={`Próximo Marco Nv ${nextMilestone.level}: +${nextMilestone.permanentMultiplierBonus}x Mult e ${nextMilestone.exclusiveVisualLabel}`}
                  className="hidden sm:inline font-mono-num text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/35"
                >
                  Marco Nv {nextMilestone.level}
                </span>
              </div>
            </div>
          </div>

          {/* Right Wallet + Audio Toggle */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-slate-950/88 border border-white/15 rounded-2xl px-3 sm:px-4 py-2 shadow-xl font-mono-num text-xs sm:text-sm font-extrabold">
              <span className="text-amber-300" data-testid="title-coins">
                {save.coins} 🪙
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-cyan-300">{save.keys} 🔑</span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span className="text-sky-300 hidden sm:inline">{save.boards} 🛹</span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="text-emerald-300">Rec: {Math.floor(save.bestScore)}</span>
            </div>

            <button
              type="button"
              data-testid="title-dev-toggle-btn"
              aria-label="Alternar modo de programador"
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onToggleDevMode();
              }}
              className={`w-10 h-10 rounded-2xl bg-slate-950/88 border text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition shadow-xl cursor-pointer shrink-0 ${
                isDevMode ? 'border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/40' : 'border-white/15'
              }`}
              title="Alternar Modo Programador (FPS & Colisão)"
            >
              <Bug className={`w-4 h-4 ${isDevMode ? 'text-cyan-300' : 'text-slate-400'}`} />
            </button>

            <button
              type="button"
              data-testid="title-mute-btn"
              aria-label={muted ? 'Ativar música e som' : 'Silenciar música e som'}
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onToggleMute();
              }}
              className="w-10 h-10 rounded-2xl bg-slate-950/88 border border-white/15 text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition shadow-xl cursor-pointer shrink-0"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Compact Switcher */}
        <div className="pointer-events-auto flex md:hidden items-center gap-1.5 bg-slate-950/88 border border-white/15 rounded-xl p-1 w-fit shadow-lg">
          <button
            type="button"
            onClick={() => {
              soundEngine.uiTab();
              setMobilePanel('streak');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              mobilePanel === 'streak'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            Sequência ({save.dailyStreak.streakCount}d)
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.uiTab();
              setMobilePanel('leaderboard');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              mobilePanel === 'leaderboard'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            Top 5 Recordes
          </button>
        </div>

        {/* Left & Right Rail Panels */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          {/* Left Rail: Top 5 Leaderboard + Active Daily Mission Card */}
          <div className="flex flex-col gap-2.5 w-full max-w-sm md:w-72 lg:w-80">
            <section
              aria-label="Top 5 Recordes Locais"
              data-testid="title-leaderboard"
              className={`pointer-events-auto bg-slate-950/88 border border-white/15 border-t-2 border-t-amber-400 rounded-2xl p-3 shadow-xl ${
                mobilePanel === 'leaderboard' ? 'block' : 'hidden md:block'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <h2 className="font-display font-extrabold text-xs sm:text-sm text-white tracking-wide">
                    Top 5 Recordes
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Melhores corridas
                </span>
              </div>

              {save.leaderboard.length === 0 ? (
                <p className="text-xs text-slate-300 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2.5">
                  Nenhuma corrida registrada ainda. Aperte JOGAR para marcar o #1!
                </p>
              ) : (
                <ol className="space-y-1.5">
                  {save.leaderboard.map((entry, idx) => {
                    const char = getCharacterDef(entry.characterId);
                    const rankBadge =
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                            ? 'bg-orange-400 text-slate-950'
                            : 'bg-slate-800 text-slate-200';
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-2 bg-slate-900/85 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center font-mono-num font-black text-[11px] shrink-0 ${rankBadge}`}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/30"
                            style={{ backgroundColor: char.badgeHex }}
                            aria-hidden="true"
                          />
                          <span className="font-bold text-slate-100 truncate">{char.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono-num">
                          <span className="text-[11px] text-slate-400">{entry.distance}m</span>
                          <span className="font-extrabold text-amber-300">{entry.score}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            {/* Desktop Active Daily Mission Preview Card */}
            <section
              aria-label="Missão Diária Ativa"
              data-testid="title-active-mission"
              className="pointer-events-auto hidden md:block bg-slate-950/88 border border-white/15 border-t-2 border-t-emerald-400 rounded-2xl p-3 shadow-xl"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="flex items-center gap-1.5 font-display font-extrabold text-xs text-emerald-300">
                  <Target className="w-3.5 h-3.5" />
                  Missão Ativa
                </span>
                <span className="font-mono-num text-[11px] font-bold text-amber-300">
                  +{activeMission.def.rewardCoins} 🪙
                </span>
              </div>
              <p className="text-xs font-bold text-white leading-snug">
                {activeMission.def.desc}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-200"
                    style={{ width: `${missionPct}%` }}
                  />
                </div>
                <span className="font-mono-num text-[11px] font-bold text-slate-300 shrink-0">
                  {activeMission.state.progress}/{activeMission.def.goal}
                </span>
              </div>
            </section>
          </div>

          {/* Right Rail: 7-Day Daily Streak Calendar Visual Indicator */}
          <section
            aria-label="Calendário de Sequência Diária"
            data-testid="daily-streak-calendar"
            className={`pointer-events-auto w-full max-w-sm md:w-76 lg:w-80 bg-slate-950/88 border border-white/15 border-t-2 border-t-cyan-400 rounded-2xl p-3 shadow-xl ${
              mobilePanel === 'streak' ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-cyan-300 shrink-0" />
                <h2 className="font-display font-extrabold text-xs sm:text-sm text-white tracking-wide">
                  Sequência Diária
                </h2>
              </div>
              <span
                data-testid="streak-count-badge"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono-num text-[11px] font-extrabold"
              >
                <Flame className="w-3 h-3 text-orange-400" />
                {save.dailyStreak.streakCount}{' '}
                {save.dailyStreak.streakCount === 1 ? 'dia' : 'dias'}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2.5">
              {DAILY_STREAK_REWARDS.map((coins, idx) => {
                const isDone = idx < completedInCycle;
                const isTodayReady = !save.dailyStreak.claimedToday && idx === cycleDayIndex;
                return (
                  <div
                    key={idx}
                    data-testid={`streak-day-${idx + 1}`}
                    data-state={isDone ? 'claimed' : isTodayReady ? 'ready' : 'locked'}
                    className={`rounded-xl border px-1 py-1.5 text-center flex flex-col items-center justify-between gap-0.5 ${
                      isDone
                        ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                        : isTodayReady
                          ? 'bg-amber-400/25 border-amber-400 text-amber-200 ring-1 ring-amber-300/60'
                          : 'bg-slate-900/80 border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold tracking-tight">D{idx + 1}</span>
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300 my-0.5" aria-label="Resgatado" />
                    ) : (
                      <span className="font-mono-num text-[10px] font-black leading-none py-0.5">
                        +{coins}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {!save.dailyStreak.claimedToday ? (
              <button
                type="button"
                data-testid="claim-streak-btn"
                onMouseEnter={() => soundEngine.uiHover()}
                onClick={onClaimDailyStreak}
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-slate-950 font-display font-extrabold text-xs tracking-wide border border-slate-950 shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Resgatar Dia {activeDayNumber} (+{rewardCoins} 🪙)
              </button>
            ) : (
              <div
                data-testid="streak-claimed-banner"
                className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 font-bold text-[11px] text-center"
              >
                Dia {save.dailyStreak.streakCount} resgatado ✓ · Volte amanhã!
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom Safe Region: Locked Biome Unlock Popover + 5-Map Switcher + Hero JOGAR CTA + Garage Dock */}
      <div className="flex flex-col items-center gap-2 max-w-3xl w-full mx-auto">
        {lockedDef && (
          <div
            data-testid="biome-unlock-popover"
            className="pointer-events-auto w-full flex flex-wrap items-center justify-between gap-2 bg-slate-950/95 border border-amber-400/60 rounded-2xl px-3.5 py-2.5 shadow-2xl"
          >
            <div className="text-xs">
              <p className="font-display font-extrabold text-white">
                Desbloquear Cenário: {lockedDef.label}
              </p>
              <p className="text-slate-300">
                Requer Conta Nível {lockedDef.requiredLevel} ({lockedDef.coinCost} 🪙) ou desbloqueio imediato com {lockedDef.keyCost} 🔑
              </p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                disabled={!lockedCanCoins}
                onMouseEnter={() => soundEngine.uiHover()}
                onClick={() => {
                  const ok = onSelectOrUnlockBiome(lockedDef.id, 'coins');
                  if (ok) setPendingLockedBiome(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 disabled:opacity-40 cursor-pointer"
              >
                {accountXp.level < lockedDef.requiredLevel
                  ? `Nv ${lockedDef.requiredLevel} · ${lockedDef.coinCost} 🪙`
                  : `${lockedDef.coinCost} 🪙`}
              </button>
              <button
                type="button"
                disabled={!lockedCanKeys}
                onMouseEnter={() => soundEngine.uiHover()}
                onClick={() => {
                  const ok = onSelectOrUnlockBiome(lockedDef.id, 'keys');
                  if (ok) setPendingLockedBiome(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-extrabold text-xs hover:bg-cyan-300 disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" /> {lockedDef.keyCost} 🔑
              </button>
              <button
                type="button"
                aria-label="Fechar desbloqueio de cenário"
                onClick={() => setPendingLockedBiome(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 5-Biome & World Tour Strip */}
        <div className="pointer-events-auto w-full flex flex-wrap items-center justify-between gap-2 bg-slate-950/88 border border-white/15 rounded-2xl px-3 sm:px-3.5 py-2 shadow-xl">
          <div className="flex flex-wrap items-center gap-1.5">
            {BIOME_DEFS.map((b) => {
              const unlocked = save.unlockedBiomes.includes(b.id);
              const selected = save.selectedBiome === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  data-testid={`biome-btn-${b.id}`}
                  onMouseEnter={() => soundEngine.uiHover()}
                  onClick={() => {
                    soundEngine.init();
                    if (unlocked) {
                      soundEngine.uiClick();
                      setPendingLockedBiome(null);
                      onSelectOrUnlockBiome(b.id, 'coins');
                    } else {
                      soundEngine.uiTab();
                      setPendingLockedBiome((cur) => (cur === b.id ? null : b.id));
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selected
                      ? 'bg-cyan-400 text-slate-950 shadow-sm'
                      : unlocked
                        ? 'bg-slate-800/90 text-slate-200 hover:bg-slate-700'
                        : 'bg-slate-900/95 text-slate-300 border border-indigo-400/35 hover:border-amber-400/60'
                  }`}
                >
                  {unlocked ? (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: selected ? '#0f172a' : b.dot }}
                      aria-hidden="true"
                    />
                  ) : (
                    <Lock className="w-3 h-3 text-amber-300 shrink-0" />
                  )}
                  <span>{b.label}</span>
                  {!unlocked && (
                    <span className="text-[10px] text-indigo-300 font-mono-num">
                      Nv{b.requiredLevel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer ml-auto">
            <Globe className="w-4 h-4 text-cyan-300" />
            <span>World Tour</span>
            <input
              type="checkbox"
              checked={save.worldTourAuto}
              onChange={(e) => {
                soundEngine.uiClick();
                onToggleWorldTour(e.target.checked);
              }}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </label>
        </div>

        {/* Action Hub */}
        <div className="pointer-events-auto w-full grid grid-cols-4 sm:grid-cols-12 gap-2">
          <button
            type="button"
            data-start="true"
            onMouseEnter={() => soundEngine.uiHover()}
            onClick={() => {
              soundEngine.uiClick();
              onStartRun();
            }}
            className="col-span-4 sm:col-span-4 py-3.5 px-5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] text-slate-950 font-display font-black text-lg tracking-wide border-2 border-slate-950 shadow-2xl flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" />
            <span>JOGAR</span>
          </button>

          <button
            type="button"
            onMouseEnter={() => soundEngine.uiHover()}
            onClick={() => {
              soundEngine.uiTab();
              onOpenGarage('characters');
            }}
            className="col-span-1 sm:col-span-2 py-3 px-1.5 sm:px-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white font-bold text-[11px] sm:text-xs border border-white/20 shadow-xl flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span>Equipa ({save.unlockedCharacters.length}/{CHARACTERS.length})</span>
          </button>

          <button
            type="button"
            onMouseEnter={() => soundEngine.uiHover()}
            onClick={() => {
              soundEngine.uiTab();
              onOpenGarage('customize');
            }}
            className="col-span-1 sm:col-span-2 py-3 px-1.5 sm:px-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white font-bold text-[11px] sm:text-xs border border-white/20 shadow-xl flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <Palette className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span>Skate</span>
          </button>

          <button
            type="button"
            onMouseEnter={() => soundEngine.uiHover()}
            onClick={() => {
              soundEngine.uiTab();
              onOpenGarage('upgrades');
            }}
            className="col-span-1 sm:col-span-2 py-3 px-1.5 sm:px-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white font-bold text-[11px] sm:text-xs border border-white/20 shadow-xl flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Loja</span>
          </button>

          <button
            type="button"
            onMouseEnter={() => soundEngine.uiHover()}
            onClick={() => {
              soundEngine.uiTab();
              onOpenGarage('missions');
            }}
            className="col-span-1 sm:col-span-2 py-3 px-1.5 sm:px-2.5 rounded-2xl bg-slate-950/90 hover:bg-slate-900 text-white font-bold text-[11px] sm:text-xs border border-white/20 shadow-xl flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap"
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>
              Missões {completedCount}/{save.dailyMissions.length}
            </span>
          </button>
        </div>

        {/* Clean borderless bottom control hint */}
        <p className="text-[11px] sm:text-xs font-medium text-slate-100/90 hud-text-stroke text-center">
          Espaço / Enter para correr · Setas / Deslizar para desviar · Shift Prancha · M Áudio
        </p>
      </div>
    </div>
  );
}
