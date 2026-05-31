import { SKILLS } from '../data/skills.js';

export function SkillTreePanel({ skills, onAction, onUnlock }) {
  const unlocked = new Set(skills.unlocked);
  return <section id="skills" className="panel compact skill-tree"><h2>SKILL TREE</h2><p className="skill-points">Available points: <b>{skills.points}</b></p><div className="skill-list">{SKILLS.map(skill => {
    const isUnlocked = unlocked.has(skill.id);
    const requirementMet = !skill.requires || unlocked.has(skill.requires);
    const canUnlock = !isUnlocked && requirementMet && skills.points >= skill.cost;
    return <article className={`skill-card ${isUnlocked ? 'unlocked' : canUnlock ? 'available' : 'locked'}`} key={skill.id}>
      <div><h3>{skill.name}</h3><small>{skill.branch}</small></div><p>Cost: {skill.cost} point{skill.cost === 1 ? '' : 's'}</p><p>Requires: {skill.requires ? SKILLS.find(value => value.id === skill.requires)?.name : 'None'}</p><button disabled={!canUnlock} onClick={() => onUnlock(skill.id)}>{isUnlocked ? 'Unlocked' : canUnlock ? 'Unlock' : 'Locked'}</button>
    </article>;
  })}</div><button onClick={() => onAction('back')}>Back</button></section>;
}
