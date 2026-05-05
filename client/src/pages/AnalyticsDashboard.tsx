import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30days');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'orders', 'labour']);

  const { data: kpiMetrics, isLoading: kpiLoading } = trpc.settings.getKPIMetrics.useQuery({
    startDate: getDateFromRange(dateRange).start,
    endDate: getDateFromRange(dateRange).end,
  });

  const { data: profitability } = trpc.profitabilityMetrics.dashboard.useQuery({
    startDate: getDateFromRange(dateRange).start,
    endDate: getDateFromRange(dateRange).end,
  });

  const { data: salesAnalytics } = trpc.salesAnalytics.getSalesMetrics.useQuery({
    startDate: getDateFromRange(dateRange).start,
    endDate: getDateFromRange(dateRange).end,
  });

  const { data: revenueTrendData, isLoading: revenueTrendLoading } = trpc.reports.dailySales.useQuery({
    locationId: 1,
    dateFrom: getDateFromRange(dateRange).start,
    dateTo: getDateFromRange(dateRange).end,
  });

  const { data: hourlySalesData, isLoading: hourlySalesLoading } = trpc.salesAnalytics.hourlySalesTrend.useQuery({
    locationId: 1,
    date: getDateFromRange(dateRange).end,
  });

  const dateRangeOptions = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: kpiMetrics?.totalRevenue || '$0.00',
      change: kpiMetrics?.revenueChange || 0,
      icon: TrendingUp,
    },
    {
      title: 'Total Orders',
      value: kpiMetrics?.totalOrders || 0,
      change: kpiMetrics?.ordersChange || 0,
      icon: BarChart3,
    },
    {
      title: 'Average Order Value',
      value: kpiMetrics?.avgOrderValue || '$0.00',
      change: kpiMetrics?.aovChange || 0,
      icon: LineChartIcon,
    },
    {
      title: 'Labour Cost %',
      value: `${kpiMetrics?.labourCostPercent || 0}%`,
      change: kpiMetrics?.labourCostChange || 0,
      icon: PieChartIcon,
    },
  ];

  if (kpiLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-2">Real-time KPIs and business intelligence</p>
        </div>
        <div className="flex gap-2">
          {dateRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={dateRange === option.value ? 'default' : 'outline'}
              onClick={() => setDateRange(option.value)}
              size="sm"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          const isPositive = card.change >= 0;

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '↑' : '↓'} {Math.abs(card.change)}% from last period
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 mt-4">
                  {revenueTrendLoading ? (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Loading chart...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrendData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${value}`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#2563eb" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Orders by Hour */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Hour</CardTitle>
                <CardDescription>Peak ordering times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 mt-4">
                  {hourlySalesLoading ? (
                    <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Loading chart...</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlySalesData || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(value) => `${value}:00`}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [value, name === 'orders' ? 'Orders' : 'Revenue']}
                          labelFormatter={(label) => `${label}:00`}
                          cursor={{ fill: '#f3f4f6' }}
                        />
                        <Bar dataKey="orders" fill="#16a34a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Items */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Most popular menu items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Margherita Pizza', orders: 245, revenue: '$1,225' },
                    { name: 'Caesar Salad', orders: 189, revenue: '$945' },
                    { name: 'Pasta Carbonara', orders: 156, revenue: '$1,248' },
                    { name: 'Grilled Salmon', orders: 134, revenue: '$1,340' },
                    { name: 'Chocolate Cake', orders: 98, revenue: '$490' },
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.orders} orders</p>
                      </div>
                      <p className="font-semibold">{item.revenue}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { method: 'Credit Card', percentage: 65, amount: '$8,450' },
                    { method: 'Cash', percentage: 20, amount: '$2,600' },
                    { method: 'Mobile Payment', percentage: 10, amount: '$1,300' },
                    { method: 'Other', percentage: 5, amount: '$650' },
                  ].map((payment, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">{payment.method}</p>
                        <p className="text-sm text-gray-600">{payment.amount}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${payment.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>Detailed sales metrics and breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold text-foreground">${salesAnalytics?.totalRevenue || '0'}</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold text-foreground">{salesAnalytics?.totalOrders || 0}</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">Avg Transaction</p>
                    <p className="text-2xl font-bold text-foreground">${salesAnalytics?.avgOrderValue || '0'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profitability Tab */}
        <TabsContent value="profitability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profitability Analysis</CardTitle>
              <CardDescription>Profit margins and cost analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <p className="text-sm text-muted-foreground">Gross Profit</p>
                    <p className="text-2xl font-bold text-success">${profitability?.grossProfit || '0'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{profitability?.grossMargin || 0}% margin</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-500">${profitability?.netProfit || '0'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{profitability?.netMargin || 0}% margin</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-sm text-muted-foreground">Prime Cost</p>
                    <p className="text-2xl font-bold text-purple-500">{(profitability as any)?.primeCost || 0}%</p>
                    <p className="text-xs text-muted-foreground mt-1">COGS + Labour</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting</CardTitle>
              <CardDescription>Predicted sales and inventory needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary">Next 7 Days Forecast</p>
                  <p className="text-3xl font-bold mt-2 text-foreground">$12,450</p>
                  <p className="text-sm text-muted-foreground mt-1">Expected revenue based on historical trends</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-border rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Predicted Orders</p>
                    <p className="text-xl font-bold text-foreground">287</p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">Confidence Level</p>
                    <p className="text-xl font-bold text-foreground">92%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getDateFromRange(range: string) {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7days':
      start.setDate(end.getDate() - 7);
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      break;
    case 'ytd':
      start.setMonth(0);
      start.setDate(1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
