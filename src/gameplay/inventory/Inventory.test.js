import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../data/items.js';
import { Inventory } from './Inventory.js';

describe('Inventory', () => {
  it('adds, queries, and removes normalized item categories', () => {
    const inventory = new Inventory();
    expect(inventory.add('coin', 3)).toBe(true);
    expect(inventory.add('verdant-sigil')).toBe(true);
    expect(inventory.add('ember-tonic', 2)).toBe(true);
    expect(inventory.quantity('coin')).toBe(3);
    expect(inventory.quantity('verdant-sigil')).toBe(1);
    expect(inventory.remove('coin', 2)).toBe(true);
    expect(inventory.remove('coin', 2)).toBe(false);
    expect(inventory.quantity('coin')).toBe(1);
  });

  it('equips and unequips only owned charms and cloaks', () => {
    const inventory = new Inventory();
    inventory.add('mossheart-charm');
    inventory.add('rimecloak');
    expect(inventory.equipCharm('mossheart-charm')).toBe(true);
    expect(inventory.equipCloak('rimecloak')).toBe(true);
    expect(inventory.equipment).toEqual({ charm: 'mossheart-charm', cloak: 'rimecloak' });
    expect(inventory.equipCharm('echo-charm')).toBe(false);
    expect(inventory.unequipCharm()).toBe(true);
    expect(inventory.unequipCloak()).toBe(true);
  });

  it('consumes available consumables and returns their definition', () => {
    const inventory = new Inventory();
    inventory.add('ember-tonic', 2);
    expect(inventory.useConsumable('ember-tonic')).toEqual(ITEMS['ember-tonic']);
    expect(inventory.quantity('ember-tonic')).toBe(1);
    expect(new Inventory().useConsumable('ember-tonic')).toBeNull();
  });

  it('returns a detached, sanitized serialization snapshot', () => {
    const inventory = new Inventory({ consumables: { 'ember-tonic': 2, broken: -4 }, equipment: { charm: null } });
    const snapshot = inventory.serialize();
    snapshot.consumables['ember-tonic'] = 99;
    snapshot.equipment.charm = 'mossheart-charm';
    expect(inventory.quantity('ember-tonic')).toBe(2);
    expect(inventory.equipment.charm).toBeNull();
    expect(inventory.consumables.broken).toBeUndefined();
  });
});
