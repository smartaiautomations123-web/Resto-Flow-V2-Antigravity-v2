# RestoFlow - Restaurant Management Platform TODO

## Completed Features ✓

### Phase 1 - Core Features
- [x] Database schema design & migrations
- [x] POS & Order Flow (dine-in, takeaway, delivery, collection)
- [x] Kitchen Display System (KDS) with station routing & timers
- [x] Menu Management (categories, items, modifiers, pricing)
- [x] Basic Inventory & Recipe Costing (ingredients, recipes, stock tracking)
- [x] Staff Accounts & Permissions (roles, PIN login, role-based access)
- [x] Real-Time Sales & Reporting Dashboard
- [x] Payments (card, cash, split bill, tips, service charge)
- [x] Vendor Price Uploads with LLM-powered PDF parsing
- [x] Dashboard redesign with KPI cards, quick actions, alerts

### Phase 2 - Back-Office & Automation
- [x] Advanced Inventory & Supplier Management
- [x] Purchase orders system
- [x] Labour Management (time clock, shift scheduling, labour cost tracking)
- [x] Owner/Manager Web Dashboard

### Phase 3 - Customer, Channels & Experience
- [x] Online Ordering (branded web page, menu sync)
- [x] QR Code Table Ordering (order-at-table)
- [x] Reservations system
- [x] CRM & Loyalty (customer profiles, points system)

### Infrastructure
- [x] Elegant dark theme with sophisticated design
- [x] Dashboard layout with sidebar navigation
- [x] Responsive design for tablet/mobile POS use
- [x] Vitest tests for core procedures
- [x] OAuth authentication with role-based access
- [x] MySQL connection pool with proper error handling

### Phase 4 - Floor Plan & Operations
- [x] Floor Plan Visualization (drag-and-drop canvas, multi-section support)
- [x] Table status indicators (free=green, occupied=red, reserved=yellow, cleaning=gray)
- [x] Real-time table status updates with 3-second polling
- [x] Section management (create, rename, delete sections)
- [x] Table detail modal with active orders display
- [x] Backend: sections table, floor plan CRUD endpoints
- [x] 6 tRPC routers for floor plan operations

---

## HIGH PRIORITY - Missing Core Features

### 1. End-of-Day (Z) Reports (Completed)
- [x] Create Z-report page/modal showing daily summary
- [x] Include: total revenue, total orders, cash vs card breakdown, discounts, voids
- [x] Show by-shift summary if multiple shifts
- [x] Export Z-report as TXT
- [x] Store Z-report history for audit trail
- [x] Add Z-report endpoint to backend

### 2. Void & Refund Management UI (Completed)
- [x] Create dedicated void/refund management page
- [x] Show pending voids/refunds with reason and staff member
- [x] Implement permission-based approval (admin only)
- [x] Add void reason tracking (customer request, mistake, damage, comp, other)
- [x] Track refund method (original payment, store credit, cash)
- [x] Add audit trail for all voids/refunds
- [x] Backend: Add void/refund reason enum to orders table

### 3. QR Code Generation for Managers (Completed)
- [x] Create QR code generation UI in Settings or Reservations page
- [x] Generate QR codes for each table linking to `/table/:tableId`
- [x] Display QR codes in a print-friendly format (8x8 grid for all tables)
- [x] Allow customization of QR code size and format
- [x] Store QR code URLs in database for easy reprint
- [x] Add QR code library (qr-code-styling)

### 4. Customer Order History Detail View (Completed)
- [x] Create customer detail page showing full profile
- [x] Display customer's complete order history with dates, items, totals
- [x] Show order details modal (items, modifiers, notes)
- [x] Display loyalty points balance and history
- [x] Show birthday and notes
- [x] Add "repeat order" quick action
- [x] Link from Customers list to detail view
- [x] Write tests for customer detail procedures (7 tests, all passing)

### 5. Automatic Plate Cost Calculation (Completed)
- [x] Backend: Add procedure to calculate menu item cost from linked recipes
- [x] Calculate cost = sum(ingredient.costPerUnit * recipe.quantity)
- [x] Update menu item's `cost` field when recipes change
- [x] Add cost calculation to menu management UI
- [x] Show calculated cost vs manual cost in menu editor
- [x] Add cost margin % display (price - cost) / price * 100
- [x] Display recipe breakdown with ingredient costs
- [x] Write tests for cost calculation procedures (8 tests, all passing)

---

## MEDIUM PRIORITY - Enhanced Features

### 6. Waitlist Management (Completed)
- [x] Add waitlist table to schema (name, phone, partySize, estimatedWaitTime, notes)
- [x] Create waitlist page showing queue
- [x] Add "Manage Waitlist" button on Reservations page
- [x] Show estimated wait time based on current orders
- [x] SMS notification infrastructure (ready for SMS integration)
- [x] Move guests through waitlist queue (waiting → called → seated)
- [x] Backend: Create waitlist CRUD endpoints (8 functions)
- [x] Write tests for waitlist procedures (11 tests, all passing)

### 7. Profitability Analysis Dashboard (Completed)
- [x] Create profitability page with tabs: by-item, by-category, by-shift
- [x] Show: revenue, COGS, labour cost, gross profit, profit margin %
- [x] Identify top 10 most/least profitable items
- [x] Show profit trends over time (daily/weekly)
- [x] Display summary cards with key metrics
- [x] Backend: Add profit calculation queries (7 functions)
- [x] Write tests for profitability procedures (10 tests, all passing)

### 8. Customer Segmentation & Communication (Completed)
- [x] Add customer tags/segments (VIP, frequent, new, inactive, etc.)
- [x] Create customer segment management page
- [x] Build email/SMS campaign builder (basic)
- [x] Export customer lists by segment
- [x] Track campaign performance (send date, open rate, etc.)
- [x] Backend: Add customer_segments table and segment_members table
- [x] Add campaigns table with recipient tracking
- [x] Write tests for segmentation procedures (11 tests, all passing)

### 9. Order History & Receipt Printing (Completed)
- [x] Create order history page with search/filter by date, customer, status
- [x] Show order details modal with full item breakdown
- [x] Print receipt (thermal printer format or PDF)
- [x] Email receipt to customer
- [x] Reprint old receipts
- [x] Backend: Ensure all order data is properly stored for retrieval
- [x] Add 10+ database helpers for order retrieval and receipt generation
- [x] Add 4 tRPC endpoints for receipt generation and email
- [x] Write tests for order history procedures (10 tests)

### 10. Real-Time Order Status Tracking (for Online Orders) (Completed)
- [x] Create public order status page (no login required)
- [x] Customer enters order number to view status
- [x] Show: pending → preparing → ready → completed
- [x] Estimated time remaining
- [x] Push notification infrastructure for order status changes
- [x] Backend: Ensure online orders are properly tracked
- [x] Add 8 database helpers for order tracking and time estimation
- [x] Add 5 tRPC endpoints for public order status lookup
- [x] Write tests for order status tracking procedures (10 tests)

### 11. Timesheet CSV Export (Completed)
- [x] Add export button on Staff page
- [x] Export timesheet for selected date range
- [x] Include: staff name, date, clock-in, clock-out, hours, rate, total cost
- [x] Format suitable for payroll processing
- [x] Support filtering by staff member or role
- [x] Add 4 database helpers for timesheet data retrieval and calculations
- [x] Add 4 tRPC endpoints for timesheet export
- [x] Create TimesheetExport component with date range and filter UI
- [x] Write tests for timesheet procedures (8 tests)

### 12. Daypart/Dynamic Pricing (Completed)
- [x] Add daypart management (breakfast, lunch, dinner, happy hour, etc.)
- [x] Link dayparts to menu items
- [x] Set different prices per daypart
- [x] Auto-apply daypart pricing based on time of day
- [x] Show active daypart on POS
- [x] Backend: Add dayparts table and menu_item_dayparts table
- [x] Add 6 database helpers for daypart operations
- [x] Add 6 tRPC endpoints for daypart management
- [x] Create DaypartManagement page component

### 13. Void/Refund Reason Tracking (Completed)
- [x] Add void_reasons enum: customer_request, mistake, damage, comp, other
- [x] Track reason for each void/refund
- [x] Report on void reasons (identify patterns)
- [x] Backend: Add reason field to order items/orders
- [x] Add 4 database helpers for void reason tracking and analytics
- [x] Add 5 tRPC endpoints for void reason management
- [x] Create VoidReasonAnalytics page with charts and statistics
- [x] Write tests for both features (7 tests)

---

## LOWER PRIORITY - Advanced Features

### 14. SMS Notifications (Completed)
- [x] Integrate Twilio or similar SMS service
- [x] Send SMS for: reservation confirmations, waitlist ready, order ready
- [x] Allow customers to opt-in/out
- [x] Track SMS delivery status
- [x] Backend: Add SMS service integration
- [x] Add 7 database helpers for SMS operations
- [x] Add 6 tRPC endpoints for SMS management
- [x] Create SmsSettings page with Twilio configuration

### 15. Email Campaigns (Completed)
- [x] Build email template builder
- [x] Send campaigns to customer segments
- [x] Track opens, clicks, conversions
- [x] Schedule campaigns for future send
- [x] Backend: Integrate with email service (SendGrid, Mailgun, etc.)
- [x] Add 8 database helpers for email campaigns
- [x] Add 7 tRPC endpoints for email campaign management
- [x] Create EmailCampaigns page with template and campaign UI

### 16. Inventory Waste Tracking (Completed)
- [x] Add waste log page
- [x] Track: ingredient, quantity, reason (spoilage, damage, theft, etc.)
- [x] Calculate waste cost impact
- [x] Report on waste trends
- [x] Backend: Add waste_logs table
- [x] Add 5 database helpers for waste tracking
- [x] Add 5 tRPC endpoints for waste operations
- [x] Create WasteTracking page with pie and bar charts
- [x] Write tests for all three features (10 tests)

### 17. Multi-Location Support (Completed)
- [x] Add locations table to schema
- [x] Modify all tables to support location_id
- [x] Create location management page
- [x] Build consolidated reporting across locations
- [x] Support location-specific inventory
- [x] Support location-specific staff management
- [x] Backend: Major refactor to add location filtering
- [x] Add 4 database helpers for location operations
- [x] Add 4 tRPC endpoints for location management

### 18. Combo/Bundle Management (Completed)
- [x] Create combo builder UI
- [x] Link multiple items to create bundles
- [x] Set combo price (with discount vs individual items)
- [x] Show combos on POS menu
- [x] Backend: Add combos table and combo_items table
- [x] Add 5 database helpers for combo operations
- [x] Add 5 tRPC endpoints for combo management

### 19. Advanced Labour Management (Completed)
- [x] Overtime tracking and alerts
- [x] Compliance rules (max hours, break requirements)
- [x] Staff availability calendar
- [x] Time-off request system
- [x] Labour budget vs actual tracking
- [x] Backend: Extend shifts table with overtime fields
- [x] Add 12 database helpers for labour operations
- [x] Add 11 tRPC endpoints for labour management
- [x] Write tests for all three features (9 tests)

### 20. Payment Integration (Stripe/Square) (Completed)
- [x] Integrate Stripe or Square for online payments
- [x] Support card payments in online ordering
- [x] Support card payments in POS (if hardware available)
- [x] Reconcile payments with orders
- [x] Handle refunds through payment gateway
- [x] Backend: Add payment_transactions table
- [x] Add 4 database helpers for payment operations
- [x] Add 4 tRPC endpoints for payment management

### 21. Real-Time Notifications System (Completed)
- [x] Build notification center/bell icon
- [x] Implement WebSocket or polling for real-time updates
- [x] Notify on: new orders, low stock, staff alerts, system events
- [x] Allow users to dismiss/archive notifications
- [x] Notification preferences per user
- [x] Backend: Add notifications table and service

### 22. Recipe Costing Analysis (Completed)
- [x] Show ingredient cost breakdown per recipe
- [x] Identify cost changes when ingredient prices update
- [x] Compare recipe cost vs menu item price
- [x] Suggest price adjustments based on cost changes
- [x] Track recipe cost history

### 23. Supplier Performance Tracking (Completed)
- [x] Track on-time delivery rate per supplier
- [x] Monitor price trends per supplier
- [x] Quality ratings and notes
- [x] Identify best suppliers for each ingredient
- [x] Generate supplier scorecards

---

## FUTURE PHASES (Not Started)

### Phase 4 - Multi-Location & Enterprise
- [ ] Multi-location support (see #18)
- [ ] Centralized reporting and analytics
- [ ] Location-specific inventory management
- [ ] Location-based staff management
- [ ] Consolidated P&L by location
- [ ] Inter-location transfers

### Phase 5 - Advanced Automation
- [ ] Automatic reorder suggestions based on usage
- [ ] Predictive inventory management
- [ ] AI-powered demand forecasting
- [ ] Automated pricing optimization
- [ ] Customer churn prediction
- [ ] Anomaly detection (unusual discounts, voids, etc.)

---

## Summary

**Total Items:** 23 major features + sub-tasks (Floor Plan completed)
**High Priority (5 features):** Z-reports, void/refund UI, QR generation, customer history, plate cost calculation
**Medium Priority (8 features):** Waitlist, profitability, segmentation, order history, status tracking, CSV export, dayparts, reason tracking
**Lower Priority (10 features):** SMS, email, waste tracking, multi-location, combos, labour, payments, notifications, recipe analysis, supplier tracking

**Recommended Implementation Order:**
1. Z-reports (quick win, high value)
2. Void/refund UI (high value, medium effort)
3. QR code generation (quick win)
4. Customer order history (quick win)
5. Plate cost calculation (quick win)
6. Waitlist (medium effort)
7. Profitability dashboard (medium effort)
8. Order history page (medium effort)
9. Timesheet export (quick win)



## Z-Reports Feature (Completed)
- [x] Add z_reports table to schema for storing daily summaries
- [x] Add z_report_items table for detailed breakdown by category/payment method
- [x] Create DB helpers for Z-report generation and retrieval
- [x] Build tRPC routers for Z-report endpoints
- [x] Create Z-Reports page with date picker and report list
- [x] Implement daily summary display (revenue, orders, discounts, voids)
- [x] Add payment breakdown (cash, card, split, etc.)
- [x] Add shift-by-shift summary view
- [x] Implement TXT export functionality
- [x] Add Z-report history with filtering and search
- [x] Write tests for Z-report procedures (10 tests, all passing)


## Void & Refund Management Feature (Completed)
- [x] Add voidReason enum to schema (customer_request, mistake, damage, comp, other)
- [x] Add refundMethod enum to schema (original_payment, store_credit, cash)
- [x] Add voidReason and refundMethod fields to orders table
- [x] Add voidApprovedBy and voidApprovedAt fields to orders table
- [x] Create void_audit_log table for tracking all void/refund changes
- [x] Create DB helpers for void/refund management
- [x] Build tRPC routers for void/refund endpoints
- [x] Create Void & Refund Management page
- [x] Implement pending voids/refunds list with filtering
- [x] Add void/refund detail modal with reason and method selection
- [x] Implement approval workflow (admin only)
- [x] Add audit trail display showing all void/refund history
- [x] Write tests for void/refund procedures (6 tests, all passing)


## Customer Order History Detail View (Completed)
- [x] Add DB helper to get customer with complete order history
- [x] Add DB helper to get loyalty points history
- [x] Build tRPC routers for customer detail endpoint
- [x] Create CustomerDetail page component
- [x] Display customer profile (name, phone, email, birthday, notes)
- [x] Display complete order history with dates, items, totals
- [x] Add order details modal showing items, modifiers, notes
- [x] Display loyalty points balance and history
- [x] Implement repeat order quick action
- [x] Link from Customers list to detail view
- [x] Write tests for customer detail procedures (7 tests, all passing)

## App Organisation & Cleanup
- [x] Rebuild todo2.md with accurate PRD feature audit
- [x] Add missing routes for unrouted pages
- [x] Reorganise sidebar navigation to group related pages logically

## Module 5.1 - POS & Order Management (Completed)
- [x] Merge tables functionality
- [x] Split bills by item/customer/percentage
- [x] Discount and promotion application (manager approval for >10%)
- [x] Tip handling (cash, card, percentage-based)
- [x] KDS: Item grouping by prep station
- [x] KDS: Audio alerts for new orders
- [x] KDS: Reprint lost/damaged order tickets
- [x] Payment dispute logging
- [x] Per-location price override capability
- [x] Hourly sales trend report
- [x] Staff sales performance report
- [x] Unified order queue view (all channels in one screen)
- [x] Payment disputes page with resolution workflow
- [x] Location pricing page for per-location menu price overrides
- [x] Unified order queue page showing all channels
- [x] 13 vitest tests passing for new features


## Module 5.1 - Technical Requirements & Aggregators (Completed)
- [x] Offline mode with IndexedDB queue and automatic sync
- [x] Barcode scanner support in POS (keyboard input, USB scanner)
- [x] Third-party aggregator integration framework (Uber Eats, DoorDash, Deliveroo)
- [~] PCI DSS compliance for card payments (full implementation - requires external audit)


---

## REMAINING FEATURES TO BUILD (44 features)

### Module 5.2: Inventory Management - Missing Features (20) ✅ COMPLETED
- [x] Lead time management for suppliers
- [x] Waste reduction suggestions based on patterns
- [x] EDI/API integration with suppliers
- [x] Auto-receive deliveries with QR code scanning
- [x] 3-way matching (PO, Invoice, Receipt)
- [x] Advanced expiry date tracking
- [x] Supplier contract management
- [x] Minimum order quantity alerts
- [x] Reorder point automation
- [x] Inventory aging reports
- [x] Stock rotation (FIFO/LIFO) tracking
- [x] Ingredient substitution suggestions
- [x] Seasonal inventory planning
- [x] Inventory transfer between locations
- [x] Barcode generation for ingredients
- [x] Inventory variance investigation tools
- [x] Order forecasting based on sales trends
- [x] Portion size variants
- [x] Production quantity templates
- [x] Batch/lot tracking with expiry

### Module 5.3: Labour Management - Missing Features (17) ✅ COMPLETED
- [x] Biometric time tracking
- [x] GPS clock-in verification
- [x] Geofencing for remote workers
- [x] Mobile time clock app
- [x] Facial recognition
- [x] Advanced vacation/PTO management
- [x] Sick leave tracking
- [x] Bonus/incentive tracking
- [x] Commission calculation
- [x] Labour dispute resolution
- [x] Staff training tracking
- [x] Certification expiry alerts
- [x] Performance reviews
- [x] Staff feedback system
- [x] Advanced labour compliance reports
- [x] Wage theft prevention
- [x] Tip pooling management

### Module 5.4: Financial Management - Missing Features (3) ✅ COMPLETED
- [x] Advanced expense categorization
- [x] Depreciation tracking
- [x] Advanced invoice features (payment terms, recurring)

### Module 5.5: Customer Management - Missing Features (2) ✅ COMPLETED
- [x] Advanced churn prediction (ML-based)
- [x] Predictive customer lifetime value

### Module 5.6: Reservations - Missing Features (2) ✅ COMPLETED
- [x] Advanced reservation modifications (time/party size changes)
- [x] Group reservation management with sub-reservations
