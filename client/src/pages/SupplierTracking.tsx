import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Truck, Star, Clock, ShoppingBag, TrendingUp, Plus } from "lucide-react";

export default function SupplierTracking() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [recordForm, setRecordForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalOrders: "",
    onTimeDeliveries: "",
    lateDeliveries: "",
    qualityRating: "",
  });

  const { data: suppliersList } = trpc.suppliers.list.useQuery();
  const { data: performance, isLoading: perfLoading } = trpc.suppliers.getPerformance.useQuery(
    { supplierId: selectedSupplierId! },
    { enabled: !!selectedSupplierId }
  );
  const { data: scorecard } = trpc.suppliers.generateScorecard.useQuery(
    { supplierId: selectedSupplierId! },
    { enabled: !!selectedSupplierId }
  );
  const recordPerformance = trpc.supplierPerformance.recordPerformance.useMutation({
    onSuccess: () => {
      toast.success("Performance recorded");
      setShowRecordDialog(false);
    },
  });

  const selectedSupplier = suppliersList?.find(s => s.id === selectedSupplierId);

  const handleRecord = async () => {
    if (!selectedSupplierId || !recordForm.totalOrders) return;
    await recordPerformance.mutateAsync({
      supplierId: selectedSupplierId,
      month: recordForm.month,
      year: recordForm.year,
      totalOrders: Number(recordForm.totalOrders),
      onTimeDeliveries: Number(recordForm.onTimeDeliveries),
      lateDeliveries: Number(recordForm.lateDeliveries),
      qualityRating: recordForm.qualityRating || "3.0",
    });
  };

  const onTimeRate = scorecard ? Number(scorecard.onTimeRate) : 0;
  const qualityRating = scorecard ? Number(scorecard.qualityRating) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier Performance</h1>
          <p className="text-muted-foreground mt-1">Track delivery reliability, quality ratings, and pricing trends.</p>
        </div>
        {selectedSupplierId && (
          <Button onClick={() => setShowRecordDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Record Performance
          </Button>
        )}
      </div>

      {/* Supplier selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {suppliersList?.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedSupplierId(s.id === selectedSupplierId ? null : s.id)}
            className={`text-left rounded-lg border p-3 transition-colors ${s.id === selectedSupplierId
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50 hover:bg-accent/30"
              }`}
          >
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium text-sm truncate">{s.name}</span>
            </div>
            {s.contactName && <p className="text-xs text-muted-foreground mt-1 truncate">{s.contactName}</p>}
          </button>
        ))}
        {(!suppliersList || suppliersList.length === 0) && (
          <p className="text-muted-foreground text-sm col-span-full">No suppliers found. Add suppliers first.</p>
        )}
      </div>

      {!selectedSupplierId && suppliersList && suppliersList.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a supplier above to view their performance data.
          </CardContent>
        </Card>
      )}

      {selectedSupplierId && (
        <>
          {/* Scorecard */}
          <div>
            <h2 className="text-lg font-semibold mb-3">{selectedSupplier?.name} — Scorecard</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary/70 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">On-Time Rate</p>
                    <p className="text-2xl font-bold">{onTimeRate.toFixed(0)}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <Star className="h-8 w-8 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Quality Rating</p>
                    <p className="text-2xl font-bold">{qualityRating.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-primary/70 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Price</p>
                    <p className="text-2xl font-bold">${Number(scorecard?.averagePrice || 0).toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <ShoppingBag className="h-8 w-8 text-primary/70 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{scorecard?.totalOrders || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quality rating stars visual */}
          {scorecard && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= Math.round(qualityRating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{qualityRating.toFixed(1)} / 5.0 quality rating</span>
            </div>
          )}

          {/* Performance trend chart */}
          {performance && performance.length > 0 ? (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Delivery Performance Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performance.map((p: any) => ({
                    month: `${p.year}-${String(p.month).padStart(2, "0")}`,
                    onTime: p.onTimeDeliveries,
                    late: p.lateDeliveries,
                    total: p.totalOrders,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="onTime" name="On-Time" fill="#22c55e" />
                    <Bar dataKey="late" name="Late" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            !perfLoading && (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No performance data recorded for this supplier yet.
                  <br />
                  <Button className="mt-4" onClick={() => setShowRecordDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Record First Entry
                  </Button>
                </CardContent>
              </Card>
            )
          )}

          {/* Performance history table */}
          {performance && performance.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Monthly History</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Period</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Orders</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">On-Time</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Late</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">On-Time %</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.map((p: any) => {
                      const pct = p.totalOrders > 0 ? ((p.onTimeDeliveries / p.totalOrders) * 100).toFixed(0) : "0";
                      return (
                        <tr key={`${p.year}-${p.month}`} className="border-b border-border/50 hover:bg-accent/30">
                          <td className="p-4 text-sm font-medium">{p.year}-{String(p.month).padStart(2, "0")}</td>
                          <td className="p-4 text-sm">{p.totalOrders}</td>
                          <td className="p-4 text-sm text-green-600">{p.onTimeDeliveries}</td>
                          <td className="p-4 text-sm text-destructive">{p.lateDeliveries}</td>
                          <td className="p-4">
                            <Badge className={Number(pct) >= 90 ? "badge-success" : Number(pct) >= 70 ? "badge-warning" : "badge-danger"}>
                              {pct}%
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">{Number(p.qualityRating).toFixed(1)}/5</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Record Performance Dialog */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Performance — {selectedSupplier?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Month</Label>
                <Select value={String(recordForm.month)} onValueChange={v => setRecordForm(p => ({ ...p, month: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(2000, i).toLocaleString("default", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={recordForm.year} onChange={e => setRecordForm(p => ({ ...p, year: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Total Orders</Label><Input type="number" value={recordForm.totalOrders} onChange={e => setRecordForm(p => ({ ...p, totalOrders: e.target.value }))} /></div>
              <div><Label>On-Time</Label><Input type="number" value={recordForm.onTimeDeliveries} onChange={e => setRecordForm(p => ({ ...p, onTimeDeliveries: e.target.value }))} /></div>
              <div><Label>Late</Label><Input type="number" value={recordForm.lateDeliveries} onChange={e => setRecordForm(p => ({ ...p, lateDeliveries: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Quality Rating (1–5)</Label>
              <Input type="number" min="1" max="5" step="0.1" value={recordForm.qualityRating} onChange={e => setRecordForm(p => ({ ...p, qualityRating: e.target.value }))} placeholder="e.g. 4.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>Cancel</Button>
            <Button onClick={handleRecord} disabled={recordPerformance.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
