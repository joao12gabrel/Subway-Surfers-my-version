'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Award, Home, KeyRound, Play, RotateCcw, Sparkles } from 'lucide-react';
import type { GameState, RunEndSummary } from '@/lib/game/types';
import { soundEngine } from '@/lib/game/audio';

interface StatusModalsProps {
  gameState: GameState;
  keysAvailable: number;
  summary: RunEndSummary | null;
  onResume: () => void;
  onRestart: () => void;
  onRevive: () => void;
  onReturnToTitle: () => void;
}

export default function StatusModals({
  gameState,
  keysAvailable,
  summary,
  onResume,
  onRestart,
  onRevive,
  onReturnToTitle,
}: StatusModalsProps) {
  if (gameState === 'paused') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jogo em Pausa"
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/70"
      >
        <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-white/15 p-6 text-center shadow-2xl">
          <h2 className="font-display text-2xl font-extrabold text-white">
            Jogo em Pausa
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-5">
            O Inspetor e o cão estão à tua espera nos trilhos.
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onResume();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center gap-2 hover:bg-emerald-300 transition cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Retomar Corrida
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onRestart();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 text-white font-bold text-sm border border-white/15 flex items-center justify-center gap-2 hover:bg-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onReturnToTitle();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800/70 text-slate-300 font-bold text-sm border border-white/10 flex items-center justify-center gap-2 hover:bg-slate-700 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Voltar ao Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'dying') {
    return (
      <div
        data-testid="gta-capture-overlay"
        aria-live="assertive"
        className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden"
        style={{
          background:
            'radial-gradient(circle at center, rgba(15, 23, 42, 0.15) 28%, rgba(127, 29, 29, 0.72) 100%)',
        }}
      >
        <motion.div
          initial={{ scale: 1.5, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: -2 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full py-5 sm:py-7 bg-slate-950/90 border-y-4 border-rose-500 text-center shadow-2xl"
        >
          <p className="font-display text-4xl sm:text-6xl font-black tracking-widest text-rose-500 drop-shadow-[0_4px_12px_rgba(244,63,94,0.45)]">
            CAPTURADO!
          </p>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.22em] text-slate-200 mt-1.5">
            O Inspetor &amp; o Cão apanharam-te nos trilhos
          </p>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'gameover' && summary) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fim da Corrida"
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/78"
      >
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/15 p-5 sm:p-6 text-center shadow-2xl max-h-[92vh] overflow-y-auto">
          {summary.isNewBest ? (
            <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1">
              Novo Recorde Pessoal
            </p>
          ) : null}
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-rose-400">
            Fim da Corrida!
          </h2>
          <p className="text-sm text-slate-300 mt-1 mb-4">{summary.reason}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
            <div className="rounded-xl bg-slate-800/85 border border-white/10 p-2.5">
              <p className="text-[11px] font-semibold text-slate-400">Pontos</p>
              <p className="font-mono-num text-lg font-extrabold text-white">
                {summary.score}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/85 border border-white/10 p-2.5">
              <p className="text-[11px] font-semibold text-slate-400">Distância</p>
              <p className="font-mono-num text-lg font-extrabold text-white">
                {summary.distance}m
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/85 border border-white/10 p-2.5">
              <p className="text-[11px] font-semibold text-slate-400">Moedas</p>
              <p className="font-mono-num text-lg font-extrabold text-amber-300">
                +{summary.runCoins}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/85 border border-white/10 p-2.5">
              <p className="text-[11px] font-semibold text-slate-400">Recorde</p>
              <p className="font-mono-num text-base font-extrabold text-cyan-300">
                {summary.bestScore}
              </p>
            </div>
          </div>

          {/* Account XP & Level Progress Banner */}
          <div
            data-testid="gameover-xp-banner"
            className="mb-3 px-3.5 py-2.5 rounded-xl bg-indigo-950/60 border border-indigo-400/35 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/25 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="font-display font-extrabold text-xs text-white flex items-center gap-1.5">
                  <span>Nível da Conta {summary.accountLevelAfter ?? 1}</span>
                  {summary.leveledUpAccount && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 text-[10px] font-black inline-flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> SUBISTE!
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-indigo-200/80">
                  Desbloqueia novos personagens, mapas e skates
                </p>
              </div>
            </div>
            <span className="font-mono-num text-sm font-black text-emerald-300 shrink-0">
              +{summary.xpGained ?? 0} XP
            </span>
          </div>

          {summary.mysteryOpened && (
            <div className="mb-3 px-3.5 py-2 rounded-xl bg-violet-950/60 border border-violet-400/40 text-xs font-bold text-violet-200">
              Caixa Mistério Aberta:{' '}
              <span className="text-amber-300">{summary.mysteryOpened.label}</span>
            </div>
          )}

          {summary.completedMissionsCount > 0 && (
            <div className="mb-3 px-3.5 py-2 rounded-xl bg-emerald-950/55 border border-emerald-400/35 text-xs font-bold text-emerald-200">
              {summary.completedMissionsCount} missão(ões) concluída(s) nesta corrida!
            </div>
          )}

          {summary.unlockedMilestones && summary.unlockedMilestones.length > 0 && (
            <div
              data-testid="gameover-milestones-banner"
              className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-950/55 border border-amber-400/50 text-left space-y-1"
            >
              {summary.unlockedMilestones.map((ms) => (
                <div key={ms.level} className="text-xs">
                  <p className="font-display font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    Marco Nível {ms.level}: {ms.title}!
                  </p>
                  <p className="text-[11px] text-amber-100/90 mt-0.5">
                    +{ms.permanentMultiplierBonus}x Mult Permanente · +{ms.rewardCoins} 🪙 · +{ms.rewardKeys} 🔑 · {ms.exclusiveVisualLabel}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {keysAvailable > 0 ? (
              <button
                type="button"
                data-testid="revive-key-btn"
                onMouseEnter={() => soundEngine.uiHover()}
                onClick={() => {
                  soundEngine.uiClick();
                  onRevive();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center gap-2 hover:bg-amber-300 border-2 border-slate-950 shadow-lg transition cursor-pointer"
              >
                <KeyRound className="w-5 h-5" />
                Salvar-me (1 Chave · Tens {keysAvailable})
              </button>
            ) : (
              <div className="w-full py-2.5 px-4 rounded-xl bg-slate-800/70 text-slate-400 font-bold text-xs border border-white/10 flex items-center justify-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                Sem Chaves para salvar (apanha 🔑 na pista ou missões)
              </div>
            )}

            <button
              type="button"
              data-start="true"
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onRestart();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-400 text-slate-950 font-display font-extrabold text-base flex items-center justify-center gap-2 hover:bg-emerald-300 transition cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              Jogar de Novo
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onReturnToTitle();
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 text-slate-200 font-bold text-sm border border-white/15 flex items-center justify-center gap-2 hover:bg-slate-700 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Voltar ao Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
