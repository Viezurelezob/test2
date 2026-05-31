import { SKILLS } from '../../data/skills.js';

export class SkillTree {
  constructor(unlocked = [], points = 0) {
    this.unlocked = [...unlocked];
    this.points = points;
  }

  unlock(id) {
    const skill = SKILLS.find(value => value.id === id);
    if (!skill || this.unlocked.includes(id) || this.points < skill.cost || (skill.requires && !this.unlocked.includes(skill.requires))) return false;
    this.points -= skill.cost;
    this.unlocked.push(id);
    return true;
  }

  serialize() {
    return { unlocked: [...this.unlocked], points: this.points };
  }
}
