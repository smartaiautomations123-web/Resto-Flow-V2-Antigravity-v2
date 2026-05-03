import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Plus, CalendarDays, Clock, Users, CheckCircle2, X, AlertCircle } from "lucide-react";

export default function Reservations() {
  const utils = trpc.useUtils();
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [dateFilter, setDateFilter] = useState(today);
  const { data: reservationsList } = trpc.reservations.list.useQuery({ date: dateFilter });
  const { data: tablesList } = trpc.tables.list.useQuery();
  const createReservation = trpc.reservations.create.useMutation({ onSuccess: () => utils.reservations.list.invalidate() });
  const updateReservation = trpc.reservations.update.useMutation({ onSuccess: () => utils.reservations.list.invalidate() });

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", date: today, time: "19:00", partySize: "2", tableId: "", notes: "" });

  const save = async () => {
    if (!form.customerName.trim() || !form.date || !form.time) return;
    await createReservation.mutateAsync({
      guestName: form.customerName,
      guestPhone: form.customerPhone || undefined,
      guestEmail: form.customerEmail || undefined,
      date: form.date,
      time: form.time,
      partySize: Number(form.partySize),
      tableId: form.tableId ? Number(form.tableId) : undefined,
      notes: form.notes || undefined,
    });
    toast.success("Reservation created");
    setShowDialog(false);
  };

  const handleStatus = async (id: number, status: string) => {
    await updateReservation.mutateAsync({ id, status: status as any });
    toast.success(`Reservation ${status}`);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "confirmed": return "badge-info";
      case "seated": return "badge-success";
      case "completed": return "badge-success";
      case "cancelled": return "badge-danger";
      case "no_show": return "badge-danger";
      default: return "badge-warning";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
          <p className="text-muted-foreground mt-1">Manage table reservations and seating.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setForm({ customerName: "", customerPhone: "", customerEmail: "", date: today, time: "19:00", partySize: "2", tableId: "", notes: "" }); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Reservation
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/waitlist'}>
            <AlertCircle className="h-4 w-4 mr-2" /> Manage Waitlist
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
        <p className="text-sm text-muted-foreground">{reservationsList?.length || 0} reservations</p>
      </div>

      {/* Timeline view */}
      <div className="space-y-3">
        {reservationsList?.map(r => {
          const table = tablesList?.find(t => t.id === r.tableId);
          return (
            <Card key={r.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-primary">{r.time}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{r.guestName}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.partySize} guests</span>
                        {table && <span>Table: {table.name}</span>}
                        {r.guestPhone && <span>{r.guestPhone}</span>}
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">{r.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColor(r.status)}>{r.status.replace("_", " ")}</Badge>
                    {r.status === "confirmed" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "confirmed")}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleStatus(r.id, "cancelled")}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {r.status === "confirmed" && (
                      <Button size="sm" onClick={() => handleStatus(r.id, "seated")}>Seat</Button>
                    )}
                    {r.status === "seated" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatus(r.id, "completed")}>Complete</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!reservationsList || reservationsList.length === 0) && (
          <p className="text-muted-foreground text-sm text-center py-12">No reservations for this date.</p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Reservation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Guest Name</Label><Input value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Phone</Label><Input value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.customerEmail} onChange={e => setForm(p => ({ ...p, customerEmail: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div><Label>Time</Label><Input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} /></div>
              <div><Label>Party Size</Label><Input type="number" min={1} value={form.partySize} onChange={e => setForm(p => ({ ...p, partySize: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Table</Label>
              <Select value={form.tableId} onValueChange={v => setForm(p => ({ ...p, tableId: v }))}>
                <SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-assign</SelectItem>
                  {tablesList?.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.seats} seats)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
