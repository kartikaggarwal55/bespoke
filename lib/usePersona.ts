"use client";

import { useCallback, useSyncExternalStore } from "react";
import { defaultPersona, type Persona } from "./persona";

const KEY = "bespoke.persona";
const listeners = new Set<() => void>();

// useSyncExternalStore needs a referentially stable snapshot, so parse only
// when the raw string actually changes.
let cachedRaw: string | null = null;
let cached: Persona = defaultPersona;

function read(): Persona {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return defaultPersona;
  }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = defaultPersona;
  if (raw) {
    try {
      const p = JSON.parse(raw) as Partial<Persona>;
      if (typeof p.name === "string" && typeof p.photo === "string" && Array.isArray(p.profile)) {
        cached = { name: p.name, photo: p.photo, profile: p.profile.map(String) };
      }
    } catch {
      /* corrupt entry — fall back to the default */
    }
  }
  return cached;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** The persona from localStorage; the default on the server and before hydration. */
export function usePersona(): [Persona, (p: Persona | null) => void] {
  const persona = useSyncExternalStore(subscribe, read, () => defaultPersona);
  const save = useCallback((p: Persona | null) => {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
    listeners.forEach((l) => l());
  }, []);
  return [persona, save];
}
