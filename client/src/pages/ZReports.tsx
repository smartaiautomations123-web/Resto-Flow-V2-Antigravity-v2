import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ZReports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Queries
  const reportQuery = trpc.zReports.getByDate.useQuery({ date: selectedDate });
  const rangeQuery = trpc.zReports.getByDateRange.useQuery({ startDate, endDate });
  const detailsQuery = trpc.zReports.getDetails.useQuery(
    { reportId: reportQuery.data?.id || 0 },
    { enabled: !!reportQuery.data?.id }
  );

  // Mutations
  const generateMutation = trpc.zReports.generate.useMutation({
    onSuccess: () => {
      toast.success("Z-Report generated successfully");
      reportQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to generate Z-Report: ${error.message}`);
    },
  });

  const deleteMutation = trpc.zReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Z-Report deleted successfully");
      reportQuery.refetch();
      rangeQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete Z-Report: ${error.message}`);
    },
  });

  const handleGenerateReport = async () => {
    await generateMutation.mutateAsync({ date: selectedDate });
  };

  const handleDeleteReport = async (reportId: number) => {
    if (confirm("Are you sure you want to delete this Z-Report?")) {
      await deleteMutation.mutateAsync({ reportId });
    }
  };

  const handleExportPDF = () => {
    if (!reportQuery.data) {
      toast.error("No report to export");
      return;
    }

    // Create a simple PDF export
    const content = `
Z-REPORT
Date: ${reportQuery.data.reportDate}
Generated: ${new Date(reportQuery.data.generatedAt).toLocaleString()}

SUMMARY
─────────────────────────────────────
Total Revenue:        $${parseFloat(reportQuery.data.totalRevenue.toString()).toFixed(2)}
Total Orders:         ${reportQuery.data.totalOrders}
Total Discounts:      $${parseFloat(reportQuery.data.totalDiscounts.toString()).toFixed(2)}
Total Voids:          $${parseFloat(reportQuery.data.totalVoids.toString()).toFixed(2)}
Total Tips:           $${parseFloat(reportQuery.data.totalTips.toString()).toFixed(2)}

PAYMENT BREAKDOWN
─────────────────────────────────────
Cash:                 $${parseFloat(reportQuery.data.cashTotal.toString()).toFixed(2)}
Card:                 $${parseFloat(reportQuery.data.cardTotal.toString()).toFixed(2)}
Split:                $${parseFloat(reportQuery.data.splitTotal.toString()).toFixed(2)}

${reportQuery.data.notes ? `NOTES\n─────────────────────────────────────\n${reportQuery.data.notes}\n` : ""}
    `.trim();

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", `z-report-${reportQuery.data.reportDate}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success("Z-Report exported as TXT");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">End-of-Day Reports</h1>
        <p className="text-muted-foreground">Generate and view daily Z-Reports for your restaurant</p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList>
          <TabsTrigger value="today">Today's Report</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Today's Report Tab */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Z-Report</CardTitle>
              <CardDescription>Create an end-of-day summary for the selected date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="max-w-xs"
                />
                <Button
                  onClick={handleGenerateReport}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Display */}
          {reportQuery.isLoading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : reportQuery.data ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Daily Summary</CardTitle>
                    <CardDescription>{reportQuery.data.reportDate}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteReport(reportQuery.data!.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">${parseFloat(reportQuery.data.totalRevenue.toString()).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{reportQuery.data.totalOrders}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Discounts</p>
                      <p className="text-2xl font-bold">${parseFloat(reportQuery.data.totalDiscounts.toString()).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Voids</p>
                      <p className="text-2xl font-bold">${parseFloat(reportQuery.data.totalVoids.toString()).toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Tips</p>
                      <p className="text-2xl font-bold">${parseFloat(reportQuery.data.totalTips.toString()).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between rounded-lg border p-3">
                      <span className="font-medium">Cash</span>
                      <span>${parseFloat(reportQuery.data.cashTotal.toString()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between rounded-lg border p-3">
                      <span className="font-medium">Card</span>
                      <span>${parseFloat(reportQuery.data.cardTotal.toString()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between rounded-lg border p-3">
                      <span className="font-medium">Split</span>
                      <span>${parseFloat(reportQuery.data.splitTotal.toString()).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              {detailsQuery.data?.items && detailsQuery.data.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsQuery.data.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.categoryName}</TableCell>
                            <TableCell className="text-right">{item.itemCount}</TableCell>
                            <TableCell className="text-right">${parseFloat(item.itemRevenue.toString()).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No Z-Report found for this date. Click "Generate Report" to create one.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>View Z-Reports from the past 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="max-w-xs"
                />
                <span className="flex items-center text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>

          {rangeQuery.isLoading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : rangeQuery.data && rangeQuery.data.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Discounts</TableHead>
                      <TableHead className="text-right">Voids</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rangeQuery.data.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.reportDate}</TableCell>
                        <TableCell className="text-right">${parseFloat(report.totalRevenue.toString()).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{report.totalOrders}</TableCell>
                        <TableCell className="text-right">${parseFloat(report.totalDiscounts.toString()).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${parseFloat(report.totalVoids.toString()).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDate(report.reportDate);
                              (document.querySelector('[value="today"]') as HTMLButtonElement)?.click();
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No Z-Reports found for the selected date range.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
