import * as THREE from 'three';

export interface GunTransform {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotationDeg: {
    x: number;
    y: number;
    z: number;
  };
  scale: number;
}

export interface GunSettingsConfig {
  handSocket: {
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotationDeg: {
      x: number;
      y: number;
      z: number;
    };
  };
  pistol: GunTransform;
  shotgun: GunTransform;
  rifle: GunTransform;
}

export const DEFAULT_GUN_SETTINGS: GunSettingsConfig = {
  /**
   * Root hand socket on the character's right hand bone ('hand_r').
   * Position: centered in right palm (x: -0.015, y: 0.07, z: 0.01).
   * Rotation: pitch -100.6 deg, yaw 1.7 deg, roll 177.6 deg aligns the barrel
   * horizontally forward (0, 0, -1) and gun sights upright (0, 1, 0).
   */
  handSocket: {
    position: {
      x: -0.015,
      y: 0.07,
      z: 0.01,
    },
    rotationDeg: {
      x: -100.6,
      y: 1.7,
      z: 177.6,
    },
  },

  /**
   * PISTOL (Pistol_1)
   */
  pistol: {
    position: {
      x: 0.0,
      y: -0.015,
      z: 0.02,
    },
    rotationDeg: {
      x: 0,
      y: 0,
      z: 0,
    },
    scale: 1.0,
  },

  /**
   * SHOTGUN (Shotgun_1)
   */
  shotgun: {
    position: {
      x: 0.0,
      y: 0.0,
      z: -0.08,
    },
    rotationDeg: {
      x: 0,
      y: 0,
      z: 0,
    },
    scale: 0.95,
  },

  /**
   * ASSAULT RIFLE (AssaultRifle_1)
   */
  rifle: {
    position: {
      x: 0.0,
      y: 0.0,
      z: -0.05,
    },
    rotationDeg: {
      x: 0,
      y: 0,
      z: 0,
    },
    scale: 0.95,
  },
};

const STORAGE_KEY = 'zombie_haven_gun_settings_v2';

function loadInitialSettings(): GunSettingsConfig {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          handSocket: { ...DEFAULT_GUN_SETTINGS.handSocket, ...(parsed.handSocket || {}) },
          pistol: { ...DEFAULT_GUN_SETTINGS.pistol, ...(parsed.pistol || {}) },
          shotgun: { ...DEFAULT_GUN_SETTINGS.shotgun, ...(parsed.shotgun || {}) },
          rifle: { ...DEFAULT_GUN_SETTINGS.rifle, ...(parsed.rifle || {}) },
        };
      }
    } catch (e) {
      console.warn('[GunSettings] Could not load localStorage settings:', e);
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_GUN_SETTINGS));
}

export const GUN_SETTINGS: GunSettingsConfig = loadInitialSettings();

export function saveGunSettings(newSettings: GunSettingsConfig) {
  Object.assign(GUN_SETTINGS.handSocket, newSettings.handSocket);
  Object.assign(GUN_SETTINGS.pistol, newSettings.pistol);
  Object.assign(GUN_SETTINGS.shotgun, newSettings.shotgun);
  Object.assign(GUN_SETTINGS.rifle, newSettings.rifle);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(GUN_SETTINGS));
    } catch (e) {
      console.warn('[GunSettings] Could not save to localStorage:', e);
    }
  }
}

export function resetGunSettings() {
  saveGunSettings(DEFAULT_GUN_SETTINGS);
}

/**
 * Apply a gun transform to a mesh.
 */
export function applyGunTransform(
  gun: THREE.Object3D,
  transform: GunTransform
) {
  gun.position.set(
    transform.position.x,
    transform.position.y,
    transform.position.z
  );

  gun.rotation.set(
    THREE.MathUtils.degToRad(transform.rotationDeg.x),
    THREE.MathUtils.degToRad(transform.rotationDeg.y),
    THREE.MathUtils.degToRad(transform.rotationDeg.z)
  );

  gun.scale.setScalar(transform.scale);
}

/**
 * Apply the hand socket transform.
 */
export function applySocketTransform(
  socket: THREE.Object3D,
  transform: GunSettingsConfig['handSocket']
) {
  socket.position.set(
    transform.position.x,
    transform.position.y,
    transform.position.z
  );

  socket.rotation.set(
    THREE.MathUtils.degToRad(transform.rotationDeg.x),
    THREE.MathUtils.degToRad(transform.rotationDeg.y),
    THREE.MathUtils.degToRad(transform.rotationDeg.z)
  );
}