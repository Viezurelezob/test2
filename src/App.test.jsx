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
  const [skills, setSkills] = useState({ unlocked: ['fleet-foot'], points: 2 });
  const [inventory, setInventory] = useState({ gold: 12, crystals: 3, keys: 1, quest: { 'canopy-emblem': 1 }, relics: {}, consumables: { 'ember-tonic': 2 }, ownedEquipment: { 'mossheart-charm': 1 }, equipment: { charm: null, cloak: null } });
  const actions = {
    handleAction(action) {
      if (action === 'settings' || action === 'credits' || action === 'inventory' || action === 'skills') setActivePanel(action);
      if (action === 'back') setActivePanel('menu');
      if (action === 'pause') setActivePanel('pause');
      if (action === 'resume') setActivePanel(null);
      if (action === 'menu') setActivePanel('menu');
    },
    setMusicVolume: setMusic,
    setSfxVolume: setSfx,
    setDebugEnabled: setDebug,
    unlockSkill(id) { setSkills(current => ({ points: current.points - 2, unlocked: [...current.unlocked, id] })); },
    toggleEquipment(id) { setInventory(current => ({ ...current, equipment: { ...current.equipment, charm: current.equipment.charm === id ? null : id } })); },
    useConsumable(id) { setInventory(current => ({ ...current, consumables: { ...current.consumables, [id]: current.consumables[id] - 1 } })); },
  };
  return <GameUI canvasRef={null} runtime={{ activePanel, canContinue: saved, debug, inventory, skills, music, sfx, toast: '', actions }} />;
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
    expect(screen.getByText('Sunshard Coin').nextSibling).toHaveTextContent('12');
    expect(screen.getByText('Aether Crystal').nextSibling).toHaveTextContent('3');
    expect(screen.getByText('Rootforged Key').nextSibling).toHaveTextContent('1');
  });


  it('shows inventory sections and wires consumable and equipment actions', () => {
    render(<UIHarness initialPanel="inventory" />);
    expect(screen.getByRole('heading', { name: 'Resources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Quest items' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Consumables' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Equipment' })).toBeInTheDocument();
    expect(screen.getByText('Ember Tonic').nextSibling).toHaveTextContent('2');
    fireEvent.click(screen.getByRole('button', { name: 'Use' }));
    expect(screen.getByText('Ember Tonic').nextSibling).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Equip' }));
    expect(screen.getByRole('button', { name: 'Unequip' })).toBeInTheDocument();
  });

  it('opens the skill tree from pause and displays costs, requirements, points, and unlock state', () => {
    render(<UIHarness initialPanel="pause" />);
    fireEvent.click(screen.getByRole('button', { name: 'Skill Tree' }));

    expect(screen.getByRole('heading', { name: 'SKILL TREE' })).toBeInTheDocument();
    expect(screen.getByText('Available points:').parentElement).toHaveTextContent('Available points: 2');
    expect(screen.getByRole('heading', { name: 'Fleet Foot' }).parentElement.parentElement).toHaveTextContent('Unlocked');
    expect(screen.getByRole('heading', { name: 'Air Dancer' }).parentElement.parentElement).toHaveTextContent('Cost: 2 points');
    expect(screen.getByRole('heading', { name: 'Air Dancer' }).parentElement.parentElement).toHaveTextContent('Requires: Fleet Foot');

    fireEvent.click(screen.getAllByRole('button', { name: 'Unlock' })[0]);
    expect(screen.getByRole('heading', { name: 'Air Dancer' }).parentElement.parentElement).toHaveTextContent('Unlocked');
    expect(screen.getByText('Available points:').parentElement).toHaveTextContent('Available points: 0');
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
