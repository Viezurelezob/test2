import { describe, expect, it, vi } from 'vitest';
import { LEVEL_ORDER, LEVELS } from '../data/levels.js';
import { BOSSES, ENEMIES } from '../data/enemies.js';
import { ITEMS } from '../data/items.js';
import { SkillTree } from '../gameplay/skills/SkillTree.js';
import { Inventory } from '../gameplay/inventory/Inventory.js';
import { applyPowerUp } from '../gameplay/player/PowerUps.js';
import { SaveManager } from '../save/SaveManager.js';
import { EventBus } from './EventBus.js';
import { PlayScene } from './PlayScene.js';

const context = new Proxy({}, { get: target => target.value || (target.value = vi.fn()) });
const canvas = { width: 1280, height: 720, getContext: () => context };
const input = { isDown: () => false, wasPressed: () => false };
const assets = { loadBiome: vi.fn() };
const music = { play: vi.fn() };

function createScene(saveData = null, bus = new EventBus(), skills = new SkillTree(saveData?.skills?.unlocked, saveData?.skills?.points)) {
  return { bus, scene: new PlayScene({ canvas, input, bus, music, assets, skills, saveData }) };
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

  it('configures every normal level with traversal, interactive zones, and biome enemies', () => {
    const normalLevels = LEVEL_ORDER.filter(id => !id.endsWith('-boss'));
    normalLevels.forEach(id => {
      const level = LEVELS[id];
      const enemyTypes = new Set(level.enemies.map(enemy => enemy.type));
      expect(level.platforms.length, `${id} platforms`).toBeGreaterThanOrEqual(8);
      expect(new Set(level.platforms.map(([, y]) => y)).size, `${id} vertical routes`).toBeGreaterThanOrEqual(4);
      expect(level.checkpoints.length, `${id} checkpoints`).toBeGreaterThan(0);
      expect(level.hazards.length, `${id} hazards`).toBeGreaterThan(0);
      expect(level.pickups.length, `${id} pickups`).toBeGreaterThan(0);
      expect(level.secrets.length, `${id} secrets`).toBeGreaterThan(0);
      expect(level.treasures.length, `${id} treasures`).toBeGreaterThan(0);
      expect(enemyTypes.size, `${id} enemy variety`).toBeGreaterThanOrEqual(2);
      level.enemies.forEach(enemy => expect(ENEMIES[enemy.type], `${id} enemy ${enemy.type}`).toBeDefined());
      level.pickups.forEach(pickup => expect(ITEMS[pickup.type], `${id} pickup ${pickup.type}`).toBeDefined());
      level.treasures.forEach(treasure => expect(ITEMS[treasure.item], `${id} treasure ${treasure.item}`).toBeDefined());
      level.conditionalZones.forEach(gate => expect(level.treasures.some(treasure => treasure.item === gate.requires), `${id} gate ${gate.id}`).toBe(true));
    });
  });

  it('keeps each normal level spawn, checkpoints, and generated exit on traversable ground', () => {
    const standsOnPlatform = (level, point) => level.platforms.some(([x, y, w]) => point.x >= x && point.x <= x + w && [point.y, point.y + 58, point.y + (point.h || 0)].some(bottom => bottom <= y && y - bottom <= 130));
    LEVEL_ORDER.filter(id => !id.endsWith('-boss')).forEach(id => {
      const level = LEVELS[id];
      expect(standsOnPlatform(level, level.spawn), `${id} spawn`).toBe(true);
      level.checkpoints.forEach(checkpoint => expect(standsOnPlatform(level, checkpoint), `${id} checkpoint ${checkpoint.id}`).toBe(true));
      expect(standsOnPlatform(level, level.exit), `${id} exit`).toBe(true);
    });
  });

  it('transitions through every adjacent level pair in campaign order', () => {
    LEVEL_ORDER.slice(0, -1).forEach((id, index) => {
      const { bus, scene } = createScene({ levelId: id });
      const completed = vi.fn();
      bus.on('level:complete', completed);
      Object.assign(scene.player, { x: scene.level.exit.x, y: scene.level.exit.y });
      if (scene.boss) scene.bossDefeated = true;

      scene.updateExit();

      const nextLevelId = LEVEL_ORDER[index + 1];
      expect(scene.levelId).toBe(nextLevelId);
      expect({ x: scene.player.x, y: scene.player.y }).toEqual(LEVELS[nextLevelId].spawn);
      expect(completed).toHaveBeenCalledWith({ fromLevelId: id, nextLevelId });
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
    scene.bossDefeated = true;

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
    const skills = { unlocked: [], points: 0 };
    saveManager.bind(() => ({ player: scene.player, levelId: scene.levelId, checkpoint: scene.checkpoints.find(checkpoint => checkpoint.active) || scene.level.spawn, inventory, skills, settings: {} }));
    Object.assign(scene.player, { x: scene.level.exit.x, y: scene.level.exit.y });

    scene.update(0);

    expect(storage.save).toHaveBeenCalledOnce();
    expect(storage.save.mock.calls[0][0]).toMatchObject({ levelId: 'verdant-02', checkpoint: LEVELS['verdant-02'].spawn });
  });
});


describe('skill progression', () => {
  it('persists unlocked skills and available points in save payloads', () => {
    const bus = new EventBus();
    const storage = { save: vi.fn() };
    const saveManager = new SaveManager(storage, bus);
    const skills = new SkillTree(['fleet-foot'], 3);
    const { scene } = createScene(null, bus, skills);
    saveManager.bind(() => ({ player: scene.player, levelId: scene.levelId, checkpoint: scene.level.spawn, inventory: scene.inventory, skills, settings: {} }));

    saveManager.manualSave();

    expect(storage.save).toHaveBeenCalledWith(expect.objectContaining({ skills: { unlocked: ['fleet-foot'], points: 3 } }));
  });

  it('restores unlocked skills and available points from saved progress', () => {
    const { scene } = createScene({ skills: { unlocked: ['rooted-heart'], points: 3 } });

    expect(scene.skills.serialize()).toEqual({ unlocked: ['rooted-heart'], points: 3 });
    expect(scene.player).toMatchObject({ maxHp: 120, hp: 120 });
  });

  it('restores and applies every unlocked skill effect to the player', () => {
    const skills = new SkillTree(['fleet-foot', 'air-dancer', 'keen-edge', 'aether-quiver', 'rooted-heart', 'lasting-spark'], 4);
    const { scene } = createScene(null, new EventBus(), skills);
    const enemy = { x: scene.player.x + scene.player.w, y: scene.player.y + 8, w: 30, h: 42, state: 'idle', hurt: vi.fn() };
    scene.player.melee([enemy]);
    scene.player.projectiles.spawn(0, 0, 1, scene.player.projectileDamage);
    applyPowerUp(scene.player, { effect: { type: 'damage', multiplier: 2, duration: 8 } });

    expect(scene.player).toMatchObject({ sprintSpeed: 385, doubleJump: true, meleeDamage: 30, projectileDamage: 20, maxHp: 120, hp: 120, powerupDuration: 1.25 });
    expect(enemy.hurt).toHaveBeenCalledWith(30, 1);
    expect(scene.player.projectiles.items.find(projectile => projectile.active).damage).toBe(20);
    expect(scene.player.powerups[0].remaining).toBe(10);
  });

  it('applies equipped item stats and active consumable damage boosts', () => {
    const inventory = new Inventory();
    inventory.add('ember-charm');
    inventory.add('windglass-cloak');
    inventory.equipCharm('ember-charm');
    inventory.equipCloak('windglass-cloak');
    const player = new PlayScene({ canvas, input, bus: new EventBus(), music, assets, inventory, skills: new SkillTree() }).player;
    player.useConsumable(ITEMS['ember-tonic']);
    const enemy = { x: player.x + player.w, y: player.y + 8, w: 30, h: 42, state: 'idle', hurt: vi.fn() };

    player.melee([enemy]);

    expect(player).toMatchObject({ meleeDamage: 27, powerupDuration: 1.25 });
    expect(player.powerups[0].remaining).toBe(10);
    expect(enemy.hurt).toHaveBeenCalledWith(40.5, 1);
  });

  it('allows a second airborne jump only after Air Dancer is unlocked', () => {
    const particles = { spawn: vi.fn() };
    const pressJump = { isDown: () => false, wasPressed: action => action === 'jump' };
    const withoutSkill = createScene().scene.player;
    withoutSkill.particles = particles;
    withoutSkill.jumps = 1;
    withoutSkill.update(pressJump, [], [], 0);
    expect(withoutSkill.jumps).toBe(1);

    const withSkill = createScene(null, new EventBus(), new SkillTree(['fleet-foot', 'air-dancer'])).scene.player;
    withSkill.particles = particles;
    withSkill.jumps = 1;
    withSkill.update(pressJump, [], [], 0);
    expect(withSkill.jumps).toBe(2);
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
    expect(scene.inventory.relics['verdant-sigil']).toBe(1);
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
    const skills = { unlocked: [], points: 0 };
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


describe('boss arenas', () => {
  it('spawns each configured boss at its arena position with collision dimensions', () => {
    LEVEL_ORDER.filter(id => id.endsWith('-boss')).forEach(id => {
      const { scene } = createScene({ levelId: id });
      const configuredBoss = LEVELS[id].boss;

      expect(scene.boss).toMatchObject({ x: configuredBoss.x, y: configuredBoss.y, state: 'idle', phase: 1 });
      expect(scene.boss.config).toBe(BOSSES[configuredBoss.config]);
      expect(scene.boss.w).toBeGreaterThan(0);
      expect(scene.boss.h).toBeGreaterThan(0);
    });
  });

  it('changes boss phases at the configured health thresholds', () => {
    const { bus, scene } = createScene({ levelId: 'verdant-boss' });
    const phaseChanged = vi.fn();
    bus.on('boss:phase', phaseChanged);

    scene.boss.hurt(scene.boss.maxHp * 0.35);
    expect(scene.boss.phase).toBe(2);
    scene.boss.hurt(scene.boss.maxHp * 0.34);

    expect(scene.boss.phase).toBe(3);
    expect(phaseChanged).toHaveBeenNthCalledWith(1, { boss: scene.boss, phase: 2 });
    expect(phaseChanged).toHaveBeenNthCalledWith(2, { boss: scene.boss, phase: 3 });
  });

  it('blocks the arena exit until its boss is defeated', () => {
    const { bus, scene } = createScene({ levelId: 'verdant-boss' });
    const blocked = vi.fn();
    const completed = vi.fn();
    bus.on('boss:exit-blocked', blocked);
    bus.on('level:complete', completed);
    Object.assign(scene.player, { x: scene.level.exit.x, y: scene.level.exit.y });

    scene.updateExit();

    expect(scene.levelId).toBe('verdant-boss');
    expect(blocked).toHaveBeenCalledOnce();
    expect(completed).not.toHaveBeenCalled();
  });

  it('unlocks progression and emits HUD, feedback, and save events after boss victory', () => {
    const { bus, scene } = createScene({ levelId: 'verdant-boss' });
    const hud = vi.fn();
    const feedback = vi.fn();
    const save = vi.fn();
    const completed = vi.fn();
    bus.on('hud:boss', hud);
    bus.on('feedback:boss-victory', feedback);
    bus.on('save', save);
    bus.on('level:complete', completed);
    scene.boss.hurt(scene.boss.maxHp);

    scene.update(0);
    expect(scene.bossDefeated).toBe(true);
    Object.assign(scene.player, { x: scene.level.exit.x, y: scene.level.exit.y });
    scene.updateExit();

    // Loading the next non-boss level resets arena-specific victory state.
    expect(scene.bossDefeated).toBe(false);
    expect(scene.levelId).toBe('grotto-01');
    expect(hud).toHaveBeenCalledWith(expect.objectContaining({ visible: false }));
    expect(feedback).toHaveBeenCalledWith(expect.objectContaining({ levelId: 'verdant-boss' }));
    expect(save).toHaveBeenCalledWith({ kind: 'Boss victory', levelId: 'verdant-boss' });
    expect(completed).toHaveBeenCalledWith({ fromLevelId: 'verdant-boss', nextLevelId: 'grotto-01' });
  });
});
