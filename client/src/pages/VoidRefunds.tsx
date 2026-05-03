import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function VoidRefunds() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [refundMethod, setRefundMethod] = useState("original_payment");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  const pendingVoids = trpc.voidRefunds.getPending.useQuery();
  const voidHistory = trpc.voidRefunds.getHistory.useQuery(
    { orderId: selectedOrder?.id || 0 },
    { enabled: !!selectedOrder?.id }
  );
  const approveVoidMutation = trpc.voidRefunds.approveVoid.useMutation();
  const rejectVoidMutation = trpc.voidRefunds.rejectVoid.useMutation();

  const handleApproveVoid = async () => {
    if (!selectedOrder) return;
    try {
      await approveVoidMutation.mutateAsync({
        orderId: selectedOrder.id,
        refundMethod: refundMethod as any,
        notes: approvalNotes,
      });
      toast.success("Void approved successfully");
      setShowApprovalDialog(false);
      setApprovalNotes("");
      setRefundMethod("original_payment");
      pendingVoids.refetch();
    } catch (error) {
      toast.error("Failed to approve void");
    }
  };

  const handleRejectVoid = async () => {
    if (!selectedOrder) return;
    try {
      await rejectVoidMutation.mutateAsync({
        orderId: selectedOrder.id,
        notes: rejectionNotes,
      });
      toast.success("Void rejected successfully");
      setShowApprovalDialog(false);
      setRejectionNotes("");
      pendingVoids.refetch();
    } catch (error) {
      toast.error("Failed to reject void");
    }
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Void & Refund Management</h1>
        <p className="text-muted-foreground">Review and approve pending voids and refunds</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history">Void History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingVoids.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading pending voids...</div>
          ) : pendingVoids.data?.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-semibold">No Pending Voids</p>
              <p className="text-muted-foreground">All void requests have been processed</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingVoids.data?.map((order: any) => (
                <Card key={order.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Order Type</p>
                          <p className="font-medium capitalize">{order.type.replace("_", " ")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-medium">${parseFloat(order.total).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Void Reason</p>
                          <p className="font-medium capitalize">{order.voidReason?.replace(/_/g, " ")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Requested By</p>
                          <p className="font-medium">{order.staffName}</p>
                        </div>
                      </div>
                      {order.voidNotes && (
                        <div className="mt-3 p-2 bg-muted rounded text-sm">
                          <p className="text-muted-foreground mb-1">Notes:</p>
                          <p>{order.voidNotes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {isAdmin && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowApprovalDialog(true);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              handleRejectVoid();
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowHistoryDialog(true);
                        }}
                      >
                        View History
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="p-6 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a pending void above to view its approval history</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Void Request</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Order #{selectedOrder.orderNumber}</p>
                <p className="font-semibold">${parseFloat(selectedOrder.total).toFixed(2)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Refund Method</label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original_payment">Original Payment Method</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Approval Notes (Optional)</label>
                <Textarea
                  placeholder="Add any notes about this approval..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="h-20"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveVoid} disabled={approveVoidMutation.isPending}>
              {approveVoidMutation.isPending ? "Processing..." : "Approve Void"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Void Approval History - Order #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {voidHistory.isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : voidHistory.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No history available</div>
          ) : (
            <div className="space-y-3">
              {voidHistory.data?.map((entry: any) => (
                <div key={entry.id} className="p-3 border rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.action === "void_requested" && (
                        <Clock className="w-4 h-4 text-yellow-500" />
                      )}
                      {entry.action === "void_approved" && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {entry.action === "void_rejected" && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium capitalize">{entry.action.replace(/_/g, " ")}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">By: {entry.performedByName}</p>
                  {entry.reason && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Reason:</span> {entry.reason.replace(/_/g, " ")}
                    </p>
                  )}
                  {entry.refundMethod && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Refund Method:</span> {entry.refundMethod.replace(/_/g, " ")}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-sm mt-1 p-2 bg-muted rounded">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
