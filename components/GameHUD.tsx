'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Award, Bug, Crown, Flame, Pause, Shield, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { BiomeKey, ComboPopupEvent, MissionDef, PowerUpType } from '@/lib/game/types';
import { getNextAccountMilestone } from '@/lib/game/rules';
import { BIOMES } from '@/lib/game/world';

export interface ActivePowerUpBar {
  key: PowerUpType | 'board';
  label: string;
  remaining: number;
  max: number;
  color: string;
}

export interface HudState {
  score: number;
  multiplier: number;
  runCoins: number;
  keys: number;
  distance: number;
  boards: number;
  boardActive: boolean;
  boardName: string;
  biome: BiomeKey;
  stumbleActive: boolean;
  level: number;
  levelTitle: string;
  levelProgressPct: number;
  shieldActive: boolean;
  characterPowerName: string;
  activeMission: MissionDef;
  activeMissionProgress: number;
  completedCount: number;
  totalMissions: number;
  powerups: ActivePowerUpBar[];
  comboCount: number;
  comboBonus: number;
  comboTimer: number;
  comboMaxTimer: number;
  comboPopup: ComboPopupEvent | null;
  accountXp: number;
  accountLevel: number;
  accountXpPct: number;
  levelUpSplash: { level: number; title: string; isMilestone?: boolean } | null;
}

interface GameHUDProps {
  hud: HudState;
  muted: boolean;
  isDevMode: boolean;
  onToggleMute: () => void;
  onToggleDevMode: () => void;
  onPause: () => void;
  onActivateBoard: () => void;
}

function PowerUpIcon({ kind }: { kind: PowerUpType | 'board' }) {
  if (kind === 'magnet') {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
        <path
          d="M6 4v8a6 6 0 0 0 12 0V4h-3.5v8a2.5 2.5 0 0 1-5 0V4H6Z"
          fill="#ef4444"
          stroke="#0f172a"
          strokeWidth="1.4"
        />
        <rect x="6" y="4" width="3.5" height="3" fill="#e2e8f0" />
        <rect x="14.5" y="4" width="3.5" height="3" fill="#e2e8f0" />
      </svg>
    );
  }
  if (kind === 'sneakers') {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
        <path
          d="M3 16h18v3H3v-3Zm1-2 4-6 3 2 3-4 6 6v2H4Z"
          fill="#22c55e"
          stroke="#0f172a"
          strokeWidth="1.4"
        />
        <rect x="3" y="16" width="18" height="3" fill="#facc15" />
      </svg>
    );
  }
  if (kind === 'multiplier') {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
        <polygon
          points="12,2 15,9 22,9.5 16.5,14.5 18.2,21.5 12,17.8 5.8,21.5 7.5,14.5 2,9.5 9,9"
          fill="#e879f9"
          stroke="#0f172a"
          strokeWidth="1.4"
        />
      </svg>
    );
  }
  if (kind === 'jetpack') {
    return (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
        <rect x="6" y="4" width="5" height="13" rx="2" fill="#f97316" stroke="#0f172a" strokeWidth="1.3" />
        <rect x="13" y="4" width="5" height="13" rx="2" fill="#f97316" stroke="#0f172a" strokeWidth="1.3" />
        <polygon points="7,17 10,17 8.5,22" fill="#fde047" />
        <polygon points="14,17 17,17 15.5,22" fill="#fde047" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <rect x="3" y="9" width="18" height="6" rx="3" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.4" />
      <rect x="6" y="11" width="12" height="2" fill="#f43f5e" />
    </svg>
  );
}

export default function GameHUD({
  hud,
  muted,
  isDevMode,
  onToggleMute,
  onToggleDevMode,
  onPause,
  onActivateBoard,
}: GameHUDProps) {
  const missionPct = Math.min(
    100,
    Math.round((hud.activeMissionProgress / Math.max(1, hud.activeMission.goal)) * 100)
  );

  return (
    <>
      {/* Peripheral warning vignette when the Inspector & Dog are right behind you */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-10 transition-opacity duration-200"
        style={{
          opacity: hud.stumbleActive ? 0.72 : 0,
          background:
            'radial-gradient(circle, transparent 54%, rgba(239, 68, 68, 0.56) 100%)',
        }}
      />

      {/* Clean Top-Center Account XP & 5-Level Milestone Bar (zero intrusive popups during gameplay) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center max-w-[92vw]">
        {(() => {
          const cycleStart = Math.floor((hud.accountLevel - 1) / 5) * 5 + 1;
          const cycleMilestone = cycleStart + 4;
          const nextMs = getNextAccountMilestone(hud.accountLevel);
          const stepsCompleted = hud.accountLevel - cycleStart; // 0..4 within current 5-level bracket
          const bracketPct = Math.min(
            100,
            Math.max(2, ((stepsCompleted + hud.accountXpPct / 100) / 5) * 100)
          );
          return (
            <div
              data-testid="top-center-xp-bar"
              className="bg-slate-950/90 border border-indigo-400/45 rounded-xl px-3 py-1.5 shadow-xl pointer-events-auto min-w-[235px] sm:min-w-[268px]"
            >
              <div className="flex items-center justify-between gap-2 text-[10px] font-extrabold">
                <span className="flex items-center gap-1 text-indigo-200">
                  <Award className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  <span>Conta Nv {hud.accountLevel}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono-num text-cyan-300">{hud.accountXpPct}%</span>
                </span>
                <span
                  data-testid="hud-milestone-badge"
                  title={nextMs.desc}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/45 text-amber-300 font-mono-num text-[9px] font-black"
                >
                  <Crown className="w-2.5 h-2.5 shrink-0" />
                  Marco Nv {nextMs.level} (+{nextMs.permanentMultiplierBonus}x)
                </span>
              </div>

              {/* Combined XP bar with 5-level Milestone pip markers */}
              <div
                data-testid="hud-milestone-track"
                className="relative mt-1.5 h-2 w-full rounded-full bg-white/12 overflow-visible flex items-center"
              >
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-cyan-400 to-amber-400 transition-all duration-300"
                    style={{ width: `${bracketPct}%` }}
                  />
                </div>
                {[1, 2, 3, 4, 5].map((step) => {
                  const targetLvl = cycleStart + step - 1;
                  const reached = hud.accountLevel >= targetLvl;
                  const isMilestoneStep = step === 5;
                  return (
                    <div
                      key={step}
                      data-testid={`hud-milestone-pip-${targetLvl}`}
                      title={
                        isMilestoneStep
                          ? `Marco Nível ${cycleMilestone}`
                          : `Nível ${targetLvl}`
                      }
                      style={{ left: `${(step / 5) * 100}%` }}
                      className={`absolute -translate-x-1/2 flex items-center justify-center rounded-full border transition-transform ${
                        isMilestoneStep
                          ? `w-3.5 h-3.5 ${
                              reached
                                ? 'bg-amber-400 border-slate-950 text-slate-950 scale-110'
                                : 'bg-amber-950 border-amber-400 text-amber-300'
                            }`
                          : `w-2 h-2 ${
                              reached
                                ? 'bg-cyan-300 border-slate-950'
                                : 'bg-slate-800 border-white/30'
                            }`
                      }`}
                    >
                      {isMilestoneStep && <Crown className="w-2 h-2" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* HUD Layer (clean peripheral zones, zero text clutter in center track) */}
      <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
        {/* Top Row: Left Compact Telemetry + Right Audio & Pause */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 w-[212px] sm:w-[258px]">
            {/* Unified Score + Multiplier + Level Progress Card */}
            <div className="bg-slate-950/88 border border-white/15 rounded-2xl px-3 py-2 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <span
                  data-testid="hud-score"
                  className="font-mono-num text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none"
                >
                  {Math.floor(hud.score)}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    data-testid="hud-level"
                    title={hud.levelTitle}
                    className="font-display font-extrabold text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-400 text-slate-950"
                  >
                    Nv {hud.level}
                  </span>
                  <span
                    data-testid="hud-multiplier"
                    className={`font-display font-extrabold text-[11px] px-1.5 py-0.5 rounded-md ${
                      hud.comboBonus > 0
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {hud.multiplier}x
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-200 mt-1.5 font-mono-num">
                <span className="flex items-center gap-1 text-amber-300">
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-amber-400"
                    aria-hidden="true"
                  />
                  <span data-testid="hud-coins">{hud.runCoins}</span>
                </span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span data-testid="hud-dist">{Math.floor(hud.distance)}m</span>
                <span aria-hidden="true" className="text-slate-600">
                  ·
                </span>
                <span className="text-cyan-300">{hud.keys}ch</span>
                {hud.shieldActive && (
                  <span
                    data-testid="hud-shield-badge"
                    className="inline-flex items-center text-cyan-300 ml-auto"
                    title="Escudo Sónico Ativo"
                  >
                    <Shield className="w-3.5 h-3.5 fill-cyan-400/30" />
                  </span>
                )}
              </div>

              {/* Thin level progress bar */}
              <div
                className="mt-1.5 h-1 w-full rounded-full bg-white/10 overflow-hidden"
                aria-label={`Nível ${hud.level}: ${hud.levelTitle}`}
              >
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-150"
                  style={{ width: `${Math.max(4, Math.min(100, hud.levelProgressPct))}%` }}
                />
              </div>
            </div>

            {/* Live Combo Chain Bar with Pop-out motion and color gradient */}
            {hud.comboCount >= 2 && hud.comboTimer > 0 && (
              <motion.div
                key={hud.comboCount}
                initial={{ scale: 0.85, opacity: 0, y: 4 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                data-testid="hud-combo-bar"
                className={`rounded-xl px-3 py-1.5 shadow-xl border-2 ${
                  hud.comboBonus >= 3
                    ? 'bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 border-amber-400 text-amber-300'
                    : hud.comboBonus >= 2
                    ? 'bg-gradient-to-r from-cyan-950 via-slate-950 to-blue-950 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950/90 border-orange-400/80 text-orange-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                    <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent font-black text-xs">
                      x{hud.comboCount}
                    </span>
                  </span>
                  <span className="font-mono-num font-black uppercase tracking-wider">
                    {hud.comboBonus > 0 ? `+${hud.comboBonus}x Mult` : 'Combo'}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      hud.comboBonus >= 3
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                        : hud.comboBonus >= 2
                        ? 'bg-gradient-to-r from-cyan-400 to-indigo-400'
                        : 'bg-gradient-to-r from-orange-400 to-amber-300'
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (hud.comboTimer / Math.max(0.1, hud.comboMaxTimer)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </motion.div>
            )}

            {/* Slim Active Daily Mission Tracker */}
            <div className="bg-slate-950/82 border border-white/12 rounded-xl px-2.5 py-1 shadow-md">
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold">
                <span className="text-emerald-300 truncate">{hud.activeMission.title}</span>
                <span className="font-mono-num text-slate-200 shrink-0">
                  {Math.min(hud.activeMissionProgress, hud.activeMission.goal)}/{hud.activeMission.goal}
                </span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-150"
                  style={{ width: `${missionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top-Right Controls + Biome Tag */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="hidden md:inline-flex items-center px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/15 text-[11px] font-bold text-slate-200">
              {BIOMES[hud.biome].name} · {hud.levelTitle}
            </span>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Alternar modo de programador"
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleDevMode();
              }}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/88 border text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition cursor-pointer ${
                isDevMode ? 'border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/40' : 'border-white/20'
              }`}
              title="Alternar Modo Programador (FPS & Colisão)"
            >
              <Bug className={`w-5 h-5 ${isDevMode ? 'text-cyan-300' : 'text-slate-300'}`} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Ativar som' : 'Silenciar som'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/88 border border-white/20 text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition cursor-pointer"
            >
              {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Pausar jogo"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/88 border border-white/20 text-white flex items-center justify-center hover:bg-slate-900 active:scale-95 transition cursor-pointer"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Compact Power-Up Pills on Left + Superpower & Hoverboard Button on Right */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-wrap items-end gap-1.5 max-w-[58vw]">
            {hud.powerups.map((pu) => {
              const pct = Math.max(0, Math.min(100, (pu.remaining / pu.max) * 100));
              return (
                <div
                  key={pu.key}
                  className="bg-slate-950/88 border border-white/15 rounded-xl px-2.5 py-1 shadow-md min-w-[96px]"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold">
                    <span className="flex items-center gap-1 text-white truncate">
                      <PowerUpIcon kind={pu.key} />
                      {pu.label}
                    </span>
                    <span className="font-mono-num text-slate-300 shrink-0">
                      {pu.remaining.toFixed(1)}s
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: pu.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/82 border border-white/15 text-[11px] font-bold text-cyan-200 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {hud.characterPowerName}
            </span>

            <button
              type="button"
              tabIndex={-1}
              disabled={hud.boards <= 0 || hud.boardActive}
              onClick={(e) => {
                e.currentTarget.blur();
                onActivateBoard();
              }}
              className="pointer-events-auto flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-display font-extrabold text-xs sm:text-sm border-2 border-slate-950 shadow-lg hover:bg-cyan-400 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              <PowerUpIcon kind="board" />
              <span>
                {hud.boardActive
                  ? `${hud.boardName} Ativa`
                  : `Prancha (${hud.boards})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
