export function MainMenu({ canContinue, onAction }) {
  return <section id="menu" className="panel menu">
    <p className="eyebrow">O aventură canvas originală</p><h1>AETHERBOUND</h1><p className="subtitle">Verdant Hollows — Vertical Slice</p>
    <button onClick={() => onAction('new')}>New Game</button><button disabled={!canContinue} onClick={() => onAction('continue')}>Continue</button><button onClick={() => onAction('settings')}>Settings</button><button onClick={() => onAction('credits')}>Credits</button>
    <p className="controls">A/D mișcare · Shift sprint · Space salt · J melee · K ranged · Esc pauză · F3 debug</p>
  </section>;
}
