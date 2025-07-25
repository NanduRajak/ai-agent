"use client";

import { ProjectForm } from "@/module/home/ui/components/project-fom";
import { DustParticles } from "@/components/dust-particles";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

const Page = () => {
  const [showParticles, setShowParticles] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Hide particles immediately when user is active
    setShowParticles(false);

    // Set new timer for 5 seconds
    inactivityTimerRef.current = setTimeout(() => {
      setShowParticles(true);
    }, 5000);
  };

  useEffect(() => {
    // Activity event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []); // Empty dependency array is now correct

  return (
    <>
      {/* Background Particles */}
      <DustParticles isActive={showParticles} />
      
      <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 relative z-10">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-4xl">
        {/* Logo and Title */}
        <div className="space-y-6">
          <div className="fade-in-up">
            <Image
              src="/logo.svg"
              alt="Vibe"
              width={64}
              height={64}
              className="mx-auto drop-shadow-lg smooth-transform hover:scale-105"
            />
          </div>
          <div className="space-y-4 fade-in-up-delay-1">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              Transform Ideas into Apps{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                With AI
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create apps and websites by chatting with AI. Just describe what
              you want to build, and watch it come to life.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full max-w-2xl mx-auto fade-in-up-delay-2">
          <ProjectForm />
        </div>
      </div>
    </div>
    </>
  );
};

export default Page;
