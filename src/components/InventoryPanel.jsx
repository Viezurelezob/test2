export function InventoryPanel({ inventory, onAction }) {
  return <section id="inventory" className="panel compact"><h2>INVENTORY</h2><div id="inventory-content"><p><span>Coins</span><b>{inventory.gold}</b></p><p><span>Aether crystals</span><b>{inventory.crystals}</b></p><p><span>Rootforged keys</span><b>{inventory.keys}</b></p></div><button onClick={() => onAction('back')}>Back</button></section>;
}
