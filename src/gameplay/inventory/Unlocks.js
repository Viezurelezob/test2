export const canUnlock = (inventory, requirement) => Boolean(requirement && inventory.quest[requirement] > 0);
export const openTreasure = (zone, inventory) => zone && !zone.opened && (zone.opened = true, inventory.add({ name: zone.item, category: 'quest' }), true);
