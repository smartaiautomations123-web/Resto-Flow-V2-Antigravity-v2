import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

export function DaypartManagement() {
  const { data: dayparts } = trpc.dayparts.list.useQuery();
  const createDaypart = trpc.dayparts.create.useMutation();
  const updateDaypart = trpc.dayparts.update.useMutation();
  const { data: currentDaypart } = trpc.dayparts.getCurrent.useQuery();
  

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", startTime: "09:00", endTime: "11:00" });

  const handleCreate = async () => {
    if (!form.name || !form.startTime || !form.endTime) {
      toast.error("All fields required");
      return;
    }
    await createDaypart.mutateAsync(form);
    toast.success("Daypart created");
    setForm({ name: "", startTime: "09:00", endTime: "11:00" });
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daypart Management</h1>
          <p className="text-muted-foreground mt-1">Manage meal periods and dynamic pricing.</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Daypart
        </Button>
      </div>

      {currentDaypart && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Active Daypart</p>
                <p className="text-sm text-green-700">{currentDaypart.name} ({currentDaypart.startTime} - {currentDaypart.endTime})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dayparts</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Time</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-right p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dayparts?.map((dp) => (
                <tr key={dp.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{dp.name}</td>
                  <td className="p-2 text-sm">{dp.startTime} - {dp.endTime}</td>
                  <td className="p-2">
                    <Badge variant={dp.isActive ? "default" : "secondary"}>
                      {dp.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="ghost">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Daypart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name (e.g., Breakfast, Lunch, Dinner)</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
