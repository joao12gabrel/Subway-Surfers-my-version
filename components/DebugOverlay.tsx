'use client';

import React from 'react';
import { Bug, X } from 'lucide-react';
import type { DebugInfo } from '@/lib/game/types';

interface DebugOverlayProps {
  debug: DebugInfo | null;
  onClose: () => void;
}

export default function DebugOverlay({ debug, onClose }: DebugOverlayProps) {
  if (!debug) return null;

  const fpsColor =
    debug.fps >= 50
      ? 'text-emerald-400'
      : debug.fps >= 30
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div
      data-testid="dev-debug-overlay"
      className="fixed top-14 right-3 z-50 w-72 bg-slate-950/92 border-2 border-cyan-500/60 rounded-2xl p-3 shadow-2xl text-[11px] font-mono text-cyan-200 pointer-events-auto backdrop-blur-md"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/30">
        <span className="flex items-center gap-1.5 font-display font-black text-xs text-cyan-300 tracking-wider">
          <Bug className="w-3.5 h-3.5 text-cyan-400" />
          DEV DEBUG (FPS & FÍSICA)
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de depuração"
          className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">FPS:</span>
          <span className={`font-black font-mono-num ${fpsColor}`}>{debug.fps}</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">Frame:</span>
          <span className="font-bold text-white font-mono-num">{debug.frameTimeMs.toFixed(1)}ms</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10 col-span-2">
          <span className="text-slate-400">Pos (X, Y, Z):</span>
          <span className="font-bold text-cyan-300 font-mono-num">
            {debug.x.toFixed(2)}, {debug.y.toFixed(2)}, {debug.z.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">Lane:</span>
          <span className="font-bold text-amber-300 font-mono-num">{debug.lane}</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">Velocidade:</span>
          <span className="font-bold text-emerald-300 font-mono-num">{debug.speed.toFixed(1)} m/s</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">Distância:</span>
          <span className="font-bold text-white font-mono-num">{debug.distance.toFixed(0)}m</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">Obstáculos:</span>
          <span className="font-bold text-rose-300 font-mono-num">{debug.obstacleCount} ativos</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10 col-span-2">
          <span className="text-slate-400">Obstáculo mais perto:</span>
          <span className="font-bold text-amber-300 font-mono-num">
            {debug.nearestObstacleDist < 999 ? `${debug.nearestObstacleDist.toFixed(1)}m` : 'Nenhum'}
          </span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">Invulnerável:</span>
          <span className="font-bold text-indigo-300 font-mono-num">{debug.invulnTimer.toFixed(1)}s</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-white/10">
          <span className="text-slate-400">Perseguição:</span>
          <span className="font-bold text-rose-400 font-mono-num">{debug.stumbleTimer.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
