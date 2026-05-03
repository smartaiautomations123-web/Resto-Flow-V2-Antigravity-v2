import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimesheetExport } from "@/components/TimesheetExport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Users, Clock, CalendarDays, LogIn, LogOut, Download } from "lucide-react";

export default function StaffManagement() {
  const utils = trpc.useUtils();
  const { data: staffList } = trpc.staff.list.useQuery();
  const createStaff = trpc.staff.create.useMutation({ onSuccess: () => utils.staff.list.invalidate() });
  const updateStaff = trpc.staff.update.useMutation({ onSuccess: () => utils.staff.list.invalidate() });
  const deleteStaff = trpc.staff.delete.useMutation({ onSuccess: () => utils.staff.list.invalidate() });
  const clockInMut = trpc.staff.clockIn.useMutation({ onSuccess: () => utils.staff.timeEntries.invalidate() });
  const clockOutMut = trpc.staff.clockOut.useMutation({ onSuccess: () => utils.staff.timeEntries.invalidate() });
  const { data: timeEntries } = trpc.staff.timeEntries.useQuery({});

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    const d = new Date();
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day + 1);
    for (let i = 0; i < 7; i++) {
      const dd = new Date(start);
      dd.setDate(start.getDate() + i);
      dates.push(dd.toISOString().split("T")[0]);
    }
    return dates;
  }, []);

  const { data: shifts } = trpc.shifts.list.useQuery({ dateFrom: weekDates[0], dateTo: weekDates[6] });
  const createShift = trpc.shifts.create.useMutation({ onSuccess: () => utils.shifts.list.invalidate() });
  const deleteShift = trpc.shifts.delete.useMutation({ onSuccess: () => utils.shifts.list.invalidate() });

  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", pin: "", role: "server" as string, hourlyRate: "" });
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [shiftForm, setShiftForm] = useState({ staffId: "", date: "", startTime: "09:00", endTime: "17:00" });

  const openDialog = (item?: any) => {
    setEditItem(item || null);
    setForm({
      name: item?.name || "", email: item?.email || "", phone: item?.phone || "",
      pin: item?.pin || "", role: item?.role || "server", hourlyRate: item?.hourlyRate || "",
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name, email: form.email || undefined, phone: form.phone || undefined,
      pin: form.pin || undefined, role: form.role as any, hourlyRate: form.hourlyRate || undefined,
    };
    if (editItem) {
      await updateStaff.mutateAsync({ id: editItem.id, ...data });
      toast.success("Staff updated");
    } else {
      await createStaff.mutateAsync(data);
      toast.success("Staff added");
    }
    setShowDialog(false);
  };

  const handleClockIn = async (staffId: number) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await clockInMut.mutateAsync({ 
              staffId, 
              latitude: position.coords.latitude, 
              longitude: position.coords.longitude 
            });
            toast.success("Clocked in");
          } catch (e: any) {
            toast.error(e.message || "Failed to clock in");
          }
        },
        (error) => {
          toast.error("Location access required to clock in.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleClockOut = async (entry: any) => {
    await clockOutMut.mutateAsync({ id: entry.id });
    toast.success("Clocked out");
  };

  const activeClocks = timeEntries?.filter(e => !e.clockOut) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-1">Manage team members, shifts, and time tracking.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add Staff
        </Button>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team"><Users className="h-4 w-4 mr-1" /> Team</TabsTrigger>
          <TabsTrigger value="clock"><Clock className="h-4 w-4 mr-1" /> Time Clock</TabsTrigger>
          <TabsTrigger value="schedule"><CalendarDays className="h-4 w-4 mr-1" /> Schedule</TabsTrigger>
          <TabsTrigger value="timesheet"><Download className="h-4 w-4 mr-1" /> Timesheet Export</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rate</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">PIN</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList?.map(s => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="p-4 font-medium text-sm">{s.name}</td>
                      <td className="p-4"><Badge variant="outline" className="capitalize">{s.role}</Badge></td>
                      <td className="p-4 text-sm text-muted-foreground">{s.email || s.phone || "-"}</td>
                      <td className="p-4 text-sm">{s.hourlyRate ? `$${Number(s.hourlyRate).toFixed(2)}/hr` : "-"}</td>
                      <td className="p-4 text-sm font-mono text-muted-foreground">{s.pin || "-"}</td>
                      <td className="p-4"><Badge className={s.isActive ? "badge-success" : "badge-danger"}>{s.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { await deleteStaff.mutateAsync({ id: s.id }); toast.success("Deleted"); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!staffList || staffList.length === 0) && <p className="text-muted-foreground text-sm text-center py-8">No staff members yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clock" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList?.filter(s => s.isActive).map(s => {
              const activeClock = activeClocks.find(c => c.staffId === s.id);
              return (
                <Card key={s.id} className={`bg-card border-border ${activeClock ? "border-success/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{s.role}</p>
                      </div>
                      {activeClock ? (
                        <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => handleClockOut(activeClock)}>
                          <LogOut className="h-4 w-4 mr-1" /> Clock Out
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleClockIn(s.id)}>
                          <LogIn className="h-4 w-4 mr-1" /> Clock In
                        </Button>
                      )}
                    </div>
                    {activeClock && (
                      <p className="text-xs text-success mt-2">Clocked in since {new Date(activeClock.clockIn).toLocaleTimeString()}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <TabsContent value="timesheet" className="mt-4">
            <TimesheetExport staffList={staffList || []} />
          </TabsContent>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => { setShiftForm({ staffId: staffList?.[0]?.id ? String(staffList[0].id) : "", date: weekDates[0], startTime: "09:00", endTime: "17:00" }); setShowShiftDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Shift
            </Button>
          </div>
          <Card className="bg-card border-border overflow-x-auto">
            <CardContent className="p-0">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground w-32">Staff</th>
                    {weekDates.map(d => (
                      <th key={d} className="text-center p-3 text-sm font-medium text-muted-foreground">
                        {new Date(d + "T00:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffList?.filter(s => s.isActive).map(s => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="p-3 font-medium text-sm">{s.name}</td>
                      {weekDates.map(d => {
                        const dayShifts = (shifts as any[])?.filter(sh => sh.staffId === s.id && (sh.date || sh.shiftDate) === d) || [];
                        return (
                          <td key={d} className="p-2 text-center">
                            {dayShifts.map(sh => (
                              <div key={sh.id || Math.random()} className="text-xs bg-primary/10 text-primary rounded px-1 py-0.5 mb-1 cursor-pointer hover:bg-primary/20" onClick={async () => { if (sh.id) { await deleteShift.mutateAsync({ id: sh.id }); toast.success("Shift removed"); } }}>
                                {sh.startTime || (sh.clockIn ? new Date(sh.clockIn).toLocaleTimeString() : '')}-{sh.endTime || (sh.clockOut ? new Date(sh.clockOut).toLocaleTimeString() : '')}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["owner", "manager", "server", "bartender", "kitchen"].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Hourly Rate ($)</Label><Input type="number" step="0.01" value={form.hourlyRate} onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))} /></div>
            </div>
            <div><Label>PIN Code</Label><Input value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value }))} maxLength={6} placeholder="e.g. 1234" /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Shift</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Staff Member</Label>
              <Select value={shiftForm.staffId} onValueChange={v => setShiftForm(p => ({ ...p, staffId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staffList?.filter(s => s.isActive).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={shiftForm.date} onChange={e => setShiftForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start</Label><Input type="time" value={shiftForm.startTime} onChange={e => setShiftForm(p => ({ ...p, startTime: e.target.value }))} /></div>
              <div><Label>End</Label><Input type="time" value={shiftForm.endTime} onChange={e => setShiftForm(p => ({ ...p, endTime: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              if (!shiftForm.staffId || !shiftForm.date) return;
              await createShift.mutateAsync({ staffId: Number(shiftForm.staffId), date: shiftForm.date, startTime: shiftForm.startTime, endTime: shiftForm.endTime });
              toast.success("Shift added");
              setShowShiftDialog(false);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
