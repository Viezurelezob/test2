import { overlaps } from '../../physics/AABB.js';

export class BossFSM {
  constructor(x, y, config, bus, particles) {
    const { w, h } = config.hitbox;
    Object.assign(this, {
      x,
      y,
      w,
      h,
      config,
      bus,
      particles,
      hp: config.hp,
      maxHp: config.hp,
      phase: 1,
      state: 'idle',
      dir: -1,
      cooldowns: {},
      telegraph: null,
      dead: false,
      deathEmitted: false,
    });
  }

  updatePhase() {
    const ratio = this.hp / this.maxHp;
    this.phase = ratio > .66 ? 1 : ratio > .33 ? 2 : 3;
  }

  hurt(amount) {
    if (this.state === 'dead') return;
    this.hp = Math.max(0, this.hp - amount);
    this.particles.spawn(this.x + this.w / 2, this.y + 40, '#d6ff93', 14);
    this.updatePhase();
    if (this.hp > 0) {
      this.state = 'hurt';
      return;
    }
    this.state = 'dead';
    this.dead = true;
    this.telegraph = null;
    if (!this.deathEmitted) {
      this.deathEmitted = true;
      this.bus.emit('boss:dead', { boss: this });
    }
  }

  update(player, _tiles, dt) {
    this.updatePhase();
    if (this.state === 'dead') return;
    this.dir = Math.sign(player.x - this.x) || this.dir;
    for (const id of Object.keys(this.cooldowns)) this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
    if (this.telegraph) {
      this.telegraph.remaining -= dt;
      if (this.telegraph.remaining <= 0) this.resolveAttack(player);
      return;
    }
    const attack = this.config.phases[this.phase].attacks.find(candidate =>
      !this.cooldowns[candidate.id] && Math.abs(player.x - this.x) <= candidate.activationRange
    );
    if (attack) this.startAttack(attack, player);
    else this.state = 'idle';
  }

  startAttack(attack, player) {
    const zone = attack.targetPlayer
      ? { x: player.x + attack.hitbox.x, y: attack.hitbox.y, w: attack.hitbox.w, h: attack.hitbox.h }
      : { x: this.x + attack.hitbox.x, y: this.y + attack.hitbox.y, w: attack.hitbox.w, h: attack.hitbox.h };
    this.telegraph = { attack, zone, remaining: attack.telegraph };
    this.cooldowns[attack.id] = attack.interval;
    this.state = 'telegraph';
  }

  resolveAttack(player) {
    const { attack, zone } = this.telegraph;
    if (overlaps(zone, player)) player.damage(attack.damage, Math.sign(player.x - this.x));
    this.particles.spawn(zone.x + zone.w / 2, zone.y + Math.min(zone.h, 90) / 2, attack.color, 16, 170);
    this.telegraph = null;
    this.state = 'attack';
  }

  draw(ctx) {
    if (this.dead) return;
    if (this.telegraph) {
      const { attack, zone } = this.telegraph;
      ctx.save();
      ctx.globalAlpha = .34;
      ctx.fillStyle = attack.color;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.globalAlpha = .9;
      ctx.strokeStyle = attack.color;
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = this.state === 'hurt' ? '#d9e989' : this.config.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#39552f';
    for (let x = 10; x < this.w; x += 24) ctx.fillRect(this.x + x, this.y - 15, 10, 25);
    ctx.fillStyle = '#1b2925';
    ctx.fillRect(this.x + (this.dir > 0 ? this.w - 34 : 20), this.y + 32, 12, 12);
    ctx.fillStyle = '#263725';
    ctx.fillRect(this.x + 12, this.y + this.h - 18, this.w - 24, 18);
    ctx.restore();
  }
}
