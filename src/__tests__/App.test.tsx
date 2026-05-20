import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App - Clipboard Copy', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  it('copies python script to clipboard and resets copied state after 2 seconds', async () => {
    render(<App />);

    const copyButton = screen.getByRole('button', { name: /copy code/i });
    expect(copyButton).toBeInTheDocument();

    // Initial state: not copied
    expect(screen.getByText('Copy Code')).toBeInTheDocument();
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

    // Click to copy using fireEvent to avoid userEvent async fake timer issues
    fireEvent.click(copyButton);

    // Verify clipboard writeText was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('def generate_cgats'));

    // State changes to copied
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    expect(screen.queryByText('Copy Code')).not.toBeInTheDocument();

    // Advance timers by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // State changes back to copy code
    expect(screen.getByText('Copy Code')).toBeInTheDocument();
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });
});
