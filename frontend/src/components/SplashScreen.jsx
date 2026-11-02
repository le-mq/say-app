import React, { useState, useEffect, useRef } from 'react';

const SPLASH_SESSION_KEY = 'hasSeenSaySplash';

// ============================================================================
// COSMIC NEBULA SUPERNOVA PARTICLE ENGINE
// Dense (2,400 - 3,200 particles), expansive 360° screen reach & celestial glow
// ============================================================================
class CosmicStardustParticle {
  constructor(x, y, viewW, viewH) {
    this.x = x;
    this.y = y;
    this.life = 0;

    const centerX = viewW / 2;
    const centerY = viewH / 2;
    const dx = x - centerX;
    const dy = y - centerY;

    // Radial blast angle radiating outwards from center + subtle random angle variance
    const radialAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.9;

    // 3 Dynamic Layers for Deep Spatial Dispersion:
    // Tier 0 (45%): High-velocity stardust shooting far across screen
    // Tier 1 (40%): Swirling nebula cloud with curl turbulence & negative gravity
    // Tier 2 (15%): Radiant core diamond embers sparkling with luminescent glow
    const tierRoll = Math.random();
    if (tierRoll < 0.45) {
      this.tier = 0;
      // High initial velocity for massive screen dispersion reach
      const speed = 5.0 + Math.random() * 12.0;
      this.vx = Math.cos(radialAngle) * speed * 2.4 + (Math.random() - 0.5) * 3.5;
      this.vy = Math.sin(radialAngle) * speed * 1.6 - 1.2 - Math.random() * 4.5;
      this.friction = 0.982; // Glides far across viewport
      this.decay = 0.009 + Math.random() * 0.008;
      this.size = 0.8 + Math.random() * 1.1;
      this.negativeGravity = -0.05 - Math.random() * 0.04;
    } else if (tierRoll < 0.85) {
      this.tier = 1;
      const speed = 2.2 + Math.random() * 6.0;
      this.vx = Math.cos(radialAngle) * speed * 1.8 + (Math.random() - 0.5) * 2.8;
      this.vy = Math.sin(radialAngle) * speed * 1.3 - 1.6 - Math.random() * 4.0;
      this.friction = 0.976;
      this.decay = 0.010 + Math.random() * 0.009;
      this.size = 1.4 + Math.random() * 1.2;
      this.negativeGravity = -0.09 - Math.random() * 0.06;
    } else {
      this.tier = 2;
      const speed = 1.0 + Math.random() * 3.2;
      this.vx = Math.cos(radialAngle) * speed + (Math.random() - 0.5) * 2.0;
      this.vy = Math.sin(radialAngle) * speed - 0.8 - Math.random() * 2.2;
      this.friction = 0.965;
      this.decay = 0.008 + Math.random() * 0.007;
      this.size = 2.2 + Math.random() * 1.5;
      this.negativeGravity = -0.04 - Math.random() * 0.03;
    }

    // Color palette: Mist Blue, Dusty Lavender, Cyan Aurora, Cosmic White & Champagne Starlight
    const colorRoll = Math.random();
    if (colorRoll < 0.35) {
      this.colorPrefix = 'rgba(145, 185, 197, '; // Mist Blue (#91B9C5)
    } else if (colorRoll < 0.65) {
      this.colorPrefix = 'rgba(179, 157, 219, '; // Dusty Lavender (#B39DDB)
    } else if (colorRoll < 0.82) {
      this.colorPrefix = 'rgba(135, 222, 245, '; // Cyan Aurora Glow
    } else if (colorRoll < 0.93) {
      this.colorPrefix = 'rgba(240, 248, 255, '; // Pure Cosmic Starlight
    } else {
      this.colorPrefix = 'rgba(255, 228, 240, '; // Rose Gold Nebula
    }

    this.alpha = 0.88 + Math.random() * 0.12;
    this.curlFrequency = 0.04 + Math.random() * 0.07;
    this.curlAmplitude = (Math.random() - 0.5) * 1.6;
  }

  update() {
    this.life++;
    this.vx *= this.friction;
    this.vy = (this.vy + this.negativeGravity) * this.friction;

    // Celestial wave curl turbulence for cosmic swirling effect
    const wave = Math.sin(this.life * this.curlFrequency) * this.curlAmplitude;
    this.x += this.vx + wave;
    this.y += this.vy;

    this.alpha = Math.max(0, this.alpha - this.decay);
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;
    ctx.fillStyle = this.colorPrefix + this.alpha + ')';

    if (this.tier === 2 && this.size > 2.4) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(this.x, this.y, this.size, this.size);
    }
  }
}

export default function SplashScreen({ onComplete }) {
  const [shouldRender, setShouldRender] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('splash') === '1' || urlParams.get('splash') === 'true') {
          return true;
        }
      }
      return !sessionStorage.getItem(SPLASH_SESSION_KEY);
    } catch {
      return true;
    }
  });

  // Stages:
  // 0: [0.0s - 0.4s] "SAY" slides up smoothly into center
  // 1: [0.4s - 1.8s] "Sound Around You" + "SAY IT WITHOUT SAYING IT" expand and remain for 1.4s (snappy, comfortable reading)
  // 2: [1.8s - 3.0s] Expansive Cosmic Nebula Supernova Dissolve (2,500 - 3,200 particles blasting across screen)
  // 3: [2.9s - 3.5s] Glassmorphism background seamlessly dissolves (opacity -> 0 in 600ms) revealing Main Feed
  const [stage, setStage] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    // Initial spring rise from y: 35 to y: 0
    requestAnimationFrame(() => setHasMounted(true));
  }, []);

  useEffect(() => {
    if (!shouldRender) {
      if (onComplete) onComplete();
      return;
    }

    // 0.4s: Expand "SAY" into "Sound Around You" and reveal tagline
    const t1 = setTimeout(() => {
      setStage(1);
    }, 400);

    // 1.8s: Text stays clearly visible for ~1.4s (vừa vặn, đọc kịp nhưng không bị chờ lâu)
    // then dissolves into an expansive cosmic particle supernova
    const t2 = setTimeout(() => {
      setStage(2);
    }, 1800);

    // 2.9s: Glassmorphism backdrop smoothly fades to reveal the pre-rendered Main Feed
    const t3 = setTimeout(() => {
      setIsFadingOut(true);
    }, 2900);

    // 3.5s: Complete sequence, set session flag and unmount
    const t4 = setTimeout(() => {
      finishSplash();
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [shouldRender]);

  const finishSplash = () => {
    try {
      sessionStorage.setItem(SPLASH_SESSION_KEY, 'true');
    } catch {}
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setShouldRender(false);
    if (onComplete) onComplete();
  };

  // Cosmic Nebula Particle Dissolve ([2.9s - 4.2s])
  useEffect(() => {
    if (stage !== 2) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    canvas.width = viewW;
    canvas.height = viewH;

    const isMobile = viewW < 640;
    const fontSize = isMobile ? 40 : 56;
    const taglineSize = isMobile ? 10 : 12;
    const textY = viewH / 2 - 14;

    // 1. Offscreen Canvas for precise text stroke pixel extraction
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
    offscreen.width = viewW;
    offscreen.height = viewH;

    // Draw "Sound Around You" in High-contrast Serif
    offCtx.fillStyle = '#91B9C5';
    offCtx.font = `700 ${fontSize}px "Playfair Display", Georgia, serif`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText('Sound Around You', viewW / 2, textY);

    // Draw Tagline below
    offCtx.fillStyle = '#B39DDB';
    offCtx.font = `600 ${taglineSize}px "Space Grotesk", sans-serif`;
    offCtx.letterSpacing = '0.24em';
    offCtx.fillText('SAY IT WITHOUT SAYING IT', viewW / 2, textY + (isMobile ? 42 : 52));

    // 2. High-density sampling with fine gap = 2px for rich 2,500 - 3,200 particles
    const textData = offCtx.getImageData(0, 0, viewW, viewH).data;
    const particles = [];
    const gap = 2; // Fine 2px grid for dense text glyph particle extraction

    const minY = Math.max(0, Math.floor(textY - 55));
    const maxY = Math.min(viewH, Math.floor(textY + 75));
    const minX = Math.max(0, Math.floor(viewW / 2 - 310));
    const maxX = Math.min(viewW, Math.floor(viewW / 2 + 310));

    for (let y = minY; y < maxY; y += gap) {
      for (let x = minX; x < maxX; x += gap) {
        const idx = (y * viewW + x) * 4;
        if (textData[idx + 3] > 40) {
          particles.push(new CosmicStardustParticle(x, y, viewW, viewH));
          if (particles.length >= 3000) break;
        }
      }
      if (particles.length >= 3000) break;
    }

    // 3. Add ambient stellar stardust particles surrounding the text cluster
    const ambientCount = isMobile ? 120 : 220;
    for (let i = 0; i < ambientCount; i++) {
      const rx = viewW / 2 + (Math.random() - 0.5) * (isMobile ? 320 : 620);
      const ry = textY + (Math.random() - 0.5) * (isMobile ? 80 : 130);
      particles.push(new CosmicStardustParticle(rx, ry, viewW, viewH));
    }

    // 4. 60FPS requestAnimationFrame particle loop with Galaxy Bloom
    const renderParticles = () => {
      ctx.clearRect(0, 0, viewW, viewH);

      // Galaxy Bloom screen blend mode for luminescent overlap
      ctx.globalCompositeOperation = 'screen';

      let activeCount = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.alpha > 0.01) {
          p.update();
          p.draw(ctx);
          activeCount++;
        }
      }

      ctx.globalCompositeOperation = 'source-over';

      if (activeCount > 0) {
        animFrameRef.current = requestAnimationFrame(renderParticles);
      }
    };

    animFrameRef.current = requestAnimationFrame(renderParticles);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [stage]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      onClick={finishSplash}
      className={`fixed inset-0 z-50 bg-[#081724]/40 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden select-none transition-opacity duration-700 ease-out will-change-transform ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
      }`}
      style={{ touchAction: 'none' }}
      title="Tap anywhere to skip"
    >
      {/* Subtle ambient galactic glow behind text */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-700"
        style={{ opacity: isFadingOut ? 0 : 0.85 }}
      >
        <div className="w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-[#142C40]/55 via-[#91B9C5]/15 to-[#B39DDB]/18 filter blur-[120px]" />
      </div>

      {/* ========================================================================= */}
      {/* STAGES 0 & 1: DOM MOTION TEXT ([0.0s - 2.9s]) */}
      {/* ========================================================================= */}
      {stage < 2 && (
        <div
          className="relative flex flex-col items-center text-center px-4 will-change-transform"
          style={{
            transform: hasMounted ? 'translateY(0px)' : 'translateY(35px)',
            opacity: hasMounted ? 1 : 0,
            transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.2), opacity 0.45s ease-out',
          }}
        >
          {/* Main Phrase: S[ound] A[round] Y[ou] */}
          <div className="flex items-baseline justify-center font-serif tracking-normal select-none">
            
            {/* "S" + "ound" */}
            <div
              className="flex items-baseline will-change-transform"
              style={{
                transform: stage === 0 ? 'translateX(18px)' : 'translateX(0px)',
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#91B9C5] drop-shadow-[0_2px_22px_rgba(145,185,197,0.4)]">
                S
              </span>
              <span
                className={`inline-block overflow-hidden whitespace-nowrap text-4xl sm:text-5xl md:text-6xl font-bold text-[#91B9C5] ${
                  stage >= 1
                    ? 'max-w-[180px] opacity-100 filter blur-0'
                    : 'max-w-0 opacity-0 filter blur-[8px]'
                }`}
                style={{
                  transition: 'max-width 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out, filter 0.6s ease-out',
                }}
              >
                ound
              </span>
            </div>

            {/* Gap between S and A */}
            <div
              style={{
                width: stage === 0 ? '4px' : '18px',
                transition: 'width 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {/* "A" + "round" */}
            <div className="flex items-baseline">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#91B9C5] drop-shadow-[0_2px_22px_rgba(145,185,197,0.4)]">
                A
              </span>
              <span
                className={`inline-block overflow-hidden whitespace-nowrap text-4xl sm:text-5xl md:text-6xl font-bold text-[#91B9C5] ${
                  stage >= 1
                    ? 'max-w-[200px] opacity-100 filter blur-0'
                    : 'max-w-0 opacity-0 filter blur-[8px]'
                }`}
                style={{
                  transition: 'max-width 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out, filter 0.6s ease-out',
                }}
              >
                round
              </span>
            </div>

            {/* Gap between A and Y */}
            <div
              style={{
                width: stage === 0 ? '4px' : '18px',
                transition: 'width 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {/* "Y" + "ou" */}
            <div
              className="flex items-baseline will-change-transform"
              style={{
                transform: stage === 0 ? 'translateX(-18px)' : 'translateX(0px)',
                transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#91B9C5] drop-shadow-[0_2px_22px_rgba(145,185,197,0.4)]">
                Y
              </span>
              <span
                className={`inline-block overflow-hidden whitespace-nowrap text-4xl sm:text-5xl md:text-6xl font-bold text-[#91B9C5] ${
                  stage >= 1
                    ? 'max-w-[130px] opacity-100 filter blur-0'
                    : 'max-w-0 opacity-0 filter blur-[8px]'
                }`}
                style={{
                  transition: 'max-width 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out, filter 0.6s ease-out',
                }}
              >
                ou
              </span>
            </div>

          </div>

          {/* Tagline: "SAY IT WITHOUT SAYING IT" */}
          <div
            className={`mt-4 sm:mt-5 transition-all duration-600 ease-out ${
              stage >= 1
                ? 'opacity-90 translate-y-0 filter blur-0'
                : 'opacity-0 translate-y-3 filter blur-[5px]'
            }`}
          >
            <span className="font-grotesk text-[10px] sm:text-xs font-semibold tracking-[0.26em] text-[#B39DDB] uppercase drop-shadow-[0_0_12px_rgba(179,157,219,0.5)]">
              SAY IT WITHOUT SAYING IT
            </span>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STAGE 2: EXPANSIVE GALAXY PARTICLE SUPERNOVA ([2.9s - 4.4s]) */}
      {/* ========================================================================= */}
      {stage >= 2 && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full block pointer-events-none will-change-transform"
        />
      )}
    </div>
  );
}

