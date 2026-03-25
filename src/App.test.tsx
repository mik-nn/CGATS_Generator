import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows an alert when downloading with no primaries selected', () => {
    // Mock window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);

    // By default, C, M, Y, K are selected. Let's deselect them.
    const buttonC = screen.getByRole('button', { name: 'C' });
    const buttonM = screen.getByRole('button', { name: 'M' });
    const buttonY = screen.getByRole('button', { name: 'Y' });
    const buttonK = screen.getByRole('button', { name: 'K' });

    // Deselect all default primaries
    fireEvent.click(buttonC);
    fireEvent.click(buttonM);
    fireEvent.click(buttonY);
    fireEvent.click(buttonK);

    // Find and click the download button
    const downloadButton = screen.getByRole('button', { name: /Download CGATS File/i });
    fireEvent.click(downloadButton);

    // Verify alert was called with the correct message
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledWith('Please select at least one primary.');

    // Cleanup mock
    alertMock.mockRestore();
  });
});
