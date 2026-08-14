/**
 * Singleton store-settings loader.
 * Components call `useSettings()` and get a cached StoreSettings object.
 * Falls back to DEFAULT_SETTINGS if Supabase is unreachable.
 */
import { supabase, StoreSettings, DEFAULT_SETTINGS } from "./supabase";
import { useState, useEffect } from "react";

let _cache: StoreSettings | null = null;

export async function fetchSettings(): Promise<StoreSettings> {
  if (_cache) return _cache;
  try {
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (data) { _cache = data as StoreSettings; return _cache; }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);
  return settings;
}

/** Bust the cache so admin saves take effect immediately */
export function bustSettingsCache() { _cache = null; }
