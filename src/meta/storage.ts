/** Schlüssel-Wert-Speicher. Im MVP localStorage, später z. B. ein Konto bei Supabase. */
export interface Store {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/** localStorage kann fehlen oder gesperrt sein (privater Modus): dann läuft das Spiel ohne Speichern weiter */
export const localStore: Store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* nicht speicherbar */ } }
};

export function memoryStore(initial: Record<string, string> = {}): Store {
  const data = new Map(Object.entries(initial));
  return { get: k => data.get(k) ?? null, set: (k, v) => { data.set(k, v); } };
}
