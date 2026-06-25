"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Menu, X } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group select-none">
            <img src="/ThinkNEXT-LOGO-NEW.svg" alt="ThinkNEXT Logo" className="h-12 w-auto group-hover:scale-105 transition-transform" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-semibold text-zinc-900 border-b-2 border-brand-green pb-1"
            >
              Platform
            </Link>
            <Link
              href="#features"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#solutions"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Solutions
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Pricing
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/login"
              id="login-btn-desktop"
              className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/auth/register"
              id="register-btn-desktop"
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-bold text-white bg-brand-green hover:bg-brand-green-hover rounded-full shadow-md shadow-emerald-700/10 transition-all hover:translate-y-[-1px] active:translate-y-[0]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-950 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 bg-background/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-bold text-zinc-900 border-l-2 border-brand-green pl-2"
            >
              Platform
            </Link>
            <Link
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 pl-2"
            >
              Features
            </Link>
            <Link
              href="#solutions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 pl-2"
            >
              Solutions
            </Link>
            <Link
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 pl-2"
            >
              Pricing
            </Link>
            <hr className="border-zinc-200" />
            <div className="flex flex-col gap-3">
              <Link
                href="/auth/login"
                id="login-btn-mobile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center h-10 text-sm font-bold text-zinc-700 border border-zinc-200 rounded-full hover:bg-zinc-50"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                id="register-btn-mobile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center h-10 text-sm font-bold text-white bg-brand-green hover:bg-brand-green-hover rounded-full shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">{children}</main>

      {/* Footer */}
      <footer className="bg-brand-dark-footer text-zinc-400 py-16 px-6 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-12">
            {/* Brand column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-white select-none">
                <img src="/ThinkNEXT-LOGO-NEW.svg" alt="ThinkNEXT Logo" className="h-12 w-auto" />
              </div>
              <p className="text-sm max-w-sm text-zinc-500 font-medium">
                AI-powered video creation for modern teams.
              </p>
            </div>

            {/* Product column */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#api" className="hover:text-white transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#security" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company column */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="#about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#careers" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal column */}
            <div className="space-y-4">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link href="#privacy" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#terms" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#cookies" className="hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright banner */}
          <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-zinc-600">
            <span>&copy; 2024 ThinkNEXT Video AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
