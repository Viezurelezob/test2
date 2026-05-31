import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GameUI } from './App.jsx';
import { Toast } from './components/Toast.jsx';
import { useTimedToast } from './hooks/useGameRuntime.js';

function UIHarness({ saved = false, initialPanel = 'menu' }) {
  const [activePanel, setActivePanel] = useState(initialPanel);
  const [music, setMusic] = useState(.5);
  const [sfx, setSfx] = useState(.7);
  const [debug, setDebug] = useState(false);
  const actions = {
    handleAction(action) {
      if (action === 'settings' || action === 'credits' || action === 'inventory') setActivePanel(action);
      if (action === 'back') setActivePanel('menu');
      if (action === 'pause') setActivePanel('pause');
      if (action === 'resume') setActivePanel(null);
      if (action === 'menu') setActivePanel('menu');
    },
    setMusicVolume: setMusic,
    setSfxVolume: setSfx,
    setDebugEnabled: setDebug,
  };
  return <GameUI canvasRef={null} runtime={{ activePanel, canContinue: saved, debug, inventory: { gold: 12, crystals: 3, keys: 1 }, music, sfx, toast: '', actions }} />;
}

function ToastHarness() {
  const { toast, showToast } = useTimedToast(100);
  return <><button onClick={() => showToast('Salvat')}>Notify</button><Toast message={toast} /></>;
}

describe('React game UI', () => {
  it('navigates between menus, pause controls, and back actions', () => {
    const { unmount } = render(<UIHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Credits' }));
    expect(screen.getByRole('heading', { name: 'CREDITS' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'SETTINGS' })).toBeInTheDocument();
    unmount();
    render(<UIHarness initialPanel="pause" />);
    fireEvent.click(screen.getByRole('button', { name: 'Inventory' }));
    expect(screen.getByRole('heading', { name: 'INVENTORY' })).toBeInTheDocument();
  });

  it('enables Continue only when a save exists', () => {
    const { rerender } = render(<UIHarness />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    rerender(<UIHarness saved />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('updates music, SFX, and debug controls through React state', () => {
    render(<UIHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    fireEvent.change(screen.getByLabelText('Music'), { target: { value: '.25' } });
    fireEvent.change(screen.getByLabelText('SFX'), { target: { value: '.4' } });
    fireEvent.click(screen.getByLabelText('Debug overlay'));
    expect(screen.getByLabelText('Music')).toHaveValue('0.25');
    expect(screen.getByLabelText('SFX')).toHaveValue('0.4');
    expect(screen.getByLabelText('Debug overlay')).toBeChecked();
  });

  it('renders inventory snapshots without injecting HTML', () => {
    render(<UIHarness initialPanel="inventory" />);
    expect(screen.getByText('Coins').nextSibling).toHaveTextContent('12');
    expect(screen.getByText('Aether crystals').nextSibling).toHaveTextContent('3');
    expect(screen.getByText('Rootforged keys').nextSibling).toHaveTextContent('1');
  });

  it('hides toast notifications after their timeout', () => {
    vi.useFakeTimers();
    render(<ToastHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByRole('status')).toHaveTextContent('Salvat');
    act(() => vi.advanceTimersByTime(100));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
