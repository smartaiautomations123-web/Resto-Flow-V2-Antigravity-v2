import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, BarChart3, Table2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const WASTE_REASONS = ["expired", "spoiled", "overproduction", "spillage", "contamination", "theft", "trimming", "other"];
const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#06b6d4", "#6366f1", "#ec4899"];

export default function WasteTracking() {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [logForm, setLogForm] = useState({
    ingredientId: "",
    quantity: "",
    unit: "",
    reason: "expired",
    cost: "",
    notes: "",
  });

  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: wasteByReason, refetch: refetchReason } = trpc.waste.getByReason.useQuery({
    startDate: new Date(startDate), endDate: new Date(endDate),
  });
  const { data: totalCost, refetch: refetchTotal } = trpc.waste.getTotalCost.useQuery({
    startDate: new Date(startDate), endDate: new Date(endDate),
  });
  const { data: wasteLogs, refetch: refetchLogs } = trpc.waste.getLogs.useQuery({
    startDate: new Date(startDate), endDate: new Date(endDate),
  });
  const { data: wasteByIngredient, refetch: refetchIngredient } = trpc.waste.getByIngredient.useQuery({
    startDate: new Date(startDate), endDate: new Date(endDate),
  });
  const logWaste = trpc.waste.logWaste.useMutation({
    onSuccess: () => {
      toast.success("Waste logged");
      setShowLogDialog(false);
      refetchReason(); refetchTotal(); refetchLogs(); refetchIngredient();
    },
  });

  const openLogDialog = () => {
    const first = ingredients?.[0];
    setLogForm({
      ingredientId: first ? String(first.id) : "",
      quantity: "",
      unit: first?.unit || "kg",
      reason: "expired",
      cost: "",
      notes: "",
    });
    setShowLogDialog(true);
  };

  const handleIngredientChange = (id: string) => {
    const ing = ingredients?.find(i => String(i.id) === id);
    setLogForm(p => ({
      ...p,
      ingredientId: id,
      unit: ing?.unit || p.unit,
      cost: ing && p.quantity ? (Number(p.quantity) * Number(ing.costPerUnit)).toFixed(2) : p.cost,
    }));
  };

  const handleQuantityChange = (q: string) => {
    const ing = ingredients?.find(i => String(i.id) === logForm.ingredientId);
    setLogForm(p => ({
      ...p,
      quantity: q,
      cost: ing && q ? (Number(q) * Number(ing.costPerUnit)).toFixed(2) : p.cost,
    }));
  };

  const submitLog = async () => {
    if (!logForm.ingredientId || !logForm.quantity || !logForm.reason || !logForm.cost) {
      toast.error("Please fill in all required fields"); return;
    }
    await logWaste.mutateAsync({
      ingredientId: Number(logForm.ingredientId),
      quantity: logForm.quantity,
      unit: logForm.unit,
      reason: logForm.reason,
      cost: logForm.cost,
      notes: logForm.notes || null,
      loggedBy: currentUser?.id || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waste Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor and analyze ingredient waste.</p>
        </div>
        <Button onClick={openLogDialog}>
          <Plus className="h-4 w-4 mr-2" /> Log Waste
        </Button>
      </div>

      {/* Date range */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Total cost banner */}
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Total Waste Cost</p>
              <p className="text-3xl font-bold text-destructive">${typeof totalCost === "number" ? totalCost.toFixed(2) : "0.00"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts"><BarChart3 className="h-4 w-4 mr-1" /> Charts</TabsTrigger>
          <TabsTrigger value="logs"><Table2 className="h-4 w-4 mr-1" /> Log Entries</TabsTrigger>
          <TabsTrigger value="byIngredient">By Ingredient</TabsTrigger>
        </TabsList>

        {/* Charts tab */}
        <TabsContent value="charts" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Waste Cost by Reason</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={wasteByReason || []} dataKey="totalCost" nameKey="reason" cx="50%" cy="50%" outerRadius={90} label={({ reason, totalCost }) => `${reason}: $${Number(totalCost).toFixed(0)}`}>
                      {(wasteByReason || []).map((_: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle>Waste Count by Reason</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={wasteByReason || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="reason" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Incidents" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {(!wasteByReason || wasteByReason.length === 0) && (
            <p className="text-muted-foreground text-sm text-center py-8">No waste data for the selected period.</p>
          )}
        </TabsContent>

        {/* Log entries tab */}
        <TabsContent value="logs" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ingredient</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reason</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cost</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteLogs?.map((log: any) => {
                      const ing = ingredients?.find(i => i.id === log.ingredientId);
                      return (
                        <tr key={log.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                          <td className="p-4 text-sm text-muted-foreground">{new Date(log.loggedAt || log.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-sm font-medium">{ing?.name || `#${log.ingredientId}`}</td>
                          <td className="p-4 text-sm">{Number(log.quantity).toFixed(2)} {log.unit}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">{log.reason}</Badge>
                          </td>
                          <td className="p-4 text-sm font-medium text-destructive">${Number(log.cost).toFixed(2)}</td>
                          <td className="p-4 text-sm text-muted-foreground">{log.notes || "–"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {(!wasteLogs || wasteLogs.length === 0) && (
                  <p className="text-muted-foreground text-sm text-center py-8">No waste logs for the selected period.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By ingredient tab */}
        <TabsContent value="byIngredient" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ingredient</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Incidents</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteByIngredient?.map((row: any) => {
                    const ing = ingredients?.find(i => i.id === row.ingredientId);
                    return (
                      <tr key={row.ingredientId} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="p-4 text-sm font-medium">{ing?.name || `#${row.ingredientId}`}</td>
                        <td className="p-4 text-sm">{Number(row.totalQuantity).toFixed(2)} {ing?.unit || ""}</td>
                        <td className="p-4 text-sm">{row.count}</td>
                        <td className="p-4 text-sm font-medium text-destructive">${Number(row.totalCost).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(!wasteByIngredient || wasteByIngredient.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-8">No data for the selected period.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Waste Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Waste</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ingredient *</Label>
              <Select value={logForm.ingredientId} onValueChange={handleIngredientChange}>
                <SelectTrigger><SelectValue placeholder="Select ingredient" /></SelectTrigger>
                <SelectContent>
                  {ingredients?.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name} ({i.unit})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={logForm.quantity} onChange={e => handleQuantityChange(e.target.value)} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={logForm.unit} onChange={e => setLogForm(p => ({ ...p, unit: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Reason *</Label>
              <Select value={logForm.reason} onValueChange={v => setLogForm(p => ({ ...p, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WASTE_REASONS.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Waste Cost ($) *</Label>
              <Input type="number" step="0.01" placeholder="Auto-calculated or enter manually" value={logForm.cost} onChange={e => setLogForm(p => ({ ...p, cost: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Optional details..." value={logForm.notes} onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>Cancel</Button>
            <Button onClick={submitLog} disabled={logWaste.isPending}>Log Waste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
