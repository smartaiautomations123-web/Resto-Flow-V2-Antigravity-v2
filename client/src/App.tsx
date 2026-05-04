import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import OrderStatus from "@/pages/OrderStatus";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import KDS from "./pages/KDS";
import MenuManagement from "./pages/MenuManagement";
import ComboBuilder from "./pages/ComboBuilder";
import { DaypartManagement } from "@/pages/DaypartManagement";
import Inventory from "./pages/Inventory";
import WasteTracking from "@/pages/WasteTracking";
import RecipeAnalysis from "./pages/RecipeAnalysis";
import StaffManagement from "./pages/StaffManagement";
import LabourManagement from "./pages/LabourManagement";
import Reports from "./pages/Reports";
import Profitability from "./pages/Profitability";
import ZReports from "./pages/ZReports";
import Suppliers from "./pages/Suppliers";
import SupplierTracking from "./pages/SupplierTracking";
import PriceUploads from "./pages/PriceUploads";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import CustomerSegments from "./pages/CustomerSegments";
import ProcurementDashboard from "./pages/ProcurementDashboard";
import Reservations from "./pages/Reservations";
import Waitlist from "./pages/Waitlist";
import OnlineOrdering from "./pages/OnlineOrdering";
import TableOrdering from "./pages/TableOrdering";
import FloorPlan from "./pages/FloorPlan";
import VoidRefunds from "./pages/VoidRefunds";
import VoidReasonAnalytics from "@/pages/VoidReasonAnalytics";
import QRCodeGenerator from "./pages/QRCodeGenerator";
import OrderHistory from "./pages/OrderHistory";
import PaymentManagement from "./pages/PaymentManagement";
import { SmsSettings } from "@/pages/SmsSettings";
import { EmailCampaigns } from "@/pages/EmailCampaigns";
import NotificationCenter from "./pages/NotificationCenter";
import LocationManagement from "./pages/LocationManagement";
import PaymentDisputes from "./pages/PaymentDisputes";
import LocationPricing from "./pages/LocationPricing";
import UnifiedOrderQueue from "./pages/UnifiedOrderQueue";
const OrderQueue = UnifiedOrderQueue; // Alias for backward compatibility
import Settings from "./pages/Settings";
import Integrations from "./pages/Integrations";
import DataImports from "./pages/DataImports";
import CustomReportBuilder from "./pages/CustomReportBuilder";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import SalesForecasting from "./pages/SalesForecasting";
import AuthPage from "./pages/Auth";
import BrandingSettings from "./pages/BrandingSettings";
import ThemeStyles from "./components/ThemeStyles";
import HelpCenter from "./pages/HelpCenter";
import SetupGuide from "./pages/SetupGuide";

import SalesOverview from "./pages/SalesOverview";
import CustomersOverview from "./pages/CustomersOverview";
import ReservationsOverview from "./pages/ReservationsOverview";

function Router() {
  return (
    <Switch>
      {/* Public routes (no dashboard layout) */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/order" component={OnlineOrdering} />
      <Route path="/table/:tableId" component={TableOrdering} />
      <Route path="/order-status" component={OrderStatus} />

      {/* Protected Routes inside DashboardLayout */}
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            
            <Route path="/sales-overview" component={SalesOverview} />
            <Route path="/pos" component={POS} />
            <Route path="/kds" component={KDS} />
            <Route path="/order-history" component={OrderHistory} />
            <Route path="/void-refunds" component={VoidRefunds} />
            <Route path="/void-reasons" component={VoidReasonAnalytics} />
            <Route path="/payments" component={PaymentManagement} />
            <Route path="/payment-disputes" component={PaymentDisputes} />
            <Route path="/order-queue" component={OrderQueue} />
            <Route path="/unified-order-queue" component={UnifiedOrderQueue} />

            <Route path="/menu" component={MenuManagement} />
            <Route path="/combos" component={ComboBuilder} />
            <Route path="/dayparts" component={DaypartManagement} />
            <Route path="/recipe-analysis" component={RecipeAnalysis} />

            <Route path="/inventory" component={Inventory} />
            <Route path="/waste-tracking" component={WasteTracking} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/supplier-tracking" component={SupplierTracking} />
            <Route path="/price-uploads" component={PriceUploads} />
            <Route path="/procurement" component={ProcurementDashboard} />

            <Route path="/staff" component={StaffManagement} />
            <Route path="/labour" component={LabourManagement} />

            <Route path="/customers-overview" component={CustomersOverview} />
            <Route path="/customers" component={Customers} />
            <Route path="/customers/:customerId" component={CustomerDetail} />
            <Route path="/segments" component={CustomerSegments} />
            <Route path="/sms-settings" component={SmsSettings} />
            <Route path="/email-campaigns" component={EmailCampaigns} />

            <Route path="/reservations-overview" component={ReservationsOverview} />
            <Route path="/reservations" component={Reservations} />
            <Route path="/waitlist" component={Waitlist} />
            <Route path="/floor-plan" component={FloorPlan} />
            <Route path="/qr-codes" component={QRCodeGenerator} />

            <Route path="/reports" component={Reports} />
            <Route path="/profitability" component={Profitability} />
            <Route path="/z-reports" component={ZReports} />
            <Route path="/custom-reports" component={CustomReportBuilder} />
            <Route path="/analytics" component={AnalyticsDashboard} />
            <Route path="/sales-forecasting" component={SalesForecasting} />

            <Route path="/settings" component={Settings} />
            <Route path="/settings/branding" component={BrandingSettings} />
            <Route path="/integrations" component={Integrations} />
            <Route path="/data-imports" component={DataImports} />
            <Route path="/notifications" component={NotificationCenter} />
            <Route path="/locations" component={LocationManagement} />
            <Route path="/location-pricing" component={LocationPricing} />

            <Route path="/help" component={HelpCenter} />
            <Route path="/setup" component={SetupGuide} />

            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <ThemeStyles />
        <TooltipProvider>
          <Toaster richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
