import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Gift, History, RotateCcw } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const [, navigate] = useLocation();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false);
  const [repeatOrderId, setRepeatOrderId] = useState<number | null>(null);

  const id = parseInt(customerId || "0", 10);

  const { data: customerData, isLoading: isLoadingCustomer } = trpc.customerDetail.getWithOrderHistory.useQuery(
    { customerId: id },
    { enabled: id > 0 }
  );

  const { data: orderDetails } = trpc.customerDetail.getOrderWithItems.useQuery(
    { orderId: selectedOrderId || 0 },
    { enabled: selectedOrderId !== null }
  );

  const { data: loyaltyHistory } = trpc.customerDetail.getLoyaltyHistory.useQuery(
    { customerId: id },
    { enabled: id > 0 }
  );

  const repeatOrderMutation = trpc.customerDetail.repeatOrder.useMutation({
    onSuccess: () => {
      toast.success("Order repeated successfully");
      setShowRepeatConfirm(false);
      setRepeatOrderId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to repeat order");
    },
  });

  if (isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">Customer not found</p>
        </div>
      </div>
    );
  }

  const customer = customerData;
  const orderHistory = customerData.orderHistory || [];
  const totalLoyaltyPoints = loyaltyHistory?.currentPoints || 0;

  const handleRepeatOrder = (orderId: number) => {
    setRepeatOrderId(orderId);
    setShowRepeatConfirm(true);
  };

  const confirmRepeatOrder = () => {
    if (repeatOrderId) {
      repeatOrderMutation.mutate({
        customerId: id,
        sourceOrderId: repeatOrderId,
      });
    }
  };

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate("/customers")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Profile Card */}
        <Card className="md:col-span-1 p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">{customer.name || "Unknown"}</h2>
              <p className="text-sm text-muted-foreground">{customer.email || "No email"}</p>
            </div>

            <div className="space-y-2 text-sm">
              {customer.phone && (
                <div>
                  <span className="font-semibold">Phone:</span> {customer.phone}
                </div>
              )}
              {customer.birthday && (
                <div>
                  <span className="font-semibold">Birthday:</span> {new Date(customer.birthday).toLocaleDateString()}
                </div>
              )}
              {customer.notes && (
                <div>
                  <span className="font-semibold">Notes:</span> {customer.notes}
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4" />
                <span className="font-semibold">Loyalty Points</span>
              </div>
              <div className="text-3xl font-bold">{totalLoyaltyPoints.toFixed(0)}</div>
            </div>

            <div className="text-xs text-muted-foreground">
              Customer since {new Date(customer.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Card>

        {/* Order History */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Order History</h3>
            <Badge variant="secondary">{orderHistory.length} orders</Badge>
          </div>

          {orderHistory.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No orders yet
            </Card>
          ) : (
            <div className="space-y-3">
              {orderHistory.map((order) => (
                <Card key={order.id} className="p-4 hover:bg-accent transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Order #{order.orderNumber}</span>
                        <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                      <p className="text-sm mt-1">
                        Payment: Unknown
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${parseFloat(order.total as any).toFixed(2)}</div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          View Details
                        </Button>
                        {order.status === "completed" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRepeatOrder(order.id)}
                            disabled={repeatOrderMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Repeat
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {orderDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Order Number:</span> {orderDetails.orderNumber}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> {orderDetails.status}
                </div>
                <div>
                  <span className="font-semibold">Date:</span> {new Date(orderDetails.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-semibold">Total:</span> ${parseFloat(orderDetails.total as any).toFixed(2)}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Items</h4>
                <div className="space-y-2">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <div className="font-medium">{item.itemName}</div>
                        {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
                      </div>
                      <div className="text-right">
                        <div>{item.quantity}x</div>
                        <div className="font-semibold">${parseFloat(item.totalPrice as any).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Repeat Order Confirmation */}
      <Dialog open={showRepeatConfirm} onOpenChange={setShowRepeatConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repeat Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Create a new order with the same items from this order?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowRepeatConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRepeatOrder}
              disabled={repeatOrderMutation.isPending}
            >
              {repeatOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Repeat Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
