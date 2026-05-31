import { LEVELS } from '../data/levels.js';
import { BIOMES } from '../data/biomes.js';
import { ENEMIES } from '../data/enemies.js';
import { BOSSES } from '../data/bosses.js';
import { Player } from '../gameplay/player/Player.js';
import { EnemyFSM } from '../gameplay/enemies/EnemyFSM.js';
import { BossFSM } from '../gameplay/enemies/BossFSM.js';
import { ProjectilePool } from '../gameplay/combat/ProjectilePool.js';
import { PickupPool } from '../gameplay/collectibles/PickupPool.js';
import { ParticlePool } from '../rendering/Particles.js';
import { Camera } from '../rendering/Camera.js';
import { Renderer } from '../rendering/Renderer.js';
import { drawParallax } from '../rendering/Parallax.js';
import { drawWeather } from '../rendering/Weather.js';
import { drawCheckpoint, updateCheckpoints } from '../gameplay/checkpoints/Checkpoint.js';
import { overlaps } from '../physics/AABB.js';
import { drawHUD } from '../ui/HUD.js';

export class PlayScene {
  constructor({ canvas, input, bus, music, assets, saveData = null }) {
    Object.assign(this, { canvas, input, bus, music, assets, debug: false, time: 0, collisionCount: 0 });
    this.camera = new Camera(canvas.width, canvas.height);
    this.renderer = new Renderer(canvas.getContext('2d'), this.camera);
    this.particles = new ParticlePool();
    this.projectiles = new ProjectilePool();
    this.pickups = new PickupPool(bus, this.particles);
    this.load(saveData?.levelId || 'verdant-01', saveData);
  }

  load(levelId, save = null) {
    this.levelId = levelId;
    this.level = structuredClone(LEVELS[levelId]);
    this.biome = BIOMES[this.level.biome];
    this.tiles = this.level.platforms.map(([x, y, w, h]) => ({ x, y, w, h }));
    this.checkpoints = this.level.checkpoints;
    const spawn = save?.checkpoint || this.level.spawn;
    this.player = new Player(spawn.x, spawn.y, this.bus, this.projectiles, this.particles);
    if (save) Object.assign(this.player, save.stats, save.collectibles);
    this.enemies = this.level.enemies.map(enemy => new EnemyFSM(enemy.x, enemy.y, ENEMIES.mossling, this.bus, this.particles));
    const bossConfig = BOSSES[this.level.boss];
    this.boss = bossConfig ? new BossFSM(bossConfig.position.x, bossConfig.position.y, bossConfig, this.bus, this.particles) : null;
    this.arenaExit = this.level.exit ? { ...this.level.exit, locked: Boolean(this.boss) } : null;
    this.pickups.load(this.level.pickups);
    this.camera.setBounds(this.level.width, this.level.height);
    this.assets.loadBiome(this.biome);
    this.music.play(this.biome.music);
  }

  enter() {
    this.bus.emit('scene:entered', { id: this.levelId });
  }

  respawn() {
    const active = this.checkpoints.find(checkpoint => checkpoint.active);
    const spawn = active || this.level.spawn;
    this.player.reset(spawn.x, spawn.y);
    this.bus.emit('save', { kind: 'Respawn' });
  }

  combatTargets() {
    return this.boss && !this.boss.dead ? [...this.enemies, this.boss] : this.enemies;
  }

  unlockArenaExit() {
    if (!this.arenaExit?.locked || !this.boss?.dead) return;
    this.arenaExit.locked = false;
    this.bus.emit('arena:exit:unlocked', { boss: this.boss, exit: this.arenaExit });
  }

  continueThroughArenaExit() {
    if (!this.arenaExit || this.arenaExit.locked || !overlaps(this.player, this.arenaExit)) return;
    const completedLevelId = this.levelId;
    const { nextLevelId } = this.arenaExit;
    this.load(nextLevelId);
    this.bus.emit('level:complete', { id: completedLevelId, nextLevelId });
    this.enter();
  }

  update(dt) {
    this.time += dt;
    if (this.input.wasPressed('pause')) this.bus.emit('ui:pause');
    if (this.input.wasPressed('debug')) {
      this.debug = !this.debug;
      this.bus.emit('debug:changed', { enabled: this.debug });
    }
    const targets = this.combatTargets();
    this.player.update(this.input, this.tiles, targets, dt);
    this.enemies.forEach(enemy => enemy.update(this.player, this.tiles, dt));
    this.enemies = this.enemies.filter(enemy => !enemy.dead);
    this.boss?.update(this.player, this.tiles, dt);
    this.projectiles.update(dt, this.tiles, this.combatTargets(), this.particles);
    this.unlockArenaExit();
    this.pickups.update(this.player, dt);
    this.particles.update(dt);
    updateCheckpoints(this.player, this.checkpoints, this.bus);
    this.continueThroughArenaExit();
    this.camera.follow(this.player, dt);
    this.collisionCount = this.tiles.length;
  }

  render(ctx) {
    drawParallax(ctx, this.camera, this.biome, this.canvas.width, this.canvas.height);
    drawWeather(ctx, this.biome.weather, this.time, this.canvas.width, this.canvas.height);
    this.renderer.world(world => {
      for (const tile of this.tiles) {
        world.fillStyle = '#264c3e';
        world.fillRect(tile.x, tile.y, tile.w, tile.h);
        world.fillStyle = '#5a8e59';
        world.fillRect(tile.x, tile.y, tile.w, 8);
      }
      this.checkpoints.forEach(checkpoint => drawCheckpoint(world, checkpoint));
      this.drawArenaExit(world);
      this.pickups.draw(world);
      this.enemies.forEach(enemy => enemy.draw(world));
      this.boss?.draw(world);
      this.projectiles.draw(world);
      this.player.draw(world);
      this.particles.draw(world);
    });
    drawHUD(ctx, this.player, this.level, this.boss);
    if (this.debug) this.drawDebug(ctx);
  }

  drawArenaExit(ctx) {
    if (!this.arenaExit) return;
    ctx.fillStyle = this.arenaExit.locked ? '#5b392f' : '#75d89b';
    ctx.fillRect(this.arenaExit.x, this.arenaExit.y, this.arenaExit.w, this.arenaExit.h);
    ctx.strokeStyle = this.arenaExit.locked ? '#d06c55' : '#d8ffcd';
    ctx.strokeRect(this.arenaExit.x, this.arenaExit.y, this.arenaExit.w, this.arenaExit.h);
  }

  drawDebug(ctx) {
    ctx.save();
    ctx.fillStyle = '#07151add';
    ctx.fillRect(1040, 620, 220, 76);
    ctx.fillStyle = '#b9ffda';
    ctx.font = '15px monospace';
    ctx.fillText(`entities: ${1 + this.enemies.length + (this.boss && !this.boss.dead ? 1 : 0)}`, 1055, 645);
    ctx.fillText(`particles: ${this.particles.activeCount}`, 1055, 665);
    ctx.fillText(`collision tiles: ${this.collisionCount}`, 1055, 685);
    ctx.restore();
  }
}
