import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Mail, Send, BarChart2, FileText, Users, Eye, MousePointer, CheckCircle2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "badge-neutral",
  scheduled: "badge-warning",
  sent: "badge-success",
  cancelled: "badge-danger",
};

export function EmailCampaigns() {
  const utils = trpc.useUtils();
  const { data: campaigns } = trpc.emailCampaigns.getCampaigns.useQuery();
  const { data: templates } = trpc.emailCampaigns.getTemplates.useQuery();
  const { data: segments } = trpc.segments.list.useQuery();

  const createCampaign = trpc.emailCampaigns.createCampaign.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.getCampaigns.invalidate();
      setShowCampaignDialog(false);
      resetCampaignForm();
      toast.success("Campaign created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const createTemplate = trpc.emailCampaigns.createTemplate.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.getTemplates.invalidate();
      setShowTemplateDialog(false);
      resetTemplateForm();
      toast.success("Template created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = trpc.emailCampaigns.updateStatus.useMutation({
    onSuccess: () => utils.emailCampaigns.getCampaigns.invalidate(),
  });

  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const [campaignForm, setCampaignForm] = useState({ name: "", templateId: "", segmentId: "" });
  const [templateForm, setTemplateForm] = useState({ name: "", subject: "", htmlContent: "" });

  const resetCampaignForm = () => setCampaignForm({ name: "", templateId: "", segmentId: "" });
  const resetTemplateForm = () => setTemplateForm({ name: "", subject: "", htmlContent: "" });

  const { data: selectedStats } = trpc.emailCampaigns.getStats.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId }
  );

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.templateId) {
      toast.error("Name and template are required");
      return;
    }
    await createCampaign.mutateAsync({
      name: campaignForm.name,
      templateId: Number(campaignForm.templateId),
      segmentId: campaignForm.segmentId ? Number(campaignForm.segmentId) : undefined,
    });
  };

  const handleMarkSent = async (campaignId: number) => {
    await updateStatus.mutateAsync({ campaignId, status: "sent", sentAt: new Date() });
    toast.success("Campaign marked as sent");
  };

  // Aggregate totals
  const totalSent = campaigns?.reduce((s, c) => s + (c.recipientCount ?? 0), 0) ?? 0;
  const totalOpens = campaigns?.reduce((s, c) => s + (c.openCount ?? 0), 0) ?? 0;
  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground mt-1">Create templates, send campaigns, and track engagement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <FileText className="h-4 w-4 mr-2" /> New Template
          </Button>
          <Button onClick={() => setShowCampaignDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns", value: campaigns?.length ?? 0, icon: <Mail className="h-5 w-5 text-primary" />, color: "bg-primary/10" },
          { label: "Emails Sent", value: totalSent, icon: <Send className="h-5 w-5 text-success" />, color: "bg-success/10" },
          { label: "Total Opens", value: totalOpens, icon: <Eye className="h-5 w-5 text-warning" />, color: "bg-warning/10" },
          { label: "Open Rate", value: `${openRate}%`, icon: <BarChart2 className="h-5 w-5 text-info" />, color: "bg-info/10" },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-card border-border">
            <CardContent className="p-5 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns"><Mail className="h-4 w-4 mr-1" />Campaigns</TabsTrigger>
          <TabsTrigger value="templates"><FileText className="h-4 w-4 mr-1" />Templates</TabsTrigger>
        </TabsList>

        {/* ── Campaigns ── */}
        <TabsContent value="campaigns" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Recipients</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Opens</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Open Rate</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns?.map(c => {
                    const rate = (c.recipientCount ?? 0) > 0
                      ? (((c.openCount ?? 0) / (c.recipientCount ?? 1)) * 100).toFixed(1)
                      : "—";
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedCampaignId(c.id)}
                      >
                        <td className="p-4 font-medium text-sm">{c.name}</td>
                        <td className="p-4">
                          <Badge className={STATUS_COLORS[c.status ?? "draft"] ?? "badge-neutral"}>
                            {c.status ?? "draft"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{c.recipientCount ?? 0}</td>
                        <td className="p-4 text-sm">{c.openCount ?? 0}</td>
                        <td className="p-4 text-sm">{rate !== "—" ? `${rate}%` : "—"}</td>
                        <td className="p-4 text-right">
                          {c.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => { e.stopPropagation(); handleMarkSent(c.id); }}
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Mark Sent
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(!campaigns || campaigns.length === 0) && (
                <div className="py-12 text-center">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground text-sm">No campaigns yet. Create your first one.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats panel for selected campaign */}
          {selectedCampaignId && selectedStats && (
            <Card className="bg-card border-border mt-4">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  Campaign Stats — {campaigns?.find(c => c.id === selectedCampaignId)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Sent", value: (selectedStats as any).sent ?? 0, icon: <Send className="h-4 w-4" /> },
                    { label: "Opened", value: (selectedStats as any).opened ?? 0, icon: <Eye className="h-4 w-4" /> },
                    { label: "Clicked", value: (selectedStats as any).clicked ?? 0, icon: <MousePointer className="h-4 w-4" /> },
                    { label: "Failed", value: (selectedStats as any).failed ?? 0, icon: <CheckCircle2 className="h-4 w-4" /> },
                  ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-lg bg-accent/30 flex items-center gap-3">
                      <div className="text-muted-foreground">{stat.icon}</div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Templates ── */}
        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.map(t => (
              <Card key={t.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{t.name}</p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{t.subject}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!templates || templates.length === 0) && (
              <Card className="bg-card border-border col-span-full">
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground text-sm">No email templates yet. Create your first template.</p>
                  <Button className="mt-4" onClick={() => setShowTemplateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> New Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Email Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                placeholder="e.g. Summer Promotion"
                value={campaignForm.name}
                onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email Template</Label>
              <Select value={campaignForm.templateId} onValueChange={v => setCampaignForm(p => ({ ...p, templateId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name} — {t.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Audience Segment <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={campaignForm.segmentId} onValueChange={v => setCampaignForm(p => ({ ...p, segmentId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {segments?.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateCampaign} disabled={createCampaign.isPending}>
              {createCampaign.isPending ? "Creating…" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Email Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input
                placeholder="e.g. Birthday Offer"
                value={templateForm.name}
                onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Subject Line</Label>
              <Input
                placeholder="e.g. 🎂 Happy Birthday — A gift from us!"
                value={templateForm.subject}
                onChange={e => setTemplateForm(p => ({ ...p, subject: e.target.value }))}
              />
            </div>
            <div>
              <Label>Email Content (HTML or plain text)</Label>
              <Textarea
                rows={8}
                placeholder="<p>Dear {{name}},</p><p>We have a special offer for you...</p>"
                value={templateForm.htmlContent}
                onChange={e => setTemplateForm(p => ({ ...p, htmlContent: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!templateForm.name || !templateForm.subject || !templateForm.htmlContent) {
                  toast.error("All fields are required");
                  return;
                }
                await createTemplate.mutateAsync(templateForm);
              }}
              disabled={createTemplate.isPending}
            >
              {createTemplate.isPending ? "Saving…" : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
