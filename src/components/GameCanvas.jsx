import { forwardRef } from 'react';

export const GameCanvas = forwardRef(function GameCanvas(_, ref) {
  return <canvas ref={ref} id="game" width="1280" height="720" aria-label="Aetherbound game canvas" />;
});
