import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Founder.css';

gsap.registerPlugin(ScrollTrigger);

export default function Founder() {
  const sectionRef = useRef(null);
  const cardRef    = useRef(null);
  const quoteRef   = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
      tl.fromTo(cardRef.current,
        { opacity: 0, y: 48 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      )
      .fromTo(quoteRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        '-=0.4'
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="founder" id="founder" ref={sectionRef}>
      <div className="founder-inner">

        {/* ── Editorial card ── */}
        <div className="founder-card" ref={cardRef}>

          {/* ── Main body ── */}
          <div className="founder-body">

            {/* Left — identity */}
            <div className="founder-identity">
              <div className="founder-avatar-ring">
                <div className="founder-avatar">ST</div>
              </div>
              <div className="founder-name-block">
                <span className="founder-name">Satyendra Tandan</span>
                <span className="founder-role">Founder & CEO, Botivate</span>
              </div>
              <p className="founder-bio">
                Built by someone who understands real business struggles, not just technology.
              </p>

              {/* Signature line */}
              <div className="founder-sig">
                <svg viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 28 C20 8, 36 32, 52 18 S80 4, 96 20 S112 32, 116 24"
                    stroke="rgba(0,0,0,0.2)" strokeWidth="1.5"
                    strokeLinecap="round" fill="none" />
                </svg>
              </div>
            </div>

            {/* Right — quote */}
            <div className="founder-quote-wrap" ref={quoteRef}>
              <blockquote className="founder-quote">
                "Automation is not about tools. It's about building a system that works
                even when you're not there."
              </blockquote>
              <p className="founder-quote-caption">
                The philosophy behind every system we build at Botivate.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
