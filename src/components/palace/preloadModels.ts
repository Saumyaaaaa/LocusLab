// Preloads all CC0 palace 3D models into browser cache during consent & imagery steps.
import { useGLTF } from '@react-three/drei';
import { PALACE_LOCI } from '../../data/loci';

let preloadingStarted = false;

/**
 * Initiates non-blocking background preloading of all 20 palace 3D models.
 * Safe to call multiple times (idempotent).
 */
export function preloadPalaceModels(): void {
  if (preloadingStarted || typeof window === 'undefined') return;
  preloadingStarted = true;

  try {
    for (const locus of PALACE_LOCI) {
      if (locus.modelFile) {
        useGLTF.preload(`/models/${locus.modelFile}`);
      }
    }
  } catch (err) {
    // Non-fatal: if preloading fails in background, runtime fallback is active
    console.warn('Background palace model preloading encounter:', err);
  }
}
