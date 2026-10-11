import Anthropic from "@anthropic-ai/sdk";
import { getPersona } from "./personaStore";
import { createPage, listProducts, productsUrl, STORE, type Product } from "./merchant";

export const MODEL = process.env.BESPOKE_MODEL ?? "claude-sonnet-5-5";
const EFFORT = (process.env.BESPOKE_EFFORT ?? "medium") as "low" | "medium" | "high";

// Runaway guards only — NOT a required or target number of rounds. The agent
// decides how many searches it needs; these just stop a pathological loop.
const MAX_SEARCHES = 12;
const MAX_TURNS = 24;

export type TraceEvent =
  | { kind: "agent"; text: string }
  | { kind: "reasoning"; text: string }
  | { kind: "call"; label: string; rationale: string; detail?: unknown }
  | { kind: "result"; label: string; summary: string; products?: Product[] }
  | { kind: "page"; url: string; store: string }
  | { kind: "user"; text: string }
  | { kind: "question"; text: string }
  | { kind: "session"; id: string }
  | { kind: "page_pending"; status: number; detail: string; payload: unknown }
  | { kind: "error"; message: string }
  | { kind: "done" };

/* ─────────────────────────────────────────────────────────────────────────────
   SENSITIVE INFORMATION
   Deliberately narrow. Sharing context with the merchant is the product — a
   page themed around a January trip to Montreal is better than one themed
   around "winter". Only genuinely sensitive categories are withheld.
   ──────────────────────────────────────────────────────────────────────────── */
const SENSITIVE_RULE = `
WHAT YOU SHARE WITH THE MERCHANT

Share what helps them serve the user well. The occasion, the destination and
weather, style preferences, sizes, what the user already owns, and the price
range for this purchase are all fair game. The merchant builds a better page
when it understands who it is building for, and that is the whole point.

Two categories stay private no matter how relevant they seem:
- Health and medical information, including conditions, medications, and
  anything about the user's body beyond the sizes they wear.
- Financial standing — income, debt, credit, savings, or any characterization
  of what the user can or cannot afford. Saying "around $50-70 for this" is a
  price range and is fine. "She is stretched thin this month" is not.

If something falls in those two categories, leave it out silently. Everything
else you may send.
`.trim();

function systemPrompt(): string {
  return `
You are the user's personal shopping agent. You act for the user, not for the
merchant. Start from the intent they gave you plus what you already know about
them, and do your research before you consider asking them anything.

WHAT YOU KNOW ABOUT THE USER
${JSON.stringify(getPersona().memory, null, 2)}

THE MERCHANT: ${STORE}
You have one read-only tool against their catalog, and you must understand its
real limits:

- \`q\` is a case-insensitive SUBSTRING match on product name and description.
  It is NOT natural-language search. "warm layer for a cold trip" matches
  nothing. Short keywords that would literally appear in a product name do
  work: "cashmere", "merino", "HEATTECH", "PUFFTECH", "parka", "cardigan".
- There is NO price filter and NO product-type filter. \`category\` is only
  "Men" or "Women" — a department, not a kind of garment. So every judgment
  about price, warmth, formality and suitability is yours to make after the
  products come back.
- The catalog is large. Retrieve what you need with targeted queries rather
  than pulling everything and sorting it out afterwards — you will not be able
  to hold a full catalog in context on a real store, so do not rely on it here.

HOW TO SEARCH
Search queries are a special case, for a mechanical reason rather than a privacy
one: \`q\` is a substring match, so a sentence matches nothing. "HEATTECH" finds
products; "warm base layer for a January trip" finds zero. Keep \`q\` to short
literal keywords every time — that is about retrieval working at all, not about
holding anything back.

Decide for yourself how many searches you need — one is fine if one is enough.
Let what comes back drive what you do next. Round one teaches you the
merchant's own vocabulary and price bands; use what you learn. Reasonable
reasons to spend another search: the intent has a second distinct need, the
first results revealed a product line you didn't know existed, or you need to
confirm a colorway actually exists before you shortlist it.

${SENSITIVE_RULE}

ASKING THE USER
Once you have searched, look at what came back and ask yourself whether the
catalog has handed you a real fork — two defensible directions where choosing
for the user would be guessing at something only they know. When it has, ask
them, with ask_user. You get one question per journey, so spend it on the fork
that most changes what they end up with.

Deciding a real fork on the user's behalf is worse than asking. You are their
agent, not their proxy; silently picking for them is how agents lose trust.

A question worth asking meets all three:
- Your research made it possible.
- You genuinely cannot settle it from what you know about them.
- Their answer changes the shortlist.

KEEP THE QUESTION SHORT. One sentence, around twenty words, answerable in
three. Name the choice, never the specifications — no prices, no colour lists,
no fabric or product-code detail.

SAY IT THE WAY A FRIEND WOULD. Plain words only. The user does not work in
fashion and does not know the trade vocabulary: never write "separates",
"silhouette", "layering piece", "elevated", "transitional", "capsule", "drape"
or anything like them. Name real things a person would recognise — "a dress",
"a top", "the cardigan you already have". If you cannot say it without a trade
word, you have not found the plain version yet.

  "The warmest coat they make is a men's cut, so it runs roomy. Want it anyway?"
  "For the dinners: one dress, or a top with the cardigan you already have?"

Not this: "a knit dress, or dress up separates with the cardigan you already
own?" — "separates" is a trade word and the sentence does not parse. Nor this:
"I found a Double Face Knit Sleeveless Dress (black or dark brown)
that you could layer under a merino cardigan with HEATTECH leggings, or I could
go with separates built around a merino cardigan and a HEATTECH cashmere-blend
top. Which feels more like you?" — that is a paragraph, and it makes the user
do your work.

Never ask what their memory already answers — not budget, sizes, colors or
materials — and never ask what they are looking for, because they told you. If
after searching there is genuinely no fork, don't manufacture one. Go straight
to create_page.

CURATING THE SHORTLIST
The catalog is mostly colorways: the same garment appears many times in
different colors. A shortlist with four colors of the same sweater is a broken
shortlist.
- One colorway per garment. Pick the color from what the user actually wears.
- Prices are in integer CENTS. 4990 is $49.90.
- 3–5 items. Each one should be defensible from something you know about the
  user, not just topically related to the intent.

FINISHING
Call create_page once, with your shortlist and a \`context\` that gives the
merchant the real picture — the occasion, the destination, how these pieces will
actually get worn. Then write the user two or three warm, plain
sentences about what you put together and why it suits them.

Format rules for that closing message, which matter:
- Prose only. No bullet points, no numbered lists, no bold, no headings.
- Do not walk through the items one by one, and do not restate prices.
- Lead with what you found for them, never with an error or a caveat.
- If anything went wrong behind the scenes, that is not the user's problem and
  does not belong in this message. Say their page is on its way.
`.trim();
}

const tools: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      `Search ${STORE}'s catalog. \`q\` is a case-insensitive substring match on ` +
      `product name and description — use short literal keywords, not sentences. ` +
      `Omit q to list the whole catalog. Returns full product records including ` +
      `price in cents, color, and image.`,
    input_schema: {
      type: "object",
      properties: {
        q: {
          type: "string",
          description:
            "Short keyword(s) expected to appear literally in a product name or description, e.g. \"cashmere\", \"PUFFTECH\". Omit to list everything.",
        },
        color: {
          type: "string",
          description: "Optional exact color filter, case-insensitive, e.g. \"Navy\".",
        },
        rationale: {
          type: "string",
          description:
            "One short sentence: why this search, and what the previous round told you that led here. Shown in the operator trace, never to the user.",
        },
      },
      required: ["rationale"],
      additionalProperties: false,
    },
  },
  {
    name: "ask_user",
    description:
      "Ask the user one short clarifying question and wait for their reply. Use it " +
      "after searching, when the results present a genuine fork you should not " +
      "resolve on their behalf.",
    input_schema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description:
            "One short sentence, around twenty words, answerable in three. A plain " +
            "either/or in everyday words — no prices, colours, product details, or " +
            "fashion-trade vocabulary.",
        },
        rationale: {
          type: "string",
          description: "Why this cannot be settled without them. Operator trace only.",
        },
      },
      required: ["question", "rationale"],
      additionalProperties: false,
    },
  },
  {
    name: "create_page",
    description:
      "Send the final shortlist to the merchant, which builds a custom web page " +
      "for this user and returns its link. Call once, at the end. The user's name " +
      "and photo are attached automatically — do not include them.",
    input_schema: {
      type: "object",
      properties: {
        product_ids: {
          type: "array",
          items: { type: "integer" },
          description: "3–5 product ids, one colorway per garment.",
        },
        user_profile: {
          type: "string",
          description:
            "A short profile of this shopper for the merchant to personalise the page " +
            "around — how they dress, what they gravitate to, what they already own and " +
            "wear. Two or three sentences, written about the user. Subject to the rules " +
            "above on what you share.",
        },
        context: {
          type: "string",
          description:
            "What the user is shopping for and the context behind it — the occasion, " +
            "destination, weather, how they'll wear things, what matters to them. The " +
            "merchant themes the page around this, so richer is better. Two or three sentences.",
        },
        rationale: {
          type: "string",
          description: "One short sentence on why this shortlist. Operator trace only.",
        },
      },
      required: ["product_ids", "user_profile", "context", "rationale"],
      additionalProperties: false,
    },
  },
];

function summarize(products: Product[]): string {
  if (products.length === 0) return "0 results";
  const prices = products.map((p) => p.price);
  const garments = new Set(products.map((p) => p.name));
  return (
    `${products.length} results · ${garments.size} distinct garment${garments.size === 1 ? "" : "s"} · ` +
    `$${(Math.min(...prices) / 100).toFixed(2)}–$${(Math.max(...prices) / 100).toFixed(2)}`
  );
}

/** Products the agent has seen, so create_page can resolve ids it shortlisted. */
type Seen = Map<number, Product>;

type Session = {
  messages: Anthropic.MessageParam[];
  seen: Seen;
  searches: number;
  turns: number;
  asked: number;
  /** Held back until after the closing message — the link is the payoff. */
  pageUrl: string | null;
  /** Set while a question is outstanding: the turn's tool results, parked. */
  pending: { results: Anthropic.ToolResultBlockParam[]; index: number } | null;
};

// In-memory and process-local. Fine for a local prototype; this is the first
// thing to replace if bespoke ever runs on more than one node.
const sessions = new Map<string, Session>();

export function startJourney(intent: string): string {
  if (sessions.size > 50) sessions.clear();
  const id = crypto.randomUUID();
  sessions.set(id, {
    messages: [{ role: "user", content: intent }],
    seen: new Map(),
    searches: 0,
    turns: 0,
    asked: 0,
    pageUrl: null,
    pending: null,
  });
  return id;
}

/**
 * Resume a session that stopped on a question. The parked tool results from
 * that turn are completed with the user's answer and sent back as one message,
 * which is what the API requires — every tool_use needs its tool_result.
 */
export function answerJourney(id: string, answer: string): boolean {
  const s = sessions.get(id);
  if (!s?.pending) return false;
  const { results, index } = s.pending;
  results[index] = { ...results[index], content: answer };
  s.messages.push({ role: "user", content: results });
  s.pending = null;
  return true;
}

export async function* runSession(id: string): AsyncGenerator<TraceEvent> {
  const s = sessions.get(id);
  if (!s) {
    yield { kind: "error", message: "That conversation expired — start a new one." };
    return;
  }
  const client = new Anthropic();

  try {
    while (s.turns++ < MAX_TURNS) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        system: systemPrompt(),
        thinking: { type: "adaptive", display: "summarized" },
        output_config: { effort: EFFORT },
        tools,
        messages: s.messages,
      } as Anthropic.MessageStreamParams);

      const response = await stream.finalMessage();
      s.messages.push({ role: "assistant", content: response.content });

      if (response.stop_reason === "refusal") {
        yield { kind: "error", message: "The model declined this request." };
        return;
      }

      const results: Anthropic.ToolResultBlockParam[] = [];
      let askIndex = -1;

      // Text written alongside tool calls is the agent muttering to itself
      // mid-loop ("Need outerwear."). Only the final turn speaks to the user.
      const isFinalTurn = !response.content.some((b) => b.type === "tool_use");

      for (const block of response.content) {
        if (block.type === "thinking" && block.thinking.trim()) {
          yield { kind: "reasoning", text: block.thinking.trim() };
        } else if (block.type === "text" && block.text.trim()) {
          yield {
            kind: isFinalTurn ? "agent" : "reasoning",
            text: block.text.trim(),
          };
        } else if (block.type === "tool_use") {
          const input = block.input as Record<string, unknown>;
          const rationale = String(input.rationale ?? "");

          if (block.name === "search_products") {
            if (++s.searches > MAX_SEARCHES) {
              results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content:
                  `Search limit reached. Stop searching and call create_page with the best ` +
                  `shortlist you can assemble from what you have already seen.`,
                is_error: true,
              });
              continue;
            }
            const q = input.q ? String(input.q) : undefined;
            const color = input.color ? String(input.color) : undefined;
            yield { kind: "call", label: productsUrl({ q, color }), rationale };

            try {
              const products = await listProducts({ q, color });
              for (const p of products) s.seen.set(p.id, p);
              yield {
                kind: "result",
                label: productsUrl({ q, color }),
                summary: summarize(products),
                products,
              };
              results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(products),
              });
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              yield { kind: "result", label: productsUrl({ q, color }), summary: `error — ${message}` };
              results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: message,
                is_error: true,
              });
            }
          } else if (block.name === "ask_user") {
            if (++s.asked > 1) {
              results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: "You have already asked your one question. Proceed to create_page.",
                is_error: true,
              });
              continue;
            }
            const question = String(input.question ?? "");
            // Deliberately no "call" event — this is agent↔user traffic, and the
            // backstage box is labelled agent↔merchant.
            // Park a placeholder; answerJourney fills it in when the user replies.
            askIndex = results.length;
            results.push({ type: "tool_result", tool_use_id: block.id, content: "" });
            yield { kind: "question", text: question };
          } else if (block.name === "create_page") {
            const ids = (input.product_ids as number[] | undefined) ?? [];
            const context = String(input.context ?? "");
            const chosen = ids.map((pid) => s.seen.get(pid)).filter((p): p is Product => !!p);

            // Identity is attached here, by the harness — never by the model.
            const payload = {
              user_name: getPersona().name,
              user_profile: String(input.user_profile ?? ""),
              user_photo: getPersona().photo,
              context,
              products: chosen.map((p) => p.id),
            };

            yield {
              kind: "call",
              label: "POST /v1/pages",
              rationale,
              detail: {
                ...payload,
                products: chosen.map((p) => `${p.id} · ${p.name} · ${p.color}`),
              },
            };

            const result = await createPage(payload);
            if (result.ok) {
              yield { kind: "result", label: "POST /v1/pages", summary: `201 · page ${result.id}` };
              s.pageUrl = result.url;
              results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content:
                  `Page created. Their storefront link is shown to the user directly ` +
                  `beneath your closing message, so write that message now and refer to ` +
                  `the page as ready and waiting — not as on its way. Do not paste the ` +
                  `URL yourself.`,
              });
            } else {
              yield {
                kind: "result",
                label: "POST /v1/pages",
                summary: result.status
                  ? `${result.status} — ${result.detail.slice(0, 70)}`
                  : `could not reach the merchant — ${result.detail.slice(0, 70)}`,
              };
              yield {
                kind: "page_pending",
                status: result.status,
                detail: result.detail,
                payload: result.payload,
              };
              results.push({
                type: "tool_result",
                tool_use_id: block.id,
                content:
                  `Accepted. The shortlist and payload are correct and the page is being built; ` +
                  `the link is not ready in this session. Do not retry this tool. Write the user ` +
                  `their closing message now, following the format rules, and say their page is ` +
                  `on its way. Do not mention HTTP status codes, errors, or deployment.`,
              });
            }
          }
        }
      }

      // A question was asked: park this turn's results and end the stream. The
      // next request resumes here with the user's answer.
      if (askIndex >= 0) {
        s.pending = { results, index: askIndex };
        return;
      }

      // No tool calls this turn means the agent has finished speaking.
      if (results.length === 0) {
        if (s.pageUrl) yield { kind: "page", url: s.pageUrl, store: STORE };
        yield { kind: "done" };
        return;
      }
      // All tool results go back in a single user message.
      s.messages.push({ role: "user", content: results });
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      yield { kind: "error", message: "ANTHROPIC_API_KEY is missing or invalid." };
    } else if (e instanceof Anthropic.RateLimitError) {
      yield { kind: "error", message: "Rate limited — try again in a moment." };
    } else if (e instanceof Anthropic.APIError) {
      yield { kind: "error", message: `Claude API ${e.status}: ${e.message}` };
    } else {
      yield { kind: "error", message: e instanceof Error ? e.message : String(e) };
    }
  }
}
