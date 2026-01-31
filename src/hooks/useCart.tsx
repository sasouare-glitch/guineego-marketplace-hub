import { createContext, useContext, useState, ReactNode } from "react";
import { CartItemData } from "@/components/marketplace/CartItem";
import { Product } from "@/components/marketplace/ProductCard";
import { toast } from "sonner";

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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItemData[]>([]);

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
