import { describe, expect, it, vi } from 'vitest';
import { LEVEL_ORDER, LEVELS } from '../data/levels.js';
import { SaveManager } from '../save/SaveManager.js';
import { EventBus } from './EventBus.js';
import { PlayScene } from './PlayScene.js';

const context = new Proxy({}, { get: target => target.value || (target.value = vi.fn()) });
const canvas = { width: 1280, height: 720, getContext: () => context };
const input = { isDown: () => false, wasPressed: () => false };
const assets = { loadBiome: vi.fn() };
const music = { play: vi.fn() };

function createScene(saveData = null, bus = new EventBus()) {
  return { bus, scene: new PlayScene({ canvas, input, bus, music, assets, saveData }) };
}

describe('level progression', () => {
  it('declares exits that follow the campaign scene order', () => {
    expect(Object.keys(LEVELS)).toEqual(LEVEL_ORDER);
    LEVEL_ORDER.forEach((id, index) => {
      expect(LEVELS[id].exit).toMatchObject({
        x: LEVELS[id].width - 120,
        y: 430,
        w: 80,
        h: 180,
        nextLevelId: LEVEL_ORDER[index + 1] ?? null,
      });
    });
  });

  it('transitions once on exit entry and preserves player progress at the new spawn', () => {
    const { bus, scene } = createScene();
    const completed = vi.fn();
    bus.on('level:complete', completed);
    Object.assign(scene.player, { x: scene.level.exit.x, y: scene.level.exit.y, hp: 73, xp: 45, gold: 9, crystals: 2, keys: 1 });

    scene.update(0);

    expect(completed).toHaveBeenCalledOnce();
    expect(completed).toHaveBeenCalledWith({ fromLevelId: 'verdant-01', nextLevelId: 'verdant-02' });
    expect(scene.levelId).toBe('verdant-02');
    expect({ x: scene.player.x, y: scene.player.y }).toEqual(LEVELS['verdant-02'].spawn);
    expect(scene.player).toMatchObject({ hp: 73, xp: 45, gold: 9, crystals: 2, keys: 1 });
  });

  it('emits a terminal completion only once while the player remains inside the last exit', () => {
    const { bus, scene } = createScene({ levelId: 'citadel-boss' });
    const completed = vi.fn();
    bus.on('level:complete', completed);
    Object.assign(scene.player, { x: scene.level.exit.x, y: scene.level.exit.y });

    scene.updateExit();
    scene.updateExit();

    expect(scene.levelId).toBe('citadel-boss');
    expect(completed).toHaveBeenCalledOnce();
    expect(completed).toHaveBeenCalledWith({ fromLevelId: 'citadel-boss', nextLevelId: null });
  });

  it('restores the saved scene and checkpoint', () => {
    const checkpoint = { x: 1770, y: 440 };
    const { scene } = createScene({ levelId: 'verdant-02', checkpoint, stats: { hp: 61 }, collectibles: { crystals: 4, keys: 2 } });

    expect(scene.levelId).toBe('verdant-02');
    expect(scene.player).toMatchObject({ x: checkpoint.x, y: checkpoint.y, hp: 61, crystals: 4, keys: 2 });
  });

  it('auto-saves the destination scene and its spawn after a transition', () => {
    const bus = new EventBus();
    const storage = { save: vi.fn() };
    const saveManager = new SaveManager(storage, bus);
    const { scene } = createScene(null, bus);
    const inventory = { serialize: () => ({}), equipment: {} };
    const skills = { unlocked: [] };
    saveManager.bind(() => ({ player: scene.player, levelId: scene.levelId, checkpoint: scene.checkpoints.find(checkpoint => checkpoint.active) || scene.level.spawn, inventory, skills, settings: {} }));
    Object.assign(scene.player, { x: scene.level.exit.x, y: scene.level.exit.y });

    scene.update(0);

    expect(storage.save).toHaveBeenCalledOnce();
    expect(storage.save.mock.calls[0][0]).toMatchObject({ levelId: 'verdant-02', checkpoint: LEVELS['verdant-02'].spawn });
  });
});

describe('interactive level zones', () => {
  it('applies hazard damage only once during invulnerability frames', () => {
    const { scene } = createScene();
    const hazard = scene.hazards.find(zone => !zone.respawn);
    Object.assign(scene.player, { x: hazard.x, y: hazard.y, hp: 100 });

    scene.updateZones();
    scene.updateZones();

    expect(scene.player.hp).toBe(100 - hazard.damage);
    expect(scene.player.invulnerable).toBe(1);
  });

  it('respawns the player after entering a respawn hazard', () => {
    const { scene } = createScene();
    const pit = scene.hazards.find(zone => zone.respawn);
    Object.assign(scene.player, { x: pit.x, y: pit.y });

    scene.updateZones();

    expect({ x: scene.player.x, y: scene.player.y }).toEqual(scene.level.spawn);
    expect(scene.player.hp).toBe(scene.player.maxHp);
  });

  it('opens a treasure only once and emits one UI event', () => {
    const { bus, scene } = createScene();
    const opened = vi.fn();
    bus.on('ui:treasure', opened);
    const treasure = scene.treasures[0];
    Object.assign(scene.player, { x: treasure.x, y: treasure.y });

    scene.updateZones();
    scene.updateZones();

    expect(opened).toHaveBeenCalledOnce();
    expect(scene.inventory.quest['verdant-sigil']).toBe(1);
    expect(scene.serializeZoneState().openedTreasures).toContain('ruin-relic');
  });

  it('unlocks a gate only when the exact required quest item is present', () => {
    const { bus, scene } = createScene();
    const unlocked = vi.fn();
    bus.on('ui:gate', unlocked);
    const gate = scene.conditionalZones[0];
    Object.assign(scene.player, { x: gate.x, y: gate.y });
    scene.inventory.add({ name: 'some-other-relic', category: 'quest' });

    scene.updateZones();
    expect(gate.unlocked).toBe(false);

    scene.inventory.add({ name: gate.requires, category: 'quest' });
    scene.updateZones();
    expect(gate.unlocked).toBe(true);
    expect(unlocked).toHaveBeenCalledOnce();
  });

  it('restores opened treasures, discovered secrets, and unlocked gates from a save', () => {
    const { scene } = createScene({
      levelId: 'verdant-01',
      openedTreasures: ['ruin-relic'],
      discoveredSecrets: ['root-cache'],
      unlockedGates: ['verdant-gate'],
    });

    expect(scene.treasures[0].opened).toBe(true);
    expect(scene.secrets[0].discovered).toBe(true);
    expect(scene.conditionalZones[0].unlocked).toBe(true);
  });

  it('persists interactive zone state through SaveManager payloads', () => {
    const bus = new EventBus();
    const storage = { save: vi.fn() };
    const saveManager = new SaveManager(storage, bus);
    const { scene } = createScene(null, bus);
    const inventory = scene.inventory;
    const skills = { unlocked: [] };
    scene.zoneState.openedTreasures.add('ruin-relic');
    scene.zoneState.discoveredSecrets.add('root-cache');
    scene.zoneState.unlockedGates.add('verdant-gate');
    saveManager.bind(() => ({ player: scene.player, levelId: scene.levelId, checkpoint: scene.level.spawn, inventory, skills, settings: {}, zoneState: scene.serializeZoneState() }));

    saveManager.manualSave();

    expect(storage.save).toHaveBeenCalledWith(expect.objectContaining({
      openedTreasures: ['ruin-relic'],
      discoveredSecrets: ['root-cache'],
      unlockedGates: ['verdant-gate'],
    }));
  });
});
