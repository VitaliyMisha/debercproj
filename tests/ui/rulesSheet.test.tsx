// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { RulesSheet } from '../../src/components/RulesSheet';
import '../../src/i18n';
import { DEFAULT_GAME_RULES } from '../../src/utils/gameHelpers';

beforeAll(() => {
  // jsdom implements neither of these; the component guards for both but the
  // guards must not be what the assertions accidentally rely on.
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
});

afterEach(cleanup);

const renderSheet = (rules = DEFAULT_GAME_RULES, targetScore = 510) =>
  render(<RulesSheet gameRules={rules} targetScore={targetScore} onClose={() => {}} />);

describe('RulesSheet', () => {
  it('renders every section heading in reading order', () => {
    renderSheet();
    const headings = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Гравці та стіл',
      'Як вводити рахунок',
      'Б — бомба',
      'ХВ — хвостик',
      'ВіС — вісімка',
      'Кінець гри',
      'Дилер',
      'Окремі випадки',
    ]);
  });

  it('shows the penalties the player actually configured, not the defaults', () => {
    renderSheet({ ...DEFAULT_GAME_RULES, secondBPenalty: -50, hvPenalty: -25 });

    expect(screen.getByText(/Кожна наступна Б знімає -50 очок/)).toBeTruthy();
    expect(screen.getByText(/Одразу віднімає -25 очок/)).toBeTruthy();
    expect(screen.queryByText(/знімає -100 очок/)).toBeNull();
  });

  it('interpolates the target score into the finish and edge sections', () => {
    renderSheet(DEFAULT_GAME_RULES, 1020);

    expect(screen.getByText(/чи набрав хтось 1020 очок або більше/)).toBeTruthy();
    expect(screen.getByText(/Рівно 1020 очок — це вже перемога/)).toBeTruthy();
  });

  it('hides the ВіС section, its edge cases and the ВіС token when the rule is off', () => {
    renderSheet({ ...DEFAULT_GAME_RULES, allowVis: false });

    expect(screen.queryByRole('heading', { name: 'ВіС — вісімка' })).toBeNull();
    // A ВіС-only edge case must not survive on its own either
    expect(screen.queryByText(/підвішена сума дорівнює нулю/)).toBeNull();
    // Token list switches to the two-token wording
    expect(screen.getByText(/Токенів два: Б і ХВ/)).toBeTruthy();
    expect(screen.queryByText(/Токенів три/)).toBeNull();
    // Non-ВіС edge cases stay
    expect(screen.getByText(/Рівно 510 очок — це вже перемога/)).toBeTruthy();
  });

  it('keeps the ВіС section when the rule is on', () => {
    renderSheet();
    expect(screen.getByRole('heading', { name: 'ВіС — вісімка' })).toBeTruthy();
    expect(screen.getByText(/Токенів три: Б, ХВ і ВіС/)).toBeTruthy();
  });

  it('scrolls to a section when its table-of-contents entry is pressed', async () => {
    const user = userEvent.setup();
    renderSheet();

    const nav = screen.getByRole('navigation', { name: 'Розділи' });
    const dealerLink = within(nav).getByRole('button', { name: 'Дилер' });
    await user.click(dealerLink);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('drops the ВіС entry from the table of contents when the rule is off', () => {
    renderSheet({ ...DEFAULT_GAME_RULES, allowVis: false });
    const nav = screen.getByRole('navigation', { name: 'Розділи' });
    expect(within(nav).queryByRole('button', { name: 'ВіС — вісімка' })).toBeNull();
    expect(within(nav).getByRole('button', { name: 'Дилер' })).toBeTruthy();
  });

  it('closes via the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RulesSheet gameRules={DEFAULT_GAME_RULES} targetScore={510} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Закрити' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
