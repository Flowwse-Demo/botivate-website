import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './AboutUs.css';
import './AboutTeaser.css';

const stats = [
  { stat: '40+',   label: 'Team Members',       desc: 'A growing team united by one purpose' },
  { stat: '100+',  label: 'Businesses Automated', desc: 'Across manufacturing, trading, and services' },
  { stat: '3+',    label: 'Years On the Ground',  desc: 'Studying and solving real business problems' },
];

export default function AboutTeaser() {
  const sectionRef     = useRef(null);
  const headerRef      = useRef(null);
  const highlightsRef  = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
        }
      );

      const cards = highlightsRef.current?.querySelectorAll('.at-card');
      if (cards?.length) {
        gsap.fromTo(cards,
          { opacity: 0, y: 28 },
          {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out',
            scrollTrigger: { trigger: highlightsRef.current, start: 'top 82%', toggleActions: 'play none none none' },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="about-us about-us--teaser" id="about" ref={sectionRef}>
      <div className="about-inner">

        <div className="about-header at-header" ref={headerRef}>
          <h2 className="about-headline">
            Built on the Ground.<br />
            <span className="gradient-text">Powered by Systems.</span>
          </h2>
          <p className="about-lead">
            Botivate was born after years of watching real businesses break down, not from a boardroom, but from factory floors, warehouses, and operations teams. Everything we build solves a problem we have witnessed first-hand.
          </p>
        </div>

        <div className="at-highlights" ref={highlightsRef}>
          {stats.map((s) => (
            <div key={s.label} className="at-card">
              <div className="at-stat">{s.stat}</div>
              <div className="at-label">{s.label}</div>
              <p className="at-desc">{s.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
