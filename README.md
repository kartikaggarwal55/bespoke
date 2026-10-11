# bespoke

A prototype of what shopping looks like when a personal agent, not a website,
does the browsing — and the **brand**, not the agent, renders the result.

The shopper states an intent once. Their agent enriches it from what it knows
about them, researches the merchant's catalog privately, curates a shortlist,
and hands the merchant enough context to build a storefront for that one person.
The agent↔merchant traffic is machine-to-machine and never shown to the shopper,
so the UI renders it greyed out and collapsed.

## The flow

```
shopper states an intent  (single message)
   ↓
agent enriches it from the shopper's memory
   ↓
GET /v1/products   ← repeated, agent-decided, each with a stated rationale
   ↓
(optionally) one short clarifying question, then waits
   ↓
POST /v1/pages     ← name, photo, profile, context, product ids
   ↓
the merchant returns a page built for this shopper
```

The number of search rounds is the agent's call. It usually takes several,
because `q` is a substring match rather than natural-language search — the
agent has to probe for the merchant's own vocabulary (`HEATTECH`, `PUFFTECH`,
`merino`) and often strikes out before it finds the right word.

## Running it

```bash
pnpm install
cp .env.example .env.local   # then add your Anthropic API key
pnpm dev
```

| Variable | Default | |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **required** |
| `BESPOKE_MODEL` | `claude-sonnet-5-5` | |
| `BESPOKE_EFFORT` | `medium` | `low` \| `medium` \| `high` |
| `MERCHANT_BASE_URL` | the hosted API | |

## Layout

| | |
|---|---|
| `lib/agent.ts` | system prompt, three tools, the loop, session state |
| `lib/merchant.ts` | every HTTP call to the merchant lives here |
| `lib/persona.ts` | the shopper's memory (seed) |
| `lib/personaStore.ts` | the live, editable copy |
| `app/api/journey` | streams the journey as SSE |
| `app/page.tsx` | the thread and the collapsed agent↔merchant trace |

## Notes

**The agent gets read-only access to the catalog.** `POST`/`PUT`/`DELETE
/v1/products` exist and mutate the merchant's live data; they are deliberately
not exposed as tools.

**Identity is attached by the harness, not the model.** `user_name` and
`user_photo` come from the persona store at call time, so the agent cannot
invent or embellish who the shopper is. `user_profile` and `context` are
model-authored, and are what the sensitive-information rule governs.

**Sessions and the persona are in-memory and process-local.** They reset when
the dev server restarts. First thing to replace if this ever runs on more than
one node.

**`POST /v1/pages` is slow and intermittently fails.** Measured at 48–96s, with
a 502 roughly one time in three under load. That is the merchant's page builder,
not this app — the read endpoints answer in under 250ms. A failure is handled
gracefully: the agent still writes its closing message, there is just no link.
