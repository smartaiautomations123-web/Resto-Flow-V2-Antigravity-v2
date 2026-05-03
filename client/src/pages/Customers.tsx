import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Pencil, Heart, Search, Star, Gift, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Customers() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const { data: customersList } = trpc.customers.list.useQuery({ search: search || undefined });
  const createCustomer = trpc.customers.create.useMutation({ onSuccess: () => utils.customers.list.invalidate() });
  const updateCustomer = trpc.customers.update.useMutation({ onSuccess: () => utils.customers.list.invalidate() });
  const addPoints = trpc.customers.addPoints.useMutation({ onSuccess: () => utils.customers.list.invalidate() });

  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", birthday: "" });
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [pointsCustomer, setPointsCustomer] = useState<any>(null);
  const [pointsAmount, setPointsAmount] = useState("");

  const openDialog = (item?: any) => {
    setEditItem(item || null);
    setForm({
      name: item?.name || "", email: item?.email || "", phone: item?.phone || "",
      notes: item?.notes || "", birthday: item?.birthday || "",
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editItem) {
      await updateCustomer.mutateAsync({ id: editItem.id, ...form });
      toast.success("Customer updated");
    } else {
      await createCustomer.mutateAsync(form);
      toast.success("Customer added");
    }
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers & Loyalty</h1>
          <p className="text-muted-foreground mt-1">Manage customer profiles, loyalty points, and preferences.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold mt-1">{customersList?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Heart className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">${customersList?.reduce((s, c) => s + Number(c.totalSpent || 0), 0).toFixed(2) || "0.00"}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center"><Star className="h-6 w-6 text-success" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Loyalty Points Issued</p>
                <p className="text-2xl font-bold mt-1">{customersList?.reduce((s, c) => s + (c.loyaltyPoints || 0), 0).toLocaleString() || "0"}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center"><Gift className="h-6 w-6 text-warning" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer list */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Visits</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Spent</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Loyalty Points</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customersList?.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="p-4">
                    <Link href={`/customers/${c.id}`}>
                      <p className="font-medium text-sm cursor-pointer hover:text-primary transition-colors">{c.name}</p>
                      {c.birthday && <p className="text-xs text-muted-foreground">Birthday: {c.birthday}</p>}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {c.email && <p>{c.email}</p>}
                    {c.phone && <p>{c.phone}</p>}
                  </td>
                  <td className="p-4 text-sm">{c.visitCount}</td>
                  <td className="p-4 text-sm font-medium">${Number(c.totalSpent || 0).toFixed(2)}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-primary">{c.loyaltyPoints || 0} pts</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/customers/${c.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPointsCustomer(c); setPointsAmount(""); setShowPointsDialog(true); }}>
                        <Gift className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!customersList || customersList.length === 0) && <p className="text-muted-foreground text-sm text-center py-8">No customers yet.</p>}
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Customer</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div><Label>Birthday (MM-DD)</Label><Input value={form.birthday} onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))} placeholder="e.g. 03-15" /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Loyalty Points</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Adding points for <strong>{pointsCustomer?.name}</strong></p>
            <p className="text-sm">Current balance: <strong>{pointsCustomer?.loyaltyPoints || 0} pts</strong></p>
            <div><Label>Points to Add</Label><Input type="number" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              if (!pointsAmount || !pointsCustomer) return;
              await addPoints.mutateAsync({ customerId: pointsCustomer.id, points: Number(pointsAmount) });
              toast.success(`${pointsAmount} points added`);
              setShowPointsDialog(false);
            }}>Add Points</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
