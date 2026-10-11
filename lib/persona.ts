/**
 * The user's profile, as the agent knows it.
 *
 * The live copy lives in the browser's localStorage (see usePersona) and is sent
 * with each journey, so the server holds no user state. This is the seed: what
 * a first visit, or "Reset to default", falls back to.
 */

export type Persona = {
  name: string;
  photo: string;
  /** Free-form facts about the user, one per entry. Passed to the merchant verbatim. */
  profile: string[];
};

export const defaultPersona: Persona = {
  // Sent to the merchant at page-creation time. Attached by the harness, never
  // by the model, so the agent cannot invent or embellish the user's identity.
  name: "Maya Fernandes",
  photo: "https://i.pravatar.cc/400?img=47",

  profile: [
    "Shops in the women's department; lives in Chicago, IL",
    "Sizes: tops M, bottoms 29, shoe US 8",
    "Usually spends $40–70 per item; has stretched to ~$100 for outerwear that gets daily winter use",
    "Wears navy, olive, off white, grey, black and brown; avoids pink, red, bright orange and purple",
    "Loves merino, cashmere and cotton; avoids polyester next to the skin",
    "Rebought HEATTECH Leggings (black) two winters running",
    "Merino Cardigan (grey) is the most-worn item in the closet",
    "Buys AIRism Cotton T-Shirts (navy, white) in multiples",
    "Avoids crop lengths and anything dry-clean only",
    "Going to Montreal for 10 days in January: cold, a lot of walking, two nicer dinners out",
  ],
};
