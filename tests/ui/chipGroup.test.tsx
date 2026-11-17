// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ChipGroup } from '../../src/components/ChipGroup';

// jsdom has no layout: give each chip a 50px-wide slot 60px apart in a 300×36 group.
const proto = HTMLElement.prototype;
const saved = ['offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight', 'clientWidth', 'clientHeight'].map(
  (k) => [k, Object.getOwnPropertyDescriptor(proto, k)] as const
);
beforeAll(() => {
  const isChip = (el: HTMLElement) => el.tagName === 'BUTTON';
  const def = (k: string, get: (this: HTMLElement) => number) => Object.defineProperty(proto, k, { configurable: true, get });
  def('offsetLeft', function () {
    return isChip(this) ? Array.from(this.parentElement?.querySelectorAll('button') ?? []).indexOf(this as HTMLButtonElement) * 60 : 0;
  });
  def('offsetTop', () => 0);
  def('offsetWidth', function () {
    return isChip(this) ? 50 : 300;
  });
  def('offsetHeight', () => 36);
  def('clientWidth', () => 300);
  def('clientHeight', () => 36);
});
afterAll(() => {
  for (const [k, d] of saved) if (d) Object.defineProperty(proto, k, d);
});
afterEach(cleanup);

const Harness = () => {
  const [v, setV] = useState(1);
  const opts = [1, 2, 3].map((n) => ({ label: `#${n}`, value: n }));
  return <ChipGroup options={opts} value={v} onChange={setV} />;
};

const pill = (c: HTMLElement) => c.querySelector<HTMLElement>('span[aria-hidden="true"]');

describe('ChipGroup sliding pill', () => {
  it('places the pill under the active chip without animating on first paint', () => {
    const { container } = render(<Harness />);
    const p = pill(container);
    expect(p?.style.left).toBe('0px');
    expect(p?.style.right).toBe('250px');
    expect(p?.style.transition).toBe('none');
  });

  it('moving right: the right edge leads (fast) and the left edge trails (slow)', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '#3' }));
    const p = pill(container);
    expect(p?.style.left).toBe('120px');
    expect(p?.style.transition).toContain('right 240ms');
    expect(p?.style.transition).toContain('left 460ms');
  });

  it('moving left flips which edge leads', () => {
    const { container } = render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '#3' }));
    fireEvent.click(screen.getByRole('button', { name: '#1' }));
    expect(pill(container)?.style.transition).toContain('left 240ms');
  });

  it('keeps aria-pressed on the chosen chip', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: '#2' }));
    expect(screen.getByRole('button', { name: '#2' }).getAttribute('aria-pressed')).toBe('true');
  });
});
