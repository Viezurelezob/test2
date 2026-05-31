import { LEVELS } from '../data/levels.js';
import { overlaps } from '../physics/AABB.js';
import { BIOMES } from '../data/biomes.js';
import { BOSSES, ENEMIES } from '../data/enemies.js';
import { Player } from '../gameplay/player/Player.js';
import { BossFSM } from '../gameplay/enemies/BossFSM.js';
import { EnemyFSM } from '../gameplay/enemies/EnemyFSM.js';
import { ProjectilePool } from '../gameplay/combat/ProjectilePool.js';
import { PickupPool } from '../gameplay/collectibles/PickupPool.js';
import { Inventory } from '../gameplay/inventory/Inventory.js';
import { canUnlock, openTreasure } from '../gameplay/inventory/Unlocks.js';
import { ParticlePool } from '../rendering/Particles.js';
import { Camera } from '../rendering/Camera.js';
import { Renderer } from '../rendering/Renderer.js';
import { drawParallax } from '../rendering/Parallax.js';
import { drawWeather } from '../rendering/Weather.js';
import { drawCheckpoint, updateCheckpoints } from '../gameplay/checkpoints/Checkpoint.js';
import { drawHUD } from '../ui/HUD.js';

const zoneSet = values => new Set(values || []);

export class PlayScene {
  constructor({ canvas, input, bus, music, assets, inventory = new Inventory(), skills, saveData = null }) {
    Object.assign(this, { canvas, input, bus, music, assets, inventory, skills, debug: false, time: 0, collisionCount: 0 });
    this.camera = new Camera(canvas.width, canvas.height);
    this.renderer = new Renderer(canvas.getContext('2d'), this.camera);
    this.particles = new ParticlePool();
    this.projectiles = new ProjectilePool();
    this.pickups = new PickupPool(bus, this.particles, inventory);
    this.zoneState = {
      openedTreasures: zoneSet(saveData?.openedTreasures),
      discoveredSecrets: zoneSet(saveData?.discoveredSecrets),
      unlockedGates: zoneSet(saveData?.unlockedGates),
    };
    this.load(saveData?.levelId || 'verdant-01', saveData);
  }

  load(levelId, save) {
    this.levelId = levelId;
    this.level = structuredClone(LEVELS[levelId]);
    this.biome = BIOMES[this.level.biome];
    this.tiles = this.level.platforms.map(([x, y, w, h]) => ({ x, y, w, h }));
    this.checkpoints = this.level.checkpoints;
    this.hazards = this.level.hazards || [];
    this.treasures = this.level.treasures || [];
    this.secrets = this.level.secrets || [];
    this.conditionalZones = this.level.conditionalZones || [];
    this.treasures.forEach(zone => { zone.opened = this.zoneState.openedTreasures.has(zone.id); });
    this.secrets.forEach(zone => { zone.discovered = this.zoneState.discoveredSecrets.has(zone.id); });
    this.conditionalZones.forEach(zone => { zone.unlocked = this.zoneState.unlockedGates.has(zone.id); });
    const spawn = save?.checkpoint || this.level.spawn;
    this.player = new Player(spawn.x, spawn.y, this.bus, this.projectiles, this.particles, this.skills, this.inventory);
    if (save) Object.assign(this.player, save.stats, save.collectibles);
    this.player.applySkillEffects();
    this.enemies = this.level.enemies.map(enemy => new EnemyFSM(enemy.x, enemy.y, ENEMIES[enemy.type], this.bus, this.particles));
    const boss = this.level.boss;
    this.boss = boss ? new BossFSM(boss.x, boss.y, BOSSES[boss.config], this.bus, this.particles) : null;
    this.bossDefeated = false;
    if (this.boss) {
      this.bus.emit('boss:spawned', { boss: this.boss });
      this.bus.emit('hud:boss', { boss: this.boss, visible: true });
    }
    this.pickups.load(this.level.pickups);
    this.camera.setBounds(this.level.width, this.level.height);
    this.assets.loadBiome(this.biome);
    this.music.play(this.biome.music);
    this.exitEntered = false;
  }

  enter() { this.bus.emit('scene:entered', { id: this.levelId }); }

  respawn() {
    const active = this.checkpoints.find(checkpoint => checkpoint.active);
    const spawn = active || this.level.spawn;
    this.player.reset(spawn.x, spawn.y);
    this.bus.emit('save', { kind: 'Respawn' });
  }

  serializeZoneState() {
    return Object.fromEntries(Object.entries(this.zoneState).map(([key, values]) => [key, [...values]]));
  }

  update(dt) {
    this.transitionedThisFrame = false;
    this.time += dt;
    if (this.input.wasPressed('pause')) this.bus.emit('ui:pause');
    if (this.input.wasPressed('debug')) {
      this.debug = !this.debug;
      this.bus.emit('debug:changed', { enabled: this.debug });
    }
    const combatTargets = this.boss && !this.boss.dead ? [...this.enemies, this.boss] : this.enemies;
    this.player.update(this.input, this.tiles, combatTargets, dt);
    this.enemies.forEach(enemy => enemy.update(this.player, this.tiles, dt));
    this.enemies = this.enemies.filter(enemy => !enemy.dead);
    this.boss?.update(this.player, this.tiles, dt);
    if (this.boss?.state === 'dead' && !this.bossDefeated) this.completeBoss();
    this.projectiles.update(dt, this.tiles, combatTargets, this.particles);
    this.pickups.update(this.player, dt);
    this.particles.update(dt);
    updateCheckpoints(this.player, this.checkpoints, this.bus);
    this.updateZones();
    this.camera.follow(this.player, dt);
    this.collisionCount = this.tiles.length;
    this.updateExit();
  }

  completeBoss() {
    this.bossDefeated = true;
    this.particles.spawn(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, this.boss.config.hitColor, 42);
    this.bus.emit('hud:boss', { boss: this.boss, visible: false });
    this.bus.emit('feedback:boss-victory', { boss: this.boss, levelId: this.levelId });
    this.bus.emit('save', { kind: 'Boss victory', levelId: this.levelId });
  }

  updateZones() {
    for (const zone of this.hazards) {
      if (!overlaps(this.player, zone)) continue;
      const damaged = this.player.damage(zone.damage || 1, zone.knockback || 0);
      if (damaged && zone.respawn && overlaps(this.player, zone)) this.respawn();
    }
    for (const zone of this.treasures) {
      if (!zone.opened && overlaps(this.player, zone) && openTreasure(zone, this.inventory)) {
        this.zoneState.openedTreasures.add(zone.id);
        this.bus.emit('ui:treasure', { treasure: zone });
      }
    }
    for (const zone of this.secrets) {
      if (!zone.discovered && overlaps(this.player, zone)) {
        zone.discovered = true;
        this.zoneState.discoveredSecrets.add(zone.id);
        this.bus.emit('ui:secret', { secret: zone });
      }
    }
    for (const zone of this.conditionalZones) {
      if (!zone.unlocked && overlaps(this.player, zone) && canUnlock(this.inventory, zone.requires)) {
        zone.unlocked = true;
        this.zoneState.unlockedGates.add(zone.id);
        this.bus.emit('ui:gate', { gate: zone });
      }
    }
  }

  updateExit() {
    const exit = this.level.exit;
    if (!exit || !overlaps(this.player, exit)) { this.exitEntered = false; return; }
    if (this.transitionedThisFrame || this.exitEntered) return;
    if (this.boss && !this.bossDefeated) {
      this.exitEntered = true;
      this.bus.emit('boss:exit-blocked', { boss: this.boss, levelId: this.levelId });
      return;
    }
    this.transitionedThisFrame = true;
    this.exitEntered = true;
    const fromLevelId = this.levelId;
    if (exit.nextLevelId) {
      const progress = {
        stats: { hp: this.player.hp, maxHp: this.player.maxHp, energy: this.player.energy, maxEnergy: this.player.maxEnergy, xp: this.player.xp, level: this.player.level, gold: this.player.gold },
        collectibles: { crystals: this.player.crystals, keys: this.player.keys },
      };
      this.load(exit.nextLevelId, progress);
      this.bus.emit('scene:entered', { id: this.levelId });
    }
    this.bus.emit('level:complete', { fromLevelId, nextLevelId: exit.nextLevelId });
  }

  render(ctx) {
    drawParallax(ctx, this.camera, this.biome, this.canvas.width, this.canvas.height);
    drawWeather(ctx, this.biome.weather, this.time, this.canvas.width, this.canvas.height);
    this.renderer.world(world => {
      for (const tile of this.tiles) {
        world.fillStyle = '#264c3e'; world.fillRect(tile.x, tile.y, tile.w, tile.h);
        world.fillStyle = '#5a8e59'; world.fillRect(tile.x, tile.y, tile.w, 8);
      }
      this.drawZones(world);
      this.checkpoints.forEach(checkpoint => drawCheckpoint(world, checkpoint));
      this.drawExit(world);
      this.pickups.draw(world);
      this.enemies.forEach(enemy => enemy.draw(world));
      this.boss?.draw(world);
      this.projectiles.draw(world);
      this.player.draw(world);
      this.particles.draw(world);
    });
    drawHUD(ctx, this.player, this.level);
    if (this.debug) this.drawDebug(ctx);
  }

  drawZones(ctx) {
    const draw = (zones, fillStyle, strokeStyle, include = () => true) => zones.filter(include).forEach(({ x, y, w, h }) => {
      ctx.fillStyle = fillStyle; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = strokeStyle; ctx.lineWidth = 3; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    });
    draw(this.hazards, '#ff554455', '#ff756b');
    draw(this.treasures, '#ffd76b55', '#ffe89d', zone => !zone.opened);
    draw(this.secrets, '#78f9df33', '#78f9df', zone => !zone.discovered);
    draw(this.conditionalZones, '#bd8cff55', '#d8b8ff', zone => !zone.unlocked);
  }

  drawExit(ctx) {
    const { x, y, w, h, nextLevelId } = this.level.exit;
    const locked = this.boss && !this.bossDefeated;
    ctx.save(); ctx.fillStyle = locked ? '#ff6e6844' : nextLevelId ? '#9cffc844' : '#ffe08a44'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = locked ? '#ff6e68' : nextLevelId ? '#b9ffda' : '#ffe08a'; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); ctx.restore();
  }

  drawDebug(ctx) {
    ctx.save(); ctx.fillStyle = '#07151add'; ctx.fillRect(1040, 620, 220, 76); ctx.fillStyle = '#b9ffda'; ctx.font = '15px monospace';
    ctx.fillText(`entities: ${1 + this.enemies.length + (this.boss && !this.boss.dead ? 1 : 0)}`, 1055, 645); ctx.fillText(`particles: ${this.particles.activeCount}`, 1055, 665); ctx.fillText(`collision tiles: ${this.collisionCount}`, 1055, 685); ctx.restore();
  }
}
