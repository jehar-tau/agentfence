import { describe, expect, it, vi } from 'vitest';
import { attachCopyListener } from '../core/provenance/copy-listener';

function fakeTarget() {
  const listeners = new Map<string, () => void>();
  return {
    addEventListener: vi.fn((type: string, handler: () => void) => listeners.set(type, handler)),
    removeEventListener: vi.fn((type: string) => listeners.delete(type)),
    fireCopy() {
      listeners.get('copy')?.();
    },
  };
}

describe('attachCopyListener', () => {
  it('reports the selection text on a copy event', () => {
    const target = fakeTarget();
    const onCopy = vi.fn();
    attachCopyListener(target, () => 'secret value', onCopy);

    target.fireCopy();
    expect(onCopy).toHaveBeenCalledWith('secret value');
  });

  it('does not report an empty selection', () => {
    const target = fakeTarget();
    const onCopy = vi.fn();
    attachCopyListener(target, () => '', onCopy);

    target.fireCopy();
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('removes the listener when the cleanup function is called', () => {
    const target = fakeTarget();
    const detach = attachCopyListener(target, () => 'x', vi.fn());
    detach();
    expect(target.removeEventListener).toHaveBeenCalledWith('copy', expect.any(Function));
  });
});
