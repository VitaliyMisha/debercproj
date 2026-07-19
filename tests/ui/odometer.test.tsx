// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Odometer } from '../../src/components/Odometer';

afterEach(cleanup);

const stripOffsets = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll<HTMLElement>('.odometer-strip')).map((s) => s.style.transform);

describe('Odometer', () => {
  it('exposes the numeric value to screen readers', () => {
    render(<Odometer value={523} />);
    expect(screen.getByLabelText('523')).toBeTruthy();
  });

  it('renders one rolling strip per digit, offset to the digit value', () => {
    const { container } = render(<Odometer value={523} />);
    expect(stripOffsets(container)).toEqual(['translateY(-5em)', 'translateY(-2em)', 'translateY(-3em)']);
  });

  it('renders a minus sign for negative values', () => {
    render(<Odometer value={-40} />);
    expect(screen.getByLabelText('-40').textContent).toContain('-');
  });

  it('keeps digit columns keyed from the right so 99→102 rolls instead of remounting', () => {
    const { container, rerender } = render(<Odometer value={99} />);
    const onesStripBefore = container.querySelectorAll('.odometer-strip')[1];
    rerender(<Odometer value={102} />);
    const strips = container.querySelectorAll('.odometer-strip');
    expect(strips).toHaveLength(3);
    // the ones column is the same DOM node — it rolls, no remount
    expect(strips[2]).toBe(onesStripBefore);
  });
});
