export class LifetimeSystem{update(world,dt){for(const e of world.query('lifetime')){const life=e.get('lifetime');life.value-=dt;if(life.value<=0)world.remove(e)}}}
