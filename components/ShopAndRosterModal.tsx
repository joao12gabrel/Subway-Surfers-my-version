'use client';

import React from 'react';
import {
  Award,
  Check,
  Crown,
  KeyRound,
  Lock,
  Palette,
  RotateCcw,
  Sparkles,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';
import type {
  BoardCustomization,
  CharacterId,
  HoverboardId,
  SaveData,
  SkatePattern,
  UpgradeKey,
} from '@/lib/game/types';
import {
  ACCOUNT_MILESTONES,
  CHARACTERS,
  DEFAULT_BOARD_CUSTOMIZATION,
  HOVERBOARDS,
  MAX_UPGRADE_LEVEL,
  SKATE_GLOWS,
  SKATE_PAINTS,
  SKATE_PATTERNS,
  SKATE_TRAILS,
  computeAccountLevel,
  getHoverboardDef,
  getMissionDefForEntry,
  getNextAccountMilestone,
  getUpgradeCost,
} from '@/lib/game/rules';
import { soundEngine } from '@/lib/game/audio';

export type GarageTab = 'characters' | 'boards' | 'customize' | 'upgrades' | 'missions';

interface ShopAndRosterModalProps {
  open: boolean;
  activeTab: GarageTab;
  onTabChange: (tab: GarageTab) => void;
  save: SaveData;
  onClose: () => void;
  onSelectOrUnlockCharacter: (id: CharacterId, currency: 'coins' | 'keys') => void;
  onSelectOrUnlockBoard: (id: HoverboardId, currency: 'coins' | 'keys') => void;
  onUpdateCustomBoard: (custom: BoardCustomization) => void;
  onBuyBoardConsumable: () => void;
  onBuyUpgrade: (key: UpgradeKey) => void;
}

function numToHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}

function SkatePreviewHD({
  deckHex,
  trimHex,
  glowHex,
  pattern,
  compact = false,
}: {
  deckHex: string;
  trimHex: string;
  glowHex: string;
  pattern: SkatePattern;
  compact?: boolean;
}) {
  const gradId = `sk-${deckHex.replace('#', '')}-${trimHex.replace('#', '')}-${pattern}`;
  return (
    <svg
      viewBox="0 0 220 92"
      className={compact ? 'w-20 h-9 shrink-0' : 'w-full max-w-[260px] h-24 mx-auto'}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={trimHex} />
          <stop offset="35%" stopColor={deckHex} />
          <stop offset="70%" stopColor={deckHex} />
          <stop offset="100%" stopColor={trimHex} />
        </linearGradient>
      </defs>

      {/* Neon Underglow Aura */}
      <ellipse cx="110" cy="54" rx="88" ry="22" fill={glowHex} opacity="0.26" />

      {/* Rear Dual Plasma Thrusters */}
      <polygon points="10,40 28,34 28,46" fill={glowHex} opacity="0.9" />
      <polygon points="10,54 28,48 28,60" fill={glowHex} opacity="0.9" />
      <rect x="24" y="33" width="12" height="10" rx="2" fill="#0f172a" stroke={glowHex} strokeWidth="1.5" />
      <rect x="24" y="49" width="12" height="10" rx="2" fill="#0f172a" stroke={glowHex} strokeWidth="1.5" />

      {/* 4 Hover-Turbine Pods */}
      <ellipse cx="56" cy="21" rx="14" ry="6" fill="#0f172a" stroke={glowHex} strokeWidth="2.2" />
      <ellipse cx="164" cy="21" rx="14" ry="6" fill="#0f172a" stroke={glowHex} strokeWidth="2.2" />
      <ellipse cx="56" cy="71" rx="14" ry="6" fill="#0f172a" stroke={glowHex} strokeWidth="2.2" />
      <ellipse cx="164" cy="71" rx="14" ry="6" fill="#0f172a" stroke={glowHex} strokeWidth="2.2" />

      {/* Sculpted Twin-Tip Carbon Deck */}
      <path
        d="M34 32 C42 20, 174 20, 188 30 L204 42 C209 46, 209 48, 204 52 L188 64 C174 72, 42 72, 34 60 Z"
        fill={`url(#${gradId})`}
        stroke="#090d16"
        strokeWidth="3"
      />
      {/* Beveled Inner Trim */}
      <path
        d="M42 36 C50 26, 170 26, 182 34 L196 46 L182 58 C170 66, 50 66, 42 56 Z"
        fill="none"
        stroke={trimHex}
        strokeWidth="2"
        opacity="0.85"
      />

      {/* Textured Grip-Tape Center Pad */}
      <rect x="66" y="31" width="88" height="30" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

      {/* HD Deck Pattern Overlay */}
      {pattern === 'classic' && (
        <>
          <rect x="50" y="42" width="124" height="8" rx="3" fill={trimHex} opacity="0.92" />
          <circle cx="76" cy="36" r="1.8" fill="#94a3b8" />
          <circle cx="76" cy="56" r="1.8" fill="#94a3b8" />
          <circle cx="144" cy="36" r="1.8" fill="#94a3b8" />
          <circle cx="144" cy="56" r="1.8" fill="#94a3b8" />
        </>
      )}
      {pattern === 'flames' && (
        <>
          <path d="M54 55 Q80 35 110 46 Q140 57 170 40 Q145 50 112 41 Q82 31 54 45 Z" fill="#f97316" />
          <path d="M62 50 Q88 38 118 46 Q142 52 162 42" fill="none" stroke="#fde047" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {pattern === 'lightning' && (
        <polygon
          points="72,48 104,35 100,44 148,40 116,57 120,48"
          fill="#fde047"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
      )}
      {pattern === 'star' && (
        <polygon
          points="110,33 114,42 124,42 116,48 119,58 110,52 101,58 104,48 96,42 106,42"
          fill={glowHex}
          stroke="#ffffff"
          strokeWidth="1.3"
        />
      )}
      {pattern === 'cyber' && (
        <>
          <line x1="72" y1="36" x2="148" y2="36" stroke={glowHex} strokeWidth="1.8" opacity="0.85" />
          <line x1="72" y1="46" x2="148" y2="46" stroke={glowHex} strokeWidth="2.2" />
          <line x1="72" y1="56" x2="148" y2="56" stroke={glowHex} strokeWidth="1.8" opacity="0.85" />
          <line x1="90" y1="31" x2="90" y2="61" stroke={trimHex} strokeWidth="1.5" opacity="0.7" />
          <line x1="110" y1="31" x2="110" y2="61" stroke={trimHex} strokeWidth="1.5" opacity="0.7" />
          <line x1="130" y1="31" x2="130" y2="61" stroke={trimHex} strokeWidth="1.5" opacity="0.7" />
        </>
      )}
      {pattern === 'imperial' && (
        <>
          <rect x="68" y="33" width="84" height="26" rx="6" fill="none" stroke="#fde047" strokeWidth="1.8" />
          <polygon points="84,46 92,38 100,46 92,54" fill="#facc15" />
          <polygon points="101,46 110,36 119,46 110,56" fill="#fde047" stroke="#0f172a" strokeWidth="1" />
          <polygon points="120,46 128,38 136,46 128,54" fill="#facc15" />
        </>
      )}
    </svg>
  );
}

function CharacterAvatar({
  hoodieColor,
  hatColor,
  accentColor,
  accessory,
}: {
  hoodieColor: number;
  hatColor: number;
  accentColor: number;
  accessory: string;
}) {
  const hoodie = numToHex(hoodieColor);
  const hat = numToHex(hatColor);
  const accent = numToHex(accentColor);

  return (
    <svg viewBox="0 0 64 64" className="w-13 h-13 shrink-0" aria-hidden="true">
      <rect x="14" y="34" width="36" height="24" rx="8" fill={hoodie} stroke="#0f172a" strokeWidth="2.5" />
      <rect x="14" y="43" width="36" height="6" fill={accent} />
      <circle cx="32" cy="24" r="12" fill="#f6c08e" stroke="#0f172a" strokeWidth="2.5" />
      <circle cx="28" cy="24" r="1.8" fill="#0f172a" />
      <circle cx="36" cy="24" r="1.8" fill="#0f172a" />
      {accessory === 'cap' && (
        <>
          <path d="M19 19c0-7 6-11 13-11s13 4 13 11H19Z" fill={hat} stroke="#0f172a" strokeWidth="2.2" />
          <rect x="26" y="16" width="22" height="4.5" rx="2" fill={accent} stroke="#0f172a" strokeWidth="1.8" />
        </>
      )}
      {accessory === 'beanie' && (
        <>
          <path d="M19 19c1-8 6-12 13-12s12 4 13 12H19Z" fill={hat} stroke="#0f172a" strokeWidth="2.2" />
          <rect x="22" y="21" width="20" height="5" rx="2" fill="#0f172a" />
        </>
      )}
      {accessory === 'boombox' && (
        <>
          <circle cx="32" cy="14" r="10" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <rect x="19" y="15" width="26" height="5" rx="2" fill={hat} stroke="#0f172a" strokeWidth="1.8" />
        </>
      )}
      {accessory === 'visor' && (
        <>
          <path d="M18 19c1-7 6-11 14-11s13 4 14 11H18Z" fill={hat} stroke="#0f172a" strokeWidth="2.2" />
          <rect x="21" y="20" width="22" height="6" rx="2" fill="#22d3ee" stroke="#0f172a" strokeWidth="1.8" />
        </>
      )}
      {accessory === 'crown' && (
        <>
          <polygon points="18,19 22,8 28,15 32,6 36,15 42,8 46,19" fill={hat} stroke="#0f172a" strokeWidth="2.2" />
          <rect x="21" y="21" width="22" height="5" rx="2" fill="#0f172a" />
        </>
      )}
      {accessory === 'headphones' && (
        <>
          <path d="M18 24a14 14 0 0 1 28 0" fill="none" stroke={hat} strokeWidth="4" strokeLinecap="round" />
          <rect x="14" y="19" width="6" height="11" rx="3" fill={accent} stroke="#0f172a" strokeWidth="1.8" />
          <rect x="44" y="19" width="6" height="11" rx="3" fill={accent} stroke="#0f172a" strokeWidth="1.8" />
        </>
      )}
      {accessory === 'jetwing' && (
        <>
          <polygon points="8,42 18,35 18,48" fill={accent} stroke="#0f172a" strokeWidth="1.8" />
          <polygon points="56,42 46,35 46,48" fill={accent} stroke="#0f172a" strokeWidth="1.8" />
          <path d="M19 19c1-7 6-11 13-11s12 4 13 11H19Z" fill={hat} stroke="#0f172a" strokeWidth="2.2" />
          <rect x="22" y="20" width="20" height="5" rx="2" fill="#38bdf8" stroke="#0f172a" strokeWidth="1.6" />
        </>
      )}
    </svg>
  );
}

export default function ShopAndRosterModal({
  open,
  activeTab,
  onTabChange,
  save,
  onClose,
  onSelectOrUnlockCharacter,
  onSelectOrUnlockBoard,
  onUpdateCustomBoard,
  onBuyBoardConsumable,
  onBuyUpgrade,
}: ShopAndRosterModalProps) {
  if (!open) return null;

  const accountLevel = computeAccountLevel(save.xp);
  const equippedBoard = getHoverboardDef(save.selectedBoard);
  const custom = save.customBoard;
  const previewDeckHex = custom.paintHex ?? numToHex(equippedBoard.deckColor);
  const previewTrimHex = numToHex(equippedBoard.trimColor);
  const previewGlowHex = custom.glowHex ?? numToHex(equippedBoard.glowColor);

  const upgrades: { key: UpgradeKey; title: string; desc: string }[] = [
    { key: 'jetpack', title: 'Jetpack', desc: 'Voa por cima dos comboios durante mais tempo' },
    { key: 'magnet', title: 'Íman de Moedas', desc: 'Atrai todas as moedas nas 3 vias por mais tempo' },
    { key: 'sneakers', title: 'Super Ténis', desc: 'Prolonga a duração dos saltos altos' },
    { key: 'multiplier', title: 'Multiplicador 2x', desc: 'Prolonga o bónus de pontuação dupla' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Garagem, Personagens e Missões"
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl font-extrabold text-white">
              Equipa, Skates &amp; Oficina
            </h2>
            <p className="text-xs text-slate-400">
              Sobe de Nível da Conta ou usa Chaves para desbloquear corredores e skates HD
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-num text-xs font-extrabold text-indigo-200 bg-indigo-950/80 border border-indigo-400/35 px-2.5 py-1.5 rounded-lg">
              Nv {accountLevel}
            </span>
            <span className="font-mono-num text-xs sm:text-sm font-extrabold text-amber-300 bg-slate-800 border border-amber-400/30 px-2.5 py-1.5 rounded-lg">
              {save.coins} 🪙
            </span>
            <span className="font-mono-num text-xs sm:text-sm font-extrabold text-cyan-300 bg-slate-800 border border-cyan-400/30 px-2.5 py-1.5 rounded-lg">
              {save.keys} 🔑
            </span>
            <button
              type="button"
              aria-label="Fechar janela"
              onMouseEnter={() => soundEngine.uiHover()}
              onClick={() => {
                soundEngine.uiClick();
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-2 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'characters' as const, label: 'Personagens', icon: User },
            { id: 'boards' as const, label: `Skates (${HOVERBOARDS.length})`, icon: Zap },
            { id: 'customize' as const, label: 'Personalizar Skate', icon: Palette },
            { id: 'upgrades' as const, label: 'Melhorias', icon: Sparkles },
            { id: 'missions' as const, label: 'Missões', icon: Trophy },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`garage-tab-${item.id}`}
                onMouseEnter={() => soundEngine.uiHover()}
                onClick={() => {
                  soundEngine.uiTab();
                  onTabChange(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHARACTERS.map((char) => {
                const unlocked = save.unlockedCharacters.includes(char.id);
                const equipped = save.selectedCharacter === char.id;
                const reqLvl = char.requiredLevel ?? 1;
                const levelMet = accountLevel >= reqLvl;
                const canCoins = levelMet && save.coins >= char.cost;
                const canKeys = Boolean(char.keyCost && save.keys >= char.keyCost);

                return (
                  <div
                    key={char.id}
                    className={`flex flex-col justify-between gap-2.5 p-3.5 rounded-xl border ${
                      equipped
                        ? 'bg-slate-800 border-amber-400'
                        : 'bg-slate-800/55 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CharacterAvatar
                        hoodieColor={char.hoodieColor}
                        hatColor={char.hatColor}
                        accentColor={char.accentColor}
                        accessory={char.accessory}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="font-display font-extrabold text-base text-white truncate">
                            {char.name}
                          </p>
                          {!unlocked && reqLvl > 1 && (
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                levelMet
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/35'
                              }`}
                            >
                              Nv {reqLvl}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-cyan-300 leading-snug">
                          ⚡ {char.powerName}
                        </p>
                        <p className="text-[11px] leading-snug text-slate-300 mt-0.5">
                          {char.powerDesc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {unlocked ? (
                        <button
                          type="button"
                          disabled={equipped}
                          onMouseEnter={() => soundEngine.uiHover()}
                          onClick={() => onSelectOrUnlockCharacter(char.id, 'coins')}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer ${
                            equipped
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                              : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                          }`}
                        >
                          {equipped ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Equipado
                            </>
                          ) : (
                            'Escolher'
                          )}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={!canCoins}
                            onMouseEnter={() => soundEngine.uiHover()}
                            onClick={() => onSelectOrUnlockCharacter(char.id, 'coins')}
                            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer ${
                              canCoins
                                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                : 'bg-slate-700/80 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {!levelMet ? (
                              <>
                                <Lock className="w-3 h-3" /> Nv {reqLvl} · {char.cost} 🪙
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" /> {char.cost} 🪙
                              </>
                            )}
                          </button>
                          {char.keyCost && (
                            <button
                              type="button"
                              disabled={!canKeys}
                              onMouseEnter={() => soundEngine.uiHover()}
                              onClick={() => onSelectOrUnlockCharacter(char.id, 'keys')}
                              title="Desbloquear já com Chaves (ignora requisito de nível)"
                              className={`py-2 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                                canKeys
                                  ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                                  : 'bg-slate-700/80 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <KeyRound className="w-3 h-3" /> {char.keyCost} 🔑
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'boards' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/30">
                <div>
                  <p className="font-display font-bold text-sm text-white">
                    Stock de Pranchas Consumíveis ({save.boards})
                  </p>
                  <p className="text-xs text-cyan-200/80">
                    Protege de 1 impacto durante 14s. Personaliza a aparência na aba Personalizar.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={save.coins < 50}
                  onMouseEnter={() => soundEngine.uiHover()}
                  onClick={onBuyBoardConsumable}
                  className="px-3.5 py-2 rounded-lg bg-cyan-400 text-slate-950 font-extrabold text-xs hover:bg-cyan-300 disabled:opacity-40 cursor-pointer whitespace-nowrap"
                >
                  +1 Prancha (50 🪙)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOVERBOARDS.map((board) => {
                  const unlocked = save.unlockedBoards.includes(board.id);
                  const equipped = save.selectedBoard === board.id;
                  const reqLvl = board.requiredLevel ?? 1;
                  const levelMet = accountLevel >= reqLvl;
                  const canCoins = levelMet && save.coins >= board.cost;
                  const canKeys = Boolean(board.keyCost && save.keys >= board.keyCost);

                  return (
                    <div
                      key={board.id}
                      className={`flex flex-col justify-between gap-2.5 p-3.5 rounded-xl border ${
                        equipped
                          ? 'bg-slate-800/95 border-cyan-400'
                          : 'bg-slate-800/55 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <SkatePreviewHD
                          compact
                          deckHex={numToHex(board.deckColor)}
                          trimHex={numToHex(board.trimColor)}
                          glowHex={numToHex(board.glowColor)}
                          pattern={equipped ? custom.pattern : 'classic'}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="font-display font-extrabold text-sm text-white truncate">
                              {board.name}
                            </p>
                            {!unlocked && reqLvl > 1 && (
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                  levelMet
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/35'
                                }`}
                              >
                                Nv {reqLvl}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{board.perk}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {unlocked ? (
                          <button
                            type="button"
                            disabled={equipped}
                            onMouseEnter={() => soundEngine.uiHover()}
                            onClick={() => onSelectOrUnlockBoard(board.id, 'coins')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold cursor-pointer ${
                              equipped
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default'
                                : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                            }`}
                          >
                            {equipped ? 'Equipada' : 'Equipar'}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={!canCoins}
                              onMouseEnter={() => soundEngine.uiHover()}
                              onClick={() => onSelectOrUnlockBoard(board.id, 'coins')}
                              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer ${
                                canCoins
                                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                                  : 'bg-slate-700/80 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {!levelMet ? `Nv ${reqLvl} · ${board.cost} 🪙` : `${board.cost} 🪙`}
                            </button>
                            {board.keyCost && (
                              <button
                                type="button"
                                disabled={!canKeys}
                                onMouseEnter={() => soundEngine.uiHover()}
                                onClick={() => onSelectOrUnlockBoard(board.id, 'keys')}
                                title="Desbloquear já com Chaves"
                                className={`py-2 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                                  canKeys
                                    ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                                    : 'bg-slate-700/80 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <KeyRound className="w-3 h-3" /> {board.keyCost} 🔑
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'customize' && (
            <div className="space-y-4">
              {/* Live HD Skate Showcase */}
              <div className="rounded-2xl bg-slate-950/90 border border-cyan-400/35 p-4 text-center">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-left">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      Pré-visualização HD · Modelo 3D Sincronizado
                    </p>
                    <p className="font-display font-extrabold text-base text-white">
                      {equippedBoard.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onMouseEnter={() => soundEngine.uiHover()}
                    onClick={() => {
                      soundEngine.uiClick();
                      onUpdateCustomBoard({ ...DEFAULT_BOARD_CUSTOMIZATION });
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Repor
                  </button>
                </div>
                <SkatePreviewHD
                  deckHex={previewDeckHex}
                  trimHex={previewTrimHex}
                  glowHex={previewGlowHex}
                  pattern={custom.pattern}
                />
              </div>

              {/* Deck Paint */}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                  Pintura da Prancha
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKATE_PAINTS.map((p) => {
                    const active = custom.paintHex === p.hex;
                    const reqLvl = p.requiredLevel ?? 1;
                    const unlocked = accountLevel >= reqLvl;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={!unlocked}
                        data-testid={`paint-${p.id}`}
                        onMouseEnter={() => soundEngine.uiHover()}
                        onClick={() => {
                          if (!unlocked) return;
                          soundEngine.uiClick();
                          onUpdateCustomBoard({ ...custom, paintHex: p.hex });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                          !unlocked
                            ? 'bg-slate-900/70 text-slate-500 border-white/5 cursor-not-allowed'
                            : active
                              ? 'bg-amber-400 text-slate-950 border-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-200 border-white/10 hover:bg-slate-700 cursor-pointer'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/40"
                          style={{
                            backgroundColor: p.hex ?? numToHex(equippedBoard.deckColor),
                          }}
                        />
                        <span>{p.label}</span>
                        {!unlocked && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono-num text-indigo-300">
                            <Lock className="w-3 h-3" /> Nv {reqLvl}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Neon Underglow */}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                  Brilho Neon &amp; Turbinas
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKATE_GLOWS.map((g) => {
                    const active = custom.glowHex === g.hex;
                    const reqLvl = g.requiredLevel ?? 1;
                    const unlocked = accountLevel >= reqLvl;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        disabled={!unlocked}
                        data-testid={`glow-${g.id}`}
                        onMouseEnter={() => soundEngine.uiHover()}
                        onClick={() => {
                          if (!unlocked) return;
                          soundEngine.uiClick();
                          onUpdateCustomBoard({ ...custom, glowHex: g.hex });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                          !unlocked
                            ? 'bg-slate-900/70 text-slate-500 border-white/5 cursor-not-allowed'
                            : active
                              ? 'bg-cyan-400 text-slate-950 border-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-200 border-white/10 hover:bg-slate-700 cursor-pointer'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/40"
                          style={{
                            backgroundColor: g.hex ?? numToHex(equippedBoard.glowColor),
                          }}
                        />
                        <span>{g.label}</span>
                        {!unlocked && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono-num text-indigo-300">
                            <Lock className="w-3 h-3" /> Nv {reqLvl}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deck Pattern + Energy Trail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                    Gráfico HD do Deck
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SKATE_PATTERNS.map((pat) => {
                      const active = custom.pattern === pat.id;
                      const reqLvl = pat.requiredLevel ?? 1;
                      const unlocked = accountLevel >= reqLvl;
                      return (
                        <button
                          key={pat.id}
                          type="button"
                          disabled={!unlocked}
                          data-testid={`pattern-${pat.id}`}
                          onMouseEnter={() => soundEngine.uiHover()}
                          onClick={() => {
                            if (!unlocked) return;
                            soundEngine.uiClick();
                            onUpdateCustomBoard({ ...custom, pattern: pat.id });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${
                            !unlocked
                              ? 'bg-slate-900/70 text-slate-500 border-white/5 cursor-not-allowed'
                              : active
                                ? 'bg-amber-400 text-slate-950 border-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-200 border-white/10 hover:bg-slate-700 cursor-pointer'
                          }`}
                        >
                          <span>{pat.label}</span>
                          {!unlocked && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono-num text-indigo-300">
                              <Lock className="w-3 h-3" /> Nv {reqLvl}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                    Rasto de Partículas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SKATE_TRAILS.map((tr) => {
                      const active = custom.trail === tr.id;
                      const reqLvl = tr.requiredLevel ?? 1;
                      const unlocked = accountLevel >= reqLvl;
                      return (
                        <button
                          key={tr.id}
                          type="button"
                          disabled={!unlocked}
                          data-testid={`trail-${tr.id}`}
                          onMouseEnter={() => soundEngine.uiHover()}
                          onClick={() => {
                            if (!unlocked) return;
                            soundEngine.uiClick();
                            onUpdateCustomBoard({ ...custom, trail: tr.id });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 ${
                            !unlocked
                              ? 'bg-slate-900/70 text-slate-500 border-white/5 cursor-not-allowed'
                              : active
                                ? 'bg-emerald-400 text-slate-950 border-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-200 border-white/10 hover:bg-slate-700 cursor-pointer'
                          }`}
                        >
                          <span>{tr.label}</span>
                          {!unlocked && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-mono-num text-indigo-300">
                              <Lock className="w-3 h-3" /> Nv {reqLvl}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upgrades' && (
            <div className="space-y-2.5">
              {upgrades.map((u) => {
                const lvl = save.upgrades[u.key];
                const isMax = lvl >= MAX_UPGRADE_LEVEL;
                const cost = getUpgradeCost(lvl);
                const canAfford = !isMax && save.coins >= cost;
                return (
                  <div
                    key={u.key}
                    className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-800/60 border border-white/10"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-display font-extrabold text-sm text-white">
                          {u.title}
                        </p>
                        <span className="font-mono-num text-[11px] font-bold text-cyan-300">
                          Nível {lvl}/{MAX_UPGRADE_LEVEL}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{u.desc}</p>
                      <div className="flex gap-1 mt-2">
                        {Array.from({ length: MAX_UPGRADE_LEVEL }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1.5 w-6 rounded-full ${
                              i < lvl ? 'bg-amber-400' : 'bg-white/15'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onMouseEnter={() => soundEngine.uiHover()}
                      onClick={() => onBuyUpgrade(u.key)}
                      className="px-3.5 py-2 rounded-lg bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isMax ? 'MÁX' : `${cost} 🪙`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'missions' && (() => {
            const nextMilestone = getNextAccountMilestone(accountLevel);
            const cycleLabel =
              save.missionIndex > 0
                ? `Ciclo Infinito Nv ${save.missionIndex}`
                : 'Ciclo Inicial';

            return (
              <div className="space-y-3">
                {/* Endless Cycle & Level Milestones Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    data-testid="missions-cycle-card"
                    className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-400/30 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                        Missões Progressivas Infinitas
                      </p>
                      <p className="font-display font-extrabold text-sm text-white">
                        {cycleLabel}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Ao concluir todas as {save.dailyMissions.length}, novo ciclo gera automaticamente.
                      </p>
                    </div>
                    <span className="font-mono-num text-xs font-black px-2 py-1 rounded-lg bg-emerald-400/20 text-emerald-200 shrink-0">
                      {save.completedMissionsTotal ?? 0} feitas
                    </span>
                  </div>

                  <div
                    data-testid="next-milestone-card"
                    className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-400/35 flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-300" />
                        Próximo Marco: Nv {nextMilestone.level}
                      </p>
                      <p className="font-display font-extrabold text-sm text-white">
                        {nextMilestone.title}
                      </p>
                      <p className="text-[11px] text-indigo-200/85">
                        +{nextMilestone.permanentMultiplierBonus}x Mult · +{nextMilestone.rewardCoins} 🪙 · +{nextMilestone.rewardKeys} 🔑 · {nextMilestone.exclusiveVisualLabel}
                      </p>
                    </div>
                    <Award className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  </div>
                </div>

                {/* Claimed / Upcoming 5-level Milestone Strip */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {ACCOUNT_MILESTONES.map((ms) => {
                    const reached = accountLevel >= ms.level || (save.claimedMilestones ?? []).includes(ms.level);
                    return (
                      <span
                        key={ms.level}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                          reached
                            ? 'bg-amber-400/20 border-amber-400/50 text-amber-200'
                            : 'bg-slate-800/70 border-white/10 text-slate-400'
                        }`}
                      >
                        {reached ? <Check className="w-3 h-3 text-emerald-300" /> : <Lock className="w-3 h-3" />}
                        Nv {ms.level} (+{ms.permanentMultiplierBonus}x)
                      </span>
                    );
                  })}
                </div>

                {/* Active Mission Cards */}
                <div className="space-y-2.5">
                  {save.dailyMissions.map((state, idx) => {
                    const def = getMissionDefForEntry(state, idx);
                    const pct = Math.min(100, Math.round((state.progress / Math.max(1, def.goal)) * 100));
                    return (
                      <div
                        key={def.id}
                        data-testid={`mission-card-${idx}`}
                        className={`p-3.5 rounded-xl border ${
                          state.completed
                            ? 'bg-emerald-950/35 border-emerald-500/40'
                            : 'bg-slate-800/60 border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-display font-extrabold text-sm text-white">
                                {def.title}
                              </p>
                              {def.tier && def.tier >= 1 && (
                                <span className="text-[10px] font-mono-num font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200">
                                  Tier {def.tier}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">{def.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {state.completed ? (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-300">
                                <Check className="w-4 h-4" /> Completa
                              </span>
                            ) : (
                              <span className="font-mono-num text-xs font-extrabold text-amber-300">
                                +{def.rewardCoins} 🪙
                                {def.rewardKeys ? ` · +${def.rewardKeys} 🔑` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-2.5">
                          <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                state.completed ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono-num text-xs font-bold text-slate-300">
                            {Math.min(state.progress, def.goal)}/{def.goal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
