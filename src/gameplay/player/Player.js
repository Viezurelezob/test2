import { SKILLS } from '../../data/skills.js';
import { PHYSICS } from '../../physics/constants.js';
import { updatePlatformBody } from '../../physics/Movement.js';
import { overlaps } from '../../physics/AABB.js';

const BASE_STATS = { maxHp: 100, meleeDamage: 22, projectileDamage: 14, sprintSpeed: PHYSICS.sprintSpeed, powerupDuration: 1 };

export class Player {
  constructor(x, y, bus, projectiles, particles, skills) {
    Object.assign(this, { x, y, w: 38, h: 58, vx: 0, vy: 0, facing: 1, grounded: false, wall: 0, hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, xp: 0, level: 1, gold: 0, keys: 0, crystals: 0, jumps: 0, invulnerable: 0, attackTimer: 0, rangedTimer: 0, powerups: [], bus, projectiles, particles, skills, spawn: { x, y } });
    this.applySkillEffects();
    this.hp = this.maxHp;
  }

  applySkillEffects() {
    Object.assign(this, BASE_STATS, { doubleJump: false });
    for (const id of this.skills?.unlocked || []) {
      const effect = SKILLS.find(skill => skill.id === id)?.effect;
      if (!effect) continue;
      if (effect.sprintSpeed) this.sprintSpeed += effect.sprintSpeed;
      if (effect.doubleJump) this.doubleJump = true;
      if (effect.meleeDamage) this.meleeDamage += effect.meleeDamage;
      if (effect.projectileDamage) this.projectileDamage += effect.projectileDamage;
      if (effect.maxHp) this.maxHp += effect.maxHp;
      if (effect.powerupDuration) this.powerupDuration += effect.powerupDuration;
    }
  }

  reset(x, y) { Object.assign(this, { x, y, vx: 0, vy: 0, hp: this.maxHp, energy: this.maxEnergy }); this.spawn = { x, y }; }
  damage(amount, dir = 0) { if (this.invulnerable > 0) return false; this.hp -= amount; this.invulnerable = 1; this.vx = dir * 280; this.vy = -250; this.particles.spawn(this.x + this.w / 2, this.y + 20, '#ff6e68', 14); this.bus.emit('player:damage', { hp: this.hp }); if (this.hp <= 0) this.bus.emit('player:dead'); return true; }
  update(input, tiles, enemies, dt) { this.invulnerable = Math.max(0, this.invulnerable - dt); this.attackTimer = Math.max(0, this.attackTimer - dt); this.rangedTimer = Math.max(0, this.rangedTimer - dt); const x = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0); if (x) this.facing = x; if (input.wasPressed('jump')) { if (this.grounded) { this.vy = -PHYSICS.jumpVelocity; this.jumps = 1; } else if (this.wall) { this.vy = -PHYSICS.jumpVelocity * .9; this.vx = -this.wall * PHYSICS.wallJumpX; this.facing = -this.wall; this.jumps = 1; } else if (this.doubleJump && this.jumps < 2) { this.vy = -PHYSICS.jumpVelocity * .88; this.jumps++; this.particles.spawn(this.x, this.y + this.h, '#b9ffda', 8); } } if (input.wasPressed('melee')) this.melee(enemies); if (input.wasPressed('ranged') && this.rangedTimer <= 0) { this.rangedTimer = .34; this.projectiles.spawn(this.x + (this.facing > 0 ? this.w : 0), this.y + 23, this.facing, this.projectileDamage); } updatePlatformBody(this, { x, sprint: input.isDown('sprint') }, tiles, dt); if (this.grounded) this.jumps = 0; if (this.y > 780) this.bus.emit('player:dead'); this.powerups = this.powerups.filter(powerup => (powerup.remaining -= dt) > 0); }
  melee(enemies) { if (this.attackTimer > 0) return; this.attackTimer = .28; const hit = { x: this.facing > 0 ? this.x + this.w : this.x - 52, y: this.y + 8, w: 52, h: 42 }; for (const enemy of enemies) if (enemy.state !== 'dead' && overlaps(hit, enemy)) enemy.hurt(this.meleeDamage, this.facing); this.particles.spawn(hit.x + hit.w / 2, hit.y + 20, '#f5f1b3', 8, 90); }
  draw(ctx) { ctx.save(); if (this.invulnerable > 0 && Math.floor(this.invulnerable * 14) % 2) ctx.globalAlpha = .32; ctx.fillStyle = '#f0d88a'; ctx.fillRect(this.x + 8, this.y, 22, 17); ctx.fillStyle = '#e8f3d2'; ctx.fillRect(this.x + 4, this.y + 17, 30, 28); ctx.fillStyle = '#32635b'; ctx.fillRect(this.x, this.y + 45, 15, 13); ctx.fillRect(this.x + 23, this.y + 45, 15, 13); ctx.fillStyle = '#152a32'; ctx.fillRect(this.x + (this.facing > 0 ? 24 : 10), this.y + 6, 5, 5); if (this.attackTimer > .12) { ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.x + 19, this.y + 30, 46, this.facing > 0 ? -.85 : Math.PI - .7, this.facing > 0 ? .85 : Math.PI + .7); ctx.stroke(); } ctx.restore(); }
}
