import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Grid3x3, Users } from "lucide-react";
import { useMemo } from "react";

export default function ReservationsOverview() {
  const locationId = 1;
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  const { data: reservations } = trpc.reservations.list.useQuery({ locationId, date: today });
  const { data: waitlist } = trpc.waitlist.queue.useQuery({ locationId });
  const { data: tables } = trpc.tables.list.useQuery();

  const activeReservations = reservations?.filter((r: any) => r.status === "confirmed" || r.status === "seated") || [];
  const activeWaitlist = waitlist?.filter((w: any) => w.status === "waiting" || w.status === "called") || [];
  const occupiedTables = tables?.filter((t: any) => t.status === "occupied") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reservations & Seating</h1>
        <p className="text-muted-foreground mt-2">
          Manage today's bookings, waitlist, and floor plan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeReservations.length} upcoming/seated
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWaitlist.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Parties waiting
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Occupancy</CardTitle>
            <Grid3x3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables?.length ? Math.round((occupiedTables.length / tables.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {occupiedTables.length} / {tables?.length || 0} tables
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Covers</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeReservations.reduce((acc: any, curr: any) => acc + (curr.partySize || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Guests booked today
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Management Links</CardTitle>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">Select a sub-menu above to manage reservations, the waitlist, view the floor plan, or print QR codes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
