'use client';

import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Crown,
  Flame,
  KeyRound,
  MapPin,
  Paintbrush,
  Play,
  Sparkles,
  TrendingUp,
  UserPlus,
  Zap,
} from 'lucide-react';
import type { LevelUnlockSummary } from '@/lib/game/types';
import { soundEngine } from '@/lib/game/audio';

interface LevelUpModalProps {
  info: LevelUnlockSummary | null;
  onContinue: () => void;
}

export default function LevelUpModal({ info, onContinue }: LevelUpModalProps) {
  useEffect(() => {
    if (!info) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        soundEngine.uiClick();
        onContinue();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [info, onContinue]);

  if (!info) return null;

  const hasCatalogUnlocks =
    info.unlockedCharacters.length > 0 ||
    info.unlockedBoards.length > 0 ||
    info.unlockedBiomes.length > 0 ||
    info.unlockedCosmetics.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Subida para o Nível ${info.level}`}
      data-testid="levelup-modal"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80"
    >
      <motion.div
        initial={{ scale: 0.78, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        className={`w-full max-w-md rounded-2xl p-4 sm:p-5 text-center shadow-2xl border-2 max-h-[94vh] overflow-y-auto ${
          info.isMilestone
            ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-amber-400'
            : 'bg-slate-900 border-indigo-400/60'
        }`}
      >
        <div className="flex flex-col items-center">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-xl mb-2 ${
              info.isMilestone
                ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-500 text-slate-950 border-amber-200'
                : 'bg-gradient-to-br from-indigo-400 to-cyan-400 text-slate-950 border-cyan-200'
            }`}
          >
            {info.isMilestone ? (
              <Crown className="w-7 h-7" />
            ) : (
              <Award className="w-7 h-7" />
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider mb-1 ${
              info.isMilestone
                ? 'bg-amber-400 text-slate-950'
                : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {info.isMilestone ? `Marco Especial Nível ${info.level}` : 'Progresso Exponencial'}
          </span>

          <h2
            data-testid="levelup-modal-title"
            className="font-display text-2xl font-black text-white leading-tight"
          >
            Nível da Conta {info.level}!
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            {info.milestone
              ? `${info.milestone.title} — Recompensas permanentes desbloqueadas!`
              : 'Evoluíste o teu perfil de corredor e desbloqueaste novas vantagens.'}
          </p>
        </div>

        {/* Milestone Permanent Rewards Card */}
        {info.milestone && (
          <div
            data-testid="levelup-milestone-rewards"
            className="mt-3 rounded-xl bg-amber-950/55 border border-amber-400/60 p-3 text-left space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                {info.milestone.title}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono-num font-black text-xs">
                +{info.milestone.permanentMultiplierBonus}x Mult
              </span>
            </div>
            <p className="text-[11px] text-amber-100/90 leading-snug">{info.milestone.desc}</p>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-center">
              <div className="rounded-lg bg-slate-950/60 border border-amber-400/25 py-1 px-2">
                <p className="text-[10px] text-slate-400 font-semibold">Moedas</p>
                <p className="font-mono-num text-sm font-black text-amber-300 leading-tight">
                  +{info.milestone.rewardCoins}
                </p>
              </div>
              <div className="rounded-lg bg-slate-950/60 border border-amber-400/25 py-1 px-2">
                <p className="text-[10px] text-slate-400 font-semibold">Chaves</p>
                <p className="font-mono-num text-sm font-black text-cyan-300 flex items-center justify-center gap-1 leading-tight">
                  <KeyRound className="w-3.5 h-3.5" />+{info.milestone.rewardKeys}
                </p>
              </div>
              <div className="col-span-2 rounded-lg bg-slate-950/60 border border-amber-400/25 py-1 px-2.5 flex items-center justify-between gap-2 text-left">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide shrink-0">
                  Visual Exclusivo
                </span>
                <span className="text-xs font-extrabold text-emerald-300 text-right">
                  {info.milestone.exclusiveVisualLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Newly Unlocked Roster / Maps / Skates / Cosmetics */}
        {hasCatalogUnlocks && (
          <div
            data-testid="levelup-catalog-unlocks"
            className="mt-2.5 rounded-xl bg-slate-800/80 border border-white/10 p-2.5 text-left space-y-1.5"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
              Novos Desbloqueios Disponíveis na Loja
            </p>
            {info.unlockedCharacters.map((c) => (
              <div key={c} className="flex items-center gap-2 text-xs text-white font-semibold">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Personagem: {c}</span>
              </div>
            ))}
            {info.unlockedBoards.map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs text-white font-semibold">
                <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Hoverboard: {b}</span>
              </div>
            ))}
            {info.unlockedBiomes.map((m) => (
              <div key={m} className="flex items-center gap-2 text-xs text-white font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Mapa: {m}</span>
              </div>
            ))}
            {info.unlockedCosmetics.map((cos) => (
              <div key={cos} className="flex items-center gap-2 text-xs text-white font-semibold">
                <Paintbrush className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                <span>Oficina: {cos}</span>
              </div>
            ))}
          </div>
        )}

        {/* Exponential Curve Challenge Indicator */}
        <div className="mt-2.5 rounded-xl bg-indigo-950/60 border border-indigo-400/35 px-3 py-2 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-300 shrink-0" />
            <div>
              <p className="text-[11px] font-extrabold text-indigo-100 leading-tight">
                Meta para Nível {info.level + 1}
              </p>
              <p className="text-[10px] text-indigo-300/80 leading-tight">
                Curva exponencial (+36% XP por nível)
              </p>
            </div>
          </div>
          <span className="font-mono-num text-xs font-black text-indigo-200 shrink-0">
            {info.nextLevelXpSpan} XP
          </span>
        </div>

        <button
          type="button"
          data-testid="levelup-continue-btn"
          onMouseEnter={() => soundEngine.uiHover()}
          onClick={() => {
            soundEngine.uiClick();
            onContinue();
          }}
          className={`mt-3 w-full py-2.5 px-4 rounded-xl font-display font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 border-2 border-slate-950 shadow-xl transition cursor-pointer ${
            info.isMilestone
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          {info.source === 'live' ? 'Continuar Corrida' : 'Ver Resumo da Corrida'}
        </button>
      </motion.div>
    </div>
  );
}
