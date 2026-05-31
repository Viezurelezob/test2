export const ENEMIES = {
  mossling: { name: 'Mossling', hp: 45, speed: 88, damage: 12, detectionRadius: 340, attackRange: 62, aggroTimeout: 2.8, color: '#b8e36c' },
  'vine-stalker': { name: 'Vine Stalker', hp: 75, speed: 110, damage: 18, detectionRadius: 390, attackRange: 74, aggroTimeout: 3.4, color: '#8cbf5c' },
  'crystal-crawler': { name: 'Crystal Crawler', hp: 62, speed: 96, damage: 16, detectionRadius: 360, attackRange: 66, aggroTimeout: 3, color: '#78f9df' },
  'echo-bat': { name: 'Echo Bat', hp: 48, speed: 124, damage: 14, detectionRadius: 430, attackRange: 70, aggroTimeout: 3.5, color: '#a88cff' },
  'snow-hare': { name: 'Snow Hare', hp: 58, speed: 132, damage: 15, detectionRadius: 380, attackRange: 64, aggroTimeout: 3.1, color: '#d8f5ff' },
  'ice-wisp': { name: 'Ice Wisp', hp: 68, speed: 104, damage: 18, detectionRadius: 440, attackRange: 72, aggroTimeout: 3.6, color: '#88cfff' },
  'cinder-imp': { name: 'Cinder Imp', hp: 72, speed: 118, damage: 20, detectionRadius: 410, attackRange: 68, aggroTimeout: 3.3, color: '#ff8c61' },
  'slag-beetle': { name: 'Slag Beetle', hp: 96, speed: 82, damage: 23, detectionRadius: 350, attackRange: 78, aggroTimeout: 3.8, color: '#c95c45' },
  'wind-sentry': { name: 'Wind Sentry', hp: 82, speed: 116, damage: 21, detectionRadius: 450, attackRange: 72, aggroTimeout: 3.7, color: '#b7e8ff' },
  'aether-knight': { name: 'Aether Knight', hp: 112, speed: 100, damage: 25, detectionRadius: 420, attackRange: 82, aggroTimeout: 4, color: '#d6c4ff' },
};

export const BOSSES = {
  'Thornback Warden': { name: 'Thornback Warden', hp: 360, w: 104, h: 112, color: '#6f9f42', hitColor: '#c9ff75', telegraphColor: '#e6ff9b', phases: [
    { speed: 72, engageRange: 150, attacks: [{ id: 'thorn-swipe', behavior: 'swipe', telegraph: 0.5, cooldown: 1.3, damage: 18, range: 46 }] },
    { speed: 96, engageRange: 210, attacks: [{ id: 'root-charge', behavior: 'charge', telegraph: 0.62, cooldown: 1.5, recovery: 0.4, damage: 23, range: 70, speed: 360 }] },
    { speed: 122, engageRange: 250, attacks: [{ id: 'bramble-slam', behavior: 'slam', telegraph: 0.38, cooldown: 1, damage: 28, range: 104, vertical: 36 }] },
  ] },
  'Resonant Maw': { name: 'Resonant Maw', hp: 410, w: 118, h: 96, color: '#8064d8', hitColor: '#d9c4ff', telegraphColor: '#c8afff', phases: [
    { speed: 58, engageRange: 180, attacks: [{ id: 'echo-bite', behavior: 'bite', telegraph: 0.55, cooldown: 1.35, damage: 19, range: 52 }] },
    { speed: 82, engageRange: 240, attacks: [{ id: 'resonant-burst', behavior: 'burst', telegraph: 0.7, cooldown: 1.55, damage: 24, range: 112, vertical: 18 }] },
    { speed: 108, engageRange: 290, attacks: [{ id: 'cavernous-charge', behavior: 'charge', telegraph: 0.42, cooldown: 1.1, damage: 29, range: 84, speed: 410 }] },
  ] },
  'The Pale Gale': { name: 'The Pale Gale', hp: 390, w: 96, h: 122, color: '#c3eaff', hitColor: '#effcff', telegraphColor: '#a8ecff', phases: [
    { speed: 104, engageRange: 170, attacks: [{ id: 'frost-cut', behavior: 'swipe', telegraph: 0.44, cooldown: 1.2, damage: 18, range: 58 }] },
    { speed: 132, engageRange: 250, attacks: [{ id: 'whiteout', behavior: 'burst', telegraph: 0.64, cooldown: 1.45, damage: 23, range: 122, vertical: 24 }] },
    { speed: 164, engageRange: 310, attacks: [{ id: 'gale-dash', behavior: 'charge', telegraph: 0.34, cooldown: 0.95, damage: 27, range: 92, speed: 480 }] },
  ] },
  'Cinderheart Colossus': { name: 'Cinderheart Colossus', hp: 470, w: 132, h: 142, color: '#b94e38', hitColor: '#ffb06b', telegraphColor: '#ff815d', phases: [
    { speed: 54, engageRange: 180, attacks: [{ id: 'molten-fist', behavior: 'slam', telegraph: 0.62, cooldown: 1.45, damage: 22, range: 58, vertical: 22 }] },
    { speed: 76, engageRange: 250, attacks: [{ id: 'eruption', behavior: 'burst', telegraph: 0.78, cooldown: 1.7, damage: 28, range: 132, vertical: 34 }] },
    { speed: 102, engageRange: 290, attacks: [{ id: 'furnace-rush', behavior: 'charge', telegraph: 0.48, cooldown: 1.2, damage: 34, range: 96, speed: 390 }] },
  ] },
  'Stormbound Regent': { name: 'Stormbound Regent', hp: 520, w: 108, h: 134, color: '#8976d4', hitColor: '#e5dcff', telegraphColor: '#ffe99d', phases: [
    { speed: 92, engageRange: 190, attacks: [{ id: 'regent-strike', behavior: 'swipe', telegraph: 0.48, cooldown: 1.25, damage: 22, range: 60 }] },
    { speed: 124, engageRange: 270, attacks: [{ id: 'thunder-court', behavior: 'burst', telegraph: 0.68, cooldown: 1.5, damage: 29, range: 140, vertical: 30 }] },
    { speed: 156, engageRange: 330, attacks: [{ id: 'tempest-lunge', behavior: 'charge', telegraph: 0.3, cooldown: 0.9, damage: 36, range: 106, speed: 520 }] },
  ] },
};
