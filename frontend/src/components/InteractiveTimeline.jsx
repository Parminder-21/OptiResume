import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, Target, RefreshCw, FileCheck } from 'lucide-react';

const STEPS = [
  {
    title: "Document Intake",
    desc: "Our serverless engine parses your PDF with 99.8% text accurate extraction.",
    icon: <FileUp size={24} />,
    color: "from-blue-500 to-cyan-400"
  },
  {
    title: "Semantic Analysis",
    desc: "SBERT embeddings compare your experience against the JD for a deep talent match.",
    icon: <Target size={24} />,
    color: "from-brand-pri to-brand-sec"
  },
  {
    title: "AI Optimization",
    desc: "Llama-3.3-70b rewrites your bullet points using industry-standard power verbs.",
    icon: <RefreshCw size={24} />,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Professional Export",
    desc: "Download a perfectly structured PDF or DOCX that passes any ATS gatekeeper.",
    icon: <FileCheck size={24} />,
    color: "from-emerald-500 to-teal-400"
  }
];

export default function InteractiveTimeline() {
  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <span className="label-premium">The Process</span>
          <h2 className="text-4xl font-bold mt-4 leading-tight">
            How we transform your <span className="text-gradient">Future</span>
          </h2>
        </div>

        <div className="relative">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-brand-pri/0 via-brand-pri/50 to-brand-pri/0 md:-translate-x-1/2" />

          <div className="space-y-24">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${
                  i % 2 !== 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Node */}
                <div className="absolute left-[20px] md:left-1/2 w-10 h-10 rounded-full bg-bg-page border-4 border-brand-pri/20 flex items-center justify-center z-10 md:-translate-x-1/2 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                  <div className="w-2 h-2 rounded-full bg-brand-pri animate-pulse" />
                </div>

                {/* Content */}
                <div className="flex-1 ml-16 md:ml-0 md:w-1/2">
                   <div className={`glass-card p-8 flex flex-col gap-4 hover:shadow-2xl hover:shadow-brand-pri/10 transition-shadow ${
                     i % 2 === 0 ? 'md:items-end md:text-right' : 'md:items-start md:text-left'
                   }`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}>
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold text-white">{step.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                        {step.desc}
                      </p>
                   </div>
                </div>

                {/* Spacer for 2-column layout */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
