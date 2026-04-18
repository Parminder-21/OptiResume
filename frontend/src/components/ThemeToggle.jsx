import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-glass)] border border-[var(--border-pri)] text-[var(--text-pri)] shadow-sm overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: 20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex items-center justify-center"
        >
          {theme === 'dark' ? (
            <Moon size={18} className="text-brand-400" />
          ) : (
            <Sun size={18} className="text-yellow-500" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
