import { useCallback } from 'react';
import { useBistroStore } from '../store/bistroStore';
import { API_URL } from '../constants/design';

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

  // Flatten menu into lookup map
  const allItems = Object.values(menu).flat();
  const itemById = Object.fromEntries(allItems.map(i => [i.id, i]));

  const sendMessage = useCallback(async (userMessage: string) => {
    // Add user message immediately
    addMessage({ role: 'user', content: userMessage });
    setAiTyping(true);

    // Build conversation history for context
    const conversationHistory = messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          cartItems: cartItems.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Process cart actions
      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          switch (action.type) {
            case 'ADD_ITEM': {
              const item = itemById[action.itemId];
              if (item) {
                addItem(item, action.quantity || 1);
              }
              break;
            }
            case 'REMOVE_ITEM': {
              removeItem(action.itemId);
              break;
            }
            case 'UPDATE_QUANTITY': {
              updateQuantity(action.itemId, action.quantity);
              break;
            }
            case 'CLEAR_CART': {
              clearCart();
              break;
            }
          }
        }

        // If cart was modified, briefly flash to cart
        if (data.actions.some((a: any) => ['ADD_ITEM', 'REMOVE_ITEM', 'UPDATE_QUANTITY', 'CLEAR_CART'].includes(a.type))) {
          // Small delay to feel natural
          setTimeout(() => {
            // Only navigate if items were actually added (not just removed)
          }, 300);
        }
      }

      // Add AI response
      addMessage({
        role: 'assistant',
        content: data.message || "I couldn't process that request. Can you try again?",
        suggestions: data.suggestions || [],
      });

    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please check that the backend server is running, or try browsing the menu directly!",
        suggestions: ['Browse menu', 'View cart'],
      });
    } finally {
      setAiTyping(false);
    }
  }, [cartItems, messages, allItems, itemById]);

  return { sendMessage };
}
