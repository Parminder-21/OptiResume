import React from 'react';
import { Github, Twitter, Linkedin, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative pt-24 pb-12 px-6 border-t border-white/5 bg-bg-page overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-brand-pri/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-pri to-brand-sec rounded-lg flex items-center justify-center text-sm">
              ⚡
            </div>
            <span className="font-bold text-white text-xl tracking-tight">OptiResume <span className="text-brand-400">AI</span></span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            The world's most advanced AI-powered resume optimizer. Engineered for high-performance candidates who demand measurable results.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-400 transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-400 transition-all">
              <Linkedin size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-400 transition-all">
              <Github size={18} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">AI Engine</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Resources</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">ATS Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Resume Tips</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-600 text-xs">
          © 2026 OptiResume AI. All rights reserved. Built for the future of recruitment.
        </p>
        <div className="flex gap-8 text-xs text-slate-600">
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
