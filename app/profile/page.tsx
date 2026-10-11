"use client";

import Link from "next/link";
import { useState } from "react";
import { defaultPersona, type Persona } from "@/lib/persona";
import { usePersona } from "@/lib/usePersona";

const field =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/30";

export default function ProfilePage() {
  const [saved, save] = usePersona();
  // Edit a local draft; nothing touches localStorage until Save.
  const [draft, setDraft] = useState<Persona | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const p = draft ?? saved;

  function edit(next: Partial<Persona>) {
    setDraft({ ...p, ...next });
    setStatus(null);
  }

  function setLine(i: number, value: string) {
    edit({ profile: p.profile.map((l, j) => (j === i ? value : l)) });
  }

  function onSave() {
    save({
      name: p.name.trim() || defaultPersona.name,
      photo: p.photo.trim() || defaultPersona.photo,
      profile: p.profile.map((l) => l.trim()).filter(Boolean),
    });
    setDraft(null);
    setStatus("Saved");
  }

  function onReset() {
    save(null);
    setDraft(null);
    setStatus("Reset to default");
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-8">
      <Link href="/" className="text-xs text-muted transition hover:text-ink">
        ← Back
      </Link>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">Your profile</h1>
      <p className="mt-1 text-sm text-muted">
        Stored in this browser only. Your agent reads it on every journey.
      </p>

      <div className="mt-6 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.photo} alt="" className="size-20 shrink-0 rounded-full object-cover ring-1 ring-line" />
        <label className="block flex-1">
          <span className="mb-1 block text-[10px] tracking-wide text-faint uppercase">
            Photo URL — the merchant fetches this, so it must be public
          </span>
          <input value={p.photo} onChange={(e) => edit({ photo: e.target.value })} className={field} />
        </label>
      </div>

      <label className="mt-5 block">
        <span className="mb-1 block text-[10px] tracking-wide text-faint uppercase">Name</span>
        <input value={p.name} onChange={(e) => edit({ name: e.target.value })} className={field} />
      </label>

      <div className="mt-5">
        <span className="mb-1 block text-[10px] tracking-wide text-faint uppercase">
          About you — shared with the merchant exactly as written
        </span>
        <ul className="space-y-2">
          {p.profile.map((line, i) => (
            <li key={i} className="flex gap-2">
              <input
                value={line}
                onChange={(e) => setLine(i, e.target.value)}
                className={field}
              />
              <button
                onClick={() => edit({ profile: p.profile.filter((_, j) => j !== i) })}
                aria-label="Remove"
                className="px-2 text-muted transition hover:text-ink"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => edit({ profile: [...p.profile, ""] })}
          className="mt-2 text-xs text-muted underline transition hover:text-ink"
        >
          Add a line
        </button>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={onSave}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Save
        </button>
        <button onClick={onReset} className="text-xs text-muted underline transition hover:text-ink">
          Reset to default
        </button>
        {status && <span className="text-xs text-faint">{status}</span>}
      </div>
    </div>
  );
}
