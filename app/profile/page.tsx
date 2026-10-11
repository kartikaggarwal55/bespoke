"use client";

import Link from "next/link";
import { useState } from "react";
import { defaultPersona, type Persona } from "@/lib/persona";
import { usePersona } from "@/lib/usePersona";

const field =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-ink/30";

/** Downscale to a small square JPEG so the data URL stays well inside localStorage's quota. */
function toAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 400;
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas
        .getContext("2d")!
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file couldn't be read as an image."));
    };
    img.src = url;
  });
}

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

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      edit({ photo: await toAvatar(file) });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
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

  const uploaded = p.photo.startsWith("data:");

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
        <img src={p.photo} alt="" className="size-20 rounded-full object-cover ring-1 ring-line" />
        <div className="space-y-2">
          <label className="inline-block cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs font-medium transition hover:border-ink/30">
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <p className="text-[11px] text-faint">
            Or paste a public image URL below.
          </p>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="mb-1 block text-[10px] tracking-wide text-faint uppercase">Photo URL</span>
        <input
          value={uploaded ? "" : p.photo}
          placeholder={uploaded ? "Using your uploaded photo" : ""}
          onChange={(e) => edit({ photo: e.target.value })}
          className={field}
        />
      </label>
      {uploaded && (
        <p className="mt-1 text-[11px] text-faint">
          An uploaded photo is sent to the merchant as inline image data. If their page doesn&apos;t
          show it, use a public URL instead.
        </p>
      )}

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
