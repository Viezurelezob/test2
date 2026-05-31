const slam = (damage, interval) => ({
  id: 'thorn-slam',
  label: 'Thorn Slam',
  damage,
  interval,
  telegraph: .55,
  activationRange: 260,
  hitbox: { x: -72, y: 36, w: 232, h: 66 },
  color: '#f0c66f',
});

const roots = (damage, interval) => ({
  id: 'root-eruption',
  label: 'Root Eruption',
  damage,
  interval,
  telegraph: .72,
  activationRange: 920,
  hitbox: { x: -34, y: 0, w: 106, h: 610 },
  targetPlayer: true,
  color: '#ce7b63',
});

const sweep = (damage, interval) => ({
  id: 'bramble-sweep',
  label: 'Bramble Sweep',
  damage,
  interval,
  telegraph: .38,
  activationRange: 420,
  hitbox: { x: -310, y: 48, w: 660, h: 54 },
  color: '#ff8d72',
});

export const BOSSES = {
  'Thornback Warden': {
    id: 'thornback-warden',
    name: 'Thornback Warden',
    hp: 540,
    position: { x: 1040, y: 466 },
    hitbox: { w: 126, h: 144 },
    color: '#52783f',
    phases: {
      1: { attacks: [slam(18, 2.4)] },
      2: { attacks: [slam(22, 1.9), roots(16, 3.1)] },
      3: { attacks: [sweep(28, 1.45), roots(20, 2.2), slam(25, 1.6)] },
    },
  },
};
