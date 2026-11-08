import React, { useState, useEffect, useRef } from 'react';

export interface ManufacturingFrame {
  id: string;
  frameNumber: string;
  title: string;
  category: string;
  subtitle: string;
  imageSrc: string;
  kenBurnsClass: string;
}

export const MANUFACTURING_FRAMES: ManufacturingFrame[] = [
  {
    id: 'factory-01',
    frameNumber: 'FRAME 01',
    title: 'MODERN MANUFACTURING FACTORY',
    category: 'Facility Overview',
    subtitle: 'Massive Automated Facility // High-Bay Assembly Infrastructure',
    imageSrc: '/images/factory360/background/factory-01.webp',
    kenBurnsClass: 'animate-kb-1'
  },
  {
    id: 'robotics-02',
    frameNumber: 'FRAME 02',
    title: 'INDUSTRIAL ROBOTICS',
    category: 'Robotic Automation',
    subtitle: 'Multi-Axis Robotic Arms // High-Precision Automated Welding & Assembly',
    imageSrc: '/images/factory360/background/robotics-02.webp',
    kenBurnsClass: 'animate-kb-2'
  },
  {
    id: 'production-03',
    frameNumber: 'FRAME 03',
    title: 'AUTOMATED PRODUCTION LINE',
    category: 'Assembly Conveyor',
    subtitle: 'Continuous Synchronized Line // Real-Time OEE Cycle Telemetry',
    imageSrc: '/images/factory360/background/production-03.webp',
    kenBurnsClass: 'animate-kb-3'
  },
  {
    id: 'cnc-04',
    frameNumber: 'FRAME 04',
    title: 'CNC & PRECISION ENGINEERING',
    category: 'Precision Machining',
    subtitle: '5-Axis CNC Milling & Turning // Sub-Micron Metal Machining',
    imageSrc: '/images/factory360/background/cnc-04.webp',
    kenBurnsClass: 'animate-kb-4'
  },
  {
    id: 'quality-05',
    frameNumber: 'FRAME 05',
    title: 'QUALITY INSPECTION',
    category: 'Metrology & QA',
    subtitle: 'Optical Laser CMM Inspection // Real-Time Non-Conformance Guard',
    imageSrc: '/images/factory360/background/quality-05.webp',
    kenBurnsClass: 'animate-kb-5'
  },
  {
    id: 'smart-factory-06',
    frameNumber: 'FRAME 06',
    title: 'SMART FACTORY TECHNOLOGY',
    category: 'Operations Command',
    subtitle: 'Central Industrial Control Center // Digital Twin SCADA Telemetry',
    imageSrc: '/images/factory360/background/smart-factory-06.webp',
    kenBurnsClass: 'animate-kb-6'
  },
  {
    id: 'warehouse-07',
    frameNumber: 'FRAME 07',
    title: 'WAREHOUSE & LOGISTICS',
    category: 'Intralogistics',
    subtitle: 'Automated Storage & Retrieval (ASRS) // Autonomous AGV Fleet',
    imageSrc: '/images/factory360/background/warehouse-07.webp',
    kenBurnsClass: 'animate-kb-7'
  },
  {
    id: 'connected-factory-08',
    frameNumber: 'FRAME 08',
    title: 'CONNECTED SMART MANUFACTURING',
    category: 'Industry 4.0 Ecosystem',
    subtitle: 'Cyber-Physical Topology // Interconnected Factory360 MES Network',
    imageSrc: '/images/factory360/background/connected-factory-08.webp',
    kenBurnsClass: 'animate-kb-8'
  }
];

// Exact 5.0 seconds per slide as specified by the user
const SLIDE_DURATION_MS = 5000;
const CROSSFADE_DURATION_MS = 1200;

export const Factory360AnimatedBackground: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Immediate Preload of all 8 local WebP images on mount for zero-delay rendering
  useEffect(() => {
    MANUFACTURING_FRAMES.forEach((frame) => {
      const img = new Image();
      img.src = frame.imageSrc;
    });
  }, []);

  // 2. Guaranteed 5-Second Interval Sequencer: Advances 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 1
  useEffect(() => {
    const advanceSlide = () => {
      setCurrentIndex((prev) => {
        setPreviousIndex(prev);
        return (prev + 1) % MANUFACTURING_FRAMES.length;
      });
    };

    // Initialize interval timer
    timerRef.current = setInterval(advanceSlide, SLIDE_DURATION_MS);

    // Tab visibility handling: pause when tab is minimized/hidden, resume when focused
    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        if (!timerRef.current) {
          timerRef.current = setInterval(advanceSlide, SLIDE_DURATION_MS);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 3. Clean up previous frame after crossfade duration so only the active frame stays rendered
  useEffect(() => {
    if (previousIndex !== null) {
      const timeout = setTimeout(() => {
        setPreviousIndex(null);
      }, CROSSFADE_DURATION_MS + 200);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, previousIndex]);

  const activeFrame = MANUFACTURING_FRAMES[currentIndex];

  const handleManualSelect = (targetIndex: number) => {
    if (targetIndex === currentIndex) return;
    setPreviousIndex(currentIndex);
    setCurrentIndex(targetIndex);

    // Reset interval timer so the user gets a full 5 seconds on the manually selected frame
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          setPreviousIndex(prev);
          return (prev + 1) % MANUFACTURING_FRAMES.length;
        });
      }, SLIDE_DURATION_MS);
    }
  };

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* =====================================================================
          BASE STATIC CANVAS (Frame 01 acts as baseline background)
          ===================================================================== */}
      <div 
        className="absolute inset-0 w-full h-full bg-[#030814] bg-cover bg-center"
        style={{ backgroundImage: `url('${MANUFACTURING_FRAMES[0].imageSrc}')` }}
      />

      {/* =====================================================================
          RENDER 8 MANUFACTURING FRAMES (CROSSFADE + KEN BURNS)
          ===================================================================== */}
      {MANUFACTURING_FRAMES.map((frame, index) => {
        const isCurrent = index === currentIndex;
        const isPrevious = index === previousIndex;

        // Current slide is elevated on z-20 and fades in
        // Previous slide stays steady on z-10 underneath during the crossfade
        // Inactive slides are hidden on z-0
        let zIndex = 0;
        let opacityClass = 'opacity-0';

        if (isCurrent) {
          zIndex = 20;
          opacityClass = 'opacity-100';
        } else if (isPrevious) {
          zIndex = 10;
          opacityClass = 'opacity-100';
        }

        return (
          <div
            key={frame.id}
            className={`absolute inset-0 w-full h-full transition-opacity ease-in-out ${opacityClass}`}
            style={{
              zIndex,
              transitionDuration: `${CROSSFADE_DURATION_MS}ms`
            }}
          >
            <div
              key={`${frame.id}-${isCurrent}`}
              className={`w-full h-full bg-cover bg-center bg-no-repeat ${
                isCurrent ? frame.kenBurnsClass : ''
              }`}
              style={{
                backgroundImage: `url('${frame.imageSrc}')`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        );
      })}

      {/* =====================================================================
          MULTI-LAYER DARK INDUSTRIAL OVERLAYS (OPTIMIZED FOR LOGIN VISIBILITY)
          ===================================================================== */}
      {/* 1. Base Dark Navy Tint */}
      <div className="absolute inset-0 bg-[#030814]/72 mix-blend-multiply z-30" />

      {/* 2. Central Form Darkener: high-contrast center with vibrant factory flanks */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'radial-gradient(ellipse 720px 780px at 50% 50%, rgba(2, 6, 16, 0.94) 0%, rgba(2, 6, 16, 0.70) 55%, rgba(2, 6, 16, 0.35) 100%)'
        }}
      />

      {/* 3. Top and Bottom Atmospheric Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020610] via-transparent to-[#020610]/85 z-30" />

      {/* 4. Peripheral Edge Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 38%, rgba(2, 6, 16, 0.88) 100%)'
        }}
      />

      {/* 5. Subtle Industrial Precision Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf80a_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80a_1px,transparent_1px)] bg-[size:4rem_4rem] mix-blend-overlay opacity-60 z-30" />

      {/* 6. Ambient Electric Cyan Glows at Corners */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none z-30" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none z-30" />

      {/* =====================================================================
          ACTIVE FRAME TELEMETRY HUD & INTERACTIVE SLIDE INDICATOR (BOTTOM-LEFT)
          ===================================================================== */}
      <div className="hidden sm:flex absolute bottom-5 left-5 z-40 items-center space-x-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/90 px-3.5 py-2 rounded-lg text-xs shadow-xl transition-all duration-500">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[11px] font-bold text-cyan-300 tracking-wider">
            {activeFrame.frameNumber}
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-semibold text-slate-200 uppercase tracking-wide text-[11px]">
            {activeFrame.title}
          </span>
        </div>

        {/* 8 Clickable Frame Dots with pointer-events-auto */}
        <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800 pointer-events-auto">
          {MANUFACTURING_FRAMES.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => handleManualSelect(dotIndex)}
              title={`Switch to Frame 0${dotIndex + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                dotIndex === currentIndex 
                  ? 'w-5 bg-cyan-400 shadow-md shadow-cyan-400/60' 
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Corner Status Stamp (Bottom-Right) */}
      <div className="hidden lg:flex absolute bottom-5 right-5 z-40 items-center space-x-2 text-[10px] font-mono text-slate-400 tracking-wider bg-slate-950/70 backdrop-blur-sm border border-slate-900 px-3 py-1.5 rounded">
        <span>RSR FACTORY360 // SMART MES ENGINE</span>
        <span className="text-cyan-400">●</span>
        <span>JIGANI-BOMMASANDRA</span>
      </div>
    </div>
  );
};

export default Factory360AnimatedBackground;
