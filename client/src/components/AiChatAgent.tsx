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
    { role: "assistant", content: "Hi! I'm Dash, your AI Employee. I can help you analyze sales data, manage inventory, or update prices. What would you like to do?" }
  ]);
  const [pendingSql, setPendingSql] = useState<string | null>(null);
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
    },
    onError: (error) => {
      console.error("AI Database Agent Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered a database access error. Please try again." }
      ]);
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

  const handleCancelSql = () => {
    setPendingSql(null);
    setMessages(prev => [...prev, { role: "assistant", content: "Action cancelled. What else can I help you with?" }]);
  };

  const CustomEmptyState = (
    <div className="flex flex-col p-6 text-left gap-8 h-full overflow-y-auto hide-scrollbar">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Sparkles className="w-6 h-6" />
          <h3 className="font-semibold text-lg text-foreground">Dash AI</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          I'm your autonomous AI Employee. I can dynamically analyze metrics, draft complex SQL queries, and execute system structural updates.
        </p>
      </div>

      <div className="w-full space-y-3">
        <div className="flex font-semibold text-[11px] text-muted-foreground items-center gap-1.5 px-1 uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" /> Quick Actions
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-auto p-3.5 flex flex-col items-start gap-1 justify-start text-left border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors shadow-sm" onClick={() => handleSendMessage("Update all pizza prices by 10%")}>
            <span className="text-sm font-semibold text-foreground">Bump Prices 10%</span>
            <span className="text-xs text-muted-foreground whitespace-normal leading-tight">Apply markup to Pizzas</span>
          </Button>
          <Button variant="outline" className="h-auto p-3.5 flex flex-col items-start gap-1 justify-start text-left border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors shadow-sm" onClick={() => handleSendMessage("Which items are low in stock?")}>
            <span className="text-sm font-semibold text-foreground">Low Stock</span>
            <span className="text-xs text-muted-foreground whitespace-normal leading-tight">Identify running out items</span>
          </Button>
        </div>
      </div>

      <div className="w-full space-y-3">
        <div className="flex font-semibold text-[11px] text-muted-foreground items-center gap-1.5 px-1 uppercase tracking-wider">
          <Lightbulb className="w-3.5 h-3.5" /> Clever Ideas
        </div>
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="h-auto p-4 justify-start text-left whitespace-normal hover:border-primary/40 transition-all group shadow-sm" onClick={() => handleSendMessage("Are we on target for this year's sales goals? Calculate current growth vs last month.")}>
            <TrendingUp className="w-5 h-5 mr-3 text-primary/70 group-hover:text-primary shrink-0 transition-colors" />
            <span className="leading-snug text-sm text-foreground/90 font-medium">Are we on target for sales goals? Calculate growth vs last month.</span>
          </Button>
          <Button variant="outline" className="h-auto p-4 justify-start text-left whitespace-normal hover:border-primary/40 transition-all group shadow-sm" onClick={() => handleSendMessage("Analyze our recent voided orders. What is the most common reason and which staff member processed the most voids?")}>
            <MessageSquare className="w-5 h-5 mr-3 text-primary/70 group-hover:text-primary shrink-0 transition-colors" />
            <span className="leading-snug text-sm text-foreground/90 font-medium">Analyze recent voided orders to find common operational patterns.</span>
          </Button>
        </div>
      </div>
    </div>
  );

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

