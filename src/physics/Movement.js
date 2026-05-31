import{PHYSICS,clamp}from'./constants.js';import{moveAndCollide}from'./Collision.js';
const approach=(v,target,amount)=>v<target?Math.min(v+amount,target):Math.max(v-amount,target);
export function updatePlatformBody(body,intent,tiles,dt){const max=intent.sprint?(body.sprintSpeed||PHYSICS.sprintSpeed):PHYSICS.walkSpeed;if(intent.x)body.vx=clamp(body.vx+intent.x*PHYSICS.acceleration*dt,-max,max);else body.vx=approach(body.vx,0,PHYSICS.friction*dt);body.vy=Math.min(body.vy+PHYSICS.gravity*dt,PHYSICS.terminalVelocity);moveAndCollide(body,tiles,dt)}
