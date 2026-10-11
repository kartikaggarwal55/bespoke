"use client";

import { useState } from "react";
import type { Persona } from "@/lib/persona";

/**
 * Memory is edited as raw JSON rather than as a generated form. It's nested and
 * free-shaped, the agent consumes it as JSON anyway, and a form would quietly
 * constrain what you can put in it — which is the opposite of the point.
 */
export function ProfileEditor({
  persona,
  onSaved,
  disabled,
}: {
  persona: Persona;
  onSaved: (p: Persona) => void;
  disabled: boolean;
}) {
  const [name, setName] = useState(persona.name);
  const [photo, setPhoto] = useState(persona.photo);
  const [memory, setMemory] = useState(() => JSON.stringify(persona.memory, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function apply(p: Persona) {
    setName(p.name);
    setPhoto(p.photo);
    setMemory(JSON.stringify(p.memory, null, 2));
    setError(null);
    onSaved(p);
  }

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(memory);
    } catch (e) {
      setError(`Invalid JSON — ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setError("Memory must be a JSON object, not an array or a bare value.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/persona", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, photo, memory: parsed }),
    });
    setBusy(false);

    if (!res.ok) {
      setError(((await res.json()) as { error?: string }).error ?? "Could not save.");
      return;
    }
    apply((await res.json()) as Persona);
  }

  async function restore() {
    setBusy(true);
    const res = await fetch("/api/persona", { method: "DELETE" });
    setBusy(false);
    apply((await res.json()) as Persona);
  }

  const field =
    "w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-ink/30 disabled:opacity-50";

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-medium tracking-[0.12em] text-faint uppercase">
        What your agent remembers
      </p>

      <div className="flex items-end gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt=""
          className="size-12 shrink-0 rounded-md object-cover ring-1 ring-line"
        />
        <label className="flex-1">
          <span className="mb-1 block text-[10px] tracking-wide text-faint uppercase">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={disabled || busy} className={field} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-[10px] tracking-wide text-faint uppercase">
          Photo URL — the merchant fetches this, so it must be public
        </span>
        <input value={photo} onChange={(e) => setPhoto(e.target.value)} disabled={disabled || busy} className={field} />
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] tracking-wide text-faint uppercase">Memory (JSON)</span>
        <textarea
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          disabled={disabled || busy}
          spellCheck={false}
          rows={16}
          className={`${field} resize-y font-mono leading-relaxed`}
        />
      </label>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={disabled || busy}
          className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:bg-line disabled:text-faint"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
        <button
          onClick={restore}
          disabled={disabled || busy}
          className="text-xs text-muted underline transition hover:text-ink disabled:opacity-40"
        >
          Reset to default
        </button>
        <span className="text-[11px] text-faint">
          {disabled ? "Finish the current journey first" : "Saving clears the conversation"}
        </span>
      </div>
    </div>
  );
}
