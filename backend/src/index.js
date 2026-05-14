import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Groq from "groq-sdk";
import Stripe from "stripe";
import menu from "./data/menu.json" with { type: "json" };

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Menu Data ────────────────────────────────────────────────────────────────

const menu_items = Object.values(menu).flat();

// ─── Menu Endpoint ────────────────────────────────────────────────────────────

app.get("/api/menu", (req, res) => {
  res.json({ success: true, menu: menu });
});

// ─── Stripe: Create PaymentIntent ─────────────────────────────────────────────
// Called by CartScreen before presenting the Stripe payment sheet.
// `amount` must be in cents (e.g. $12.50 → 1250).

app.post("/api/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== "number" || amount < 50) {
    return res.status(400).json({ error: "Invalid amount (minimum 50 cents)" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      // Optional: attach metadata for your records
      metadata: { source: "bistro-app" },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {
  const { amount, items } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      success_url: "http://localhost:8081/cart?success=true",
      cancel_url: "http://localhost:8081/cart?canceled=true",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Chat Endpoint ─────────────────────────────────────────────────────────

app.post("/api/chat", async (req, res) => {
  const { message, cartItems = [], conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const menuContext = Object.entries(menu)
    .map(([category, items]) => {
      const itemList = items
        .map(
          (i) =>
            `  - [ID:${i.id}] "${i.name}" | $${i.price} | ${i.description}`,
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

  const systemPrompt = `You are Maya, a warm and witty AI server at "The Intelligent Bistro".

MENU (copy IDs and names EXACTLY — do not invent or change them):
${menuContext}

GUEST'S CART: ${cartContext}

━━━ REAL EXAMPLES — follow these exactly ━━━

Guest: "add fries" or "fries please"
→ {"message":"Truffle fries on the way! 🍟 Fancy a drink to go with?","actions":[{"type":"ADD_ITEM","itemId":"SI1","quantity":1,"name":"Truffle Fries"}],"suggestions":["Add a drink","Add a burger","View cart"]}

Guest: "i want a burger"
→ {"message":"One Wagyu Burger coming up! 🍔 Want truffle fries on the side?","actions":[{"type":"ADD_ITEM","itemId":"M1","quantity":1,"name":"Wagyu Burger"}],"suggestions":["Add Truffle Fries","Add a drink","View cart"]}

Guest: "get me a lemonade"
→ {"message":"Fresh lemonade coming right up! 🍋","actions":[{"type":"ADD_ITEM","itemId":"D3","quantity":1,"name":"Fresh Lemonade"}],"suggestions":["Add a main","See desserts","View cart"]}

Guest: "remove the fries"
→ {"message":"Truffle fries removed, no problem!","actions":[{"type":"REMOVE_ITEM","itemId":"SI1"}],"suggestions":["Add something else","View cart","See mains"]}

Guest: "clear my cart"
→ {"message":"Cart cleared! Fresh start — what are you feeling?","actions":[{"type":"CLEAR_CART"}],"suggestions":["See full menu","What's popular?","Quick order"]}

Guest: "what's good here?"
→ {"message":"The Wagyu Burger and Truffle Fries are guest favorites! The Ribeye is incredible if you're feeling fancy 🥩","actions":[],"suggestions":["Add Wagyu Burger","Add Ribeye Steak","See full menu"]}

━━━ ALIAS MAP ━━━
fries → SI1 "Truffle Fries"
burger → M1 "Wagyu Burger"
chicken → M2 "Spicy Chicken Sandwich"
salmon → M3 "Seared Salmon"
risotto → M4 "Wild Mushroom Risotto"
steak → M5 "Ribeye Steak"
lobster → M6 "Lobster Linguine"
arancini → S1 "Truffle Arancini"
tuna → S2 "Tuna Tataki"
burrata → S3 "Burrata Board"
calamari → S4 "Crispy Calamari"
broccolini → SI2 "Roasted Broccolini"
mac and cheese → SI3 "Mac & Cheese"
salad → SI4 "Wedge Salad"
sparkling water → D1 "Sparkling Water"
still water → D2 "Still Water"
lemonade → D3 "Fresh Lemonade"
cola → D4 "Craft Cola"
matcha → D5 "Iced Matcha Latte"
mocktail → D6 "Seasonal Mocktail"
creme brulee → DE1 "Crème Brûlée"
lava cake → DE2 "Chocolate Lava Cake"
sorbet → DE3 "Seasonal Sorbet"

━━━ RULES ━━━
- Return ONLY raw JSON, no markdown, no backticks, no explanation
- itemId MUST match exactly from the alias map or menu above
- name MUST be copied exactly from the menu
- Keep message under 20 words, warm and human
- Never invent item IDs`;

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.json(ruleBasedParser(message, cartItems));
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-6).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.5,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const rawText = completion.choices[0]?.message?.content || "{}";
    console.log("Groq raw response:", rawText);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match
        ? JSON.parse(match[0])
        : { message: rawText, actions: [], suggestions: [] };
    }

    // Server-side safety net: fix wrong IDs by name
    if (parsed.actions) {
      parsed.actions = parsed.actions.map((action) => {
        if (
          ["ADD_ITEM", "REMOVE_ITEM", "UPDATE_QUANTITY"].includes(action.type)
        ) {
          const exactMatch = menu_items.find((i) => i.id === action.itemId);
          if (!exactMatch && action.name) {
            const nameMatch = menu_items.find(
              (i) =>
                i.name.toLowerCase() === action.name.toLowerCase() ||
                i.name.toLowerCase().includes(action.name.toLowerCase()) ||
                action.name.toLowerCase().includes(i.name.toLowerCase()),
            );
            if (nameMatch) {
              console.log(
                `Fixed: "${action.itemId}" → "${nameMatch.id}" (${nameMatch.name})`,
              );
              return { ...action, itemId: nameMatch.id, name: nameMatch.name };
            }
          }
        }
        return action;
      });
    }

    res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Groq error:", error.message);
    res.json(ruleBasedParser(message, cartItems));
  }
});

// ─── Rule-Based Fallback Parser ───────────────────────────────────────────────

function ruleBasedParser(message, cartItems) {
  const lower = message.toLowerCase();
  const actions = [];
  let responseMsg = "";
  let suggestions = [];

  const numberWords = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    "a ": 1,
    "an ": 1,
  };

  if (
    lower.includes("clear") ||
    lower.includes("start over") ||
    lower.includes("empty cart")
  ) {
    actions.push({ type: "CLEAR_CART" });
    responseMsg = "Done! Cart cleared. What would you like to order?";
    suggestions = ["See the menu", "Today's specials", "Quick order"];
    return { success: true, message: responseMsg, actions, suggestions };
  }

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
        let qty = 1;
        for (const [word, num] of Object.entries(numberWords)) {
          if (lower.includes(word)) {
            qty = num;
            break;
          }
        }
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
        "Welcome to The Intelligent Bistro! 🍽️ What are you hungry for?";
      suggestions = ["See full menu", "What's popular?", "Vegetarian options"];
    } else if (lower.includes("vegetarian") || lower.includes("vegan")) {
      const vegItems = menu_items.filter(
        (i) => i.tags?.includes("vegetarian") || i.tags?.includes("vegan"),
      );
      responseMsg = `Great choices! We have: ${vegItems.map((i) => i.name).join(", ")}. Which sounds good?`;
    } else {
      responseMsg =
        "Ask me to add items, remove things, or tell you about our menu!";
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
