const DEVICE_ID_KEY = 'nove-device-id';

export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = window.crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: {
    platform: string;
  };
}

export function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') {
    return 'Web · 未知系统';
  }

  const uaDataPlatform = (navigator as NavigatorWithUAData).userAgentData?.platform;
  if (uaDataPlatform) {
    return `Web · ${uaDataPlatform}`;
  }

  const ua = navigator.userAgent || '';
  let os = '未知系统';

  if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  return `Web · ${os}`;
}
