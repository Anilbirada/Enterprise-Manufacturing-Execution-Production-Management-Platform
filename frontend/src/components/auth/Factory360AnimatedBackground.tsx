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

const FRAME_DURATION_MS = 5500; // 5.5 seconds per frame
const CROSSFADE_DURATION_MS = 1400; // 1.4 seconds crossfade

export const Factory360AnimatedBackground: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [hasError, setHasError] = useState<Record<string, boolean>>({});

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Accessibility: Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionPreference = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionPreference);
    return () => mediaQuery.removeEventListener('change', handleMotionPreference);
  }, []);

  // 2. Progressive Preloading: Preload first image immediately, then upcoming frames
  useEffect(() => {
    // Preload current, next, and next+1 images to guarantee zero flicker
    const indicesToPreload = [
      currentIndex,
      (currentIndex + 1) % MANUFACTURING_FRAMES.length,
      (currentIndex + 2) % MANUFACTURING_FRAMES.length
    ];

    indicesToPreload.forEach((idx) => {
      const frame = MANUFACTURING_FRAMES[idx];
      if (!loadedImages[frame.id] && !hasError[frame.id]) {
        const img = new Image();
        img.src = frame.imageSrc;
        img.onload = () => {
          setLoadedImages((prev) => ({ ...prev, [frame.id]: true }));
        };
        img.onerror = () => {
          console.warn(`[Factory360] Frame failed to load: ${frame.imageSrc}`);
          setHasError((prev) => ({ ...prev, [frame.id]: true }));
        };
      }
    });
  }, [currentIndex]);

  // 3. Continuous Animation Sequencer with Tab Visibility Pause/Resume
  useEffect(() => {
    if (prefersReducedMotion) return;

    const startTransitionTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setPreviousIndex(currentIndex);
        setCurrentIndex((prev) => (prev + 1) % MANUFACTURING_FRAMES.length);
      }, FRAME_DURATION_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        startTransitionTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTransitionTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentIndex, prefersReducedMotion]);

  // Clean up previous frame after crossfade completes
  useEffect(() => {
    if (previousIndex !== null) {
      const cleanupTimer = setTimeout(() => {
        setPreviousIndex(null);
      }, CROSSFADE_DURATION_MS);
      return () => clearTimeout(cleanupTimer);
    }
  }, [previousIndex]);

  const activeFrame = MANUFACTURING_FRAMES[currentIndex];

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* =====================================================================
          BASE FALLBACK / POSTER CANVAS
          ===================================================================== */}
      <div 
        className="absolute inset-0 w-full h-full bg-[#030814] bg-cover bg-center"
        style={{ backgroundImage: `url('${MANUFACTURING_FRAMES[0].imageSrc}')` }}
      />

      {/* =====================================================================
          RENDER 8 MANUFACTURING FRAMES (WITH GPU KEN BURNS & CROSSFADE)
          ===================================================================== */}
      {MANUFACTURING_FRAMES.map((frame, index) => {
        const isCurrent = index === currentIndex;
        const isPrevious = index === previousIndex;
        const isVisible = isCurrent || isPrevious;

        // In reduced-motion mode, only display Frame 01 statically
        if (prefersReducedMotion && index !== 0) return null;

        const animationClass = isCurrent && !prefersReducedMotion ? frame.kenBurnsClass : '';

        return (
          <div
            key={frame.id}
            className={`absolute inset-0 w-full h-full transition-opacity ease-in-out ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transitionDuration: `${CROSSFADE_DURATION_MS}ms`,
              zIndex: isCurrent ? 2 : isPrevious ? 1 : 0
            }}
          >
            <div
              className={`w-full h-full bg-cover bg-center bg-no-repeat ${animationClass}`}
              style={{
                backgroundImage: `url('${frame.imageSrc}')`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        );
      })}

      {/* =====================================================================
          PREMIUM MULTI-LAYER DARK INDUSTRIAL OVERLAYS
          1. Base Dark Navy Tint [rgba(3, 8, 20, 0.72)]
          2. Central Reading Zone Darkener (Guarantees 100% Login Card Readability)
          3. Top & Bottom Vertical Gradient
          4. Edge Vignette
          5. Subtle Industrial Overlay Grid Texture
          ===================================================================== */}
      {/* 1. Base Dark Navy Tint */}
      <div className="absolute inset-0 bg-[#030814]/72 mix-blend-multiply" />

      {/* 2. Central Reading Zone Darkener: radial falloff that leaves machinery visible on sides */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 720px 780px at 50% 50%, rgba(2, 6, 16, 0.94) 0%, rgba(2, 6, 16, 0.70) 55%, rgba(2, 6, 16, 0.35) 100%)'
        }}
      />

      {/* 3. Top and Bottom Atmospheric Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020610] via-transparent to-[#020610]/85" />

      {/* 4. Peripheral Edge Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 38%, rgba(2, 6, 16, 0.88) 100%)'
        }}
      />

      {/* 5. Subtle Industrial Precision Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf80a_1px,transparent_1px),linear-gradient(to_bottom,#38bdf80a_1px,transparent_1px)] bg-[size:4rem_4rem] mix-blend-overlay opacity-60" />

      {/* 6. Ambient Electric Cyan Atmospheric Glow at Corner */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* =====================================================================
          ENTERPRISE TELEMETRY HUD OVERLAY (BOTTOM-LEFT STATUS BADGE)
          Shows active manufacturing environment without obstructing login form
          ===================================================================== */}
      <div className="hidden md:flex absolute bottom-6 left-6 z-10 items-center space-x-3 bg-slate-950/70 backdrop-blur-md border border-slate-800/80 px-3.5 py-2 rounded-lg text-xs shadow-lg transition-all duration-700">
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

        {/* Frame Progress Indicators (8 Dots) */}
        <div className="flex items-center space-x-1 pl-2 border-l border-slate-800">
          {MANUFACTURING_FRAMES.map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                dotIndex === currentIndex 
                  ? 'w-4 bg-cyan-400 shadow-sm shadow-cyan-400/50' 
                  : 'w-1.5 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Corner Status Stamp (Bottom-Right) */}
      <div className="hidden lg:flex absolute bottom-6 right-6 z-10 items-center space-x-2 text-[10px] font-mono text-slate-500 tracking-wider bg-slate-950/60 backdrop-blur-sm border border-slate-900 px-3 py-1.5 rounded">
        <span>RSR FACTORY360 // SMART MES ENGINE</span>
        <span className="text-cyan-500/60">●</span>
        <span>JIGANI-BOMMASANDRA</span>
      </div>
    </div>
  );
};

export default Factory360AnimatedBackground;
