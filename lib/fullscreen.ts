/**
 * Cross-browser Fullscreen Utility with iOS / iPhone Support
 */

export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isIPhone(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPhone|iPod/i.test(navigator.userAgent);
}

export function isFullscreenActive(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.webkitCurrentFullScreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  const docEl = document.documentElement as any;

  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled ||
    docEl.requestFullscreen ||
    docEl.webkitRequestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.msRequestFullscreen
  );
}

export async function toggleFullscreen(): Promise<{
  success: boolean;
  isIPhoneDevice: boolean;
  active: boolean;
}> {
  if (typeof document === 'undefined') {
    return { success: false, isIPhoneDevice: false, active: false };
  }

  const doc = document as any;
  const docEl = document.documentElement as any;
  const isIPhoneDevice = isIPhone();

  const active = isFullscreenActive();

  if (active) {
    // Exit fullscreen
    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
      }
      return { success: true, isIPhoneDevice, active: false };
    } catch {
      return { success: false, isIPhoneDevice, active: true };
    }
  } else {
    // On iPhone devices, Safari does not support Element.requestFullscreen()
    if (isIPhoneDevice) {
      return { success: false, isIPhoneDevice: true, active: false };
    }

    try {
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      } else if (docEl.webkitRequestFullScreen) {
        await docEl.webkitRequestFullScreen();
      } else if (docEl.mozRequestFullScreen) {
        await docEl.mozRequestFullScreen();
      } else if (docEl.msRequestFullscreen) {
        await docEl.msRequestFullscreen();
      } else {
        return { success: false, isIPhoneDevice, active: false };
      }
      return { success: true, isIPhoneDevice, active: true };
    } catch {
      return { success: false, isIPhoneDevice, active: false };
    }
  }
}
