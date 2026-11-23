import { Injectable, OnDestroy, signal } from '@angular/core';

export const MAP_PREFERENCES_STORAGE_KEY = 'ngx-perfect-stack.map-preferences';
export const MAP_PREFERENCES_SCHEMA_VERSION = 1;

export type PersistentMapSizeMode = 'small' | 'medium' | 'split';
export type MapBasemap = 'topo' | 'satellite';

export interface MapPreferences {
  version: number;
  sizeMode?: PersistentMapSizeMode;
  basemap?: MapBasemap;
  referenceLayerVisibility?: Record<string, boolean>;
  /** Allow future persisted map properties without breaking existing serialized state. */
  [key: string]: unknown;
}

const VALID_SIZE_MODES = new Set<string>(['small', 'medium', 'split']);
const VALID_BASEMAPS = new Set<string>(['topo', 'satellite']);

function createDefaultPreferences(): MapPreferences {
  return {
    version: MAP_PREFERENCES_SCHEMA_VERSION,
  };
}

@Injectable({
  providedIn: 'root',
})
export class MapPreferencesService implements OnDestroy {
  readonly preferences = signal<MapPreferences>(this.readFromStorage());

  private storageListener?: (event: StorageEvent) => void;

  constructor() {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      this.storageListener = (event: StorageEvent) => {
        if (event.key === MAP_PREFERENCES_STORAGE_KEY || event.key === null) {
          this.preferences.set(this.readFromStorage());
        }
      };
      window.addEventListener('storage', this.storageListener);
    }
  }

  ngOnDestroy(): void {
    if (this.storageListener && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = undefined;
    }
  }

  getPreferences(): MapPreferences {
    return this.preferences();
  }

  getValue<K extends keyof MapPreferences>(key: K): MapPreferences[K] {
    return this.preferences()[key];
  }

  setValue<K extends keyof MapPreferences>(key: K, value: MapPreferences[K]): void {
    this.updatePreferences({ [key]: value } as Partial<MapPreferences>);
  }

  updatePreferences(patch: Partial<MapPreferences>): void {
    const current = this.preferences();
    const merged: MapPreferences = {
      ...current,
      ...patch,
      version: MAP_PREFERENCES_SCHEMA_VERSION,
    };
    const sanitized = this.sanitize(merged);
    this.preferences.set(sanitized);
    this.writeToStorage(sanitized);
  }

  clearPreferences(): void {
    const defaults = createDefaultPreferences();
    this.preferences.set(defaults);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(MAP_PREFERENCES_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors (e.g. private mode / restricted storage)
    }
  }

  getSizeMode(): PersistentMapSizeMode | undefined {
    const mode = this.preferences().sizeMode;
    return mode && VALID_SIZE_MODES.has(mode) ? mode : undefined;
  }

  setSizeMode(mode: string): void {
    // Fullscreen is intentionally transient and never persisted across sessions
    if (!VALID_SIZE_MODES.has(mode)) {
      return;
    }
    this.updatePreferences({ sizeMode: mode as PersistentMapSizeMode });
  }

  getBasemap(): MapBasemap | undefined {
    const basemap = this.preferences().basemap;
    return basemap && VALID_BASEMAPS.has(basemap) ? basemap : undefined;
  }

  setBasemap(basemap: MapBasemap): void {
    if (!VALID_BASEMAPS.has(basemap)) {
      return;
    }
    this.updatePreferences({ basemap });
  }

  getReferenceLayerVisibility(layerId: string): boolean | undefined {
    if (!layerId) {
      return undefined;
    }
    const map = this.preferences().referenceLayerVisibility;
    if (!map || typeof map !== 'object') {
      return undefined;
    }
    const val = map[layerId];
    return typeof val === 'boolean' ? val : undefined;
  }

  getAllReferenceLayerVisibility(): Record<string, boolean> {
    const map = this.preferences().referenceLayerVisibility;
    return map ? { ...map } : {};
  }

  setReferenceLayerVisible(layerId: string, visible: boolean): void {
    if (!layerId) {
      return;
    }
    const existing = this.getAllReferenceLayerVisibility();
    existing[layerId] = Boolean(visible);
    this.updatePreferences({ referenceLayerVisibility: existing });
  }

  private sanitize(raw: unknown): MapPreferences {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return createDefaultPreferences();
    }

    const input = raw as Record<string, unknown>;
    const result: MapPreferences = {
      ...input,
      version: MAP_PREFERENCES_SCHEMA_VERSION,
    };

    if (typeof input['sizeMode'] === 'string' && VALID_SIZE_MODES.has(input['sizeMode'])) {
      result.sizeMode = input['sizeMode'] as PersistentMapSizeMode;
    } else {
      delete result.sizeMode;
    }

    if (typeof input['basemap'] === 'string' && VALID_BASEMAPS.has(input['basemap'])) {
      result.basemap = input['basemap'] as MapBasemap;
    } else {
      delete result.basemap;
    }

    if (
      input['referenceLayerVisibility'] &&
      typeof input['referenceLayerVisibility'] === 'object' &&
      !Array.isArray(input['referenceLayerVisibility'])
    ) {
      const cleaned: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(input['referenceLayerVisibility'] as Record<string, unknown>)) {
        if (typeof v === 'boolean') {
          cleaned[k] = v;
        }
      }
      result.referenceLayerVisibility = cleaned;
    } else {
      delete result.referenceLayerVisibility;
    }

    return result;
  }

  private readFromStorage(): MapPreferences {
    try {
      if (typeof localStorage === 'undefined') {
        return createDefaultPreferences();
      }
      const raw = localStorage.getItem(MAP_PREFERENCES_STORAGE_KEY);
      if (!raw) {
        return createDefaultPreferences();
      }
      const parsed = JSON.parse(raw);
      return this.sanitize(parsed);
    } catch {
      return createDefaultPreferences();
    }
  }

  private writeToStorage(prefs: MapPreferences): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(MAP_PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage quota or security errors gracefully
    }
  }
}
