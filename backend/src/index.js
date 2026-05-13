import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import menu from "./data/menu.json" with { type: "json" };

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ─── Menu Data ───────────────────────────────────────────────────────────────

const menu_items = Object.values(menu).flat();

// ─── Menu Endpoint ────────────────────────────────────────────────────────────
app.get("/api/menu", (req, res) => {
  res.json({ success: true, menu: menu });
});

// ─── AI Chat Endpoint ─────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message, cartItems = [], conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Build menu context for the AI
  const menuContext = Object.entries(menu)
    .map(([category, items]) => {
      const itemList = items
        .map(
          (i) => `  - ${i.name} (ID: ${i.id}) $${i.price} — ${i.description}`,
        )
        .join("\n");
      return `${category.toUpperCase()}:\n${itemList}`;
    })
    .join("\n\n");

  const cartContext =
    cartItems.length > 0
      ? cartItems
          .map((i) => `${i.quantity}x ${i.name} ($${i.price} each)`)
          .join(", ")
      : "empty";

  const systemPrompt = `You are a friendly, warm AI assistant for "The Intelligent Bistro", an upscale casual restaurant. You help guests browse the menu and manage their orders.

CURRENT MENU:
${menuContext}

CURRENT CART: ${cartContext}

YOUR ROLE:
- Help guests discover menu items and make decisions
- Process order requests and return structured cart actions
- Be conversational, warm, and slightly witty
- Upsell naturally when appropriate (e.g., suggest a drink with a meal)
- Handle modifications like quantity changes and removals

RESPONSE FORMAT:
Always respond with a JSON object (no markdown, no code blocks, raw JSON only) with this structure:
{
  "message": "Your friendly conversational response to the guest",
  "actions": [
    {
      "type": "ADD_ITEM" | "REMOVE_ITEM" | "UPDATE_QUANTITY" | "CLEAR_CART",
      "itemId": "item ID from menu",
      "quantity": number (for ADD_ITEM and UPDATE_QUANTITY),
      "name": "item name (for ADD_ITEM)"
    }
  ],
  "suggestions": ["optional array of 1-3 short follow-up suggestion chips"]
}

RULES:
- actions array can be empty [] if no cart changes needed
- For ADD_ITEM, always include itemId, quantity, and name
- For REMOVE_ITEM, include itemId
- For UPDATE_QUANTITY, include itemId and new quantity (0 means remove)
- Match items by name flexibly (e.g., "spicy chicken" = "Spicy Chicken Sandwich")
- Keep message under 100 words, friendly and conversational
- suggestions should be short (under 5 words each)`;

  try {
    // Use Anthropic API with claude-haiku (free tier / most cost-effective)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Fallback: rule-based parsing if no API key
      const fallbackResponse = ruleBasedParser(message, cartItems);
      return res.json(fallbackResponse);
    }

    const messages = [
      ...conversationHistory.slice(-6), // Keep last 3 turns for context
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      const fallbackResponse = ruleBasedParser(message, cartItems);
      return res.json(fallbackResponse);
    }

    const data = await response.json();
    const rawText = data.content[0]?.text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from the response
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match
        ? JSON.parse(match[0])
        : { message: rawText, actions: [], suggestions: [] };
    }

    res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Chat error:", error);
    const fallbackResponse = ruleBasedParser(message, cartItems);
    res.json(fallbackResponse);
  }
});

// ─── Rule-Based Fallback Parser ───────────────────────────────────────────────
function ruleBasedParser(message, cartItems) {
  const lower = message.toLowerCase();
  const actions = [];
  let responseMsg = "";
  let suggestions = [];

  // Number word mapping
  const numberWords = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    "a ": 1,
    "an ": 1,
  };

  // Check for clear cart
  if (
    lower.includes("clear") ||
    lower.includes("start over") ||
    lower.includes("empty cart")
  ) {
    actions.push({ type: "CLEAR_CART" });
    responseMsg = "Done! I've cleared your cart. What would you like to order?";
    suggestions = ["See the menu", "Today's specials", "Quick order"];
    return { success: true, message: responseMsg, actions, suggestions };
  }

  // Check for remove
  if (
    lower.includes("remove") ||
    lower.includes("take off") ||
    lower.includes("don't want")
  ) {
    for (const item of menu_items) {
      if (lower.includes(item.name.toLowerCase())) {
        actions.push({ type: "REMOVE_ITEM", itemId: item.id });
        responseMsg = `Removed ${item.name} from your cart!`;
      }
    }
  }

  // Check for add
  const addPatterns = [
    "add",
    "get",
    "order",
    "want",
    "have",
    "give me",
    "i'll take",
    "can i get",
  ];
  const isAdding = addPatterns.some((p) => lower.includes(p));

  if (isAdding || actions.length === 0) {
    for (const item of menu_items) {
      if (
        lower.includes(item.name.toLowerCase()) ||
        lower.includes(item.name.toLowerCase().split(" ")[0])
      ) {
        // Try to detect quantity
        let qty = 1;
        for (const [word, num] of Object.entries(numberWords)) {
          if (lower.includes(word)) {
            qty = num;
            break;
          }
        }
        const numMatch = lower.match(
          /(\d+)\s*x?\s*${item.name.toLowerCase().split(' ')[0]}/,
        );
        if (numMatch) qty = parseInt(numMatch[1]);

        actions.push({
          type: "ADD_ITEM",
          itemId: item.id,
          quantity: qty,
          name: item.name,
        });
        responseMsg += `Added ${qty}x ${item.name} to your cart! `;
      }
    }
  }

  if (actions.length === 0) {
    // Menu browsing / general help
    if (lower.includes("menu") || lower.includes("what")) {
      responseMsg =
        "We have starters, mains, sides, drinks, and desserts. What are you in the mood for? 😊";
      suggestions = ["Show starters", "Show mains", "Something spicy"];
    } else if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("hey")
    ) {
      responseMsg =
        "Welcome to The Intelligent Bistro! 🍽️ I'm here to help you order. What are you hungry for?";
      suggestions = ["See full menu", "What's popular?", "Vegetarian options"];
    } else if (lower.includes("vegetarian") || lower.includes("vegan")) {
      const vegItems = menu_items.filter(
        (i) => i.tags.includes("vegetarian") || i.tags.includes("vegan"),
      );
      responseMsg = `Great choices for you! We have: ${vegItems.map((i) => i.name).join(", ")}. Which sounds good?`;
    } else {
      responseMsg =
        "I'd be happy to help! You can ask me to add items, remove things from your cart, or tell you about our menu. What sounds good?";
      suggestions = ["What's popular?", "Show me mains", "Add fries"];
    }
  } else {
    responseMsg = responseMsg.trim() + " Anything else?";
    suggestions = ["Add a drink", "See desserts", "View my cart"];
  }

  return { success: true, message: responseMsg, actions, suggestions };
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🍽️ Bistro backend running on port ${PORT}`);
});
