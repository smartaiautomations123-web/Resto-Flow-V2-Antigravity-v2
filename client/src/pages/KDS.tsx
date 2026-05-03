import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ChefHat, Clock, CheckCircle2, Flame, Volume2, VolumeX, Printer } from "lucide-react";

function TimerDisplay({ startTime }: { startTime: Date | string | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  if (!startTime) return null;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isLate = mins >= 15;
  return (
    <span className={`text-xs font-mono font-medium ${isLate ? "text-destructive" : mins >= 10 ? "text-yellow-500" : "text-muted-foreground"}`}>
      {mins}:{secs.toString().padStart(2, "0")}
    </span>
  );
}

const STATIONS = ["all", "grill", "fryer", "salad", "dessert", "bar", "general"] as const;

export default function KDS() {
  const utils = trpc.useUtils();
  const { data: kdsItemsData, isLoading } = trpc.kds.items.useQuery(undefined, { refetchInterval: 5000 });
  const kdsItems = kdsItemsData as any[] | undefined;
  const updateStatus = trpc.kds.updateStatus.useMutation({
    onSuccess: () => utils.kds.items.invalidate(),
  });
  const [station, setStation] = useState<string>("all");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const prevCountRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  // Audio alert for new orders
  const playAlert = useCallback(() => {
    if (!audioEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc2.start(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.8);
    } catch { /* audio not available */ }
  }, [audioEnabled]);

  // Detect new items and play alert
  useEffect(() => {
    if (!kdsItems) return;
    const pendingCount = kdsItems.filter(i => i.status === "pending").length;
    if (pendingCount > prevCountRef.current && prevCountRef.current > 0) {
      playAlert();
    }
    prevCountRef.current = pendingCount;
  }, [kdsItems, playAlert]);

  const filteredItems = useMemo(() => {
    if (!kdsItems) return [];
    if (station === "all") return kdsItems;
    return kdsItems.filter(i => (i.station || "general") === station);
  }, [kdsItems, station]);

  // Group items by station for the grouped view
  const groupedByStation = useMemo(() => {
    if (!kdsItems) return {};
    const groups: Record<string, typeof kdsItems> = {};
    for (const item of kdsItems) {
      const s = item.station || "general";
      if (!groups[s]) groups[s] = [];
      groups[s].push(item);
    }
    return groups;
  }, [kdsItems]);

  const pendingItems = filteredItems.filter(i => i.status === "pending");
  const preparingItems = filteredItems.filter(i => i.status === "preparing");

  // Station counts for badges
  const stationCounts = useMemo(() => {
    if (!kdsItems) return {};
    const counts: Record<string, number> = {};
    for (const item of kdsItems) {
      const s = item.station || "general";
      counts[s] = (counts[s] || 0) + (item.status === "pending" || item.status === "preparing" ? 1 : 0);
    }
    counts["all"] = kdsItems.filter(i => i.status === "pending" || i.status === "preparing").length;
    return counts;
  }, [kdsItems]);

  const handleStart = async (id: number) => {
    await updateStatus.mutateAsync({ id, status: "preparing" });
    toast.info("Item started");
  };

  const handleReady = async (id: number) => {
    await updateStatus.mutateAsync({ id, status: "ready" });
    toast.success("Item ready!");
  };

  // Reprint ticket
  const handleReprint = (item: NonNullable<typeof kdsItems>[0]) => {
    const ticket = [
      "================================",
      "       KITCHEN ORDER TICKET      ",
      "================================",
      `Order Item #${item.id}`,
      `Item: ${item.name}`,
      `Qty: ${item.quantity}`,
      `Station: ${item.station || "general"}`,
      item.notes ? `Notes: ${item.notes}` : "",
      Array.isArray(item.modifiers) && (item.modifiers as any[]).length > 0
        ? `Mods: ${(item.modifiers as Array<{ name: string }>).map(m => m.name).join(", ")}`
        : "",
      `Time: ${new Date().toLocaleTimeString()}`,
      "================================",
    ].filter(Boolean).join("\n");

    // Open print dialog
    const printWindow = window.open("", "_blank", "width=300,height=400");
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap;">${ticket}</pre>`);
      printWindow.document.close();
      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);
    }
    toast.info("Ticket sent to printer");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" /> Kitchen Display
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pendingItems.length} pending &middot; {preparingItems.length} preparing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAudioEnabled(!audioEnabled)}
            className={audioEnabled ? "text-primary" : "text-muted-foreground"}>
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => utils.kds.items.invalidate()}>Refresh</Button>
        </div>
      </div>

      {/* Station filter with counts */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATIONS.map(s => (
          <Button key={s} variant={station === s ? "default" : "outline"} size="sm" onClick={() => setStation(s)} className="capitalize gap-1.5">
            {s}
            {(stationCounts[s] || 0) > 0 && (
              <Badge variant={station === s ? "secondary" : "outline"} className="text-xs h-5 min-w-5 px-1">
                {stationCounts[s]}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Station-grouped view when "all" is selected */}
      {station === "all" && Object.keys(groupedByStation).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(groupedByStation).map(([stationName, items]) => {
            const stationPending = items.filter(i => i.status === "pending");
            const stationPreparing = items.filter(i => i.status === "preparing");
            if (stationPending.length === 0 && stationPreparing.length === 0) return null;
            return (
              <div key={stationName} className="border border-border rounded-xl p-4 bg-card/50">
                <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {stationName}
                  <Badge variant="secondary" className="text-xs">{stationPending.length + stationPreparing.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {[...stationPending, ...stationPreparing].map(item => (
                    <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${item.status === "pending" ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-primary/10 border border-primary/20"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{item.name}</span>
                          <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                        </div>
                        {item.notes && <p className="text-xs text-muted-foreground truncate">{String(item.notes)}</p>}
                      </div>
                      <TimerDisplay startTime={item.sentToKitchenAt} />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReprint(item)} title="Reprint">
                          <Printer className="h-3 w-3" />
                        </Button>
                        {item.status === "pending" ? (
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleStart(item.id)}>Start</Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-green-500 text-green-500" onClick={() => handleReady(item.id)}>Ready</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standard two-column view when a specific station is selected */}
      {station !== "all" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" /> Pending
              <Badge variant="secondary">{pendingItems.length}</Badge>
            </h2>
            <div className="space-y-3">
              {pendingItems.map(item => (
                <Card key={item.id} className="bg-card border-yellow-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{item.station || "general"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{String(item.notes)}</p>}
                        {Array.isArray(item.modifiers) && (item.modifiers as Array<{ name: string }>).length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {(item.modifiers as Array<{ name: string }>).map((m, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{m.name}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReprint(item)} title="Reprint ticket">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleStart(item.id)}>
                          <Flame className="h-4 w-4 mr-1" /> Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pendingItems.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No pending items</p>}
            </div>
          </div>

          {/* Preparing */}
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" /> Preparing
              <Badge variant="secondary">{preparingItems.length}</Badge>
            </h2>
            <div className="space-y-3">
              {preparingItems.map(item => (
                <Card key={item.id} className="bg-card border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{item.station || "general"}</Badge>
                          <TimerDisplay startTime={item.sentToKitchenAt} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{String(item.notes)}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReprint(item)} title="Reprint ticket">
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500/10" onClick={() => handleReady(item.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Ready
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {preparingItems.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No items being prepared</p>}
            </div>
          </div>
        </div>
      )}

      {isLoading && <p className="text-center text-muted-foreground py-12">Loading kitchen orders...</p>}
    </div>
  );
}
