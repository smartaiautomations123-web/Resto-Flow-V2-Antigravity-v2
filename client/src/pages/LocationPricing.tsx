import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { MapPin, DollarSign, Save, Trash2 } from "lucide-react";

export default function LocationPricing() {
  const utils = trpc.useUtils();
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: menuItems } = trpc.menu.list.useQuery();
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [editPrices, setEditPrices] = useState<Record<number, string>>({});

  const locationId = selectedLocation ? Number(selectedLocation) : 0;
  const { data: locationPrices } = trpc.locationPrices.getByLocation.useQuery(
    { locationId },
    { enabled: locationId > 0 }
  );

  const setPriceMut = trpc.locationPrices.set.useMutation({
    onSuccess: () => { utils.locationPrices.getByLocation.invalidate(); toast.success("Price saved"); },
  });
  const deletePriceMut = trpc.locationPrices.delete.useMutation({
    onSuccess: () => { utils.locationPrices.getByLocation.invalidate(); toast.success("Override removed"); },
  });

  // Build a map of locationPrice overrides
  const priceOverrides = useMemo(() => {
    const map = new Map<number, { id: number; price: string }>();
    if (locationPrices) {
      for (const lp of locationPrices as any[]) {
        map.set(lp.menuItemId, { id: lp.id, price: lp.price });
      }
    }
    return map;
  }, [locationPrices]);

  const handleSave = (menuItemId: number) => {
    const price = editPrices[menuItemId];
    if (!price || !selectedLocation) return;
    setPriceMut.mutate({ locationId: Number(selectedLocation), menuItemId, price });
    setEditPrices(prev => { const next = { ...prev }; delete next[menuItemId]; return next; });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Location Pricing
          </h1>
          <p className="text-muted-foreground mt-1">Set per-location price overrides for menu items.</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Select Location</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Choose a location" /></SelectTrigger>
            <SelectContent>
              {locations?.map((loc: any) => (
                <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(!locations || locations.length === 0) && (
            <p className="text-sm text-muted-foreground mt-2">No locations found. Add locations in Settings first.</p>
          )}
        </CardContent>
      </Card>

      {selectedLocation && menuItems && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Menu Item Prices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Item</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Default Price</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Location Price</th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item: any) => {
                    const override = priceOverrides.get(item.id);
                    const editValue = editPrices[item.id];
                    return (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30">
                        <td className="p-3">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.categoryName || "Uncategorized"}</p>
                        </td>
                        <td className="p-3 text-right text-sm">${Number(item.price).toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            className="w-28 ml-auto text-right"
                            value={editValue !== undefined ? editValue : (override?.price || "")}
                            placeholder={Number(item.price).toFixed(2)}
                            onChange={e => setEditPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1 justify-end">
                            {(editValue || (!override && editPrices[item.id] !== undefined)) && (
                              <Button size="sm" onClick={() => handleSave(item.id)} disabled={setPriceMut.isPending}>
                                <Save className="h-3 w-3 mr-1" /> Save
                              </Button>
                            )}
                            {override && (
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePriceMut.mutate({ id: override.id })}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
