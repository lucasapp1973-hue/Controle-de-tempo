import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'motion/react';

export default function HourglassAnimated() {
  const [isFlipped, setIsFlipped] = useState(false);
  const sandControls = useAnimation();

  useEffect(() => {
    // Automatically flip every 5 seconds to show a continuous cycle
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-4">
      {/* Outer Rotating Container */}
      <motion.div
        animate={{ rotate: isFlipped ? 180 : 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 90, 
          damping: 14,
          duration: 1.2 
        }}
        className="w-24 h-28 relative flex items-center justify-center"
      >
        <svg 
          viewBox="0 0 100 120" 
          className="w-full h-full text-slate-700 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS FOR GRADIENTS AND FILTERS */}
          <defs>
            <linearGradient id="sandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" /> {/* indigo-400 */}
              <stop offset="50%" stopColor="#34d399" /> {/* emerald-400 */}
              <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
            </linearGradient>
            
            <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0f172a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* INNER GLASS SHADING */}
          <path 
            d="M32,16 C32,45 47,55 47,60 C47,65 32,75 32,104 L68,104 C68,75 53,65 53,60 C53,55 68,45 68,16 Z" 
            fill="url(#glassGrad)" 
            stroke="#334155" 
            strokeWidth="1.5"
          />

          {/* GLASS FRAME / COLUMNS */}
          {/* Top Plate */}
          <rect x="22" y="8" width="56" height="8" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          {/* Bottom Plate */}
          <rect x="22" y="104" width="56" height="8" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          
          {/* Column Rails (Left, Right) */}
          <rect x="18" y="16" width="4" height="88" rx="2" fill="#334155" />
          <rect x="78" y="16" width="4" height="88" rx="2" fill="#334155" />

          {/* ACTIVE DRAINING TOP SAND pile */}
          <motion.path
            d="M34,18 L66,18 L51,57 C50.5,58 49.5,58 49,57 Z"
            fill="url(#sandGrad)"
            style={{ originY: 1, originX: 0.5 }}
            animate={{ 
              scaleY: [1, 0],
              opacity: [1, 0.8, 0]
            }}
            key={`top-sand-${isFlipped}`}
            transition={{
              duration: 4.8,
              ease: "linear",
              delay: 0.8
            }}
          />

          {/* FLOWING TRICKLE STREAM */}
          <motion.line
            x1="50"
            y1="56"
            x2="50"
            y2="102"
            stroke="url(#sandGrad)"
            strokeWidth="2.5"
            strokeDasharray="4 6"
            filter="url(#glow)"
            animate={{
              strokeDashoffset: [0, -30]
            }}
            key={`stream-${isFlipped}`}
            transition={{
              repeat: Infinity,
              duration: 0.6,
              ease: "linear",
              delay: 0.2
            }}
            // Only visible after flip complete, hides right when sand ends
            style={{ originX: 0.5, originY: 0 }}
            initial={{ opacity: 0 }}
            variants={{
              visible: { opacity: 1 },
              glowing: { opacity: [0, 1, 1, 0], transition: { duration: 4.8, times: [0, 0.1, 0.9, 1] } }
            }}
            run-animation="true"
            className="text-emerald-400"
          />

          {/* ACCUMULATING BOTTOM SAND pile */}
          <motion.path
            d="M34,102 C36,92 42,75 50,75 C58,75 64,92 66,102 Z"
            fill="url(#sandGrad)"
            style={{ originY: 1, originX: 0.5 }}
            initial={{ scaleY: 0 }}
            animate={{ 
              scaleY: [0, 1]
            }}
            key={`bottom-sand-${isFlipped}`}
            transition={{
              duration: 4.8,
              ease: "linear",
              delay: 0.8
            }}
          />

          {/* SPLASH PARTICLES AT BOTTOM OF THE TRICKLE */}
          <motion.circle
            cx="50"
            cy="100"
            r="1.5"
            fill="#34d399"
            animate={{
              y: [0, -6, 0],
              x: [0, 2, -2, 0],
              scale: [0, 1.2, 0],
              opacity: [0, 1, 0]
            }}
            key={`splash-${isFlipped}`}
            transition={{
              repeat: Infinity,
              duration: 0.4,
              ease: "easeOut"
            }}
          />

          {/* GLASS REFLECTIONS */}
          <path 
            d="M35,22 C35,45 42,48 42,48 M65,22 C65,45 58,48 58,48" 
            stroke="white" 
            strokeWidth="1" 
            strokeLinecap="round" 
            opacity="0.15" 
          />
        </svg>
      </motion.div>

      {/* Elegant minimalist falling indicator circles */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 pointer-events-none mt-2">
        <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500/80 transition-all duration-500 ${isFlipped ? 'scale-125 opacity-100 shadow-[0_0_10px_#6366f1]' : 'scale-90 opacity-40'}`} />
        <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500/80 transition-all duration-500 ${!isFlipped ? 'scale-125 opacity-100 shadow-[0_0_10px_#10b981]' : 'scale-90 opacity-40'}`} />
      </div>
    </div>
  );
}
