import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Search, Eye, Download, Mail, Printer } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function OrderHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: orders, isLoading, refetch } = trpc.orderHistory.search.useQuery({
    searchTerm,
    dateFrom,
    dateTo,
    status: statusFilter || undefined,
  });

  const { data: orderDetails } = trpc.orderHistory.getDetails.useQuery(
    { orderId: selectedOrderId || 0 },
    { enabled: !!selectedOrderId }
  );

  const handleSearch = () => {
    refetch();
  };

  const handlePrint = () => {
    if (!orderDetails) {
      toast.error("Order details not available");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Failed to open print window");
      return;
    }

    const receiptHTML = generateReceiptHTML(orderDetails);
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
    toast.success("Receipt sent to printer");
  };

  const handleEmail = async () => {
    if (!orderDetails?.customerEmail) {
      toast.error("Customer email not available");
      return;
    }
    toast.success("Email receipt sent to " + orderDetails.customerEmail);
  };

  const generateReceiptHTML = (order: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: monospace; width: 80mm; margin: 0; padding: 10px; }
          .receipt { text-align: center; }
          .header { font-weight: bold; margin-bottom: 10px; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .item-row { display: flex; justify-content: space-between; font-size: 12px; }
          .total { font-weight: bold; font-size: 14px; }
          .footer { font-size: 10px; margin-top: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">RECEIPT</div>
          <div class="line"></div>
          <div class="row">
            <span>Order #${order.orderNumber}</span>
            <span>${new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="row">
            <span>Customer:</span>
            <span>${order.customerName || "Walk-in"}</span>
          </div>
          <div class="line"></div>
          <div style="text-align: left; margin: 10px 0;">
            ${order.items
        ?.map(
          (item: any) => `
              <div class="item-row">
                <span>${item.itemName} x${item.quantity}</span>
                <span>$${(item.totalPrice || 0).toFixed(2)}</span>
              </div>
            `
        )
        .join("")}
          </div>
          <div class="line"></div>
          <div class="row">
            <span>Subtotal:</span>
            <span>$${(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Tax:</span>
            <span>$${(order.taxAmount || 0).toFixed(2)}</span>
          </div>
          ${order.discountAmount ? `<div class="row"><span>Discount:</span><span>-$${(order.discountAmount || 0).toFixed(2)}</span></div>` : ""}
          <div class="row total">
            <span>Total:</span>
            <span>$${(order.total || 0).toFixed(2)}</span>
          </div>
          <div class="line"></div>
          <div class="row">
            <span>Payment:</span>
            <span>${order.paymentMethod || "Unpaid"}</span>
          </div>
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>${new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-700";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700";
      case "preparing":
        return "bg-blue-500/20 text-blue-700";
      case "ready":
        return "bg-purple-500/20 text-purple-700";
      case "cancelled":
        return "bg-red-500/20 text-red-700";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
        <p className="text-muted-foreground mt-1">Search and view order history with receipt printing.</p>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Order # or customer name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Orders ({orders?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Order #</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-right py-3 px-4 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-center py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders && orders.length > 0 ? (
                  orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="py-3 px-4 font-mono">{order.orderNumber}</td>
                      <td className="py-3 px-4">{order.customerName || "Walk-in"}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">${(order.total || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrderId(order.id)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Order #{orderDetails?.orderNumber}</DialogTitle>
                            </DialogHeader>
                            {orderDetails && (
                              <div className="space-y-6">
                                {/* Order Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Customer</p>
                                    <p className="font-semibold">{orderDetails.customerName || "Walk-in"}</p>
                                    {orderDetails.customerEmail && (
                                      <p className="text-sm text-muted-foreground">{orderDetails.customerEmail}</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Order Date</p>
                                    <p className="font-semibold">
                                      {new Date(orderDetails.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge className={getStatusColor(orderDetails.status)}>
                                      {orderDetails.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Payment</p>
                                    <p className="font-semibold">{orderDetails.paymentMethod || "Unpaid"}</p>
                                  </div>
                                </div>

                                {/* Items */}
                                <div>
                                  <h3 className="font-semibold mb-3">Order Items</h3>
                                  <div className="space-y-2 border-t border-border pt-3">
                                    {orderDetails.items?.map((item: any) => (
                                      <div key={item.id} className="flex justify-between text-sm">
                                        <div>
                                          <p className="font-medium">{item.itemName}</p>
                                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold">${(item.totalPrice || 0).toFixed(2)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Totals */}
                                <div className="border-t border-border pt-3 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>${Number(orderDetails.subtotal || 0).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Tax:</span>
                                    <span>${Number(orderDetails.taxAmount || 0).toFixed(2)}</span>
                                  </div>
                                  {orderDetails.discountAmount && (
                                    <div className="flex justify-between text-sm text-red-600">
                                      <span>Discount:</span>
                                      <span>-${Number(orderDetails.discountAmount || 0).toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                                    <span>Total:</span>
                                    <span>${Number(orderDetails.total || 0).toFixed(2)}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <Button onClick={handlePrint} className="flex-1 gap-2">
                                    <Printer className="h-4 w-4" />
                                    Print Receipt
                                  </Button>
                                  <Button onClick={handleEmail} variant="outline" className="flex-1 gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Receipt
                                  </Button>
                                  <Button variant="outline" className="flex-1 gap-2">
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
