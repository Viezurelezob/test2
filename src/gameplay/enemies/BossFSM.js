import { overlaps } from '../../physics/AABB.js';
import { moveAndCollide } from '../../physics/Collision.js';
import { PHYSICS } from '../../physics/constants.js';

const noopBus = { emit() {} };
const noopParticles = { spawn() {} };

export class BossFSM {
  constructor(x, y, config, bus = noopBus, particles = noopParticles) {
    Object.assign(this, {
      x, y, w: config.w, h: config.h, vx: 0, vy: 0, grounded: false, wall: 0,
      hp: config.hp, maxHp: config.hp, phase: 1, state: 'idle', timer: config.openingDelay ?? 0.7,
      attackCooldown: 0, attackIndex: 0, dir: -1, dead: false, config, bus, particles,
    });
  }

  get phaseConfig() { return this.config.phases[this.phase - 1]; }

  transition(state, timer = 0) { this.state = state; this.timer = timer; }

  updatePhase() {
    const nextPhase = this.hp / this.maxHp > 0.66 ? 1 : this.hp / this.maxHp > 0.33 ? 2 : 3;
    if (nextPhase === this.phase) return;
    this.phase = nextPhase;
    this.attackCooldown = 0;
    this.bus.emit('boss:phase', { boss: this, phase: this.phase });
  }

  hurt(amount, dir = 0) {
    if (this.state === 'dead') return false;
    this.hp = Math.max(0, this.hp - amount);
    this.vx = dir * 130;
    this.particles.spawn(this.x + this.w / 2, this.y + this.h / 3, this.config.hitColor, 18);
    this.bus.emit('boss:hurt', { boss: this, hp: this.hp, maxHp: this.maxHp });
    if (this.hp === 0) {
      this.transition('dead', this.config.deathDuration ?? 0.8);
      this.bus.emit('boss:defeated', { boss: this });
    } else {
      this.updatePhase();
      this.transition('hurt', this.config.hurtDuration ?? 0.22);
    }
    return true;
  }

  beginAttack() {
    const attacks = this.phaseConfig.attacks;
    this.attack = attacks[this.attackIndex++ % attacks.length];
    this.vx = 0;
    this.transition('telegraph', this.attack.telegraph);
    this.bus.emit('boss:telegraph', { boss: this, phase: this.phase, attack: this.attack.id });
  }

  strike(player) {
    const attack = this.attack;
    const reach = attack.range ?? 30;
    const hitbox = { x: this.x - reach, y: this.y - (attack.vertical ?? 0), w: this.w + reach * 2, h: this.h + (attack.vertical ?? 0) };
    if (overlaps(hitbox, player)) player.damage(attack.damage, -this.dir);
    this.attackCooldown = attack.cooldown;
    this.transition('cooldown', attack.recovery ?? 0.25);
    this.bus.emit('boss:attack', { boss: this, phase: this.phase, attack: attack.id, hitbox });
  }

  update(player, tiles, dt) {
    if (this.dead) return;
    this.timer -= dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.vy = Math.min(this.vy + PHYSICS.gravity * dt, PHYSICS.terminalVelocity);
    const dx = player.x - this.x;
    this.dir = Math.sign(dx) || this.dir;
    const phase = this.phaseConfig;

    switch (this.state) {
      case 'idle':
      case 'chase':
        this.state = 'chase';
        this.vx = this.dir * phase.speed;
        if (Math.abs(dx) <= phase.engageRange && this.attackCooldown <= 0) this.beginAttack();
        break;
      case 'telegraph':
        this.vx = this.attack.behavior === 'charge' ? this.dir * phase.speed * 0.35 : 0;
        if (this.timer <= 0) {
          if (this.attack.behavior === 'charge') this.vx = this.dir * (this.attack.speed ?? phase.speed * 3);
          this.transition('attack', this.attack.duration ?? 0.12);
        }
        break;
      case 'attack':
        if (this.timer <= 0) this.strike(player);
        break;
      case 'cooldown':
        this.vx *= 0.7;
        if (this.timer <= 0) this.transition('chase');
        break;
      case 'hurt':
        this.vx *= 0.8;
        if (this.timer <= 0) this.transition('chase');
        break;
      case 'dead':
        this.vx = 0;
        if (this.timer <= 0) this.dead = true;
        break;
    }
    moveAndCollide(this, tiles, dt);
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    ctx.globalAlpha = this.state === 'dead' ? 0.35 : 1;
    ctx.fillStyle = this.state === 'hurt' ? '#ffffff' : this.config.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#241b2f';
    ctx.fillRect(this.x + (this.dir > 0 ? this.w - 24 : 12), this.y + 22, 12, 12);
    if (this.state === 'telegraph') {
      const reach = this.attack.range ?? 30;
      ctx.strokeStyle = this.config.telegraphColor;
      ctx.lineWidth = 5;
      ctx.strokeRect(this.x - reach, this.y - 8, this.w + reach * 2, this.h + 16);
    }
    ctx.restore();
  }
}
