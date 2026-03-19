import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { CartItemData } from "@/components/marketplace/CartItem";
import { Product } from "@/components/marketplace/ProductCard";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const CART_STORAGE_PREFIX = "guineego_cart";

interface CartContextType {
  items: CartItemData[];
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartKey(uid?: string): string {
  return uid ? `${CART_STORAGE_PREFIX}_${uid}` : `${CART_STORAGE_PREFIX}_guest`;
}

function loadCartFromStorage(uid?: string): CartItemData[] {
  try {
    const raw = localStorage.getItem(getCartKey(uid));
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveCartToStorage(items: CartItemData[], uid?: string) {
  try {
    localStorage.setItem(getCartKey(uid), JSON.stringify(items));
  } catch {}
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [items, setItems] = useState<CartItemData[]>(() => loadCartFromStorage(uid));

  // Reload cart when user changes (login/logout)
  useEffect(() => {
    setItems(loadCartFromStorage(uid));
  }, [uid]);

  // Persist to localStorage on change
  useEffect(() => {
    saveCartToStorage(items, uid);
  }, [items, uid]);

  const addItem = useCallback((product: Product, quantity = 1, variant?: string) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (item) => item.productId === product.id && item.variant === variant
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.maxQuantity) }
            : item
        );
      }

      const newItem: CartItemData = {
        id: `${product.id}-${variant || "default"}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        variant,
        seller: product.seller,
        sellerId: product.sellerId || '',
        inStock: product.inStock,
        maxQuantity: 10,
      };

      return [...prev, newItem];
    });

    toast.success("Produit ajouté au panier", {
      description: product.name,
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Produit retiré du panier");
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(getCartKey(uid));
  }, [uid]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
