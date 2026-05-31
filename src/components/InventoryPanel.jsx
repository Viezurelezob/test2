import { ITEMS } from '../data/items.js';

const entries = bag => Object.entries(bag || {}).filter(([, amount]) => amount > 0);
const itemName = id => ITEMS[id]?.name || id;

function ItemList({ bag, empty = 'None', action }) {
  const items = entries(bag);
  if (!items.length) return <p className="inventory-empty">{empty}</p>;
  return <ul>{items.map(([id, amount]) => <li key={id}><span>{itemName(id)}</span><b>{amount}</b>{action?.(id)}</li>)}</ul>;
}

export function InventoryPanel({ inventory, onAction, onEquip, onConsume }) {
  const resources = { coin: inventory.gold, crystal: inventory.crystals, key: inventory.keys, ...inventory.resources };
  return <section id="inventory" className="panel compact inventory-panel">
    <h2>INVENTORY</h2>
    <div id="inventory-content">
      <h3>Resources</h3><ItemList bag={resources} />
      <h3>Quest items</h3><ItemList bag={{ ...inventory.quest, ...inventory.relics }} />
      <h3>Consumables</h3><ItemList bag={inventory.consumables} action={id => <button onClick={() => onConsume(id)}>Use</button>} />
      <h3>Equipment</h3><ItemList bag={inventory.ownedEquipment} action={id => <button onClick={() => onEquip(id)}>{inventory.equipment?.[ITEMS[id]?.slot] === id ? 'Unequip' : 'Equip'}</button>} />
    </div>
    <button onClick={() => onAction('back')}>Back</button>
  </section>;
}
