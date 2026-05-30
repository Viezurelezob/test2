export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const overlapDepth=(a,b)=>({x:Math.min(a.x+a.w-b.x,b.x+b.w-a.x),y:Math.min(a.y+a.h-b.y,b.y+b.h-a.y)});
export const pointInRect=(x,y,r)=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
