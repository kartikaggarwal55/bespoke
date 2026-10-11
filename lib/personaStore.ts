import { defaultPersona, type Persona } from "./persona";

/**
 * The live persona. In-memory and process-local, like the session store — it
 * resets when the dev server restarts, which is the right behaviour for a demo.
 */
let current: Persona = structuredClone(defaultPersona);

export function getPersona(): Persona {
  return current;
}

export function setPersona(next: Persona): void {
  current = next;
}

export function resetPersona(): Persona {
  current = structuredClone(defaultPersona);
  return current;
}
