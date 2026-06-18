import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './CTA.css';

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const sectionRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const buttonsRef = useRef(null);
  const narrativeRef = useRef(null);

  useEffect(() => {
    const narrative = narrativeRef.current;
    if (!narrative) return;

    // ── Performance Optimization: quickTo ──
    // quickTo is much faster for high-frequency updates like mousemove
    const xTo = gsap.quickTo(narrative, 'rotateY', { duration: 0.6, ease: 'power2.out' });
    const yTo = gsap.quickTo(narrative, 'rotateX', { duration: 0.6, ease: 'power2.out' });

    let rect = narrative.getBoundingClientRect();
    let absLeft = rect.left + window.scrollX;
    let absTop = rect.top + window.scrollY;

    // Update dimensions ONLY on resize. Removing scroll listener prevents layout thrashing.
    const updateRect = () => { 
      const r = narrative.getBoundingClientRect();
      absLeft = r.left + window.scrollX;
      absTop = r.top + window.scrollY;
      rect = r;
    };
    window.addEventListener('resize', updateRect);

    const handleMouseMove = (e) => {
      const { pageX, pageY } = e;
      const x = (pageX - (absLeft + rect.width / 2)) / 30;
      const y = (pageY - (absTop + rect.height / 2)) / 30;

      xTo(x);
      yTo(-y);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    narrative.addEventListener('mousemove', handleMouseMove);
    narrative.addEventListener('mouseleave', handleMouseLeave);

    // ── Intersection Animation ──
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 75%',
      onEnter: () => {
        const tl = gsap.timeline();

        tl.add(() => {
            line1Ref.current.classList.add('is-visible');
            line2Ref.current.classList.add('is-visible');
            narrative.classList.add('is-visible');
          })
          .fromTo(line3Ref.current,
            { opacity: 0, scale: 0.95 },
            { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out' },
            '-=0.4'
          )
          .fromTo(buttonsRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.7)' },
            '<'
          );
      }
    });

    return () => {
      narrative.removeEventListener('mousemove', handleMouseMove);
      narrative.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', updateRect);
      st.kill();
    };
  }, []);

  return (
    <section className="cta" id="contact" ref={sectionRef}>

      <div className="cta-bg">
        <div className="cta-bg-zone cta-bg-zone--1" />
        <div className="cta-bg-zone cta-bg-zone--2" />
        <div className="cta-bg-zone cta-bg-zone--3" />
      </div>
      <div className="cta-grid" />

      <div className="cta-content">

        {/* ── Narrative statement ── */}
        <div className="cta-narrative" ref={narrativeRef}>
          <p className="cta-line cta-line--premise" ref={line1Ref}>
            If your business depends on people…
          </p>
          <p className="cta-line cta-line--premise" ref={line2Ref}>
            it will always stay limited.
          </p>
          <div className="cta-narrative-sep" />
          <p className="cta-line cta-line--resolution" ref={line3Ref}>
            Build systems. Scale faster. Stay in control.
          </p>
        </div>

        {/* Buttons */}
        <div className="cta-buttons" ref={buttonsRef}>
          <a
            href="https://wa.me/918871527519?text=Hi%20Botivate%2C%20I%27d%20like%20to%20book%20a%20free%20demo."
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3v5l3 3"
                stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Book Free Demo
          </a>
          <a
            href="https://wa.me/918871527519"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z"
                stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Talk to Expert
          </a>
        </div>

      </div>
    </section>
  );
}
