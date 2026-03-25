import { describe, it, expect } from 'vitest';
import { generateCGATSContent } from './App';

describe('generateCGATSContent', () => {
  it('generates content with default parameters', () => {
    const content = generateCGATSContent(['C', 'M', 'Y', 'K'], 11, 'portrait');

    // Header checks
    expect(content).toContain('CGATS.17');
    expect(content).toContain('ORIGINATOR\t"Web CGATS Generator"');
    expect(content).toContain('DESCRIPTOR\t"Custom CMYK Target"');

    // Format and Set checks
    expect(content).toContain('NUMBER_OF_FIELDS\t7');
    expect(content).toContain('BEGIN_DATA_FORMAT');
    expect(content).toContain('SAMPLE_ID\tRow\tCol\tCMYK_C\tCMYK_M\tCMYK_Y\tCMYK_K');
    expect(content).toContain('END_DATA_FORMAT');
    expect(content).toContain('NUMBER_OF_SETS\t44'); // 4 primaries * 11 patches
    expect(content).toContain('BEGIN_DATA');
    expect(content).toContain('END_DATA');

    // Sample data check for first and last patch
    // Patch 1: C=0, M=0, Y=0, K=0 (Portrait, C is first primary so col=1, row=1)
    expect(content).toContain('1\t1\t1\t0.00\t0.00\t0.00\t0.00');
    // Patch 44: C=0, M=0, Y=0, K=100 (Portrait, K is 4th primary so col=4, row=11)
    expect(content).toContain('44\t11\t4\t0.00\t0.00\t0.00\t100.00');
  });

  it('generates content with landscape orientation', () => {
    const content = generateCGATSContent(['C', 'M', 'Y', 'K'], 11, 'landscape');

    expect(content).toContain('NUMBER_OF_SETS\t44');

    // In landscape:
    // PIdx (Primary index) becomes row.
    // SIdx (Step index) becomes col.
    // Patch 1: C=0, M=0, Y=0, K=0 (Landscape, C is first primary so row=1, col=1)
    expect(content).toContain('1\t1\t1\t0.00\t0.00\t0.00\t0.00');

    // Patch 44: K primary, row=4, col=11 (100% K)
    expect(content).toContain('44\t4\t11\t0.00\t0.00\t0.00\t100.00');
  });

  it('generates content with different combinations of primaries', () => {
    const content = generateCGATSContent(['CM', 'CMY'], 5, 'portrait');

    expect(content).toContain('NUMBER_OF_SETS\t10'); // 2 primaries * 5 patches

    // CM primary (row=1, col=1) for 0%
    expect(content).toContain('1\t1\t1\t0.00\t0.00\t0.00\t0.00');
    // The patches are sorted by row then col.
    // CM primary (row=5, col=1) is the 9th patch in the sorted list.
    expect(content).toContain('9\t5\t1\t100.00\t100.00\t0.00\t0.00');

    // CMY primary (row=1, col=2) is the 2nd patch in the sorted list.
    expect(content).toContain('2\t1\t2\t0.00\t0.00\t0.00\t0.00');
    // CMY primary (row=5, col=2) is the 10th patch in the sorted list.
    expect(content).toContain('10\t5\t2\t100.00\t100.00\t100.00\t0.00');
  });

  it('generates content with an edge case of 1 patch', () => {
    const content = generateCGATSContent(['C'], 1, 'portrait');

    expect(content).toContain('NUMBER_OF_SETS\t1');

    // When numPatches is 1, stepVal is explicitly 100.0
    expect(content).toContain('1\t1\t1\t100.00\t0.00\t0.00\t0.00');
  });
});
