import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { expect, test, vi, beforeEach, afterEach, describe } from 'vitest';

describe('App component', () => {
  let createObjectURLMock: any;
  let revokeObjectURLMock: any;

  beforeEach(() => {
    // Mock URL methods
    createObjectURLMock = vi.fn().mockReturnValue('mock-url');
    revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    // Mock alert
    window.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('generates valid CGATS content for single patch edge case without NaN', async () => {
    const user = userEvent.setup();
    render(<App />);

    const mockClick = vi.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
      style: {}
    };

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') return mockAnchor as any;
      return originalCreateElement(tag);
    });

    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);

    // Keep only C selected
    const mButton = screen.getByRole('button', { name: 'M' });
    const yButton = screen.getByRole('button', { name: 'Y' });
    const kButton = screen.getByRole('button', { name: 'K' });
    await user.click(mButton);
    await user.click(yButton);
    await user.click(kButton);

    // Set number of patches to 1 using fireEvent as user.type on number inputs can be flaky in jsdom
    const patchesInput = screen.getByRole('spinbutton') as HTMLInputElement;
    fireEvent.change(patchesInput, { target: { value: '1' } });
    expect(patchesInput.value).toBe('1'); // Verify it actually changed

    // Trigger download
    const downloadBtn = screen.getByRole('button', { name: /Download CGATS File/i });
    await user.click(downloadBtn);

    // Verify download was triggered
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);

    // Get the blob passed to createObjectURL
    const blob = createObjectURLMock.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);

    // Read blob content
    const content = await blob.text();

    // Parse content to check for expected values
    const lines = content.split('\n');

    // Find the data section
    const beginDataIdx = lines.findIndex(l => l === 'BEGIN_DATA');
    expect(beginDataIdx).toBeGreaterThan(-1);

    const endDataIdx = lines.findIndex(l => l === 'END_DATA');
    expect(endDataIdx).toBeGreaterThan(beginDataIdx);

    const dataLines = lines.slice(beginDataIdx + 1, endDataIdx);
    expect(dataLines.length).toBe(1); // Should only be 1 patch since we selected 1 primary and 1 patch

    // Expected format: ID Row Col C M Y K
    const fields = dataLines[0].split('\t');
    expect(fields.length).toBe(7);

    const cValue = fields[3];
    const mValue = fields[4];
    const yValue = fields[5];
    const kValue = fields[6];

    expect(cValue).toBe('100.00');
    expect(mValue).toBe('0.00');
    expect(yValue).toBe('0.00');
    expect(kValue).toBe('0.00');

    // Specifically verify there is no NaN string which happens with division by zero
    expect(content).not.toContain('NaN');

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  test('default render state is correct', () => {
    render(<App />);

    // Verify default inputs
    expect(screen.getByText('CGATS 1.7 Generator')).toBeInTheDocument();

    const patchesInput = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(patchesInput.value).toBe('11');

    expect(screen.getByRole('button', { name: 'C' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CMY' })).toBeInTheDocument();
  });
});
