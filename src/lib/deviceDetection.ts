// Device covariate detection (non-identifying, non-invasive)

export interface DeviceInfo {
  viewport_w: number;
  viewport_h: number;
  device_class: 'phone' | 'tablet' | 'desktop';
  input_type: 'touch' | 'mouse';
}

export function detectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      viewport_w: 1280,
      viewport_h: 800,
      device_class: 'desktop',
      input_type: 'mouse',
    };
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);

  let device_class: 'phone' | 'tablet' | 'desktop' = 'desktop';
  if (minDim < 600) {
    device_class = 'phone';
  } else if (minDim >= 600 && maxDim <= 1200) {
    device_class = 'tablet';
  }

  const isTouch =
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  const input_type: 'touch' | 'mouse' = isTouch ? 'touch' : 'mouse';

  return {
    viewport_w: w,
    viewport_h: h,
    device_class,
    input_type,
  };
}
