// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '../../src/i18n';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

const Boom = () => {
  throw new Error('boom');
};

afterEach(cleanup);

describe('ErrorBoundary', () => {
  it('renders children when nothing crashes', () => {
    render(
      <ErrorBoundary>
        <p>все добре</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('все добре')).toBeTruthy();
  });

  it('shows the fallback with a reload button on a render crash', () => {
    // React logs the caught error — silence it so the test output stays clean.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Щось пішло не так')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Перезавантажити' })).toBeTruthy();
    spy.mockRestore();
  });

  it('reload button triggers window.location.reload', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
    });
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    screen.getByRole('button', { name: 'Перезавантажити' }).click();
    expect(reload).toHaveBeenCalled();
    spy.mockRestore();
  });
});
