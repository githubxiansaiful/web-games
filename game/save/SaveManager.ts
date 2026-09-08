export interface SaveData {
  version: number;
  cash: number;
  completedMissions: string[];
  lastSavedAt: string;
}

export class SaveManager {
  private static readonly STORAGE_KEY = 'apex_city_save_data';

  public static save(cash: number, completedMissions: string[] = []): void {
    if (typeof window === 'undefined') return;
    try {
      const data: SaveData = {
        version: 1,
        cash,
        completedMissions,
        lastSavedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable
    }
  }

  public static load(): SaveData | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  public static clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }
}
