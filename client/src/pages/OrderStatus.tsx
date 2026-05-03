import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2, Loader2 } from "lucide-react";

export default function OrderStatus() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchedOrderNumber, setSearchedOrderNumber] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const orderQuery = trpc.orderTracking.getStatusWithItems.useQuery(
    { orderNumber: searchedOrderNumber },
    { enabled: !!searchedOrderNumber, refetchInterval: autoRefresh ? 5000 : false }
  );

  const estimatedTimeQuery = trpc.orderTracking.getEstimatedTime.useQuery(
    { orderId: orderQuery.data?.id || 0 },
    { enabled: !!orderQuery.data?.id, refetchInterval: autoRefresh ? 5000 : false }
  );

  const timelineQuery = trpc.orderTracking.getStatusTimeline.useQuery(
    { orderId: orderQuery.data?.id || 0 },
    { enabled: !!orderQuery.data?.id, refetchInterval: autoRefresh ? 5000 : false }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchedOrderNumber(orderNumber);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-5 h-5" />,
    preparing: <Loader2 className="w-5 h-5 animate-spin" />,
    ready: <CheckCircle2 className="w-5 h-5" />,
    completed: <CheckCircle2 className="w-5 h-5" />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Order Status</h1>
          <p className="text-slate-300">Track your order in real-time</p>
        </div>

        {/* Search Form */}
        <Card className="bg-slate-800 border-slate-700 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Order Number
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter your order number (e.g., ORD-12345)"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Search
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Order Not Found */}
        {searchedOrderNumber && orderQuery.isLoading && (
          <Card className="bg-slate-800 border-slate-700 p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-4" />
            <p className="text-slate-300">Searching for order...</p>
          </Card>
        )}

        {searchedOrderNumber && orderQuery.isError && (
          <Card className="bg-red-900 border-red-700 p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-100">Order Not Found</h3>
                <p className="text-red-200 text-sm mt-1">
                  We couldn't find an order with that number. Please check and try again.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Order Details */}
        {orderQuery.data && (
          <div className="space-y-6">
            {/* Order Info */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Order Number</p>
                  <p className="text-white font-semibold">{orderQuery.data.orderNumber}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Order Total</p>
                  <p className="text-white font-semibold">${parseFloat(orderQuery.data.total as any).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Order Type</p>
                  <p className="text-white font-semibold capitalize">{orderQuery.data.type}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Current Status</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[orderQuery.data.status] || "bg-gray-100 text-gray-800"}`}>
                    {orderQuery.data.status.charAt(0).toUpperCase() + orderQuery.data.status.slice(1)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Status Timeline */}
            {timelineQuery.data && (
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Order Progress</h3>
                <div className="space-y-4">
                  {timelineQuery.data.statuses.map((status, index) => (
                    <div key={status.name} className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            status.completed
                              ? "bg-green-500 text-white"
                              : status.current
                                ? "bg-orange-500 text-white"
                                : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {status.completed || status.current ? (
                            statusIcons[status.name]
                          ) : (
                            <span className="text-sm">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium capitalize ${status.current ? "text-orange-400" : status.completed ? "text-green-400" : "text-slate-400"}`}>
                          {status.name}
                        </p>
                        {status.timestamp && (
                          <p className="text-sm text-slate-500">
                            {new Date(status.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Estimated Time */}
            {estimatedTimeQuery.data && (
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Estimated Time</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Elapsed</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {estimatedTimeQuery.data.elapsedMinutes}m
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Remaining</p>
                    <p className="text-2xl font-bold text-green-400">
                      {estimatedTimeQuery.data.remainingMinutes}m
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {estimatedTimeQuery.data.estimatedTotalMinutes}m
                    </p>
                  </div>
                </div>
                <div className="mt-4 bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-green-400 h-full transition-all duration-500"
                    style={{ width: `${estimatedTimeQuery.data.percentComplete}%` }}
                  />
                </div>
                <p className="text-center text-slate-400 text-sm mt-2">
                  {estimatedTimeQuery.data.percentComplete}% Complete
                </p>
              </Card>
            )}

            {/* Order Items */}
            {orderQuery.data.items && orderQuery.data.items.length > 0 && (
              <Card className="bg-slate-800 border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>
                <div className="space-y-3">
                  {orderQuery.data.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.itemName}</p>
                        {item.notes && (
                          <p className="text-slate-400 text-sm">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-slate-300 text-sm">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Auto-refresh Toggle */}
            <div className="flex items-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-lg">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="autoRefresh" className="text-slate-300 text-sm cursor-pointer">
                Auto-refresh every 5 seconds
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
