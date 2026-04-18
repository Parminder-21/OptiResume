import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const mouseX = useSpring(0, { stiffness: 500, damping: 28 });
  const mouseY = useSpring(0, { stiffness: 500, damping: 28 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMove = (e) => {
      mouseX.set(e.clientX - 16);
      mouseY.set(e.clientY - 16);
    };

    const handleHover = (e) => {
      const target = e.target;
      const isInteractive = ['BUTTON', 'A', 'INPUT', 'TEXTAREA'].includes(target.tagName) || 
                            target.closest('button') || 
                            target.closest('a');
      setIsHovering(!!isInteractive);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseover', handleHover);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseover', handleHover);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border border-brand-pri/50 pointer-events-none z-[9999] hidden lg:block"
      style={{
        x: mouseX,
        y: mouseY,
        scale: isHovering ? 1.5 : 1,
        backgroundColor: isHovering ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
      }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
    />
  );
}
