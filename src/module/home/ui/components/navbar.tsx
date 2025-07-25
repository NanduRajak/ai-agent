"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuIcon, HomeIcon } from "lucide-react";
import { MobileChatHistory } from "@/module/home/ui/components/mobile-chat-history";

export const Navbar = () => {
  return (
    <nav className="p-4 bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-200 border-b border-border/50">
      <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Mobile Menu - only show when signed in and on mobile */}
          <SignedIn>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 bg-background/95 backdrop-blur-xl"
              >
                <SheetHeader>
                  <SheetTitle>Chat History</SheetTitle>
                </SheetHeader>
                <MobileChatHistory />
              </SheetContent>
            </Sheet>
          </SignedIn>

          <Link
            href="/"
            className="flex items-center gap-2 group transition-all duration-200"
          >
            <div className="relative">
              <Image src="/logo.svg" alt="Vibe" width={24} height={24} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200"></div>
            </div>
            <div className="flex items-center gap-1.5">
              <HomeIcon className="h-5 w-5 text-blue-500 group-hover:text-blue-600 transition-colors duration-200" />
              <span className="font-semibold text-lg">Vibe</span>
            </div>
          </Link>
        </div>
        <SignedOut>
          <div className="flex gap-2">
            <SignUpButton>
              <Button variant="outline" size="sm">
                Sign up
              </Button>
            </SignUpButton>
            <SignInButton>
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </div>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserControl showName />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
};
