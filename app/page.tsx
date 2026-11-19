'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import GameCanvas, { type GameController } from '@/components/GameCanvas';
import GameHUD, { type HudState } from '@/components/GameHUD';
import TitleOverlay from '@/components/TitleOverlay';
import DebugOverlay from '@/components/DebugOverlay';
import LevelUpModal from '@/components/LevelUpModal';
import ShopAndRosterModal, { type GarageTab } from '@/components/ShopAndRosterModal';
import StatusModals from '@/components/StatusModals';
import {
  COMBO_WINDOW_SECONDS,
  DAILY_MISSIONS,
  STORAGE_KEY,
  claimDailyStreakReward,
  createDefaultSave,
  getBiomeDef,
  getCharacterDef,
  getHoverboardDef,
  normalizeSaveData,
  purchaseBoardConsumable,
  purchaseOrSelectBiome,
  purchaseOrSelectCharacter,
  purchaseOrSelectHoverboard,
  purchaseUpgrade,
} from '@/lib/game/rules';
import { soundEngine } from '@/lib/game/audio';
import type {
  BiomeKey,
  BoardCustomization,
  CharacterId,
  DebugInfo,
  GameState,
  HoverboardId,
  LevelUnlockSummary,
  RunEndSummary,
  SaveData,
  UpgradeKey,
} from '@/lib/game/types';

function loadSaveFromStorage(): SaveData {
  if (typeof window === 'undefined') return createDefaultSave();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSave();
    return normalizeSaveData(JSON.parse(raw) as Partial<SaveData>);
  } catch {
    return createDefaultSave();
  }
}

function persistSaveToStorage(save: SaveData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Ignore storage quota errors
  }
}

export default function HomePage() {
  const [save, setSave] = useState<SaveData>(() => createDefaultSave());
  const [gameState, setGameState] = useState<GameState>('title');
  const [isDevMode, setIsDevMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [garageOpen, setGarageOpen] = useState(false);
  const [garageTab, setGarageTab] = useState<GarageTab>('characters');
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [summary, setSummary] = useState<RunEndSummary | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUnlockSummary | null>(null);
  const [hud, setHud] = useState<HudState>(() => ({
    score: 0,
    multiplier: 1,
    runCoins: 0,
    keys: 2,
    distance: 0,
    boards: 3,
    boardActive: false,
    boardName: 'Sky Dart',
    biome: 'classic',
    stumbleActive: false,
    level: 1,
    levelTitle: 'Aquecimento',
    levelProgressPct: 0,
    shieldActive: false,
    characterPowerName: 'Turbo Clássico',
    activeMission: DAILY_MISSIONS[0],
    activeMissionProgress: 0,
    completedCount: 0,
    totalMissions: DAILY_MISSIONS.length,
    powerups: [],
    comboCount: 0,
    comboBonus: 0,
    comboTimer: 0,
    comboMaxTimer: COMBO_WINDOW_SECONDS,
    comboPopup: null,
    accountXp: 0,
    accountLevel: 1,
    accountXpPct: 0,
    levelUpSplash: null,
  }));

  const saveRef = useRef<SaveData>(save);
  const isGarageOpenRef = useRef<boolean>(false);
  const controllerRef = useRef<GameController | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const loaded = loadSaveFromStorage();
    saveRef.current = loaded;
    controllerRef.current?.applyCharacter(loaded.selectedCharacter);
    controllerRef.current?.applyHoverboard(loaded.selectedBoard, loaded.customBoard);
    controllerRef.current?.previewBiome(loaded.selectedBiome);
    const unbindAudio = soundEngine.bindAutoUnlock();
    const id = window.setTimeout(() => {
      setSave(loaded);
    }, 0);
    return () => {
      window.clearTimeout(id);
      unbindAudio();
      soundEngine.setMusicMode('off');
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const handleSaveUpdate = useCallback((nextSave: SaveData) => {
    saveRef.current = nextSave;
    setSave(nextSave);
    persistSaveToStorage(nextSave);
  }, []);

  const openGarage = useCallback((tab: GarageTab) => {
    isGarageOpenRef.current = true;
    setGarageTab(tab);
    setGarageOpen(true);
  }, []);

  const closeGarage = useCallback(() => {
    isGarageOpenRef.current = false;
    setGarageOpen(false);
  }, []);

  const handleSelectOrUnlockCharacter = useCallback(
    (charId: CharacterId, currency: 'coins' | 'keys' = 'coins') => {
      soundEngine.init();
      const def = getCharacterDef(charId);
      const res = purchaseOrSelectCharacter(saveRef.current, charId, currency);
      if (res.outcome === 'level_locked') {
        soundEngine.uiDenied();
        showToast(`Requer Nível ${def.requiredLevel ?? 1} ou ${def.keyCost ?? 1} Chaves!`);
        return;
      }
      if (res.outcome === 'insufficient') {
        soundEngine.uiDenied();
        showToast(currency === 'keys' ? 'Chaves insuficientes!' : 'Moedas insuficientes!');
        return;
      }
      handleSaveUpdate(res.save);
      controllerRef.current?.applyCharacter(charId);
      if (res.outcome === 'unlocked') {
        soundEngine.uiPurchase();
        showToast(`${def.name} desbloqueado e equipado!`);
      } else {
        soundEngine.uiClick();
        showToast(`${def.name} equipado!`);
      }
    },
    [handleSaveUpdate, showToast]
  );

  const handleSelectOrUnlockBoard = useCallback(
    (boardId: HoverboardId, currency: 'coins' | 'keys' = 'coins') => {
      soundEngine.init();
      const def = getHoverboardDef(boardId);
      const res = purchaseOrSelectHoverboard(saveRef.current, boardId, currency);
      if (res.outcome === 'level_locked') {
        soundEngine.uiDenied();
        showToast(`Requer Nível ${def.requiredLevel ?? 1} ou ${def.keyCost ?? 1} Chaves!`);
        return;
      }
      if (res.outcome === 'insufficient') {
        soundEngine.uiDenied();
        showToast(currency === 'keys' ? 'Chaves insuficientes!' : 'Moedas insuficientes!');
        return;
      }
      handleSaveUpdate(res.save);
      controllerRef.current?.applyHoverboard(boardId, res.save.customBoard);
      if (res.outcome === 'unlocked') {
        soundEngine.uiPurchase();
        showToast(`Skate ${def.name} desbloqueado!`);
      } else {
        soundEngine.uiClick();
        showToast(`Skate ${def.name} equipado!`);
      }
    },
    [handleSaveUpdate, showToast]
  );

  const handleUpdateCustomBoard = useCallback(
    (customBoard: BoardCustomization) => {
      const next = { ...saveRef.current, customBoard };
      handleSaveUpdate(next);
      controllerRef.current?.applyHoverboard(next.selectedBoard, customBoard);
    },
    [handleSaveUpdate]
  );

  const handleSelectOrUnlockBiome = useCallback(
    (biome: BiomeKey, currency: 'coins' | 'keys' = 'coins'): boolean => {
      soundEngine.init();
      const def = getBiomeDef(biome);
      const res = purchaseOrSelectBiome(saveRef.current, biome, currency);
      if (res.outcome === 'level_locked') {
        soundEngine.uiDenied();
        showToast(`Cenário requer Nível ${def.requiredLevel} ou ${def.keyCost} Chaves!`);
        return false;
      }
      if (res.outcome === 'insufficient') {
        soundEngine.uiDenied();
        showToast(currency === 'keys' ? 'Chaves insuficientes!' : 'Moedas insuficientes!');
        return false;
      }
      handleSaveUpdate(res.save);
      controllerRef.current?.previewBiome(biome);
      if (res.outcome === 'unlocked') {
        soundEngine.uiPurchase();
        showToast(`Cenário ${def.label} desbloqueado!`);
      } else {
        soundEngine.uiClick();
      }
      return true;
    },
    [handleSaveUpdate, showToast]
  );

  const handleBuyBoardConsumable = useCallback(() => {
    soundEngine.init();
    const res = purchaseBoardConsumable(saveRef.current, 50);
    if (!res.purchased) {
      soundEngine.uiDenied();
      return;
    }
    handleSaveUpdate(res.save);
    soundEngine.uiPurchase();
    showToast('+1 Hoverboard adicionado!');
  }, [handleSaveUpdate, showToast]);

  const handleBuyUpgrade = useCallback(
    (key: UpgradeKey) => {
      soundEngine.init();
      const res = purchaseUpgrade(saveRef.current, key);
      if (!res.purchased) {
        soundEngine.uiDenied();
        return;
      }
      handleSaveUpdate(res.save);
      soundEngine.uiPurchase();
    },
    [handleSaveUpdate]
  );

  const handleToggleWorldTour = useCallback(
    (enabled: boolean) => {
      const next = { ...saveRef.current, worldTourAuto: enabled };
      handleSaveUpdate(next);
    },
    [handleSaveUpdate]
  );

  const handleClaimDailyStreak = useCallback(() => {
    soundEngine.init();
    const res = claimDailyStreakReward(saveRef.current);
    if (!res) {
      showToast('Recompensa de hoje já resgatada!');
      return;
    }
    handleSaveUpdate(res.save);
    soundEngine.unlock();
    showToast(`Sequência Dia ${res.claimedDay}! +${res.rewardCoins} Moedas!`);
  }, [handleSaveUpdate, showToast]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <GameCanvas
        saveRef={saveRef}
        isGarageOpenRef={isGarageOpenRef}
        controllerRef={controllerRef}
        onStateChange={setGameState}
        onSaveUpdate={handleSaveUpdate}
        onHudUpdate={setHud}
        onGameOver={setSummary}
        onToast={showToast}
        onMuteChange={setMuted}
        onDebugUpdate={setDebugInfo}
        onAccountLevelUp={setLevelUpInfo}
      />

      {isDevMode && (
        <DebugOverlay
          debug={debugInfo}
          onClose={() => setIsDevMode(false)}
        />
      )}

      {gameState === 'title' && toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-[288px] sm:bottom-auto sm:top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-4 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-display font-extrabold text-xs sm:text-sm shadow-lg border-2 border-slate-950 whitespace-nowrap"
        >
          {toast}
        </div>
      )}

      {gameState === 'title' && (
        <TitleOverlay
          save={save}
          muted={muted}
          isDevMode={isDevMode}
          onToggleMute={() => {
            controllerRef.current?.toggleMute();
          }}
          onToggleDevMode={() => setIsDevMode(!isDevMode)}
          onStartRun={() => {
            setToast(null);
            controllerRef.current?.startNewRun();
          }}
          onOpenGarage={openGarage}
          onSelectOrUnlockBiome={handleSelectOrUnlockBiome}
          onToggleWorldTour={handleToggleWorldTour}
          onClaimDailyStreak={handleClaimDailyStreak}
        />
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          hud={hud}
          muted={muted}
          isDevMode={isDevMode}
          onToggleMute={() => controllerRef.current?.toggleMute()}
          onToggleDevMode={() => setIsDevMode(!isDevMode)}
          onPause={() => controllerRef.current?.pauseRun()}
          onActivateBoard={() => controllerRef.current?.activateBoard()}
        />
      )}

      {!levelUpInfo && (
        <StatusModals
          gameState={gameState}
          keysAvailable={save.keys}
          summary={summary}
          onResume={() => controllerRef.current?.resumeRun()}
          onRestart={() => controllerRef.current?.startNewRun()}
          onRevive={() => controllerRef.current?.reviveRun()}
          onReturnToTitle={() => controllerRef.current?.returnToTitle()}
        />
      )}

      <LevelUpModal
        info={levelUpInfo}
        onContinue={() => {
          const wasLive = levelUpInfo?.source === 'live';
          setLevelUpInfo(null);
          if (wasLive) {
            controllerRef.current?.resumeRun();
          }
        }}
      />

      <ShopAndRosterModal
        open={garageOpen}
        activeTab={garageTab}
        onTabChange={setGarageTab}
        save={save}
        onClose={closeGarage}
        onSelectOrUnlockCharacter={handleSelectOrUnlockCharacter}
        onSelectOrUnlockBoard={handleSelectOrUnlockBoard}
        onUpdateCustomBoard={handleUpdateCustomBoard}
        onBuyBoardConsumable={handleBuyBoardConsumable}
        onBuyUpgrade={handleBuyUpgrade}
      />
    </main>
  );
}
