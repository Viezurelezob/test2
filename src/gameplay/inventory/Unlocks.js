import { ITEMS } from '../../data/items.js';

export const canUnlock = (inventory, requirement) => Boolean(requirement && (inventory.quantity?.(requirement) || inventory.quest?.[requirement] || inventory.relics?.[requirement]));
export const openTreasure = (zone, inventory) => zone && !zone.opened && (zone.opened = true, inventory.add(ITEMS[zone.item] || { name: zone.item, category: 'quest-item' }), true);
