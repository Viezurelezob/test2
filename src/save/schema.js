export const SAVE_VERSION = 2;
export const createSave = ({ player, levelId, checkpoint, inventory, skills, settings, zoneState = {} }) => ({
  version: SAVE_VERSION,
  savedAt: new Date().toISOString(),
  levelId,
  checkpoint,
  stats: { hp: player.hp, maxHp: player.maxHp, energy: player.energy, maxEnergy: player.maxEnergy, xp: player.xp, level: player.level, gold: player.gold },
  skills: skills.unlocked,
  inventory: inventory.serialize(),
  equipment: inventory.equipment,
  collectibles: { crystals: player.crystals, keys: player.keys },
  openedTreasures: zoneState.openedTreasures || [],
  discoveredSecrets: zoneState.discoveredSecrets || [],
  unlockedGates: zoneState.unlockedGates || [],
  settings,
});
