import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { MessageSquare, X, Zap, Sparkles, Lightbulb, TrendingUp, AlertCircle, CheckCircle2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AIChatBox, Message } from "@/components/AIChatBox";

import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
export function AiChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hello! I'm **Dash**, your autonomous AI Operations Manager. I'm connected to your live restaurant data and ready to help you optimize performance.\n\nYou can ask me to analyze sales trends, identify low stock, or even execute complex database updates like bumping prices. How can I assist you today?" 
    }
  ]);
  const [pendingSql, setPendingSql] = useState<string | null>(null);
  const [lastRevertSql, setLastRevertSql] = useState<string | null>(null);
  const [lastActionId, setLastActionId] = useState<number | null>(null);
  const [nudgesLoaded, setNudgesLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const transcriptRef = useRef("");

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = useMemo(() => {
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    return rec;
  }, [SpeechRecognition]);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => (result as any)[0])
        .map((result: any) => (result as any).transcript)
        .join('');
      
      transcriptRef.current = transcript;
      setChatInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalTranscript = transcriptRef.current;
      if (finalTranscript.trim()) {
        handleSendMessage(finalTranscript);
        setChatInput("");
        transcriptRef.current = "";
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
  }, [recognition]);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      transcriptRef.current = "";
      setChatInput("");
      recognition.start();
      setIsListening(true);
    }
  };

  const { data: nudges } = trpc.aiAgent.getProactiveNudges.useQuery(undefined, {
    enabled: isOpen && !nudgesLoaded,
  });

  useEffect(() => {
    if (nudges && nudges.length > 0 && !nudgesLoaded) {
      const nudgeMessages: Message[] = nudges.map(n => ({
        role: "assistant",
        content: `⚠️ **${n.title}**: ${n.message}`
      }));
      setMessages(prev => [...nudgeMessages, ...prev]);
      setNudgesLoaded(true);
    }
  }, [nudges, nudgesLoaded, isOpen]);



  const toggleOpen = () => setIsOpen((prev) => !prev);

  const chatMutation = trpc.aiAgent.queryBrain.useMutation({
    onSuccess: (response) => {
      if (response?.requiresConfirmation && response.pendingSql) {
        setPendingSql(response.pendingSql);
      }
      
      if (response?.answer) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.answer },
        ]);
      }

      if (response?.revertSql) {
        setLastRevertSql(response.revertSql);
        setLastActionId(response.actionId || null);
      }
    },
    onError: (error) => {
      console.error("AI Database Agent Error:", error);
      const errorMessage = error.message?.includes("OPENAI_API_KEY") 
        ? "AI service is not configured. Please check your OPENAI_API_KEY in .env"
        : "Sorry, I encountered a database access error. Please try again.";
        
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage }
      ]);
    }
  });
  
  const undoMutation = trpc.aiAgent.undoAction.useMutation({
    onSuccess: () => {
      setMessages(prev => [...prev, { role: "assistant", content: "✅ **Action Undone**: The changes have been successfully reverted." }]);
      setLastRevertSql(null);
      setLastActionId(null);
    },
    onError: (error) => {
      console.error("Undo Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "❌ **Undo Failed**: Sorry, I couldn't revert the changes. Please check your data manually." }]);
    }
  });

  const getQueryContext = (msgs: Message[]) => {
    return msgs
      .filter(m => m.role !== 'system')
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");
  };

  const handleSendMessage = (content: string) => {
    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);
    setPendingSql(null);
    
    chatMutation.mutate({ query: getQueryContext(newMessages) });
  };

  const handleConfirmSql = () => {
    if (!pendingSql) return;
    
    // Add a system-like message to show the action in UI
    setMessages(prev => [...prev, { role: "user", content: "I approve this change. Please proceed." }]);
    
    chatMutation.mutate({ 
      query: getQueryContext(messages), 
      confirmedSql: pendingSql 
    });
    
    setPendingSql(null);
  };

  const handleUndo = () => {
    if (!lastRevertSql) return;
    undoMutation.mutate({ 
      revertSql: lastRevertSql,
      actionId: lastActionId || undefined
    });
  };

  const handleCancelSql = () => {
    setPendingSql(null);
    setMessages(prev => [...prev, { role: "assistant", content: "Action cancelled. What else can I help you with?" }]);
  };

  const CustomEmptyState = (
    <div className="flex flex-col p-6 text-left gap-8 h-full overflow-y-auto hide-scrollbar bg-gradient-to-b from-primary/5 to-transparent">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-primary mb-1">
          <div className="p-2 rounded-xl bg-primary/10 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-bold text-xl tracking-tight text-foreground">Meet Dash</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your autonomous AI Employee. I dynamically analyze metrics, draft complex SQL queries, and execute system structural updates with precision.
        </p>
      </div>

      <div className="w-full space-y-4">
        <div className="flex font-bold text-[10px] text-primary/60 items-center gap-1.5 px-1 uppercase tracking-widest">
          <Zap className="w-3 h-3" /> Quick Power Actions
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-1.5 justify-start text-left border-primary/10 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm hover:shadow-md group" onClick={() => handleSendMessage("Update all pizza prices by 10%")}>
            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Bump Prices 10%</span>
            <span className="text-[11px] text-muted-foreground whitespace-normal leading-tight">Instant markup across the Pizza category</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-1.5 justify-start text-left border-primary/10 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm hover:shadow-md group" onClick={() => handleSendMessage("Which items are low in stock?")}>
            <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Low Stock</span>
            <span className="text-[11px] text-muted-foreground whitespace-normal leading-tight">Audit inventory and find items to reorder</span>
          </Button>
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="flex font-bold text-[10px] text-primary/60 items-center gap-1.5 px-1 uppercase tracking-widest">
          <Lightbulb className="w-3 h-3" /> Strategic Insights
        </div>
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="h-auto p-4 justify-start text-left whitespace-normal hover:border-primary/30 hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md" onClick={() => handleSendMessage("Are we on target for this year's sales goals? Calculate current growth vs last month.")}>
            <TrendingUp className="w-5 h-5 mr-3 text-primary/40 group-hover:text-primary shrink-0 transition-all" />
            <span className="leading-snug text-sm text-foreground/90 font-semibold group-hover:text-foreground transition-colors">Are we on target for sales goals? Compare growth vs last month.</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 justify-start text-left whitespace-normal hover:border-primary/30 hover:bg-primary/5 transition-all group shadow-sm hover:shadow-md" onClick={() => handleSendMessage("Analyze our recent voided orders. What is the most common reason and which staff member processed the most voids?")}>
            <AlertCircle className="w-5 h-5 mr-3 text-primary/40 group-hover:text-primary shrink-0 transition-all" />
            <span className="leading-snug text-sm text-foreground/90 font-semibold group-hover:text-foreground transition-colors">Analyze recent voided orders to identify operational friction.</span>
          </Button>
        </div>
      </div>
    </div>
  );

  const dashSuggestions = [
    "📈 Sales Analysis",
    "📦 Inventory Check",
    "👥 Staff Status",
    "💰 Bump Prices 10%",
    "🚫 Void Report"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[380px] sm:w-[420px] shadow-2xl rounded-2xl overflow-hidden border border-border/50 bg-card pointer-events-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Dash (AI Employee)</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" onClick={toggleOpen}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Chat Body */}
            <div className="relative flex flex-col h-[500px]">
               <AIChatBox 
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={chatMutation.isPending}
                placeholder={isListening ? "Listening..." : "Ask Dash anything..."}
                customEmptyState={CustomEmptyState}
                height="100%"
                className="border-0 rounded-none shadow-none"
                inputValue={chatInput}
                onInputChange={setChatInput}
                suggestions={dashSuggestions}
                onUndo={handleUndo}
                canUndo={!!lastRevertSql}
                leftActions={
                  SpeechRecognition && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-9 w-9 rounded-full transition-all duration-300",
                          isListening ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "text-muted-foreground hover:bg-muted"
                        )}
                        onClick={toggleListening}
                      >
                        {isListening ? (
                          <div className="relative">
                            <Mic className="h-4 w-4" />
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          </div>
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                      {isListening && (
                        <span className="text-[10px] font-medium text-red-500 animate-pulse uppercase tracking-wider">
                          Listening...
                        </span>
                      )}
                    </div>
                  )
                }
              />

              {/* Review & Approve Overlay */}
              <AnimatePresence>
                {pendingSql && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-x-0 bottom-0 p-4 bg-background/80 backdrop-blur-sm border-t z-10"
                  >
                    <Card className="border-primary/20 shadow-lg">
                      <CardHeader className="py-3 px-4 flex flex-row items-center gap-2 space-y-0">
                        <AlertCircle className="w-4 h-4 text-primary" />
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">Review & Approve SQL</CardTitle>
                      </CardHeader>
                      <CardContent className="py-0 px-4">
                        <div className="bg-muted p-3 rounded-md overflow-x-auto max-h-[150px] overflow-y-auto">
                          <code className="text-[11px] font-mono whitespace-pre text-foreground/80 leading-tight">
                            {pendingSql}
                          </code>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 flex gap-2">
                        <Button 
                          className="flex-1 text-xs gap-1.5 h-9" 
                          onClick={handleConfirmSql}
                          disabled={chatMutation.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 text-xs h-9" 
                          onClick={handleCancelSql}
                          disabled={chatMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={toggleOpen}
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 pointer-events-auto flex items-center justify-center",
          isOpen ? "bg-muted text-muted-foreground rotate-90 hover:bg-muted/80" : "bg-primary text-primary-foreground hover:shadow-primary/50"
        )}
      >
        {isOpen ? <X className="h-6 w-6 transition-transform -rotate-90" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  );
}

