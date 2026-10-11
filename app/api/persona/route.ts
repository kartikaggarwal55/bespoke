import { getPersona, resetPersona, setPersona } from "@/lib/personaStore";
import type { Persona } from "@/lib/persona";

export async function GET() {
  return Response.json(getPersona());
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<Persona>;

  const name = body.name?.trim();
  const photo = body.photo?.trim();
  if (!name) return Response.json({ error: "name is required" }, { status: 400 });
  if (!photo) return Response.json({ error: "photo is required" }, { status: 400 });
  if (!body.memory || typeof body.memory !== "object" || Array.isArray(body.memory)) {
    return Response.json({ error: "memory must be a JSON object" }, { status: 400 });
  }

  setPersona({ name, photo, memory: body.memory as Record<string, unknown> });
  return Response.json(getPersona());
}

/** Restore the seed persona. */
export async function DELETE() {
  return Response.json(resetPersona());
}
