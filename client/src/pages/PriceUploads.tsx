import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Upload, FileText, ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle2, XCircle, Clock, Loader2, Search, Link2,
  Unlink, TrendingUp, Package, History, AlertTriangle,
  ChevronRight, Eye, Check, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Upload Tab ──────────────────────────────────────────────────────
function UploadTab() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const suppliersQ = trpc.suppliers.list.useQuery();
  const uploadMut = trpc.priceUploads.upload.useMutation();
  const utils = trpc.useUtils();

  const handleFileSelect = useCallback((f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }
    if (f.size > 16 * 1024 * 1024) {
      toast.error("File must be under 16MB");
      return;
    }
    setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedSupplierId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result: any = await uploadMut.mutateAsync({
          supplierId: Number(selectedSupplierId),
          fileName: file.name,
          fileBase64: base64,
        });
        toast.success(`Extracted ${result.totalItems} items — ${result.newItems} new, ${result.priceChanges} price changes`);
        setFile(null);
        utils.priceUploads.list.invalidate();
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5 text-primary" />
            Upload Vendor Order Guide
          </CardTitle>
          <CardDescription>
            Upload a PDF order guide from your vendor. The system will extract all product codes, descriptions, and prices using AI, then compare against existing records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Vendor</Label>
            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vendor..." />
              </SelectTrigger>
              <SelectContent>
                {(suppliersQ.data || []).map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".pdf"; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFileSelect(f); }; input.click(); }}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop a PDF order guide here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground/60">PDF files only, max 16MB</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !selectedSupplierId || uploadMut.isPending}
            className="w-full"
            size="lg"
          >
            {uploadMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing with AI... This may take a moment
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Extract Prices
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <UploadHistory />
    </div>
  );
}

// ─── Upload History ──────────────────────────────────────────────────
function UploadHistory() {
  const uploadsQ = trpc.priceUploads.list.useQuery();
  const suppliersQ = trpc.suppliers.list.useQuery();
  const [reviewUploadId, setReviewUploadId] = useState<number | null>(null);

  const supplierMap = useMemo(() => {
    const m = new Map<number, string>();
    (suppliersQ.data || []).forEach(s => m.set(s.id, s.name));
    return m;
  }, [suppliersQ.data]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "processing": return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case "review": return <Eye className="h-4 w-4 text-amber-400" />;
      case "applied": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, string> = {
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      applied: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return (
      <Badge variant="outline" className={`${variants[status] || ""} gap-1`}>
        {statusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Upload History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!uploadsQ.data?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No uploads yet. Upload your first vendor order guide above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {uploadsQ.data.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => u.status === "review" || u.status === "applied" ? setReviewUploadId(u.id) : null}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{u.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {supplierMap.get(u.supplierId) || "Unknown Vendor"} · {new Date(u.createdAt).toLocaleDateString()}
                        {u.dateRangeStart && ` · ${u.dateRangeStart} - ${u.dateRangeEnd}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {u.totalItems ? (
                      <div className="text-xs text-muted-foreground text-right">
                        <span className="font-medium">{u.totalItems}</span> items
                        {u.newItems ? <span className="text-emerald-400 ml-1">+{u.newItems} new</span> : null}
                        {u.priceChanges ? <span className="text-amber-400 ml-1">{u.priceChanges} changed</span> : null}
                      </div>
                    ) : null}
                    {statusBadge(u.status)}
                    {(u.status === "review" || u.status === "applied") && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {reviewUploadId !== null && (
        <ReviewDialog uploadId={reviewUploadId} onClose={() => setReviewUploadId(null)} />
      )}
    </>
  );
}

// ─── Review Dialog ───────────────────────────────────────────────────
function ReviewDialog({ uploadId, onClose }: { uploadId: number; onClose: () => void }) {
  const uploadQ = trpc.priceUploads.get.useQuery({ id: uploadId });
  const itemsQ = trpc.priceUploads.items.useQuery({ uploadId });
  const applyMut = trpc.priceUploads.applyPrices.useMutation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");

  const upload = uploadQ.data;
  const items = itemsQ.data || [];

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      (i.description as string).toLowerCase().includes(q) || i.vendorCode.includes(q)
    );
  }, [items, search]);

  const handleApply = async () => {
    try {
      const result: any = await applyMut.mutateAsync({ uploadId });
      toast.success(`Applied prices: ${result.totalItems} items, ${result.newItems} new, ${result.priceChanges} changed`);
      utils.priceUploads.list.invalidate();
      utils.priceUploads.get.invalidate({ id: uploadId });
      utils.vendorProducts.list.invalidate();
      utils.ingredients.list.invalidate();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply prices");
    }
  };

  const priceChangeIcon = (change: string | null) => {
    if (!change || Number(change) === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
    return Number(change) > 0
      ? <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
      : <ArrowDownRight className="h-3.5 w-3.5 text-emerald-400" />;
  };

  const increases = items.filter(i => i.priceChange && Number(i.priceChange) > 0).length;
  const decreases = items.filter(i => i.priceChange && Number(i.priceChange) < 0).length;
  const newItems = items.filter(i => i.isNew).length;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Review Price Upload
          </DialogTitle>
          <DialogDescription>
            {upload?.fileName} · {upload?.dateRangeStart && `${upload.dateRangeStart} - ${upload.dateRangeEnd}`}
          </DialogDescription>
        </DialogHeader>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{newItems}</p>
            <p className="text-xs text-muted-foreground">New Products</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-red-400">{increases}</p>
            <p className="text-xs text-muted-foreground">Price Increases</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{decreases}</p>
            <p className="text-xs text-muted-foreground">Price Decreases</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by description or vendor code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Items table */}
        <ScrollArea className="flex-1 min-h-0 border rounded-lg">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[80px_1fr_100px_100px_80px_80px] gap-2 px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 border-b">
              <span>Code</span>
              <span>Description</span>
              <span className="text-right">Case Price</span>
              <span className="text-right">Prev Price</span>
              <span className="text-right">Change</span>
              <span className="text-center">Status</span>
            </div>
            {filtered.map(item => (
              <div
                key={item.id}
                className={`grid grid-cols-[80px_1fr_100px_100px_80px_80px] gap-2 px-4 py-2.5 text-sm border-b last:border-0 hover:bg-accent/20 transition-colors
                  ${item.isNew ? "bg-emerald-500/5" : ""}
                  ${item.priceChange && Number(item.priceChange) > 0 ? "bg-red-500/5" : ""}
                  ${item.priceChange && Number(item.priceChange) < 0 ? "bg-emerald-500/5" : ""}`}
              >
                <span className="font-mono text-xs text-muted-foreground">{item.vendorCode}</span>
                <span className="truncate">{item.description as string}</span>
                <span className="text-right font-mono">${Number(item.casePrice || 0).toFixed(2)}</span>
                <span className="text-right font-mono text-muted-foreground">
                  {item.previousCasePrice ? `$${Number(item.previousCasePrice).toFixed(2)}` : "—"}
                </span>
                <span className="text-right flex items-center justify-end gap-1">
                  {priceChangeIcon(item.priceChange)}
                  {item.priceChange && Number(item.priceChange) !== 0 ? (
                    <span className={`font-mono text-xs ${Number(item.priceChange) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {Number(item.priceChange) > 0 ? "+" : ""}{Number(item.priceChange).toFixed(2)}
                    </span>
                  ) : null}
                </span>
                <span className="text-center">
                  {item.isNew ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">New</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Existing</Badge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {upload?.status === "review" && (
            <Button onClick={handleApply} disabled={applyMut.isPending}>
              {applyMut.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Applying...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> Apply All Prices</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Vendor Catalog Tab ──────────────────────────────────────────────
function CatalogTab() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const suppliersQ = trpc.suppliers.list.useQuery();
  const productsQ = trpc.vendorProducts.list.useQuery(
    selectedSupplierId !== "all" ? { supplierId: Number(selectedSupplierId) } : undefined
  );

  const filtered = useMemo(() => {
    const items = productsQ.data || [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      (i.description as string).toLowerCase().includes(q) || i.vendorCode.includes(q)
    );
  }, [productsQ.data, search]);

  const supplierMap = useMemo(() => {
    const m = new Map<number, string>();
    (suppliersQ.data || []).forEach(s => m.set(s.id, s.name));
    return m;
  }, [suppliersQ.data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {(suppliersQ.data || []).map(s => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {!filtered.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No vendor products yet. Upload an order guide to populate the catalog.</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-[80px_1fr_120px_100px_100px_100px_100px] gap-2 px-4 py-2.5 bg-muted/30 text-xs font-medium text-muted-foreground border-b">
                  <span>Code</span>
                  <span>Description</span>
                  <span>Vendor</span>
                  <span className="text-right">Case Price</span>
                  <span className="text-right">Unit Price</span>
                  <span>Pack Size</span>
                  <span className="text-right">Updated</span>
                </div>
                {filtered.map(p => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[80px_1fr_120px_100px_100px_100px_100px] gap-2 px-4 py-2.5 text-sm border-b last:border-0 hover:bg-accent/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{p.vendorCode}</span>
                    <span className="truncate">{p.description as string}</span>
                    <span className="text-xs text-muted-foreground truncate">{supplierMap.get(p.supplierId) || "—"}</span>
                    <span className="text-right font-mono">${Number(p.currentCasePrice || 0).toFixed(2)}</span>
                    <span className="text-right font-mono">
                      {p.currentUnitPrice && Number(p.currentUnitPrice) > 0 ? `$${Number(p.currentUnitPrice).toFixed(4)}` : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">{p.packSize || "—"}</span>
                    <span className="text-right text-xs text-muted-foreground">
                      {p.lastUpdated ? new Date(p.lastUpdated).toLocaleDateString() : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProductId !== null && (
        <PriceHistoryDialog productId={selectedProductId} onClose={() => setSelectedProductId(null)} />
      )}
    </div>
  );
}

// ─── Price History Dialog ────────────────────────────────────────────
function PriceHistoryDialog({ productId, onClose }: { productId: number; onClose: () => void }) {
  const productQ = trpc.vendorProducts.get.useQuery({ id: productId });
  const historyQ = trpc.priceHistory.list.useQuery({ vendorProductId: productId });

  const product = productQ.data;
  const history = (historyQ.data || []).slice().reverse();

  const chartData = history.map(h => ({
    date: new Date(h.recordedAt).toLocaleDateString(),
    casePrice: Number(h.casePrice || 0),
    unitPrice: Number(h.unitPrice || 0),
  }));

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Price History
          </DialogTitle>
          <DialogDescription>
            {product?.vendorCode} — {product?.description as string}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xl font-bold">${Number(product?.currentCasePrice || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Current Case Price</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xl font-bold">
              {product?.currentUnitPrice && Number(product.currentUnitPrice) > 0
                ? `$${Number(product.currentUnitPrice).toFixed(4)}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Unit Price</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xl font-bold">{history.length}</p>
            <p className="text-xs text-muted-foreground">Price Records</p>
          </div>
        </div>

        {chartData.length > 1 ? (
          <div className="h-[250px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}`} />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Line type="monotone" dataKey="casePrice" name="Case Price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Need at least 2 data points for a chart. Upload more order guides to see trends.</p>
          </div>
        )}

        {history.length > 0 && (
          <ScrollArea className="max-h-[200px] border rounded-lg">
            <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground sticky top-0 border-b">
              <span>Date</span>
              <span className="text-right">Case Price</span>
              <span className="text-right">Unit Price</span>
            </div>
            {(historyQ.data || []).map(h => (
              <div key={h.id} className="grid grid-cols-[1fr_100px_100px] gap-2 px-4 py-2 text-sm border-b last:border-0">
                <span className="text-muted-foreground">{new Date(h.recordedAt).toLocaleDateString()}</span>
                <span className="text-right font-mono">${Number(h.casePrice || 0).toFixed(2)}</span>
                <span className="text-right font-mono">
                  {h.unitPrice && Number(h.unitPrice) > 0 ? `$${Number(h.unitPrice).toFixed(4)}` : "—"}
                </span>
              </div>
            ))}
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mappings Tab ────────────────────────────────────────────────────
function MappingsTab() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [mappingProduct, setMappingProduct] = useState<any>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");

  const suppliersQ = trpc.suppliers.list.useQuery();
  const productsQ = trpc.vendorProducts.list.useQuery(
    selectedSupplierId !== "all" ? { supplierId: Number(selectedSupplierId) } : undefined
  );
  const mappingsQ = trpc.vendorMappings.list.useQuery(
    selectedSupplierId !== "all" ? { supplierId: Number(selectedSupplierId) } : undefined
  );
  const ingredientsQ = trpc.ingredients.list.useQuery();
  const createMappingMut = trpc.vendorMappings.create.useMutation();
  const deleteMappingMut = trpc.vendorMappings.delete.useMutation();
  const utils = trpc.useUtils();

  const mappingMap = useMemo(() => {
    const m = new Map<number, { mappingId: number; ingredientId: number }>();
    (mappingsQ.data || []).forEach(mp => m.set(mp.vendorProductId, { mappingId: mp.id, ingredientId: mp.ingredientId }));
    return m;
  }, [mappingsQ.data]);

  const ingredientMap = useMemo(() => {
    const m = new Map<number, string>();
    (ingredientsQ.data || []).forEach(i => m.set(i.id, i.name));
    return m;
  }, [ingredientsQ.data]);

  const filtered = useMemo(() => {
    const items = productsQ.data || [];
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i =>
      (i.description as string).toLowerCase().includes(q) || i.vendorCode.includes(q)
    );
  }, [productsQ.data, search]);

  const handleCreateMapping = async () => {
    if (!mappingProduct || !selectedIngredientId) return;
    try {
      await createMappingMut.mutateAsync({
        vendorProductId: mappingProduct.id,
        ingredientId: Number(selectedIngredientId),
      });
      toast.success("Mapping created");
      utils.vendorMappings.list.invalidate();
      setMappingProduct(null);
      setSelectedIngredientId("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteMapping = async (mappingId: number) => {
    try {
      await deleteMappingMut.mutateAsync({ id: mappingId });
      toast.success("Mapping removed");
      utils.vendorMappings.list.invalidate();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const mapped = filtered.filter(p => mappingMap.has(p.id));
  const unmapped = filtered.filter(p => !mappingMap.has(p.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Vendors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {(suppliersQ.data || []).map(s => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendor products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Badge variant="outline" className="gap-1">
          <Link2 className="h-3 w-3" />
          {mapped.length} Mapped
        </Badge>
        <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-400 border-amber-500/20">
          <Unlink className="h-3 w-3" />
          {unmapped.length} Unmapped
        </Badge>
      </div>

      {/* Unmapped products */}
      {unmapped.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Unmapped Products ({unmapped.length})
            </CardTitle>
            <CardDescription className="text-xs">
              These vendor products are not linked to any internal ingredient. Map them to auto-update ingredient costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-auto">
              {unmapped.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 hover:bg-accent/20 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{p.description as string}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.vendorCode} · ${Number(p.currentCasePrice || 0).toFixed(2)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setMappingProduct(p); setSelectedIngredientId(""); }}>
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Map
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapped products */}
      {mapped.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Mapped Products ({mapped.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              {mapped.map(p => {
                const m = mappingMap.get(p.id)!;
                return (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{p.description as string}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.vendorCode}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Badge variant="secondary" className="shrink-0">
                        {ingredientMap.get(m.ingredientId) || `Ingredient #${m.ingredientId}`}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteMapping(m.mappingId)}>
                      <Unlink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping dialog */}
      <Dialog open={!!mappingProduct} onOpenChange={() => setMappingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Vendor Product to Ingredient</DialogTitle>
            <DialogDescription>
              Link <strong>{mappingProduct?.vendorCode}</strong> — {mappingProduct?.description as string} to an internal ingredient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Internal Ingredient</Label>
            <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an ingredient..." />
              </SelectTrigger>
              <SelectContent>
                {(ingredientsQ.data || []).map(i => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.name} ({i.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMappingProduct(null)}>Cancel</Button>
            <Button onClick={handleCreateMapping} disabled={!selectedIngredientId || createMappingMut.isPending}>
              {createMappingMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              Create Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function PriceUploads() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Price Uploads</h1>
        <p className="text-muted-foreground mt-1">
          Upload vendor order guides to track and compare product prices. Map vendor codes to your internal ingredients for automatic cost updates.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Upload & Review
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-1.5">
            <Package className="h-4 w-4" />
            Vendor Catalog
          </TabsTrigger>
          <TabsTrigger value="mappings" className="gap-1.5">
            <Link2 className="h-4 w-4" />
            Mappings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <UploadTab />
        </TabsContent>
        <TabsContent value="catalog">
          <CatalogTab />
        </TabsContent>
        <TabsContent value="mappings">
          <MappingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
