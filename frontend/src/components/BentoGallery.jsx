import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Globe, ShieldCheck, Zap } from 'lucide-react';

const FEATURES = [
  {
    title: "AI Intelligence",
    desc: "Powered by Llama-3.3-70b for semantic, recruiter-grade bullet point rewriting.",
    icon: <Brain className="text-brand-400" />,
    img: "/features/ai_intel.png",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Global Standards",
    desc: "Optimized for global ATS compliance and international hiring standards.",
    icon: <Globe className="text-purple-400" />,
    img: "/features/global_reach.png",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Unmatched Accuracy",
    desc: "Measureable ATS impact with honest, data-driven semantic scoring.",
    icon: <ShieldCheck className="text-emerald-400" />,
    img: "/features/trust_score.png",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    title: "Instant Impact",
    desc: "From zero to interview-ready in under 10 seconds flat.",
    icon: <Zap className="text-yellow-400" />,
    className: "md:col-span-1 md:row-span-1",
  }
];

export default function BentoGallery() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <span className="label-premium">Features Showcase</span>
        <h2 className="text-4xl font-bold mt-4 leading-tight">
          Next-Gen Career <span className="text-gradient">Intelligence</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px]">
        {FEATURES.map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className={`bento-item group relative overflow-hidden ${feat.className}`}
          >
            {/* Background Image if exists */}
            {feat.img && (
              <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60">
                <img 
                  src={`file:///${feat.img}`} 
                  alt={feat.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/50 to-transparent" />
              </div>
            )}

            <div className="relative z-10 h-full flex flex-col justify-end">
              <div className="mb-4 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-brand-400 transition-colors">
                {feat.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                {feat.desc}
              </p>
            </div>

            {/* Subtle glow on hover */}
            <div className="absolute -inset-2 bg-gradient-to-br from-brand-pri/20 to-purple-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
