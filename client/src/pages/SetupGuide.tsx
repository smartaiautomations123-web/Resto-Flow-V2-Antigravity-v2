import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, Store, Link2, Utensils, Users, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

const SETUP_STEPS = [
  {
    id: "branding",
    title: "Branding & Location Setup",
    description: "Set your restaurant's name, logo, address, and theme colors.",
    icon: Store,
    link: "/settings/branding",
    estimatedTime: "5 mins"
  },
  {
    id: "integrations",
    title: "Data Integrations",
    description: "Connect your payment processors, delivery platforms, and accounting software.",
    icon: Link2,
    link: "/integrations",
    estimatedTime: "10 mins"
  },
  {
    id: "menu",
    title: "Menu Configuration",
    description: "Add your first categories, items, and set up your pricing.",
    icon: Utensils,
    link: "/menu",
    estimatedTime: "15 mins"
  },
  {
    id: "staff",
    title: "Staff & Permissions",
    description: "Invite your team members and assign their roles and PINs.",
    icon: Users,
    link: "/staff",
    estimatedTime: "5 mins"
  },
  {
    id: "test",
    title: "Testing Orders",
    description: "Run a test transaction in the POS to ensure everything works.",
    icon: ShoppingCart,
    link: "/pos",
    estimatedTime: "5 mins"
  }
];

const STORAGE_KEY = "resto-flow-onboarding-progress";

export default function SetupGuide() {
  const [, setLocation] = useLocation();
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [skippedSteps, setSkippedSteps] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY + "-skipped");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedSteps));
    localStorage.setItem(STORAGE_KEY + "-skipped", JSON.stringify(skippedSteps));
  }, [completedSteps, skippedSteps]);

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
    // Remove from skipped if marked as completed
    if (skippedSteps.includes(stepId)) {
      setSkippedSteps(prev => prev.filter(id => id !== stepId));
    }
  };

  const skipStep = (stepId: string) => {
    setSkippedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
    // Remove from completed if marked as skipped
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(prev => prev.filter(id => id !== stepId));
    }
  };

  const resetProgress = () => {
    if (confirm("Are you sure you want to reset your setup progress?")) {
      setCompletedSteps([]);
      setSkippedSteps([]);
    }
  };

  const totalSteps = SETUP_STEPS.length;
  const processedSteps = completedSteps.length + skippedSteps.length;
  const progressPercent = Math.round((processedSteps / totalSteps) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Setup Guide</h1>
          <p className="text-muted-foreground mt-2">Let's get your restaurant up and running. Follow these steps to configure your system.</p>
        </div>
        <Button variant="outline" onClick={resetProgress}>Reset Progress</Button>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-lg">Overall Progress</span>
            <span className="font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-sm text-muted-foreground mt-3">
            {completedSteps.length} completed, {skippedSteps.length} skipped out of {totalSteps} tasks
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {SETUP_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isSkipped = skippedSteps.includes(step.id);
          const statusColor = isCompleted ? "text-green-500" : isSkipped ? "text-amber-500" : "text-muted-foreground";
          const bgColor = isCompleted ? "bg-green-500/10 border-green-500/20" : isSkipped ? "bg-amber-500/10 border-amber-500/20" : "";

          return (
            <Card key={step.id} className={`transition-all duration-300 ${bgColor}`}>
              <div className="flex flex-col md:flex-row md:items-center p-6 gap-4">
                <div className="flex-shrink-0 cursor-pointer" onClick={() => toggleStep(step.id)}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <Circle className={`w-8 h-8 ${isSkipped ? 'text-amber-500' : 'text-muted-foreground'} hover:text-primary transition-colors`} />
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <step.icon className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Step {index + 1}: {step.title}
                    {isSkipped && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full dark:bg-amber-900/30 dark:text-amber-400">Skipped</span>}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">{step.description}</p>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">Est. time: {step.estimatedTime}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0 flex-shrink-0">
                  {!isCompleted && (
                    <Button variant="ghost" onClick={() => skipStep(step.id)}>
                      {isSkipped ? "Unskip" : "Skip"}
                    </Button>
                  )}
                  <Button 
                    variant={isCompleted ? "outline" : "default"}
                    onClick={() => setLocation(step.link)}
                  >
                    Go to Setting <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {progressPercent === 100 && (
        <Card className="bg-green-500/10 border-green-500/20 mt-8 text-center py-8">
          <CardContent>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Setup Complete!</h2>
            <p className="text-green-600/80 dark:text-green-400/80 mt-2 max-w-md mx-auto">
              You've successfully completed the basic setup. Your restaurant is now ready to take orders, manage inventory, and track sales.
            </p>
            <Button className="mt-6" onClick={() => setLocation("/")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
