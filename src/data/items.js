export const ITEM_CATEGORIES = Object.freeze({
  currency: 'currency',
  collectible: 'collectible',
  questItem: 'quest-item',
  relic: 'relic',
  consumable: 'consumable',
  equipment: 'equipment',
});

const item = (id, definition) => ({ id, ...definition });

export const ITEMS = {
  coin: item('coin', { name: 'Sunshard Coin', category: 'currency', rarity: 'common', value: 1, color: '#ffd76b' }),
  crystal: item('crystal', { name: 'Aether Crystal', category: 'collectible', rarity: 'uncommon', value: 1, color: '#78f9df' }),
  key: item('key', { name: 'Rootforged Key', category: 'collectible', rarity: 'rare', value: 1, color: '#efb569' }),

  'verdant-sigil': item('verdant-sigil', { name: 'Verdant Sigil', biome: 'verdant', category: 'relic', rarity: 'epic', effect: 'unlock-verdant-gate', color: '#a0ff94' }),
  'canopy-emblem': item('canopy-emblem', { name: 'Canopy Emblem', biome: 'verdant', category: 'quest-item', rarity: 'rare', effect: 'unlock-canopy-gate', color: '#b8e36c' }),
  'resonance-prism': item('resonance-prism', { name: 'Resonance Prism', biome: 'grotto', category: 'quest-item', rarity: 'rare', effect: 'unlock-resonance-door', color: '#78f9df' }),
  'echo-lens': item('echo-lens', { name: 'Echo Lens', biome: 'grotto', category: 'relic', rarity: 'epic', effect: 'unlock-maw-seal', color: '#a88cff' }),
  'rime-compass': item('rime-compass', { name: 'Rime Compass', biome: 'frost', category: 'quest-item', rarity: 'rare', effect: 'unlock-glacier-gate', color: '#d8f5ff' }),
  'gale-crest': item('gale-crest', { name: 'Gale Crest', biome: 'frost', category: 'relic', rarity: 'epic', effect: 'unlock-crown-door', color: '#88cfff' }),
  'furnace-brand': item('furnace-brand', { name: 'Furnace Brand', biome: 'ember', category: 'quest-item', rarity: 'rare', effect: 'unlock-forge-door', color: '#ff8c61' }),
  'cinder-key': item('cinder-key', { name: 'Cinder Key', biome: 'ember', category: 'relic', rarity: 'epic', effect: 'unlock-core-seal', color: '#c95c45' }),
  'windglass-seal': item('windglass-seal', { name: 'Windglass Seal', biome: 'citadel', category: 'quest-item', rarity: 'rare', effect: 'unlock-lift-gate', color: '#b7e8ff' }),
  'regent-insignia': item('regent-insignia', { name: 'Regent Insignia', biome: 'citadel', category: 'relic', rarity: 'epic', effect: 'unlock-throne-door', color: '#d6c4ff' }),

  'mossheart-charm': item('mossheart-charm', { name: 'Mossheart Charm', biome: 'verdant', category: 'equipment', slot: 'charm', rarity: 'uncommon', effect: { maxHp: 12 }, color: '#a0ff94' }),
  'echo-charm': item('echo-charm', { name: 'Echo Charm', biome: 'grotto', category: 'equipment', slot: 'charm', rarity: 'rare', effect: { projectileDamage: 4 }, color: '#78f9df' }),
  'rimecloak': item('rimecloak', { name: 'Rimecloak', biome: 'frost', category: 'equipment', slot: 'cloak', rarity: 'rare', effect: { sprintSpeed: 35 }, color: '#d8f5ff' }),
  'ember-charm': item('ember-charm', { name: 'Ember Charm', biome: 'ember', category: 'equipment', slot: 'charm', rarity: 'rare', effect: { meleeDamage: 5 }, color: '#ff8c61' }),
  'windglass-cloak': item('windglass-cloak', { name: 'Windglass Cloak', biome: 'citadel', category: 'equipment', slot: 'cloak', rarity: 'epic', effect: { powerupDuration: .25 }, color: '#b7e8ff' }),

  'verdant-elixir': item('verdant-elixir', { name: 'Verdant Elixir', biome: 'verdant', category: 'consumable', rarity: 'uncommon', effect: { type: 'damageBoost', multiplier: 1.2, duration: 8 }, color: '#a0ff94' }),
  'resonance-draught': item('resonance-draught', { name: 'Resonance Draught', biome: 'grotto', category: 'consumable', rarity: 'uncommon', effect: { type: 'damageBoost', multiplier: 1.3, duration: 8 }, color: '#78f9df' }),
  'rime-tonic': item('rime-tonic', { name: 'Rime Tonic', biome: 'frost', category: 'consumable', rarity: 'uncommon', effect: { type: 'damageBoost', multiplier: 1.35, duration: 8 }, color: '#d8f5ff' }),
  'ember-tonic': item('ember-tonic', { name: 'Ember Tonic', biome: 'ember', category: 'consumable', rarity: 'uncommon', effect: { type: 'damageBoost', multiplier: 1.5, duration: 8 }, color: '#ff8c61' }),
  'aetherglass-tonic': item('aetherglass-tonic', { name: 'Aetherglass Tonic', biome: 'citadel', category: 'consumable', rarity: 'rare', effect: { type: 'damageBoost', multiplier: 1.6, duration: 8 }, color: '#b7e8ff' }),
};
