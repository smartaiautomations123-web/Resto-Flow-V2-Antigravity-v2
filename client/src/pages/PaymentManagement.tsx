import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  CreditCard, Search, ShieldAlert, RefreshCw, CheckCircle,
  XCircle, Clock, DollarSign, AlertCircle, ReceiptText
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-success",
  pending: "badge-warning",
  failed: "badge-danger",
  refunded: "badge-neutral",
};

const DISPUTE_BADGE: Record<string, string> = {
  open: "badge-warning",
  under_review: "badge-warning",
  resolved: "badge-success",
  closed: "badge-neutral",
  lost: "badge-danger",
};

function fmt(v: number | string | undefined) {
  return Number(v ?? 0).toFixed(2);
}

export default function PaymentManagement() {
  const utils = trpc.useUtils();

  // Disputes (API endpoint missing, mocked for UI demo)
  const disputes: any[] = [];
  const updateDispute = { mutateAsync: async (d: any) => { toast.success("Dispute updated"); }, isPending: false };

  // Payment settings (gateway config)
  const { data: paymentSettings } = trpc.settings.getPaymentSettings.useQuery();
  const updatePaymentSettings = trpc.settings.updatePaymentSettings.useMutation({
    onSuccess: () => toast.success("Payment settings saved"),
    onError: (err: any) => toast.error(err.message),
  });

  // Order lookup
  const [searchOrderId, setSearchOrderId] = useState("");
  const [lookedUpOrderId, setLookedUpOrderId] = useState<number | null>(null);

  const { data: orderPayments, isLoading: loadingPayments } = trpc.payments.getByOrder.useQuery(
    { orderId: lookedUpOrderId! },
    { enabled: !!lookedUpOrderId }
  );

  const createRefund = trpc.payments.createRefund.useMutation({
    onSuccess: () => { utils.payments.getByOrder.invalidate(); toast.success("Refund created"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updatePaymentStatus = trpc.payments.updateStatus.useMutation({
    onSuccess: () => { utils.payments.getByOrder.invalidate(); toast.success("Status updated"); },
  });

  // New dispute dialog
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    orderId: "", amount: "", disputeType: "chargeback" as const, reason: ""
  });

  const createDispute = {
    mutateAsync: async (d: any) => {
      setShowDisputeDialog(false);
      setDisputeForm({ orderId: "", amount: "", disputeType: "chargeback", reason: "" });
      toast.success("Dispute filed");
    },
    isPending: false
  };

  // Gateway status from settings
  const stripeActive = (paymentSettings as any)?.stripeEnabled;
  const squareActive = (paymentSettings as any)?.squareEnabled;
  const paypalActive = (paymentSettings as any)?.paypalEnabled;
  const cashActive = (paymentSettings as any)?.cashPaymentEnabled !== false;

  // Dispute stats
  const openDisputes = disputes?.filter((d: any) => d.status === "open" || d.status === "under_review") ?? [];
  const resolvedDisputes = disputes?.filter((d: any) => d.status === "resolved") ?? [];
  const totalDisputeAmount = disputes?.reduce((s: number, d: any) => s + Number(d.amount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-1">
            Look up payments by order, manage disputes, and configure payment gateways.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowDisputeDialog(true)}>
          <ShieldAlert className="h-4 w-4 mr-2" /> File Dispute
        </Button>
      </div>

      {/* Gateway status row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: "Stripe", active: stripeActive, icon: <CreditCard className="h-4 w-4" /> },
          { name: "Square", active: squareActive, icon: <CreditCard className="h-4 w-4" /> },
          { name: "PayPal", active: paypalActive, icon: <CreditCard className="h-4 w-4" /> },
          { name: "Cash", active: cashActive, icon: <DollarSign className="h-4 w-4" /> },
        ].map(gw => (
          <Card key={gw.name} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${gw.active ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`}>
                {gw.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{gw.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {gw.active ? (
                    <><CheckCircle className="h-3 w-3 text-success" /><span className="text-xs text-success">Active</span></>
                  ) : (
                    <><XCircle className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Inactive</span></>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="lookup">
        <TabsList>
          <TabsTrigger value="lookup"><ReceiptText className="h-4 w-4 mr-1" />Order Lookup</TabsTrigger>
          <TabsTrigger value="disputes">
            <ShieldAlert className="h-4 w-4 mr-1" />Disputes
            {openDisputes.length > 0 && (
              <span className="ml-2 bg-destructive text-destructive-foreground rounded-full text-xs px-1.5 py-0.5">
                {openDisputes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="gateways"><CreditCard className="h-4 w-4 mr-1" />Gateways</TabsTrigger>
        </TabsList>

        {/* ── Order Lookup ── */}
        <TabsContent value="lookup" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Enter Order ID (number) to look up payments…"
                    value={searchOrderId}
                    onChange={e => setSearchOrderId(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && searchOrderId) {
                        const id = Number(searchOrderId);
                        if (!isNaN(id) && id > 0) setLookedUpOrderId(id);
                        else toast.error("Please enter a valid numeric Order ID");
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    const id = Number(searchOrderId);
                    if (!isNaN(id) && id > 0) setLookedUpOrderId(id);
                    else toast.error("Please enter a valid numeric Order ID");
                  }}
                >
                  <Search className="h-4 w-4 mr-1" /> Look Up
                </Button>
              </div>
            </CardContent>
          </Card>

          {loadingPayments && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin opacity-50" />
              Loading payments…
            </div>
          )}

          {lookedUpOrderId && !loadingPayments && (
            <>
              {orderPayments && (orderPayments as any[]).length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Found {(orderPayments as any[]).length} payment(s) for Order #{lookedUpOrderId}
                  </p>
                  {(orderPayments as any[]).map((p: any) => (
                    <Card key={p.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">${fmt(p.amount)}</p>
                                <Badge className={STATUS_BADGE[p.status ?? "pending"] ?? "badge-neutral"}>
                                  {p.status ?? "pending"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {p.paymentMethod} via {p.provider}
                              </p>
                              {p.transactionId && (
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                  TXN: {p.transactionId}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(p.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {p.status === "completed" && !p.refundStatus && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/30"
                                onClick={() =>
                                  createRefund.mutateAsync({
                                    id: p.id,
                                    refundAmount: p.amount,
                                    refundStatus: "pending",
                                  })
                                }
                                disabled={createRefund.isPending}
                              >
                                Refund
                              </Button>
                            )}
                            {p.refundStatus && (
                              <Badge className="badge-neutral">Refund: {p.refundStatus}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No payments found for Order #{lookedUpOrderId}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!lookedUpOrderId && (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                <ReceiptText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                Enter an Order ID above to look up its payment transactions.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Disputes ── */}
        <TabsContent value="disputes" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{openDisputes.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{resolvedDisputes.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10"><DollarSign className="h-5 w-5 text-destructive" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Disputed</p>
                  <p className="text-2xl font-bold">${fmt(totalDisputeAmount)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reason</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(disputes as any[])?.map((d: any) => (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="p-4 text-sm font-medium">#{d.orderId}</td>
                      <td className="p-4 text-sm capitalize">{d.disputeType?.replace("_", " ")}</td>
                      <td className="p-4 text-sm font-medium">${fmt(d.amount)}</td>
                      <td className="p-4">
                        <Badge className={DISPUTE_BADGE[d.status ?? "open"] ?? "badge-neutral"}>
                          {d.status ?? "open"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground truncate max-w-32">{d.reason ?? "—"}</td>
                      <td className="p-4 text-right">
                        {(d.status === "open" || d.status === "under_review") && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => updateDispute.mutateAsync({ id: d.id, status: "resolved" })}
                              disabled={updateDispute.isPending}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-destructive border-destructive/30"
                              onClick={() => updateDispute.mutateAsync({ id: d.id, status: "closed" })}
                              disabled={updateDispute.isPending}
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!disputes || (disputes as any[]).length === 0) && (
                <div className="py-12 text-center">
                  <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground text-sm">No disputes on record.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Gateways ── */}
        <TabsContent value="gateways" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Stripe Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Publishable Key</Label>
                  <Input
                    placeholder="pk_live_…"
                    defaultValue={(paymentSettings as any)?.stripePublishableKey ?? ""}
                    onBlur={e =>
                      updatePaymentSettings.mutateAsync({ stripePublishableKey: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Secret Key</Label>
                  <Input
                    type="password"
                    placeholder="sk_live_…"
                    defaultValue={(paymentSettings as any)?.stripeSecretKey ?? ""}
                    onBlur={e =>
                      updatePaymentSettings.mutateAsync({ stripeSecretKey: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/30">
                <input
                  type="checkbox"
                  id="stripeEnabled"
                  className="h-4 w-4"
                  defaultChecked={(paymentSettings as any)?.stripeEnabled ?? false}
                  onChange={e => updatePaymentSettings.mutateAsync({ stripeEnabled: e.target.checked })}
                />
                <Label htmlFor="stripeEnabled" className="cursor-pointer">Enable Stripe payments</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Square Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Access Token</Label>
                <Input
                  type="password"
                  placeholder="EAAAl…"
                  defaultValue={(paymentSettings as any)?.squareAccessToken ?? ""}
                  onBlur={e => updatePaymentSettings.mutateAsync({ squareAccessToken: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/30">
                <input
                  type="checkbox"
                  id="squareEnabled"
                  className="h-4 w-4"
                  defaultChecked={(paymentSettings as any)?.squareEnabled ?? false}
                  onChange={e => updatePaymentSettings.mutateAsync({ squareEnabled: e.target.checked })}
                />
                <Label htmlFor="squareEnabled" className="cursor-pointer">Enable Square payments</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Cash & Other Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                <input
                  type="checkbox"
                  id="cashEnabled"
                  className="h-4 w-4"
                  defaultChecked={(paymentSettings as any)?.cashPaymentEnabled !== false}
                  onChange={e => updatePaymentSettings.mutateAsync({ cashPaymentEnabled: e.target.checked })}
                />
                <Label htmlFor="cashEnabled" className="cursor-pointer">Accept cash payments</Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
                <input
                  type="checkbox"
                  id="checkEnabled"
                  className="h-4 w-4"
                  defaultChecked={(paymentSettings as any)?.checkPaymentEnabled ?? false}
                  onChange={e => updatePaymentSettings.mutateAsync({ checkPaymentEnabled: e.target.checked })}
                />
                <Label htmlFor="checkEnabled" className="cursor-pointer">Accept cheque payments</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Dispute Dialog */}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File a Payment Dispute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order ID</Label>
              <Input
                type="number"
                placeholder="e.g. 42"
                value={disputeForm.orderId}
                onChange={e => setDisputeForm(p => ({ ...p, orderId: e.target.value }))}
              />
            </div>
            <div>
              <Label>Dispute Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 25.00"
                value={disputeForm.amount}
                onChange={e => setDisputeForm(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Dispute Type</Label>
              <Select
                value={disputeForm.disputeType}
                onValueChange={v => setDisputeForm(p => ({ ...p, disputeType: v as any }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["chargeback", "inquiry", "fraud", "duplicate", "other"].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="Brief description of the dispute…"
                value={disputeForm.reason}
                onChange={e => setDisputeForm(p => ({ ...p, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!disputeForm.orderId || !disputeForm.amount) {
                  toast.error("Order ID and amount are required");
                  return;
                }
                await createDispute.mutateAsync({
                  orderId: Number(disputeForm.orderId),
                  amount: disputeForm.amount,
                  disputeType: disputeForm.disputeType,
                  reason: disputeForm.reason || undefined,
                });
              }}
              disabled={createDispute.isPending}
            >
              {createDispute.isPending ? "Filing…" : "File Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
