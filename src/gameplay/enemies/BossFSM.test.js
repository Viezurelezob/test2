import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../../core/EventBus.js';
import { BOSSES } from '../../data/bosses.js';
import { BossFSM } from './BossFSM.js';

const makeBoss = () => {
  const bus = new EventBus();
  const particles = { spawn: vi.fn() };
  const config = BOSSES['Thornback Warden'];
  return { boss: new BossFSM(config.position.x, config.position.y, config, bus, particles), bus };
};

describe('Thornback Warden FSM', () => {
  it('changes phase at the existing 66% and 33% HP thresholds', () => {
    const { boss } = makeBoss();
    boss.hp = boss.maxHp * .67;
    boss.updatePhase();
    expect(boss.phase).toBe(1);
    boss.hp = boss.maxHp * .66;
    boss.updatePhase();
    expect(boss.phase).toBe(2);
    boss.hp = boss.maxHp * .34;
    boss.updatePhase();
    expect(boss.phase).toBe(2);
    boss.hp = boss.maxHp * .33;
    boss.updatePhase();
    expect(boss.phase).toBe(3);
  });

  it('emits a distinct boss death event only once', () => {
    const { boss, bus } = makeBoss();
    const onDeath = vi.fn();
    bus.on('boss:dead', onDeath);
    boss.hurt(boss.maxHp);
    boss.hurt(1);
    expect(boss.dead).toBe(true);
    expect(boss.state).toBe('dead');
    expect(onDeath).toHaveBeenCalledTimes(1);
    expect(onDeath).toHaveBeenCalledWith({ boss });
  });
});
