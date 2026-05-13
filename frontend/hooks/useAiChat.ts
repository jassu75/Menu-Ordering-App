import { useCallback } from "react";
import { useBistroStore } from "../store/bistroStore";
import { API_URL } from "@/constants/config";

export function useAiChat() {
  const {
    cartItems,
    messages,
    addMessage,
    setAiTyping,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    menu,
    setActiveTab,
  } = useBistroStore();

  const allItems = Object.values(menu).flat();
  const itemById = Object.fromEntries(allItems.map((i) => [i.id, i]));

  // Name-based fallback lookup
  const findItemByName = (name: string) => {
    if (!name) return undefined;
    const nameLower = name.toLowerCase();
    return allItems.find(
      (i) =>
        i.name.toLowerCase() === nameLower ||
        i.name.toLowerCase().includes(nameLower) ||
        nameLower.includes(i.name.toLowerCase()),
    );
  };

  const sendMessage = useCallback(
    async (userMessage: string) => {
      addMessage({ role: "user", content: userMessage });
      setAiTyping(true);

      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            cartItems: cartItems.map((i) => ({
              id: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
            })),
            conversationHistory,
          }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        console.log("AI response:", JSON.stringify(data, null, 2));

        if (data.actions && Array.isArray(data.actions)) {
          for (const action of data.actions) {
            switch (action.type) {
              case "ADD_ITEM": {
                // Try ID first, fall back to name
                let item = itemById[action.itemId];
                if (!item) {
                  item = findItemByName(action.name);
                  if (item)
                    console.log(
                      `Resolved by name: "${action.name}" → ${item.id}`,
                    );
                  else console.warn("Could not find item:", action);
                }
                if (item) addItem(item, action.quantity || 1);
                break;
              }
              case "REMOVE_ITEM": {
                removeItem(action.itemId);
                break;
              }
              case "UPDATE_QUANTITY": {
                updateQuantity(action.itemId, action.quantity);
                break;
              }
              case "CLEAR_CART": {
                clearCart();
                break;
              }
            }
          }

          // Flash to cart tab if items were modified
          const cartModified = data.actions.some((a: any) =>
            [
              "ADD_ITEM",
              "REMOVE_ITEM",
              "UPDATE_QUANTITY",
              "CLEAR_CART",
            ].includes(a.type),
          );
          if (cartModified) {
            setTimeout(() => setActiveTab("cart"), 300);
          }
        }

        addMessage({
          role: "assistant",
          content:
            data.message || "I couldn't process that. Can you try again?",
          suggestions: data.suggestions || [],
        });
      } catch (error) {
        console.error("Chat error:", error);
        addMessage({
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Try browsing the menu directly!",
          suggestions: ["Browse menu", "View cart"],
        });
      } finally {
        setAiTyping(false);
      }
    },
    [cartItems, messages, allItems, itemById],
  );

  return { sendMessage };
}
