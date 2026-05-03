import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Flame, ArrowLeft, CheckCircle2 } from "lucide-react";

type CartItem = { menuItemId: number; name: string; quantity: number; unitPrice: number };

export default function OnlineOrdering() {
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: menuItems } = trpc.menu.list.useQuery();
  const createOrder = trpc.orders.create.useMutation();
  const addItem = trpc.orders.addItem.useMutation();
  const updateOrder = trpc.orders.update.useMutation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"takeaway" | "delivery">("takeaway");
  const [address, setAddress] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return selectedCat ? menuItems.filter(i => i.categoryId === selectedCat && i.isAvailable) : menuItems.filter(i => i.isAvailable);
  }, [menuItems, selectedCat]);

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

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
    if (!customerName.trim()) { toast.error("Please enter your name"); return; }
    try {
      const order: any = await createOrder.mutateAsync({
        type: orderType,
        customerName,

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
        total: total.toFixed(2), status: "pending",
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
            <h2 className="text-2xl font-bold">Order Placed!</h2>
            <p className="text-muted-foreground mt-2">Your order #{orderNumber} has been received.</p>
            <p className="text-sm text-muted-foreground mt-1">We'll start preparing it shortly.</p>
            <Button className="mt-6" onClick={() => { setOrderPlaced(false); setOrderNumber(""); }}>
              Place Another Order
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
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">RestoFlow</span>
            <Badge variant="outline" className="ml-2">Online Order</Badge>
          </div>
          <Button variant="outline" className="relative" onClick={() => cart.length > 0 && setShowCheckout(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
            {cart.length > 0 && <span className="ml-2 font-bold">${total.toFixed(2)}</span>}
          </Button>
        </div>
      </header>

      <div className="container py-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          <Button variant={selectedCat === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(null)}>All</Button>
          {categories?.filter(c => c.isActive).map(cat => (
            <Button key={cat.id} variant={selectedCat === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(cat.id)}>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Menu grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No menu items available in this category.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const inCart = cart.find(c => c.menuItemId === item.id);
              return (
                <Card key={item.id} className="bg-card border-border overflow-hidden group hover:border-primary/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                      </div>
                      {item.isPopular && <Badge className="badge-warning ml-2 shrink-0">Popular</Badge>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(cart.indexOf(inCart), -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium w-6 text-center">{inCart.quantity}</span>
                          <Button size="icon" className="h-8 w-8" onClick={() => updateQty(cart.indexOf(inCart), 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart(item)}>
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Checkout</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
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
              <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>
            <div className="space-y-3 pt-2">
              <div><Label>Your Name *</Label><Input value={customerName} onChange={e => setCustomerName(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button variant={orderType === "takeaway" ? "default" : "outline"} size="sm" onClick={() => setOrderType("takeaway")}>Pickup</Button>
                <Button variant={orderType === "delivery" ? "default" : "outline"} size="sm" onClick={() => setOrderType("delivery")}>Delivery</Button>
              </div>
              {orderType === "delivery" && <div><Label>Delivery Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>}
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" size="lg" onClick={placeOrder}>
              Place Order — ${total.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
