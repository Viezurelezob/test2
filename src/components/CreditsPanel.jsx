export function CreditsPanel({ onAction }) {
  return <section id="credits" className="panel compact"><h2>CREDITS</h2><p>Design, code și univers original pentru demonstrația Aetherbound.</p><p>Construit exclusiv cu HTML5 Canvas, CSS3 și Vanilla JavaScript.</p><button onClick={() => onAction('back')}>Back</button></section>;
}
