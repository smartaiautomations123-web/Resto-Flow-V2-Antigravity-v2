import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bell, Check, Archive, CheckCheck, Info,
  AlertTriangle, ShoppingBag, Users, Star, RefreshCw, Sparkles
} from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  order: { icon: <ShoppingBag className="h-4 w-4" />, color: "text-primary" },
  alert: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-destructive" },
  staff: { icon: <Users className="h-4 w-4" />, color: "text-success" },
  promo: { icon: <Star className="h-4 w-4" />, color: "text-warning" },
  system: { icon: <Info className="h-4 w-4" />, color: "text-muted-foreground" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
}

function timeAgo(dateStr: string | Date) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const {
    data: notifications,
    isLoading,
    refetch,
  } = trpc.notifications.getByUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user }
  );

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => utils.notifications.getByUser.invalidate(),
  });

  const archiveNotif = trpc.notifications.archive.useMutation({
    onSuccess: () => utils.notifications.getByUser.invalidate(),
  });

  const generateAlerts = trpc.ai.generateSmartNotifications.useMutation({
    onSuccess: (data) => {
      if (data.success && data.notifications.length > 0) {
        toast.success(`Generated ${data.notifications.length} smart alerts!`);
        utils.notifications.getByUser.invalidate();
      } else {
        toast.info("No new insights found at this time.");
      }
    },
    onError: () => {
      toast.error("Failed to generate smart alerts.");
    }
  });

  const unread = notifications?.filter((n: any) => !n.isRead && !n.isArchived) ?? [];
  const read = notifications?.filter((n: any) => n.isRead && !n.isArchived) ?? [];
  const archived = notifications?.filter((n: any) => n.isArchived) ?? [];

  const handleMarkAllRead = async () => {
    const unreadItems = notifications?.filter((n: any) => !n.isRead) ?? [];
    await Promise.all(unreadItems.map((n: any) => markAsRead.mutateAsync({ id: n.id })));
    toast.success(`Marked ${unreadItems.length} notification(s) as read`);
  };

  const NotificationItem = ({ notif }: { notif: any }) => {
    const cfg = getTypeConfig(notif.type ?? "system");
    return (
      <div
        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${!notif.isRead ? "bg-primary/5 border-primary/20" : "bg-card border-border/50"
          }`}
      >
        <div className={`p-2 rounded-lg shrink-0 ${!notif.isRead ? "bg-primary/10" : "bg-accent/50"} ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-semibold ${!notif.isRead ? "" : "text-muted-foreground"}`}>
                {notif.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo(notif.createdAt)}
              </span>
              {!notif.isRead && (
                <span className="h-2 w-2 rounded-full bg-primary ml-1 shrink-0" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {notif.type && (
              <Badge variant="outline" className="text-xs capitalize">{notif.type}</Badge>
            )}
            {!notif.isRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => markAsRead.mutateAsync({ id: notif.id })}
                disabled={markAsRead.isPending}
              >
                <Check className="h-3 w-3 mr-1" /> Mark read
              </Button>
            )}
            {!notif.isArchived && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => archiveNotif.mutateAsync({ id: notif.id })}
                disabled={archiveNotif.isPending}
              >
                <Archive className="h-3 w-3 mr-1" /> Archive
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="py-14 text-center">
      <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
      <p className="font-medium">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground mt-1">
            Stay up-to-date with orders, alerts, and system events.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
            onClick={() => generateAlerts.mutateAsync()}
            disabled={generateAlerts.isPending}
          >
            <Sparkles className={`h-4 w-4 mr-2 ${generateAlerts.isPending ? "animate-spin" : ""}`} />
            {generateAlerts.isPending ? "Analyzing..." : "Generate AI Alerts"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          {unread.length > 0 && (
            <Button size="sm" onClick={handleMarkAllRead} disabled={markAsRead.isPending}>
              <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unread</p>
              <p className="text-2xl font-bold">{unread.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Read</p>
              <p className="text-2xl font-bold">{read.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted/50">
              <Archive className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Archived</p>
              <p className="text-2xl font-bold">{archived.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="unread">
        <TabsList>
          <TabsTrigger value="unread">
            Unread
            {unread.length > 0 && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full text-xs px-1.5 py-0.5">
                {unread.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Loading…</div>
          ) : unread.length > 0 ? (
            <div className="space-y-3">
              {unread.map((n: any) => (
                <NotificationItem key={n.id} notif={n} />
              ))}
            </div>
          ) : (
            <EmptyState message="No unread notifications" />
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-4">
          {read.length > 0 ? (
            <div className="space-y-3">
              {read.map((n: any) => (
                <NotificationItem key={n.id} notif={n} />
              ))}
            </div>
          ) : (
            <EmptyState message="No read notifications" />
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {archived.length > 0 ? (
            <div className="space-y-3">
              {archived.map((n: any) => (
                <NotificationItem key={n.id} notif={n} />
              ))}
            </div>
          ) : (
            <EmptyState message="No archived notifications" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
