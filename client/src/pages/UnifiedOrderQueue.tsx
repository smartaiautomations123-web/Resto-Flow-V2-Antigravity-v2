import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { LayoutGrid, Store, ShoppingBag, Truck, Clock } from "lucide-react";

const CHANNEL_ICONS: Record<string, any> = {
  dine_in: Store,
  takeaway: ShoppingBag,
  delivery: Truck,
  collection: ShoppingBag,
};

const CHANNEL_COLORS: Record<string, string> = {
  dine_in: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  takeaway: "bg-green-500/20 text-green-400 border-green-500/30",
  delivery: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  collection: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  preparing: "bg-blue-500/20 text-blue-400",
  ready: "bg-green-500/20 text-green-400",
  served: "bg-gray-500/20 text-gray-400",
};

export default function UnifiedOrderQueue() {
  const { data: orders, isLoading } = trpc.salesAnalytics.unifiedQueue.useQuery(undefined, { refetchInterval: 10000 });
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (channelFilter === "all") return orders;
    return orders.filter((o: any) => o.channel === channelFilter);
  }, [orders, channelFilter]);

  const channelCounts = useMemo(() => {
    if (!orders) return {};
    const counts: Record<string, number> = { all: orders.length };
    for (const o of orders as any[]) {
      counts[o.channel] = (counts[o.channel] || 0) + 1;
    }
    return counts;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" /> Unified Order Queue
          </h1>
          <p className="text-muted-foreground mt-1">All active orders from every channel in one view.</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-1">{orders?.length || 0} active</Badge>
      </div>

      {/* Channel filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "dine_in", "takeaway", "delivery", "collection"].map(ch => (
          <Button key={ch} variant={channelFilter === ch ? "default" : "outline"} size="sm" onClick={() => setChannelFilter(ch)} className="capitalize gap-1.5">
            {ch === "all" ? "All Channels" : ch.replace("_", " ")}
            {(channelCounts[ch] || 0) > 0 && (
              <Badge variant="secondary" className="text-xs h-5 min-w-5 px-1">{channelCounts[ch]}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Orders grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((order: any) => {
          const ChannelIcon = CHANNEL_ICONS[order.channel] || Store;
          const channelColor = CHANNEL_COLORS[order.channel] || "";
          return (
            <Card key={order.id} className={`bg-card border ${channelColor.split(" ").pop() || "border-border"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${channelColor}`}>
                      <ChannelIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold">#{order.id}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.channel?.replace("_", " ")}</p>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[order.status] || ""}>{order.status}</Badge>
                </div>

                {order.customerName && <p className="text-sm mb-2">{order.customerName}</p>}

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {order.items?.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                      <span>${Number(item.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items?.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{order.items.length - 5} more items</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <span className="font-bold text-primary">${Number(order.total).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isLoading && <p className="text-center text-muted-foreground py-12">Loading orders...</p>}
      {!isLoading && filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No active orders.</p>}
    </div>
  );
}
