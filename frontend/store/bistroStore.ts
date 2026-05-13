import { create } from 'zustand';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  tags: string[];
  category?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface BistroStore {
  // Menu
  menu: Record<string, MenuItem[]>;
  setMenu: (menu: Record<string, MenuItem[]>) => void;

  // Cart
  cartItems: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;

  // Chat
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  isAiTyping: boolean;
  setAiTyping: (typing: boolean) => void;

  // UI
  activeTab: 'menu' | 'chat' | 'cart';
  setActiveTab: (tab: 'menu' | 'chat' | 'cart') => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

export const useBistroStore = create<BistroStore>((set, get) => ({
  // Menu
  menu: {},
  setMenu: (menu) => set({ menu }),

  // Cart
  cartItems: [],

  addItem: (item, quantity = 1) => {
    const current = get().cartItems;
    const existing = current.find(i => i.id === item.id);
    if (existing) {
      set({
        cartItems: current.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        ),
      });
    } else {
      set({ cartItems: [...current, { ...item, quantity }] });
    }
  },

  removeItem: (itemId) => {
    set({ cartItems: get().cartItems.filter(i => i.id !== itemId) });
  },

  updateQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    set({
      cartItems: get().cartItems.map(i =>
        i.id === itemId ? { ...i, quantity } : i
      ),
    });
  },

  clearCart: () => set({ cartItems: [] }),

  cartTotal: () => {
    return get().cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  cartCount: () => {
    return get().cartItems.reduce((sum, i) => sum + i.quantity, 0);
  },

  // Chat
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to The Intelligent Bistro! 🍽️ I'm your AI dining assistant. I can help you explore our menu, answer questions, and add items to your cart — just ask!",
      timestamp: new Date(),
      suggestions: ["What's popular tonight?", 'Show me vegetarian options', 'Build me a full meal'],
    },
  ],

  addMessage: (message) => {
    set({
      messages: [
        ...get().messages,
        { ...message, id: Date.now().toString(), timestamp: new Date() },
      ],
    });
  },

  isAiTyping: false,
  setAiTyping: (typing) => set({ isAiTyping: typing }),

  // UI
  activeTab: 'menu',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeCategory: 'starters',
  setActiveCategory: (cat) => set({ activeCategory: cat }),
}));
