/**
 * The user's memory, as the agent knows it.
 *
 * This is the seed. The live copy lives in personaStore and can be edited from
 * the UI, so treat this as the default to fall back to rather than the single
 * source of truth.
 */

export type Persona = {
  name: string;
  photo: string;
  memory: Record<string, unknown>;
};

export const defaultPersona: Persona = {
  // Sent to the merchant at page-creation time. Attached by the harness, never
  // by the model, so the agent cannot invent or embellish the user's identity.
  name: "Maya Fernandes",
  photo: "https://i.pravatar.cc/400?img=47",

  memory: {
    department: "Women",
    location: "Chicago, IL",
    sizes: { tops: "M", bottoms: "29", shoe: "US 8" },

    budget:
      "Usually spends $40–70 per item. Has stretched to ~$100 for outerwear that gets daily winter use.",

    palette: {
      wears: ["navy", "olive", "off white", "grey", "black", "brown"],
      avoids: ["pink", "red", "bright orange", "purple"],
    },

    materials: {
      loves: ["merino", "cashmere", "cotton"],
      avoids: ["polyester next to the skin"],
    },

    pastPurchases: [
      "HEATTECH Leggings (black) — rebought two winters running",
      "Merino Cardigan (grey) — most-worn item in the closet",
      "AIRism Cotton T-Shirt (navy, white) — buys in multiples",
    ],

    upcoming: [
      "10 days in Montreal in January: cold, a lot of walking, two nicer dinners out",
    ],

    avoids: ["crop lengths", "anything dry-clean only"],
  },
};
