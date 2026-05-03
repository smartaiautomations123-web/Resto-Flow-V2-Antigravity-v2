import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TimesheetExportProps {
  staffList: Array<{ id: number; name: string; role: string }>;
}

export function TimesheetExport({ staffList }: TimesheetExportProps) {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [staffId, setStaffId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = trpc.timesheet.exportCSV.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      staffId: staffId ? parseInt(staffId) : undefined,
      role: role || undefined,
    },
    { enabled: false }
  );

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const csv = await exportCSV.refetch();

      if (csv.data) {
        const blob = new Blob([csv.data], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `timesheet-${startDate}-to-${endDate}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Timesheet exported successfully!");
      }
    } catch (error) {
      toast.error("Failed to export timesheet");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const uniqueRoles = Array.from(new Set(staffList.map((s) => s.role)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Timesheet</CardTitle>
        <CardDescription>Generate payroll-ready timesheet CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="staff-select">Staff Member (Optional)</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger id="staff-select">
                <SelectValue placeholder="All staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All staff</SelectItem>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id.toString()}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="role-select">Role (Optional)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All roles</SelectItem>
                {uniqueRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleExport}
          disabled={isExporting || exportCSV.isLoading}
          className="w-full"
        >
          {isExporting || exportCSV.isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export as CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
