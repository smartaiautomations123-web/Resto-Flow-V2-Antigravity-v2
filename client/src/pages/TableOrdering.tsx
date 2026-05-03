import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { useParams } from "wouter";
import { ShoppingCart, Plus, Minus, Trash2, Flame, CheckCircle2, QrCode } from "lucide-react";

type CartItem = { menuItemId: number; name: string; quantity: number; unitPrice: number };

export default function TableOrdering() {
  const params = useParams<{ tableId: string }>();
  const tableId = params.tableId ? Number(params.tableId) : null;
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: menuItems } = trpc.menu.list.useQuery();
  const { data: tablesList } = trpc.tables.list.useQuery();
  const createOrder = trpc.orders.create.useMutation();
  const addItem = trpc.orders.addItem.useMutation();
  const updateOrder = trpc.orders.update.useMutation();

  const table = tablesList?.find(t => t.id === tableId);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return selectedCat ? menuItems.filter(i => i.categoryId === selectedCat && i.isAvailable) : menuItems.filter(i => i.isAvailable);
  }, [menuItems, selectedCat]);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * 0.1;
  const serviceCharge = subtotal * 0.05;
  const total = subtotal + tax + serviceCharge;

  const addToCart = (item: NonNullable<typeof menuItems>[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: Number(item.price) }];
    });
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + delta };
      if (updated[idx].quantity <= 0) updated.splice(idx, 1);
      return updated;
    });
  };

  const placeOrder = async () => {
    try {
      const order: any = await createOrder.mutateAsync({
        type: "dine_in",
        tableId: tableId || undefined,
        customerName: customerName || undefined,
      });
      for (const item of cart) {
        await addItem.mutateAsync({
          orderId: order.id, menuItemId: item.menuItemId, name: item.name,
          quantity: item.quantity, unitPrice: item.unitPrice.toFixed(2),
          totalPrice: (item.unitPrice * item.quantity).toFixed(2),
        });
      }
      await updateOrder.mutateAsync({
        id: order.id, subtotal: subtotal.toFixed(2), taxAmount: tax.toFixed(2),
        serviceCharge: serviceCharge.toFixed(2), total: total.toFixed(2), status: "pending",
      });
      setOrderNumber(String(order.id));
      setOrderPlaced(true);
      setCart([]);
      setShowCheckout(false);
    } catch {
      toast.error("Failed to place order");
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Order Sent!</h2>
            <p className="text-muted-foreground mt-2">Order #{orderNumber} has been sent to the kitchen.</p>
            {table && <p className="text-sm text-muted-foreground mt-1">Table: {table.name}</p>}
            <Button className="mt-6" onClick={() => { setOrderPlaced(false); setOrderNumber(""); }}>
              Order More
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="font-bold">RestoFlow</span>
            {table && <Badge variant="secondary" className="ml-2"><QrCode className="h-3 w-3 mr-1" /> {table.name}</Badge>}
          </div>
          <Button variant="outline" size="sm" className="relative" onClick={() => cart.length > 0 && setShowCheckout(true)}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </Button>
        </div>
      </header>

      <div className="container py-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Menu</h1>
          {table && <p className="text-sm text-muted-foreground">Ordering for {table.name}</p>}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Button variant={selectedCat === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(null)}>All</Button>
          {categories?.filter(c => c.isActive).map(cat => (
            <Button key={cat.id} variant={selectedCat === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(cat.id)}>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border">No items available.</div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => {
              const inCart = cart.find(c => c.menuItemId === item.id);
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.isPopular && <Badge className="badge-warning text-xs">Popular</Badge>}
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>}
                    <p className="text-sm font-bold text-primary mt-1">${Number(item.price).toFixed(2)}</p>
                  </div>
                  {inCart ? (
                    <div className="flex items-center gap-1 ml-3">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(cart.indexOf(inCart), -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium w-6 text-center text-sm">{inCart.quantity}</span>
                      <Button size="icon" className="h-8 w-8" onClick={() => updateQty(cart.indexOf(inCart), 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="ml-3" onClick={() => addToCart(item)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-4">
          <Button className="w-full" size="lg" onClick={() => setShowCheckout(true)}>
            View Order ({cart.reduce((s, i) => s + i.quantity, 0)} items) — ${total.toFixed(2)}
          </Button>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader><DialogTitle>Your Order</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3 space-y-1">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Service</span><span>${serviceCharge.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>
            <div><Label>Your Name (optional)</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button className="w-full" size="lg" onClick={placeOrder}>
              Send to Kitchen — ${total.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
