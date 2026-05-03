import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface PremiumTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "pill" | "underline";
  size?: "sm" | "md" | "lg";
}

export function PremiumTabs({
  tabs,
  activeTab,
  onChange,
  className,
  variant = "pill",
  size = "md",
}: PremiumTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto no-scrollbar",
        variant === "pill" ? "bg-muted/50 p-1 rounded-xl" : "border-b border-border w-full",
        className
      )}
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              // Size variants
              size === "sm" && "text-xs px-3 py-1.5",
              size === "md" && "text-sm px-4 py-2",
              size === "lg" && "text-base px-6 py-2.5",
              // Pill variant styling
              variant === "pill" && cn(
                "rounded-lg z-10",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              ),
              // Underline variant styling
              variant === "underline" && cn(
                "hover:text-foreground/80 pb-3 -mb-px rounded-t-sm z-10",
                isActive ? "text-primary hover:text-primary" : "text-muted-foreground"
              )
            )}
          >
            {isActive && variant === "pill" && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}
            
            {isActive && variant === "underline" && (
              <motion.div
                layoutId="active-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
              {tab.icon && <span className={cn("shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")}>{tab.icon}</span>}
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "ml-1 flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold leading-none",
                    size === "sm" ? "h-4 min-w-4 px-1 text-[10px]" : "h-5 min-w-5 px-1.5 text-xs"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
