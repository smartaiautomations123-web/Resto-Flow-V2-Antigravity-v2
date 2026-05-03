import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, TrendingDown, Store, AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function ProcurementDashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: marketPrices, isLoading: loadingPrices } = trpc.procurement.getMarketPrices.useQuery();
  const { data: smartBasket, isLoading: loadingBasket } = trpc.procurement.getSmartBasket.useQuery();
  
  const createPoMutation = trpc.purchaseOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Draft PO created successfully!");
      // Optionally, navigate to the supplier tracking page or invalidate queries
      // setLocation("/supplier-tracking");
    },
    onError: (err) => {
      toast.error(`Failed to create PO: ${err.message}`);
    }
  });

  const handleDraftPo = async (basket: any) => {
    await createPoMutation.mutateAsync({
      supplierId: basket.supplierId,
      notes: `Smart Basket Auto-Generated PO. Includes best market prices as of ${new Date().toLocaleDateString()}`,
      items: basket.items.map((item: any) => ({
        ingredientId: item.ingredientId,
        quantity: item.orderQty.toString(),
        unitCost: item.unitPrice.toString(),
        totalCost: item.totalCost.toString()
      }))
    });
  };

  // Metrics
  const activeItems = marketPrices?.length || 0;
  const itemsBelowPar = marketPrices?.filter((i: any) => i.currentStock < i.parLevel)?.length || 0;
  
  const totalSavingsOpportunity = useMemo(() => {
    if (!marketPrices) return 0;
    return marketPrices.reduce((acc: number, item: any) => {
      if (!item.suppliers || item.suppliers.length < 2) return acc;
      const prices = item.suppliers.map((s: any) => s.unitPrice);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      // Simplified potential savings if buying the highest vs lowest
      return acc + (max - min);
    }, 0);
  }, [marketPrices]);

  if (loadingPrices || loadingBasket) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procurement Marketplace</h1>
          <p className="text-muted-foreground mt-1">Single Shelf view of all vendor prices and smart order recommendations.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Store className="h-8 w-8 text-primary/70 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tracked Items</p>
              <p className="text-2xl font-bold">{activeItems}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-border ${itemsBelowPar > 0 ? 'bg-destructive/5' : 'bg-card'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className={`h-8 w-8 shrink-0 ${itemsBelowPar > 0 ? 'text-destructive' : 'text-primary/70'}`} />
            <div>
              <p className="text-xs text-muted-foreground">Items Below Par</p>
              <p className="text-2xl font-bold">{itemsBelowPar}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Potential Savings</p>
              <p className="text-2xl font-bold">${totalSavingsOpportunity.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Smart Basket */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Smart Basket
              </CardTitle>
              <CardDescription>Optimized PO generation based on par levels and best prices.</CardDescription>
            </CardHeader>
            <CardContent>
              {!smartBasket || smartBasket.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  All items are above par. No orders needed.
                </div>
              ) : (
                <div className="space-y-4">
                  {smartBasket.map((basket: any) => (
                    <div key={basket.supplierId} className="border border-border/50 rounded-lg p-3 bg-background">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">{basket.supplierName}</span>
                        <Badge variant="secondary">${basket.totalCost.toFixed(2)}</Badge>
                      </div>
                      <div className="space-y-1">
                        {basket.items.map((item: any) => (
                          <div key={item.ingredientId} className="flex justify-between text-xs text-muted-foreground">
                            <span>{item.orderQty}x {item.name}</span>
                            <span>${item.totalCost.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3 h-8" 
                        onClick={() => handleDraftPo(basket)}
                        disabled={createPoMutation.isPending}
                      >
                        {createPoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Draft PO"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Market Prices (Single Shelf) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Single Shelf Comparison</CardTitle>
              <CardDescription>Compare normalized unit prices across all active vendors.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Item</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Best Vendor</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">Best Price (Unit)</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">Other Prices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketPrices?.map((item: any) => (
                      <tr key={item.id} className={`border-b border-border/50 hover:bg-accent/20 ${item.currentStock < item.parLevel ? 'bg-destructive/5' : ''}`}>
                        <td className="p-3">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Stock: {item.currentStock}/{item.parLevel} {item.baseUom}
                          </div>
                        </td>
                        <td className="p-3">
                          {item.bestPrice ? (
                            <span className="text-sm">{item.bestPrice.supplierName}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No data</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {item.bestPrice ? (
                            <div>
                              <div className="font-semibold text-green-500">${item.bestPrice.unitPrice.toFixed(2)} / {item.baseUom}</div>
                              <div className="text-xs text-muted-foreground">Pack: {item.bestPrice.packSize}</div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            {item.suppliers?.slice(1).map((s: any) => (
                              <div key={s.supplierId} className="text-xs text-muted-foreground">
                                <span className="opacity-70">{s.supplierName}:</span> ${s.unitPrice.toFixed(2)}
                              </div>
                            ))}
                            {(!item.suppliers || item.suppliers.length <= 1) && (
                              <span className="text-xs text-muted-foreground opacity-50">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!marketPrices || marketPrices.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No market prices found. Upload an invoice to start tracking!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
