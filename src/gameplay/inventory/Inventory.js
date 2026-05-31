import { ITEMS } from '../../data/items.js';

const emptyEquipment = () => ({ charm: null, cloak: null });
const copyBag = bag => Object.fromEntries(Object.entries(bag || {}).filter(([, amount]) => Number.isFinite(amount) && amount > 0).map(([id, amount]) => [id, Math.floor(amount)]));
const resolveItem = item => typeof item === 'string' ? ITEMS[item] : item;
const itemId = item => item?.id || item?.name;

export class Inventory {
  constructor(saved = {}) {
    this.resources = copyBag(saved.resources);
    this.quest = copyBag(saved.quest || saved.questItems);
    this.relics = copyBag(saved.relics);
    this.consumables = copyBag(saved.consumables);
    this.ownedEquipment = copyBag(saved.ownedEquipment);
    this.equipment = { ...emptyEquipment(), ...(saved.equipment || {}) };
  }

  bagFor(item) {
    if (item.category === 'currency' || item.category === 'collectible') return this.resources;
    if (item.category === 'quest-item' || item.category === 'quest') return this.quest;
    if (item.category === 'relic') return this.relics;
    if (item.category === 'consumable') return this.consumables;
    if (item.category === 'equipment') return this.ownedEquipment;
    throw new Error(`Unsupported item category: ${item.category}`);
  }

  add(itemOrId, amount = 1) {
    const item = resolveItem(itemOrId);
    const id = itemId(item);
    if (!item || !id || !Number.isInteger(amount) || amount < 1) return false;
    const bag = this.bagFor(item);
    bag[id] = (bag[id] || 0) + amount;
    return true;
  }

  remove(itemOrId, amount = 1) {
    const item = resolveItem(itemOrId);
    const id = itemId(item);
    if (!item || !id || !Number.isInteger(amount) || amount < 1) return false;
    const bag = this.bagFor(item);
    if ((bag[id] || 0) < amount) return false;
    bag[id] -= amount;
    if (!bag[id]) delete bag[id];
    if (item.category === 'equipment' && this.equipment[item.slot] === id && !bag[id]) this.equipment[item.slot] = null;
    return true;
  }

  quantity(itemOrId) {
    const item = resolveItem(itemOrId);
    const id = itemId(item);
    return item && id ? this.bagFor(item)[id] || 0 : 0;
  }

  equipCharm(id) { return this.equip(id, 'charm'); }
  equipCloak(id) { return this.equip(id, 'cloak'); }
  unequipCharm() { return this.unequip('charm'); }
  unequipCloak() { return this.unequip('cloak'); }

  equip(id, slot) {
    const item = ITEMS[id];
    if (!item || item.category !== 'equipment' || item.slot !== slot || this.quantity(item) < 1) return false;
    this.equipment[slot] = id;
    return true;
  }

  unequip(slot) {
    if (!this.equipment[slot]) return false;
    this.equipment[slot] = null;
    return true;
  }

  useConsumable(id) {
    const item = ITEMS[id];
    if (!item || item.category !== 'consumable' || !this.remove(item)) return null;
    return item;
  }

  serialize() {
    return structuredClone({ resources: this.resources, quest: this.quest, relics: this.relics, consumables: this.consumables, ownedEquipment: this.ownedEquipment, equipment: this.equipment });
  }
}
