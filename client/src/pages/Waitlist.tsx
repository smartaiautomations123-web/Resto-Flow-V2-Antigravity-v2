import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Plus, Phone, Users, Clock, CheckCircle, XCircle, Trash2, PhoneCall } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Waitlist() {
  const utils = trpc.useUtils();
  const { data: queue, isLoading } = trpc.waitlist.queue.useQuery(undefined, { refetchInterval: 5000 });
  const { data: stats } = trpc.waitlist.stats.useQuery(undefined, { refetchInterval: 5000 });

  const addToWaitlist = trpc.waitlist.add.useMutation({
    onSuccess: () => {
      utils.waitlist.queue.invalidate();
      utils.waitlist.stats.invalidate();
      setShowDialog(false);
      setFormData({ name: "", phone: "", email: "", partySize: "2", notes: "" });
      toast.success("Added to waitlist");
    },
  });

  const promoteGuest = trpc.waitlist.promote.useMutation({
    onSuccess: () => {
      utils.waitlist.queue.invalidate();
      utils.waitlist.stats.invalidate();
      toast.success("Guest called to table");
    },
  });

  const removeGuest = trpc.waitlist.remove.useMutation({
    onSuccess: () => {
      utils.waitlist.queue.invalidate();
      utils.waitlist.stats.invalidate();
      toast.success("Removed from waitlist");
    },
  });

  const updateStatus = trpc.waitlist.updateStatus.useMutation({
    onSuccess: () => {
      utils.waitlist.queue.invalidate();
      utils.waitlist.stats.invalidate();
    },
  });

  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", partySize: "2", notes: "" });

  const handleAddToWaitlist = async () => {
    if (!formData.name.trim() || !formData.partySize) {
      toast.error("Name and party size required");
      return;
    }

    await addToWaitlist.mutateAsync({
      guestName: formData.name,
      guestPhone: formData.phone || undefined,
      guestEmail: formData.email || undefined,
      partySize: Number(formData.partySize),
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waitlist Management</h1>
          <p className="text-muted-foreground mt-1">Manage guest queue and estimated wait times.</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Guest
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Waiting</p>
                <p className="text-3xl font-bold mt-2">{stats.waitingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Called</p>
                <p className="text-3xl font-bold mt-2">{stats.calledCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Seated</p>
                <p className="text-3xl font-bold mt-2">{stats.seatedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">Avg Wait</p>
                <p className="text-3xl font-bold mt-2">{stats.averageWaitTime}m</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Waitlist Queue */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : queue && queue.length > 0 ? (
            <div className="space-y-3">
              {queue.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-sm">
                        {guest.position}
                      </div>
                      <div>
                        <p className="font-semibold">{guest.guestName}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          {guest.guestPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {guest.guestPhone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {guest.partySize} guests
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> ~{guest.estimatedWaitTime}m wait
                          </span>
                        </div>
                        {guest.notes && <p className="text-xs text-muted-foreground mt-2">{guest.notes}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {guest.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => promoteGuest.mutate({ id: guest.id })}
                      disabled={promoteGuest.isPending}
                    >
                      <PhoneCall className="h-4 w-4 text-success" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeGuest.mutate({ id: guest.id })}
                      disabled={removeGuest.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No guests waiting</p>
          )}
        </CardContent>
      </Card>

      {/* Add Guest Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Guest to Waitlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Guest Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Party Size *</Label>
              <Input
                type="number"
                min="1"
                value={formData.partySize}
                onChange={(e) => setFormData((p) => ({ ...p, partySize: e.target.value }))}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                placeholder="High chair needed, allergies, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToWaitlist} disabled={addToWaitlist.isPending}>
              Add to Waitlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
