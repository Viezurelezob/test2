import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './EventBus.js';
import { PlayScene } from './PlayScene.js';

const createScene = () => {
  const bus = new EventBus();
  const input = { wasPressed: () => false, isDown: () => false };
  const canvas = { width: 1280, height: 720, getContext: () => ({}) };
  const music = { play: vi.fn() };
  const assets = { loadBiome: vi.fn() };
  const scene = new PlayScene({ canvas, input, bus, music, assets });
  scene.load('verdant-boss');
  return { scene, bus };
};

describe('boss arena progression', () => {
  it('unlocks the arena exit when Thornback Warden dies', () => {
    const { scene, bus } = createScene();
    const onUnlock = vi.fn();
    bus.on('arena:exit:unlocked', onUnlock);
    expect(scene.arenaExit.locked).toBe(true);
    scene.boss.hurt(scene.boss.maxHp);
    scene.update(.016);
    expect(scene.arenaExit.locked).toBe(false);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });

  it('continues into the next biome through the unlocked arena exit', () => {
    const { scene, bus } = createScene();
    const onComplete = vi.fn();
    bus.on('level:complete', onComplete);
    scene.boss.hurt(scene.boss.maxHp);
    scene.update(.016);
    Object.assign(scene.player, { x: scene.arenaExit.x, y: scene.arenaExit.y });
    scene.update(.016);
    expect(scene.levelId).toBe('grotto-01');
    expect(onComplete).toHaveBeenCalledWith({ id: 'verdant-boss', nextLevelId: 'grotto-01' });
  });
});
