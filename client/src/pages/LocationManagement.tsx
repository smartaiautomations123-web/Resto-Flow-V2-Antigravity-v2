import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Plus, MapPin, Phone, Mail, Clock, Pencil, Trash2, Building2 } from 'lucide-react';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Toronto', 'Europe/London',
  'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney',
];

const emptyForm = { name: '', address: '', phone: '', email: '', timezone: 'UTC' };

export default function LocationManagement() {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: locations, isLoading } = trpc.locations.getAll.useQuery();

  const createMut = trpc.locations.create.useMutation({
    onSuccess: () => {
      toast.success('Location created');
      utils.locations.getAll.invalidate();
      setAddOpen(false);
      setAddForm({ ...emptyForm });
    },
    onError: () => toast.error('Failed to create location'),
  });

  const updateMut = trpc.locations.update.useMutation({
    onSuccess: () => {
      toast.success('Location updated');
      utils.locations.getAll.invalidate();
      setEditOpen(false);
    },
    onError: () => toast.error('Failed to update location'),
  });

  const deleteMut = trpc.locations.delete.useMutation({
    onSuccess: () => {
      toast.success('Location deleted');
      utils.locations.getAll.invalidate();
    },
    onError: () => toast.error('Failed to delete location'),
  });

  const handleAdd = () => {
    if (!addForm.name.trim() || !addForm.address.trim()) {
      toast.error('Name and address are required');
      return;
    }
    createMut.mutate(addForm);
  };

  const handleEdit = (loc: any) => {
    setEditForm({
      id: loc.id,
      name: loc.name ?? '',
      address: loc.address ?? '',
      phone: loc.phone ?? '',
      email: loc.email ?? '',
      timezone: loc.timezone ?? 'UTC',
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editForm) return;
    if (!editForm.name.trim() || !editForm.address.trim()) {
      toast.error('Name and address are required');
      return;
    }
    updateMut.mutate(editForm);
  };

  const FormFields = ({ data, onChange }: { data: any; onChange: (key: string, val: string) => void }) => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Location Name *</Label>
        <Input value={data.name} onChange={e => onChange('name', e.target.value)} placeholder="Downtown Branch" />
      </div>
      <div className="space-y-1">
        <Label>Address *</Label>
        <Input value={data.address} onChange={e => onChange('address', e.target.value)} placeholder="123 Main St, City, State" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input value={data.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+1 555-000-0000" />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input type="email" value={data.email} onChange={e => onChange('email', e.target.value)} placeholder="branch@restaurant.com" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Timezone</Label>
        <Select value={data.timezone} onValueChange={v => onChange('timezone', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Location Management</h1>
          <p className="text-muted-foreground mt-2">Manage your restaurant branches and locations</p>
        </div>

        {/* Add Location Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Location</DialogTitle></DialogHeader>
            <FormFields
              data={addForm}
              onChange={(key, val) => setAddForm(prev => ({ ...prev, [key]: val }))}
            />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} disabled={createMut.isPending} className="flex-1">
                {createMut.isPending ? 'Creating…' : 'Create Location'}
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Location Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Location</DialogTitle></DialogHeader>
          {editForm && (
            <>
              <FormFields
                data={editForm}
                onChange={(key, val) => setEditForm((prev: any) => ({ ...prev, [key]: val }))}
              />
              <div className="flex gap-2 pt-2">
                <Button onClick={handleUpdate} disabled={updateMut.isPending} className="flex-1">
                  {updateMut.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Location Cards */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Loading locations…</div>
      )}

      {!isLoading && (!locations || locations.length === 0) && (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">No locations yet</h3>
            <p className="text-muted-foreground text-sm mt-1">Click "Add Location" to create your first branch.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {locations?.map((loc: any) => (
          <Card key={loc.id} className="relative group transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{loc.name}</CardTitle>
                    <Badge variant="outline" className="text-xs mt-0.5">
                      {loc.isActive === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(loc)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Location</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{loc.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMut.mutate({ id: loc.id })}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {loc.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{loc.address}</span>
                </div>
              )}
              {loc.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{loc.phone}</span>
                </div>
              )}
              {loc.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{loc.email}</span>
                </div>
              )}
              {loc.timezone && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{loc.timezone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
