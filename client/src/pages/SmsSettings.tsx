import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  MessageSquare, Check, Send, Settings, History, Phone,
  Key, Shield, CheckCircle, XCircle, RefreshCw
} from "lucide-react";

export function SmsSettings() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.sms.getSettings.useQuery();
  const updateSettings = trpc.sms.updateSettings.useMutation({
    onSuccess: () => toast.success("SMS settings saved"),
    onError: err => toast.error(err.message),
  });

  const sendMessage = trpc.sms.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Test message sent!");
      setTestPhone("");
      setTestMessage("");
    },
    onError: err => toast.error(err.message),
  });

  const [form, setForm] = useState({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    isEnabled: false,
  });

  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("This is a test message from RestoFlow 🍽️");
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        twilioAccountSid: (settings as any).twilioAccountSid ?? "",
        twilioAuthToken: (settings as any).twilioAuthToken ?? "",
        twilioPhoneNumber: (settings as any).twilioPhoneNumber ?? "",
        isEnabled: (settings as any).isEnabled ?? false,
      });
    }
  }, [settings]);

  const isConfigured =
    form.twilioAccountSid.startsWith("AC") &&
    form.twilioAuthToken.length >= 10 &&
    form.twilioPhoneNumber.startsWith("+");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Configure Twilio to send SMS to customers for reservations, waitlists, and order updates.
          </p>
        </div>
        <Badge className={form.isEnabled && isConfigured ? "badge-success" : "badge-neutral"}>
          {form.isEnabled && isConfigured ? (
            <><CheckCircle className="h-3.5 w-3.5 mr-1" />Active</>
          ) : (
            <><XCircle className="h-3.5 w-3.5 mr-1" />Inactive</>
          )}
        </Badge>
      </div>

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config"><Settings className="h-4 w-4 mr-1" />Configuration</TabsTrigger>
          <TabsTrigger value="test"><Send className="h-4 w-4 mr-1" />Send Test</TabsTrigger>
        </TabsList>

        {/* ── Configuration ── */}
        <TabsContent value="config" className="space-y-6 mt-4">
          {/* Setup guide */}
          <Card className="bg-accent/20 border-border">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Twilio Setup Guide
              </h3>
              <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
                <li>Sign up at <strong className="text-foreground">twilio.com</strong> and go to Console</li>
                <li>Copy your <strong className="text-foreground">Account SID</strong> (starts with "AC")</li>
                <li>Copy your <strong className="text-foreground">Auth Token</strong> from the Console dashboard</li>
                <li>Buy a phone number and enter it below in E.164 format (e.g. +14155552671)</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-5 w-5" /> Twilio Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Account SID</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={form.twilioAccountSid}
                    onChange={e => setForm(p => ({ ...p, twilioAccountSid: e.target.value }))}
                    className={form.twilioAccountSid && !form.twilioAccountSid.startsWith("AC") ? "border-destructive" : ""}
                  />
                </div>
                {form.twilioAccountSid && !form.twilioAccountSid.startsWith("AC") && (
                  <p className="text-xs text-destructive mt-1">Account SID must start with "AC"</p>
                )}
              </div>

              <div>
                <Label>Auth Token</Label>
                <div className="relative mt-1 flex gap-2">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="Your Twilio auth token"
                    value={form.twilioAuthToken}
                    onChange={e => setForm(p => ({ ...p, twilioAuthToken: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToken(v => !v)}
                    className="shrink-0"
                  >
                    {showToken ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Twilio Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="+14155552671"
                    value={form.twilioPhoneNumber}
                    onChange={e => setForm(p => ({ ...p, twilioPhoneNumber: e.target.value }))}
                  />
                </div>
                {form.twilioPhoneNumber && !form.twilioPhoneNumber.startsWith("+") && (
                  <p className="text-xs text-destructive mt-1">Use E.164 format starting with "+"</p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                <div>
                  <p className="font-medium text-sm">Enable SMS Notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send automated SMS to customers for updates, reservations, and promotions
                  </p>
                </div>
                <Switch
                  checked={form.isEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, isEnabled: v }))}
                />
              </div>

              {/* Status indicator */}
              <div className={`p-4 rounded-lg border ${isConfigured ? "bg-success/5 border-success/20" : "bg-muted/50 border-border"}`}>
                <div className="flex items-center gap-2">
                  {isConfigured ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={`text-sm font-medium ${isConfigured ? "text-success" : "text-muted-foreground"}`}>
                    {isConfigured ? "Configuration looks valid" : "Fill in all fields above to enable"}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => updateSettings.mutateAsync(form)}
                disabled={updateSettings.isPending}
                className="w-full"
              >
                {updateSettings.isPending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />Save Settings</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Send Test ── */}
        <TabsContent value="test" className="space-y-4 mt-4">
          {!isConfigured || !form.isEnabled ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">SMS not configured</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Complete the Configuration tab and enable SMS to send a test message.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-5 w-5" /> Send a Test Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Recipient Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="+447700900000"
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <Input
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{testMessage.length} / 160 characters</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() =>
                    sendMessage.mutateAsync({
                      customerId: null,
                      phoneNumber: testPhone,
                      message: testMessage,
                      type: "test",
                    })
                  }
                  disabled={!testPhone || !testMessage || sendMessage.isPending}
                >
                  {sendMessage.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" />Send Test SMS</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
