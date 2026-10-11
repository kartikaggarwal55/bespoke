import { answerJourney, runSession, startJourney } from "@/lib/agent";

function bad(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const { intent, sessionId, answer } = (await req.json()) as {
    intent?: string;
    sessionId?: string;
    answer?: string;
  };

  let id: string;
  if (sessionId && answer?.trim()) {
    // Resuming a journey that stopped on a question.
    if (!answerJourney(sessionId, answer.trim())) {
      return bad("no pending question for that session");
    }
    id = sessionId;
  } else if (intent?.trim()) {
    id = startJourney(intent.trim());
  } else {
    return bad("intent, or sessionId + answer, is required");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        send({ kind: "session", id });
        for await (const event of runSession(id)) send(event);
      } catch (e) {
        send({ kind: "error", message: e instanceof Error ? e.message : String(e) });
      } finally {
        send({ kind: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
