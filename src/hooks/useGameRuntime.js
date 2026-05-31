import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicManager } from '../audio/MusicManager.js';
import { Volume } from '../audio/Volume.js';
import { AssetLoader } from '../core/AssetLoader.js';
import { EventBus } from '../core/EventBus.js';
import { Game } from '../core/Game.js';
import { Input } from '../core/Input.js';
import { PlayScene } from '../core/PlayScene.js';
import { SceneManager } from '../core/SceneManager.js';
import { Inventory } from '../gameplay/inventory/Inventory.js';
import { SkillTree } from '../gameplay/skills/SkillTree.js';
import { SaveManager } from '../save/SaveManager.js';
import { Storage } from '../save/Storage.js';

const EMPTY_INVENTORY = { gold: 0, crystals: 0, keys: 0 };

export function createGameRuntime(canvas, notify = {}) {
  const bus = new EventBus();
  const input = new Input();
  const assets = new AssetLoader();
  const scenes = new SceneManager();
  const game = new Game({ canvas, input, scenes });
  const volume = new Volume();
  const music = new MusicManager(volume);
  const storage = new Storage();
  let inventory = new Inventory();
  let skills = new SkillTree();
  const saveManager = new SaveManager(storage, bus);
  let scene;

  const settings = () => ({ music: volume.music, sfx: volume.sfx, debug: Boolean(scene?.debug) });
  const getInventorySnapshot = () => scene?.player ? { gold: scene.player.gold, crystals: scene.player.crystals, keys: scene.player.keys } : { ...EMPTY_INVENTORY };
  const getSkillsSnapshot = () => skills.serialize();
  const launch = save => {
    if (save?.settings) {
      volume.set('music', save.settings.music);
      volume.set('sfx', save.settings.sfx);
    }
    inventory = new Inventory(save?.inventory);
    skills = new SkillTree(save?.skills?.unlocked, save?.skills?.points);
    scene = new PlayScene({ canvas, input, bus, music, assets, inventory, skills, saveData: save });
    scene.debug = Boolean(save?.settings?.debug);
    scenes.change(scene);
    saveManager.bind(() => ({ player: scene.player, levelId: scene.levelId, checkpoint: scene.checkpoints.find(checkpoint => checkpoint.active) || scene.level.spawn, inventory, skills, zoneState: scene.serializeZoneState(), settings: settings() }));
    notify.settings?.(settings());
    notify.inventory?.(getInventorySnapshot());
    notify.skills?.(getSkillsSnapshot());
  };
  const subscriptions = [
    bus.on('ui:pause', () => api.pauseGame()),
    bus.on('player:dead', () => scene?.respawn()),
    bus.on('checkpoint', ({ checkpoint }) => notify.toast?.(`Checkpoint activat: ${checkpoint.id}`)),
    bus.on('level:complete', ({ nextLevelId }) => notify.toast?.(nextLevelId ? 'Nivel complet! Se încarcă următoarea zonă.' : 'Aventura este completă!')),
    bus.on('pickup', ({ item }) => { notify.inventory?.(getInventorySnapshot()); notify.toast?.(`${item.name} colectat`); }),
    bus.on('ui:treasure', ({ treasure }) => notify.toast?.(`Comoară deschisă: ${treasure.item}`)),
    bus.on('ui:secret', () => notify.toast?.('Secret descoperit!')),
    bus.on('ui:gate', () => notify.toast?.('Poartă deblocată!')),
    bus.on('save', ({ kind }) => { notify.continueAvailability?.(storage.has()); notify.toast?.(`${kind} complet`); }),
    bus.on('debug:changed', ({ enabled }) => notify.debug?.(enabled)),
  ];
  const api = {
    newGame() { storage.clear(); launch(null); game.setPaused(false); notify.paused?.(false); notify.panel?.(null); notify.continueAvailability?.(false); },
    continueGame() { const save = storage.load(); if (!save) return; launch(save); game.setPaused(false); notify.paused?.(false); notify.panel?.(null); },
    pauseGame() { game.setPaused(true); notify.paused?.(true); notify.panel?.('pause'); },
    resumeGame() { game.setPaused(false); notify.paused?.(false); notify.panel?.(null); },
    manualSave() { saveManager.manualSave(); notify.continueAvailability?.(storage.has()); },
    returnToMenu() { game.setPaused(true); notify.paused?.(true); notify.panel?.('menu'); },
    setMusicVolume(value) { volume.set('music', value); music.sync(); notify.settings?.(settings()); },
    setSfxVolume(value) { volume.set('sfx', value); notify.settings?.(settings()); },
    setDebugEnabled(value) { if (scene) scene.debug = value; notify.debug?.(value); },
    getInventorySnapshot,
    getSkillsSnapshot,
    unlockSkill(id) { if (!skills.unlock(id)) return false; scene?.player.applySkillEffects(); notify.skills?.(getSkillsSnapshot()); return true; },
    destroy() { subscriptions.forEach(unsubscribe => unsubscribe()); saveManager.destroy(); music.destroy(); game.stop(); input.destroy(); scenes.destroy(); },
  };
  game.setPaused(true);
  game.start();
  return { api, storage, settings };
}

export function useTimedToast(duration = 1800) {
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState('');
  const showToast = useCallback(message => {
    setToast(message);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), duration);
  }, [duration]);
  useEffect(() => () => clearTimeout(toastTimerRef.current), []);
  return { toast, showToast };
}

export function useGameRuntime(canvasRef) {
  const runtimeRef = useRef(null);
  const returnPanelRef = useRef('menu');
  const [activePanel, setActivePanel] = useState('menu');
  const [paused, setPaused] = useState(true);
  const [canContinue, setCanContinue] = useState(false);
  const [music, setMusic] = useState(.5);
  const [sfx, setSfx] = useState(.7);
  const [debug, setDebug] = useState(false);
  const [inventory, setInventory] = useState(EMPTY_INVENTORY);
  const [skills, setSkills] = useState({ unlocked: [], points: 0 });
  const { toast, showToast } = useTimedToast();

  useEffect(() => {
    const runtime = createGameRuntime(canvasRef.current, {
      panel: setActivePanel,
      paused: setPaused,
      continueAvailability: setCanContinue,
      settings: values => { setMusic(values.music); setSfx(values.sfx); setDebug(values.debug); },
      debug: setDebug,
      inventory: setInventory,
      skills: setSkills,
      toast: showToast,
    });
    runtimeRef.current = runtime;
    setCanContinue(runtime.storage.has());
    return () => {
      runtime.api.destroy();
      runtimeRef.current = null;
    };
  }, [canvasRef, showToast]);

  const call = useCallback((method, ...args) => runtimeRef.current?.api[method](...args), []);
  const setMusicVolume = useCallback(value => call('setMusicVolume', value), [call]);
  const setSfxVolume = useCallback(value => call('setSfxVolume', value), [call]);
  const setDebugEnabled = useCallback(value => call('setDebugEnabled', value), [call]);
  const handleAction = useCallback(action => {
    if (action === 'new') call('newGame');
    if (action === 'continue') call('continueGame');
    if (action === 'pause') call('pauseGame');
    if (action === 'resume') call('resumeGame');
    if (action === 'save') call('manualSave');
    if (action === 'menu') call('returnToMenu');
    if (action === 'settings' || action === 'credits') { returnPanelRef.current = activePanel || (paused ? 'pause' : 'menu'); setActivePanel(action); }
    if (action === 'inventory') { returnPanelRef.current = 'pause'; setInventory(runtimeRef.current?.api.getInventorySnapshot() || EMPTY_INVENTORY); setActivePanel('inventory'); }
    if (action === 'skills') { returnPanelRef.current = 'pause'; setSkills(runtimeRef.current?.api.getSkillsSnapshot() || { unlocked: [], points: 0 }); setActivePanel('skills'); }
    if (action === 'back') setActivePanel(returnPanelRef.current);
  }, [activePanel, call, paused]);

  const unlockSkill = useCallback(id => call('unlockSkill', id), [call]);
  return { activePanel, paused, canContinue, music, sfx, debug, inventory, skills, toast, actions: { handleAction, unlockSkill, setMusicVolume, setSfxVolume, setDebugEnabled } };
}
