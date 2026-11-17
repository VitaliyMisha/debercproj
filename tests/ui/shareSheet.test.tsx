// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../src/i18n';
import { ShareSheet } from '../../src/components/ShareSheet';

afterEach(cleanup);

describe('ShareSheet copy button', () => {
  it('copies the link, flips to the copied state and announces it once', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<ShareSheet shareUrl="https://x.test/?watch=AB12" onStopSharing={vi.fn()} onClose={vi.fn()} />);

    const btn = screen.getByRole('button', { name: 'Копіювати посилання' });
    expect(btn.getAttribute('data-copied')).toBe('false');
    fireEvent.click(btn);

    expect(writeText).toHaveBeenCalledWith('https://x.test/?watch=AB12');
    await waitFor(() => expect(btn.getAttribute('data-copied')).toBe('true'));
    // the visual labels are aria-hidden; the button name and one live region carry the state
    expect(btn.getAttribute('aria-label')).toBe('Скопійовано');
    expect(screen.getByRole('status').textContent).toBe('Скопійовано');
  });
});
