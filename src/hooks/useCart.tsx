import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { CartItemData } from "@/components/marketplace/CartItem";
import { Product } from "@/components/marketplace/ProductCard";
import { toast } from "sonner";

const CART_STORAGE_KEY = "guineego_cart";

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

function loadCartFromStorage(): CartItemData[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveCartToStorage(items: CartItemData[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItemData[]>(() => loadCartFromStorage());

  // Persist to localStorage on change
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = (product: Product, quantity = 1, variant?: string) => {
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
        inStock: product.inStock,
        maxQuantity: 10,
      };

      return [...prev, newItem];
    });

    toast.success("Produit ajouté au panier", {
      description: product.name,
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Produit retiré du panier");
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

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
