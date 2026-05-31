export function PauseMenu({ onAction }) {
  return <section id="pause" className="panel compact"><h2>PAUSED</h2><button onClick={() => onAction('resume')}>Resume</button><button onClick={() => onAction('save')}>Manual Save</button><button onClick={() => onAction('inventory')}>Inventory</button><button onClick={() => onAction('skills')}>Skill Tree</button><button onClick={() => onAction('settings')}>Settings</button><button onClick={() => onAction('menu')}>Main Menu</button></section>;
}
