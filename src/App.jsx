import { useRef } from 'react';
import { CreditsPanel } from './components/CreditsPanel.jsx';
import { GameCanvas } from './components/GameCanvas.jsx';
import { InventoryPanel } from './components/InventoryPanel.jsx';
import { MainMenu } from './components/MainMenu.jsx';
import { PauseMenu } from './components/PauseMenu.jsx';
import { SettingsPanel } from './components/SettingsPanel.jsx';
import { SkillTreePanel } from './components/SkillTreePanel.jsx';
import { Toast } from './components/Toast.jsx';
import { useGameRuntime } from './hooks/useGameRuntime.js';

export function GameUI({ runtime, canvasRef }) {
  const { activePanel, canContinue, debug, inventory, skills, music, sfx, toast, actions } = runtime;
  return <main id="app">
    <GameCanvas ref={canvasRef} />
    {activePanel === 'menu' && <MainMenu canContinue={canContinue} onAction={actions.handleAction} />}
    {activePanel === 'pause' && <PauseMenu onAction={actions.handleAction} />}
    {activePanel === 'settings' && <SettingsPanel music={music} sfx={sfx} debug={debug} onAction={actions.handleAction} onMusicChange={actions.setMusicVolume} onSfxChange={actions.setSfxVolume} onDebugChange={actions.setDebugEnabled} />}
    {activePanel === 'inventory' && <InventoryPanel inventory={inventory} onAction={actions.handleAction} />}
    {activePanel === 'skills' && <SkillTreePanel skills={skills} onAction={actions.handleAction} onUnlock={actions.unlockSkill} />}
    {activePanel === 'credits' && <CreditsPanel onAction={actions.handleAction} />}
    <Toast message={toast} />
  </main>;
}

export default function App() {
  const canvasRef = useRef(null);
  const runtime = useGameRuntime(canvasRef);
  return <GameUI runtime={runtime} canvasRef={canvasRef} />;
}
