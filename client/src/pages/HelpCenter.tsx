import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const helpTopics = [
  {
    category: "Dashboard & Overview",
    items: [
      { title: "Understanding the Dashboard", content: "The main dashboard provides a high-level overview of your restaurant's performance today, including net sales, total orders, average ticket size, and customer sentiment. It is your control center for daily operations." },
      { title: "Viewing Notifications", content: "Click the bell icon in the top right or navigate to the Notifications tab to see critical alerts such as low inventory, high void rates, and payment disputes." }
    ]
  },
  {
    category: "Sales & Orders",
    items: [
      { title: "Using the POS (Point of Sale)", content: "Navigate to 'POS' to ring up orders. You can browse categories, add items to the cart, apply discounts, and tender payments. Use the 'Unified Order Queue' to manage incoming orders from all channels." },
      { title: "Kitchen Display System (KDS)", content: "The KDS helps your kitchen staff manage tickets. Orders appear here as soon as they are placed. Staff can bump tickets once they are prepared." },
      { title: "Handling Voids and Refunds", content: "Navigate to 'Void & Refunds' to manage cancellations. You can review void reasons in the 'Void Reasons' analytics dashboard to spot trends or issues with staff or menu items." }
    ]
  },
  {
    category: "Menu & Recipes",
    items: [
      { title: "Managing your Menu", content: "Go to 'Menu' to add, edit, or remove items. You can set prices, assign categories, and link inventory items to track stock depletion." },
      { title: "Combo Builder", content: "Use the Combo Builder to create meal deals. You can set base prices and allow customers to choose sides and drinks, with optional upcharges." },
      { title: "Recipe Analysis", content: "The Recipe Analysis tool helps you determine the profitability of each dish. Add ingredients and their costs to calculate your food cost percentage." }
    ]
  },
  {
    category: "Inventory & Supply Chain",
    items: [
      { title: "Tracking Inventory", content: "The Inventory section lets you log counts, track variances, and set low-stock alerts. It integrates with your POS to automatically deduct stock as items are sold." },
      { title: "Procurement & Suppliers", content: "Manage your vendors in the 'Suppliers' tab. Use 'Procurement' to create and send purchase orders based on your current inventory levels." },
      { title: "Waste Tracking", content: "Log food waste in the 'Waste Tracking' module to understand where product is being lost and how it affects your bottom line." }
    ]
  },
  {
    category: "Staff & Operations",
    items: [
      { title: "Managing Staff", content: "Add new employees, set roles and permissions, and manage wages in the 'Staff' section." },
      { title: "Labour Management", content: "Use the Labour dashboard to track clock-ins, review timesheets, and monitor your labour cost percentage against sales." }
    ]
  },
  {
    category: "Customers & Marketing",
    items: [
      { title: "Customer Database", content: "View all customer profiles, order history, and preferences in the 'Customers' tab." },
      { title: "Marketing Campaigns", content: "Create SMS and Email campaigns to re-engage customers. Use 'Segments' to target specific groups, like VIPs or churned customers." }
    ]
  },
  {
    category: "Reservations & Seating",
    items: [
      { title: "Floor Plan Setup", content: "Design your restaurant's layout in the 'Floor Plan' section to easily manage table statuses and seating." },
      { title: "Taking Reservations", content: "Manage upcoming bookings and your waitlist through the 'Reservations' and 'Waitlist' tabs." }
    ]
  },
  {
    category: "Settings & Setup",
    items: [
      { title: "Data Integrations", content: "Connect external services (like QuickBooks, Uber Eats) in the 'Integrations' tab within Settings." },
      { title: "Branding", content: "Customize your receipts, app theme, and logos in the 'Branding' section under Settings." }
    ]
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = helpTopics.map(topic => {
    return {
      ...topic,
      items: topic.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    };
  }).filter(topic => topic.items.length > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Help Center</h1>
        <p className="text-muted-foreground mt-2">Find answers, learn about features, and master the Resto-Flow platform.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input 
          className="pl-10 h-12 text-lg" 
          placeholder="Search for help topics..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No topics found matching "{searchQuery}"
          </div>
        ) : (
          filteredTopics.map((topic, i) => (
            <Card key={i}>
              <CardHeader className="bg-muted/30 pb-4">
                <CardTitle className="text-xl">{topic.category}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {topic.items.map((item, j) => (
                    <AccordionItem key={j} value={`item-${i}-${j}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
