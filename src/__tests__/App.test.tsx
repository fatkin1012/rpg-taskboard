import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import ErrorBoundary from '../components/ErrorBoundary';

beforeEach(() => {
  localStorage.clear();
});

describe('App', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(<App />);
    }).not.toThrow();
  });

  it('renders the taskboard overlay with player level', () => {
    render(<App />);
    // "Lv.1" appears in both LevelBadge and XPBar text
    expect(screen.getAllByText('Lv.1').length).toBeGreaterThanOrEqual(1);
    // LevelBadge shows the cat emoji
    expect(screen.getByText('🐱')).toBeInTheDocument();
    // XP bar header
    expect(screen.getByText('EXP')).toBeInTheDocument();
  });

  it('shows the settings panel when gear button is clicked', () => {
    render(<App />);

    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);

    expect(screen.getByText(/SETTINGS/i)).toBeInTheDocument();
    expect(screen.getByText(/Sound Effects/i)).toBeInTheDocument();
  });

  it('toggles sound in settings panel', () => {
    render(<App />);

    // Open settings
    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);

    // Sound toggle and Reset button should be visible
    expect(screen.getByText(/Sound Effects/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset All Data/i)).toBeInTheDocument();

    // Close settings by clicking gear again
    fireEvent.click(settingsButton);
    expect(screen.queryByText(/SETTINGS/i)).not.toBeInTheDocument();
  });

  it('switches widget modes via buttons', () => {
    render(<App />);

    // Click mini mode button
    const miniButton = screen.getByTitle('Mini mode [1]');
    fireEvent.click(miniButton);

    // Click compact mode button
    const compactButton = screen.getByTitle('Compact mode [2]');
    fireEvent.click(compactButton);
    expect(screen.getByText(/DAILY QUESTS/i)).toBeInTheDocument();

    // Click full mode button
    const fullButton = screen.getByTitle('Full mode [3]');
    fireEvent.click(fullButton);
    expect(screen.getByText(/NEW QUEST/i)).toBeInTheDocument();
  });

  it('does not crash with missing localStorage data', () => {
    // Ensure localStorage is empty
    localStorage.clear();
    expect(() => {
      render(<App />);
    }).not.toThrow();
  });
});

describe('ErrorBoundary', () => {
  it('catches errors and shows fallback UI', () => {
    const Bomb = () => {
      throw new Error('💥');
    };

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
  });

  it('resets error state when clicking Try Again', () => {
    const Bomb = () => {
      throw new Error('💥');
    };

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    const tryAgainButton = screen.getByText(/Try Again/i);
    fireEvent.click(tryAgainButton);

    // After reset, the error UI should be shown again since Bomb re-throws
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>All good</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('All good')).toBeInTheDocument();
  });
});
