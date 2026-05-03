import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { Plus, Download, Trash2, Eye } from 'lucide-react';

export default function CustomReportBuilder() {
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('sales');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { data: reports, isLoading } = trpc.settings.getCustomReports.useQuery();
  const createMutation = trpc.settings.createCustomReport.useMutation();
  const deleteMutation = trpc.settings.deleteCustomReport.useMutation();
  const exportMutation = trpc.settings.exportCustomReport.useMutation();

  const reportTypes = [
    { value: 'sales', label: 'Sales Report' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'labour', label: 'Labour Report' },
    { value: 'profitability', label: 'Profitability Report' },
    { value: 'customer', label: 'Customer Report' },
    { value: 'supplier', label: 'Supplier Report' },
  ];

  const metricOptions = {
    sales: ['Revenue', 'Orders', 'Average Order Value', 'Payment Methods', 'Discounts', 'Tips'],
    inventory: ['Stock Levels', 'Inventory Value', 'Waste', 'Supplier Performance', 'Lead Times'],
    labour: ['Labour Cost', 'Staff Hours', 'Overtime', 'Payroll', 'Compliance'],
    profitability: ['Gross Profit', 'Net Profit', 'Prime Cost', 'Food Cost %', 'Labour Cost %'],
    customer: ['Customer Count', 'Loyalty Points', 'Repeat Customers', 'Churn Rate', 'CLV'],
    supplier: ['Purchase Orders', 'Supplier Performance', 'Lead Times', 'Price Trends'],
  };

  const handleCreateReport = async () => {
    if (!reportName || !reportType) return;

    await createMutation.mutateAsync({
      name: reportName,
      type: reportType,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      metrics: selectedMetrics,
    });

    setReportName('');
    setReportType('sales');
    setDateFrom('');
    setDateTo('');
    setSelectedMetrics([]);
    setFilters({});
  };

  const handleExport = async (reportId: number, format: 'csv' | 'pdf') => {
    const result = await exportMutation.mutateAsync({ id: reportId, format });
    if (result?.success) alert(`Report "${result.name}" exported as ${result.format?.toUpperCase()}`);
  };

  const handleDelete = async (reportId: number) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await deleteMutation.mutateAsync({ id: reportId });
    }
  };

  const currentMetrics = metricOptions[reportType as keyof typeof metricOptions] || [];

  if (isLoading) {
    return <div className="p-6">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Custom Report Builder</h1>
        <p className="text-gray-500 mt-2">Create and manage custom reports</p>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Build Report</TabsTrigger>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
        </TabsList>

        {/* Report Builder */}
        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Report</CardTitle>
              <CardDescription>Define your custom report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Name */}
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="e.g., Weekly Sales Summary"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>

              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <select
                  id="report-type"
                  value={reportType}
                  onChange={(e) => {
                    setReportType(e.target.value);
                    setSelectedMetrics([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {reportTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-from">From Date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to">To Date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Metrics Selection */}
              <div className="space-y-3">
                <Label>Metrics to Include</Label>
                <div className="grid grid-cols-2 gap-3">
                  {currentMetrics.map((metric) => (
                    <label key={metric} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMetrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMetrics([...selectedMetrics, metric]);
                          } else {
                            setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <Label>Filters (Optional)</Label>
                <div className="space-y-2">
                  {reportType === 'sales' && (
                    <Input
                      placeholder="Filter by location"
                      value={filters.location || ''}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  )}
                  {reportType === 'labour' && (
                    <Input
                      placeholder="Filter by staff member"
                      value={filters.staff || ''}
                      onChange={(e) => setFilters({ ...filters, staff: e.target.value })}
                    />
                  )}
                  {reportType === 'inventory' && (
                    <Input
                      placeholder="Filter by category"
                      value={filters.category || ''}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateReport}
                  disabled={!reportName || !reportType || createMutation.isPending}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? 'Creating...' : 'Create Report'}
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Reports */}
        <TabsContent value="reports" className="space-y-4">
          {reports && reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription>
                      {report.type} • Created {new Date(report.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <p>Metrics: {(report as any).metrics?.join(', ') || 'None selected'}</p>
                      {(report as any).dateFrom && (report as any).dateTo && (
                        <p>
                          Period: {new Date((report as any).dateFrom).toLocaleDateString()} -{' '}
                          {new Date((report as any).dateTo).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(report.id, 'pdf')}
                        disabled={exportMutation.isPending}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(report.id, 'csv')}
                        disabled={exportMutation.isPending}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Excel
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(report.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No custom reports yet. Create one to get started!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
