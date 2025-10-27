"use client";

import "./theme-toggle-animated.css";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// TypeScript declarations for View Transition API
declare global {
  interface Document {
    startViewTransition?: (callback: () => Promise<void> | void) => {
      ready: Promise<void>;
    };
  }
}

interface ThemeToggleAnimatedProps {
  variant?: "circle" | "circle-blur" | "polygon";
  start?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
}

export const ThemeToggleAnimated = ({ 
  variant = "circle-blur", 
  start = "bottom-left" 
}: ThemeToggleAnimatedProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = async () => {
    if (!document.startViewTransition) {
      setTheme(theme === "dark" ? "light" : "dark");
      return;
    }

    await document.startViewTransition(async () => {
      setTheme(theme === "dark" ? "light" : "dark");
    }).ready;

    const { innerWidth, innerHeight } = window;
    
    // Calculate clip path based on start position
    let clipPath: string;
    let x: number, y: number;
    
    switch (start) {
      case "top-left":
        x = 0;
        y = 0;
        break;
      case "top-right":
        x = innerWidth;
        y = 0;
        break;
      case "bottom-left":
        x = 0;
        y = innerHeight;
        break;
      case "bottom-right":
        x = innerWidth;
        y = innerHeight;
        break;
      case "center":
        x = innerWidth / 2;
        y = innerHeight / 2;
        break;
      default:
        x = 0;
        y = innerHeight;
    }

    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    if (variant === "circle-blur") {
      clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`,
      ][theme === "dark" ? 0 : 1];
    } else {
      clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`,
      ][theme === "dark" ? 0 : 1];
    }

    document.documentElement.animate(
      {
        clipPath: clipPath,
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement:
          theme === "dark" ? "::view-transition-old(root)" : "::view-transition-new(root)",
      }
    );
  };

  if (!mounted) {
    return (
      <button 
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        disabled
      >
        <div className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
