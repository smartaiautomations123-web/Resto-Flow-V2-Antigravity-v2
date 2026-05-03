import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { AlertTriangle, Plus, Eye, CheckCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  under_review: "bg-blue-500/20 text-blue-400",
  won: "bg-green-500/20 text-green-400",
  lost: "bg-red-500/20 text-red-400",
  closed: "bg-gray-500/20 text-gray-400",
};

export default function PaymentDisputes() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);

  const [form, setForm] = useState({ orderId: "", transactionId: "", disputeType: "chargeback" as string, amount: "", reason: "" });

  const { data: disputes, isLoading } = trpc.paymentDisputes.list.useQuery(statusFilter !== "all" ? { status: statusFilter } : undefined);
  const createDispute = trpc.paymentDisputes.create.useMutation({
    onSuccess: () => { utils.paymentDisputes.list.invalidate(); setShowCreate(false); toast.success("Dispute logged"); },
  });
  const updateDispute = trpc.paymentDisputes.update.useMutation({
    onSuccess: () => { utils.paymentDisputes.list.invalidate(); toast.success("Dispute updated"); },
  });

  const handleCreate = () => {
    if (!form.orderId || !form.amount) { toast.error("Order ID and amount required"); return; }
    createDispute.mutate({
      orderId: Number(form.orderId),
      transactionId: form.transactionId ? Number(form.transactionId) : undefined,
      disputeType: form.disputeType as any,
      amount: form.amount,
      reason: form.reason || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" /> Payment Disputes
          </h1>
          <p className="text-muted-foreground mt-1">Track chargebacks, fraud claims, and payment inquiries.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Log Dispute</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "open", "under_review", "won", "lost", "closed"].map(s => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
            {s.replace("_", " ")}
          </Button>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-3">
        {disputes?.map((d: any) => (
          <Card key={d.id} className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setShowDetail(d)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">Dispute #{d.id}</p>
                    <p className="text-sm text-muted-foreground">Order #{d.orderId} &middot; {d.disputeType.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">${Number(d.amount).toFixed(2)}</span>
                  <Badge className={STATUS_COLORS[d.status] || ""}>{d.status.replace("_", " ")}</Badge>
                </div>
              </div>
              {d.reason && <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{d.reason}</p>}
              <p className="text-xs text-muted-foreground mt-1">{new Date(d.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
        {(!disputes || disputes.length === 0) && !isLoading && (
          <p className="text-muted-foreground text-center py-12">No disputes found.</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Payment Dispute</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Order ID *</Label><Input type="number" value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))} /></div>
              <div><Label>Transaction ID</Label><Input type="number" value={form.transactionId} onChange={e => setForm(p => ({ ...p, transactionId: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dispute Type *</Label>
                <Select value={form.disputeType} onValueChange={v => setForm(p => ({ ...p, disputeType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chargeback">Chargeback</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="fraud">Fraud</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
            </div>
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3} /></div>
            <Button className="w-full" onClick={handleCreate} disabled={createDispute.isPending}>Log Dispute</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dispute #{showDetail?.id}</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Order:</span> #{showDetail.orderId}</div>
                <div><span className="text-muted-foreground">Amount:</span> ${Number(showDetail.amount).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Type:</span> {showDetail.disputeType}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={STATUS_COLORS[showDetail.status] || ""}>{showDetail.status}</Badge></div>
              </div>
              {showDetail.reason && <div><Label className="text-muted-foreground">Reason</Label><p className="text-sm mt-1">{showDetail.reason}</p></div>}
              {showDetail.evidence && <div><Label className="text-muted-foreground">Evidence</Label><p className="text-sm mt-1">{showDetail.evidence}</p></div>}
              {showDetail.status === "open" || showDetail.status === "under_review" ? (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => { updateDispute.mutate({ id: showDetail.id, status: "under_review" }); setShowDetail(null); }}>Mark Under Review</Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { updateDispute.mutate({ id: showDetail.id, status: "won" }); setShowDetail(null); }}>Won</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { updateDispute.mutate({ id: showDetail.id, status: "lost" }); setShowDetail(null); }}>Lost</Button>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
