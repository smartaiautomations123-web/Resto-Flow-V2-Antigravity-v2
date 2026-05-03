import { useRef, useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Grid3x3, Users } from "lucide-react";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const TABLE_SIZE = 60;
const GRID_SIZE = 20;

const STATUS_COLORS = {
  free: "#10b981",
  occupied: "#ef4444",
  reserved: "#f59e0b",
  cleaning: "#6b7280",
};

export default function FloorPlan() {
  const utils = trpc.useUtils();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [draggingTable, setDraggingTable] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [sectionForm, setSectionForm] = useState({ name: "" });
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Queries
  const { data: sections } = trpc.sections.list.useQuery();
  const { data: tables, refetch: refetchTables } = trpc.floorPlan.tablesBySection.useQuery(
    { section: activeSection || undefined },
    { refetchInterval: 3000 }
  );

  // Mutations
  const createSection = trpc.sections.create.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate();
      setSectionForm({ name: "" });
      setShowSectionDialog(false);
      toast.success("Section created");
    },
  });

  const deleteSection = trpc.sections.delete.useMutation({
    onSuccess: () => {
      utils.sections.list.invalidate();
      setActiveSection(null);
      toast.success("Section deleted");
    },
  });

  const updateTablePosition = trpc.floorPlan.updateTablePosition.useMutation({
    onSuccess: () => {
      utils.floorPlan.tablesBySection.invalidate();
      toast.success("Table position saved");
    },
  });

  const updateTableStatus = trpc.floorPlan.updateTableStatus.useMutation({
    onSuccess: () => {
      utils.floorPlan.tablesBySection.invalidate();
    },
  });

  const { data: tableDetails } = trpc.floorPlan.getTableDetails.useQuery(
    { id: selectedTable?.id || 0 },
    { enabled: !!selectedTable }
  );

  // Set active section on first load
  useEffect(() => {
    if (sections && sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].name);
    }
  }, [sections, activeSection]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tables) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw tables
    tables.forEach((table) => {
      const x = table.positionX || 0;
      const y = table.positionY || 0;
      const isSelected = selectedTable?.id === table.id;
      const color = STATUS_COLORS[table.status as keyof typeof STATUS_COLORS] || "#6b7280";

      // Draw table circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + TABLE_SIZE / 2, y + TABLE_SIZE / 2, TABLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw selection border
      if (isSelected) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + TABLE_SIZE / 2, y + TABLE_SIZE / 2, TABLE_SIZE / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw table number
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(table.name, x + TABLE_SIZE / 2, y + TABLE_SIZE / 2 - 5);

      // Draw seats count
      ctx.font = "12px Inter";
      ctx.fillStyle = "#ccc";
      ctx.fillText(`${table.seats}s`, x + TABLE_SIZE / 2, y + TABLE_SIZE / 2 + 8);
    });
  }, [tables, selectedTable]);

  // Canvas mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !tables) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a table
    for (const table of tables) {
      const tableX = table.positionX || 0;
      const tableY = table.positionY || 0;
      const dist = Math.sqrt(
        Math.pow(x - (tableX + TABLE_SIZE / 2), 2) + Math.pow(y - (tableY + TABLE_SIZE / 2), 2)
      );

      if (dist < TABLE_SIZE / 2) {
        setSelectedTable(table);
        setDraggingTable(table.id);
        setDragOffset({
          x: x - tableX,
          y: y - tableY,
        });
        return;
      }
    }

    setSelectedTable(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingTable || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // Snap to grid
    const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

    // Update local state for immediate feedback
    setSelectedTable((prev: any) => prev ? { ...prev, positionX: snappedX, positionY: snappedY } : null);
  };

  const handleCanvasMouseUp = () => {
    if (draggingTable && selectedTable) {
      updateTablePosition.mutate({
        id: draggingTable,
        positionX: selectedTable.positionX,
        positionY: selectedTable.positionY,
        section: activeSection || undefined,
      });
    }
    setDraggingTable(null);
  };

  const handleStatusChange = (status: "free" | "occupied" | "reserved" | "cleaning") => {
    if (selectedTable) {
      updateTableStatus.mutate({ id: selectedTable.id, status });
      setSelectedTable({ ...selectedTable, status });
    }
  };

  const handleCreateSection = async () => {
    if (!sectionForm.name.trim()) return;
    await createSection.mutateAsync(sectionForm);
  };

  const handleDeleteSection = (sectionName: string) => {
    if (confirm(`Delete section "${sectionName}"?`)) {
      deleteSection.mutate({ id: sections?.find((s) => s.name === sectionName)?.id || 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Floor Plan</h1>
          <p className="text-muted-foreground">Drag tables to reposition them on the floor plan</p>
        </div>
        <Button onClick={() => setShowSectionDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Section
        </Button>
      </div>

      {/* Sections Tabs */}
      {sections && sections.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeSection || ""} onValueChange={setActiveSection}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(sections.length, 6)}, 1fr)` }}>
                {sections.map((section) => (
                  <TabsTrigger key={section.id} value={section.name} className="text-xs">
                    {section.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Canvas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            {activeSection || "Floor Plan"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-border rounded-lg overflow-hidden bg-black">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="cursor-move w-full"
            />
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: STATUS_COLORS.free }} />
              <span>Free</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: STATUS_COLORS.occupied }} />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: STATUS_COLORS.reserved }} />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: STATUS_COLORS.cleaning }} />
              <span>Cleaning</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Details Panel */}
      {selectedTable && tableDetails && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Table {selectedTable.name}
              </span>
              <Badge>{selectedTable.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Seats</Label>
                <p className="text-lg font-semibold">{selectedTable.seats}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <p className="text-sm">({selectedTable.positionX}, {selectedTable.positionY})</p>
              </div>
            </div>

            {tableDetails.activeOrders && tableDetails.activeOrders.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Active Orders</Label>
                <div className="space-y-2 mt-2">
                  {tableDetails.activeOrders.map((order: any) => (
                    <div key={order.id} className="text-sm p-2 bg-muted rounded">
                      <div className="font-medium">Order #{order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">{order.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Change Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["free", "occupied", "reserved", "cleaning"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={selectedTable.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    className="capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections Management */}
      {sections && sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium">{section.name}</p>
                    {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSection(section.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Section Dialog */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                placeholder="e.g., Main Dining, Patio, Bar"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({ name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSection} disabled={!sectionForm.name.trim()}>
              Create Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
