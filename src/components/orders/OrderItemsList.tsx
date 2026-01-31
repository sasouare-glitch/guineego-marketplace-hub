import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  variant?: string;
}

interface OrderItemsListProps {
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export function OrderItemsList({ items, subtotal, deliveryFee, total }: OrderItemsListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-GN").format(price) + " GNF";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Articles commandés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <img
              src={item.image}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{item.name}</h4>
              {item.variant && (
                <p className="text-sm text-muted-foreground">{item.variant}</p>
              )}
              <p className="text-sm text-muted-foreground">Qté: {item.quantity}</p>
            </div>
            <p className="font-medium text-foreground">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="text-foreground">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span className="text-foreground">{formatPrice(deliveryFee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
