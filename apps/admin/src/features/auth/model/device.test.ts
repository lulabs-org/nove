import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDeviceId, getDeviceInfo } from './device';

describe('device helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getDeviceId', () => {
    it('returns existing device id from localStorage if present', () => {
      localStorage.setItem('nove-device-id', 'existing-device-id-123');

      expect(getDeviceId()).toBe('existing-device-id-123');
    });

    it('generates, stores, and returns a new device id when none exists', () => {
      vi.spyOn(window.crypto, 'randomUUID').mockReturnValue('11111111-2222-3333-4444-555555555555');

      const id = getDeviceId();

      expect(id).toBe('11111111-2222-3333-4444-555555555555');
      expect(localStorage.getItem('nove-device-id')).toBe('11111111-2222-3333-4444-555555555555');
    });
  });

  describe('getDeviceInfo', () => {
    it('prioritizes navigator.userAgentData.platform when available', () => {
      Object.defineProperty(window.navigator, 'userAgentData', {
        value: { platform: 'macOS' },
        configurable: true,
      });

      expect(getDeviceInfo()).toBe('Web · macOS');
    });

    it('identifies macOS from userAgent when userAgentData is absent', () => {
      Object.defineProperty(window.navigator, 'userAgentData', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        configurable: true,
      });

      expect(getDeviceInfo()).toBe('Web · macOS');
    });

    it('identifies Windows from userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgentData', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });

      expect(getDeviceInfo()).toBe('Web · Windows');
    });

    it('identifies Android from userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgentData', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36',
        configurable: true,
      });

      expect(getDeviceInfo()).toBe('Web · Android');
    });

    it('identifies iOS from userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgentData', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      });

      expect(getDeviceInfo()).toBe('Web · iOS');
    });

    it('identifies Linux from userAgent', () => {
      Object.defineProperty(window.navigator, 'userAgentData', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
        configurable: true,
      });

      expect(getDeviceInfo()).toBe('Web · Linux');
    });

    it('falls back to 未知系统 when userAgent is unknown', () => {
      Object.defineProperty(window.navigator, 'userAgentData', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'CustomUnknownBot/1.0',
        configurable: true,
      });

      expect(getDeviceInfo()).toBe('Web · 未知系统');
    });
  });
});
