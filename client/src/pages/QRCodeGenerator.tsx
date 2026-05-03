import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Printer, RefreshCw } from "lucide-react";
import QRCodeStyling from "qr-code-styling";
import { toast } from "sonner";

export default function QRCodeGenerator() {
  const [qrSize, setQrSize] = useState(200);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: allQRCodes, isLoading: isLoadingQRs, refetch: refetchQRs } = trpc.qrCodes.getAll.useQuery();
  const { data: allTables } = trpc.tables.list.useQuery();
  const { mutate: generateForAll, isPending: isGenerating } = trpc.qrCodes.createOrUpdate.useMutation({
    onSuccess: () => {
      toast.success("QR code generated");
      refetchQRs();
    },
    onError: (err: any) => toast.error(err?.message || "Error generating QR code"),
  });

  const handleGenerateAll = async () => {
    if (!allTables) return;
    for (const table of allTables) {
      const qrUrl = `${window.location.origin}/table/${table.id}`;
      generateForAll({
        tableId: table.id,
        qrUrl,
        qrSize: 200,
        format: "png",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadGrid = () => {
    const gridElement = document.getElementById("qr-grid");
    if (!gridElement) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 8;
    const qrWithMargin = qrSize + 40;
    canvas.width = gridSize * qrWithMargin;
    canvas.height = Math.ceil((allTables?.length || 0) / gridSize) * qrWithMargin;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-codes-grid-${new Date().toISOString().split("T")[0]}.png`;
    link.click();
  };

  useEffect(() => {
    if (selectedTable && previewOpen && qrRef.current) {
      qrRef.current.innerHTML = "";
      const qrCode = new QRCodeStyling({
        width: 300,
        height: 300,
        data: `${window.location.origin}/table/${selectedTable}`,
        image: "/logo.png",
        dotsOptions: {
          color: "#000000",
          type: "rounded",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
      });
      qrCode.append(qrRef.current);
    }
  }, [selectedTable, previewOpen]);

  if (isLoadingQRs) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  const qrMap = new Map(allQRCodes?.map(qr => [qr.tableId, qr]) || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">QR Code Generator</h1>
        <p className="text-muted-foreground">Generate and manage QR codes for table ordering</p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="print">Print Layout</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Configuration</CardTitle>
              <CardDescription>Customize QR code size and generate for all tables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="qr-size">QR Code Size (pixels)</Label>
                  <Input
                    id="qr-size"
                    type="number"
                    min="100"
                    max="500"
                    step="50"
                    value={qrSize}
                    onChange={(e) => setQrSize(parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 200-300px</p>
                </div>

                <div className="space-y-2">
                  <Label>Total Tables</Label>
                  <div className="text-2xl font-bold">{allTables?.length || 0}</div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate QR Codes for All Tables
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handlePrint} className="flex-1">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button variant="outline" onClick={handleDownloadGrid} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download Grid
                  </Button>
                  <Button variant="outline" onClick={() => refetchQRs()} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Gallery</CardTitle>
              <CardDescription>View QR codes for individual tables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allTables?.map((table) => {
                  const qr = qrMap.get(table.id);
                  return (
                    <Card key={table.id} className="text-center p-4">
                      <div className="space-y-2">
                        <p className="font-semibold">{table.name}</p>
                        {qr ? (
                          <div className="flex justify-center bg-white p-2 rounded">
                            <img src={qr.qrUrl} alt={`QR for ${table.name}`} className="w-24 h-24" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-muted flex items-center justify-center rounded mx-auto">
                            <p className="text-xs text-muted-foreground">Not generated</p>
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTable(table.id)}
                          className="w-full"
                        >
                          Preview
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Print Layout Tab */}
        <TabsContent value="print">
          <Card>
            <CardHeader>
              <CardTitle>Print-Friendly Layout</CardTitle>
              <CardDescription>8x8 grid layout ready for printing</CardDescription>
            </CardHeader>
            <CardContent>
              <div id="qr-grid" className="print:p-0 p-4 bg-white">
                <div className="grid grid-cols-8 gap-2 print:gap-1">
                  {allTables?.map((table) => {
                    const qr = qrMap.get(table.id);
                    return (
                      <div key={table.id} className="flex flex-col items-center justify-center p-2 print:p-1 border print:border-gray-300">
                        <div className="text-xs font-semibold mb-1 print:text-xs">{table.name}</div>
                        {qr ? (
                          <img src={qr.qrUrl} alt={`QR for ${table.name}`} className="w-16 h-16 print:w-20 print:h-20" />
                        ) : (
                          <div className="w-16 h-16 bg-muted" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex gap-2 print:hidden">
                <Button onClick={handlePrint} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print This Layout
                </Button>
                <Button onClick={handleDownloadGrid} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download as Image
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="flex flex-col items-center space-y-4">
              <div ref={qrRef} className="bg-white p-4 rounded" />
              <p className="text-sm text-muted-foreground">
                Table: {allTables?.find(t => t.id === selectedTable)?.name}
              </p>
              <Button
                onClick={() => {
                  const qr = qrMap.get(selectedTable);
                  if (qr) {
                    const link = document.createElement("a");
                    link.href = qr.qrUrl;
                    link.download = `qr-table-${selectedTable}.png`;
                    link.click();
                  }
                }}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          #qr-grid { margin: 0; padding: 0; }
          .print\\:hidden { display: none; }
          .print\\:p-0 { padding: 0; }
          .print\\:gap-1 { gap: 4px; }
          .print\\:border-gray-300 { border-color: #d1d5db; }
          .print\\:text-xs { font-size: 10px; }
          .print\\:w-20 { width: 80px; }
          .print\\:h-20 { height: 80px; }
        }
      `}</style>
    </div>
  );
}
