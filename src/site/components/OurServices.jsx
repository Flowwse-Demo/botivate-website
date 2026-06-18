import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FiZap, FiGrid, FiCpu, FiBarChart2,
  FiCode, FiUsers, FiCompass, FiRefreshCw, FiChevronDown,
} from 'react-icons/fi';
import img01 from '../assets/assets/01-business-automation.png';
import img02 from '../assets/assets/02-os-implementation.png';
import img03 from '../assets/assets/03-ai-agents.png';
import img04 from '../assets/assets/04-reporting.png';
import img05 from '../assets/assets/05-custom-development.png';
import img06 from '../assets/assets/06-team-deployment.png';
import img07 from '../assets/assets/07-pilot-consulting.png';
import img08 from '../assets/assets/08-continuous-support.png';
import './OurServices.css';

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  {
    num: '01', icon: FiZap, color: '#3b82f6', img: img01,
    title: 'Business Automation Solutions',
    tagline: 'Transform manual operations into intelligent workflows',
    desc: 'Most businesses run on a mix of WhatsApp messages, Excel sheets, phone calls, and memory. We replace that with structured, automated workflows so work moves forward on its own, nothing gets missed, and management always knows what is happening.',
    col1Head: 'What We Automate',
    col1: ['Workflow design & automation', 'Process mapping & optimization', 'Approval & escalation systems', 'Task automation & delegation'],
    col2Head: 'What You Get',
    col2: ['Department integration', 'Cross-department workflow setup', 'Business process standardization', 'Digital process transformation'],
  },
  {
    num: '02', icon: FiGrid, color: '#6366f1', img: img02,
    title: 'Botivate OS Implementation',
    tagline: 'Run your entire business from one operating system',
    desc: 'Botivate OS connects your complete business into one centralized platform where every department, every team member, and every manager works with full visibility and control. No more switching between tools. No more information silos. One system. Everything connected.',
    col1Head: 'Modules Covered',
    col1: ['Sales & CRM', 'Purchase Management', 'Inventory Management', 'Production Management', 'HRMS & Attendance'],
    col2Head: 'Also Includes',
    col2: ['Task Management', 'Maintenance Management', 'Finance & Approvals', 'MIS & Reporting', 'AI Agent Integration', 'Custom Workflow Builder'],
  },
  {
    num: '03', icon: FiCpu, color: '#8b5cf6', img: img03,
    title: 'AI-Powered Business Agents',
    tagline: 'Intelligent agents built around your specific workflows',
    desc: 'Every AI agent we build is designed around your actual workflows, departments, and requirements. These agents work 24x7, handle repetitive tasks, and keep your operations moving without constant human intervention.',
    col1Head: 'Agent Capabilities',
    col1: ['Automate repetitive work', 'Real-time intelligence', 'WhatsApp & communication', 'Cross-department actions'],
    col2Head: 'Built For Every Function',
    col2: ['Sales & Follow-up', 'Customer Support', 'Inventory & Production', 'HR & Finance', 'Maintenance & Logistics', 'Compliance & Operations'],
  },
  {
    num: '04', icon: FiBarChart2, color: '#10b981', img: img04,
    title: 'MIS & Business Reporting',
    tagline: 'Reports that actually help you make decisions',
    desc: 'Most businesses have data but cannot use it. We build dashboards and reporting systems that give management complete visibility: where work is stuck, which teams are performing, and what decisions need to be made right now.',
    col1Head: 'Visibility Tools',
    col1: ['Real-time dashboards', 'KPI & KRA tracking', 'Department reporting', 'Delay & bottleneck tracking'],
    col2Head: 'Performance Insights',
    col2: ['Employee performance scoring', 'Productivity analysis', 'Financial summaries', 'Daily, weekly & monthly MIS'],
  },
  {
    num: '05', icon: FiCode, color: '#f59e0b', img: img05,
    title: 'Custom System Development',
    tagline: 'Systems designed around your operations, not the other way around',
    desc: 'Instead of forcing your business into ready-made software, we build systems that match exactly how your business works. From CRM to complaint management, from asset tracking to enterprise applications, built your way, from the ground up.',
    col1Head: 'What We Build',
    col1: ['CRM Systems', 'Lead Management', 'Task & Delegation Systems', 'Inventory Systems', 'Fixed Asset Management', 'Payment Management'],
    col2Head: 'Also Covers',
    col2: ['Complaint Management', 'Service Management', 'Maintenance Systems', 'HRMS Solutions', 'Workflow Systems', 'Custom Enterprise Applications'],
  },
  {
    num: '06', icon: FiUsers, color: '#ec4899', img: img06,
    title: 'Dedicated Team Deployment',
    tagline: 'Your extended technology team, fully focused on your growth',
    desc: 'For businesses with large-scale requirements, continuous development needs, or long-term digital transformation goals, we provide a dedicated team that works as an extension of your organization.',
    col1Head: 'Team Can Include',
    col1: ['Backend & Frontend Developers', 'AI Engineers', 'System Architects', 'Business Analysts', 'UI/UX Designers', 'QA & Testing Team'],
    col2Head: 'Ideal For',
    col2: ['Enterprise digital transformation', 'Large-scale implementation', 'Multi-department automation', 'Long-term development needs', 'Custom OS implementation', 'Continuous technology support'],
  },
  {
    num: '07', icon: FiCompass, color: '#14b8a6', img: img07,
    title: 'Pilot Projects & Process Consulting',
    tagline: 'Understand the problem before scaling the solution',
    desc: 'Before building anything large, we work with businesses through pilot implementations and process studies. We map your current operations, identify where things break down, and build targeted solutions so you invest in what actually solves the problem.',
    col1Head: 'Process Work',
    col1: ['Business process study', 'Gap analysis', 'Problem identification', 'Workflow optimization'],
    col2Head: 'Outcome',
    col2: ['Pilot implementation', 'Technology recommendations', 'Process improvement plan', 'Clear roadmap for scaling'],
  },
  {
    num: '08', icon: FiRefreshCw, color: '#f97316', img: img08,
    title: 'Continuous Support & System Growth',
    tagline: "We don't deliver and disappear",
    desc: 'Technology that stops improving becomes a burden. We stay connected with your business, continuously improving systems as your operations grow, evolve, and change. Your system should get better over time, not just stay the same.',
    col1Head: 'What Continues',
    col1: ['Continuous system improvements', 'Technical support', 'Performance monitoring', 'Process optimization'],
    col2Head: 'What This Includes',
    col2: ['Feature enhancements', 'User training', 'Regular review meetings'],
  },
];

const WHY = [
  { title: 'Centralized Operations',   desc: 'Every department, one platform' },
  { title: 'AI-Powered Automation',    desc: 'Intelligent systems that work 24x7' },
  { title: 'Lightning-Fast Systems',   desc: 'Built for speed, not just features' },
  { title: 'Mobile-First Platforms',   desc: 'Works on any device, anywhere' },
  { title: 'Real-Time Visibility',     desc: 'No guesswork. Just clarity.' },
  { title: 'Custom Workflows',         desc: 'Built around how you actually work' },
  { title: 'Dedicated Team Support',   desc: 'People behind every system' },
  { title: 'Ground-Level Experience',  desc: 'Built from real on-ground learning' },
];

const INDUSTRIES = [
  'Manufacturing', 'Retail', 'Trading', 'Services',
  'Construction', 'Healthcare', 'Real Estate', 'Logistics', 'MSMEs', 'Enterprises',
];

export default function OurServices() {
  const sectionRef   = useRef(null);
  const headerRef    = useRef(null);
  const accordionRef = useRef(null);
  const whyRef       = useRef(null);
  const indRef       = useRef(null);
  const ctaRef       = useRef(null);
  const scrollTriggerRef = useRef(null);
  const openIdRef = useRef('01');
  const [openId, setOpenId] = useState('01');
  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    openIdRef.current = openId;
  }, [openId]);

  const handleTabClick = (num) => {
    setOpenId(num);
    const st = scrollTriggerRef.current;
    if (st) {
      const index = SERVICES.findIndex(s => s.num === num);
      if (index !== -1) {
        const progress = index / (SERVICES.length - 1);
        const targetScroll = st.start + progress * (st.end - st.start);
        
        isManualScrollingRef.current = true;
        clearTimeout(scrollTimeoutRef.current);

        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });

        scrollTimeoutRef.current = setTimeout(() => {
          isManualScrollingRef.current = false;
        }, 650);
      }
    }
  };

  useEffect(() => {
    // Reset scroll position to top immediately on mount to prevent stale scroll state
    window.scrollTo(0, 0);
    const prevScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 48 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: headerRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
      );

      gsap.fromTo(accordionRef.current,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: accordionRef.current, start: 'top 78%', toggleActions: 'play none none none' } }
      );

      // Scroll-driven tab stepping — desktop only
      if (window.matchMedia('(min-width: 960px)').matches) {
        const tabCount = SERVICES.length;

        scrollTriggerRef.current = ScrollTrigger.create({
          trigger: accordionRef.current,
          start: 'top top+=76',
          end: `+=${(tabCount - 1) * Math.round(window.innerHeight * 0.7)}`,
          pin: true,
          pinSpacing: true,
          onUpdate: (self) => {
            if (isManualScrollingRef.current) return;

            const index = Math.max(
              0,
              Math.min(
                Math.floor(self.progress * tabCount),
                tabCount - 1
              )
            );
            const targetNum = SERVICES[index].num;
            if (openIdRef.current !== targetNum) {
              setOpenId(targetNum);
            }
          },
        });
      }

      const whyCards = whyRef.current?.querySelectorAll('.why-card');
      if (whyCards?.length) {
        gsap.fromTo(whyCards,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out',
            scrollTrigger: { trigger: whyRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
        );
      }

      gsap.fromTo(indRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: indRef.current, start: 'top 82%', toggleActions: 'play none none none' } }
      );

      gsap.fromTo(ctaRef.current,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: ctaRef.current, start: 'top 80%', toggleActions: 'play none none none' } }
      );
    }, sectionRef);

    // Wait for the Framer Motion page transition (400ms) to settle before refreshing triggers
    const t = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 450);

    return () => {
      ctx.revert();
      scrollTriggerRef.current = null;
      window.history.scrollRestoration = prevScrollRestoration;
      clearTimeout(t);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <section className="svc-section" id="services" ref={sectionRef}>
      <div className="svc-beams-bg" />
      <div className="svc-inner">

        {/* ── Header ── */}
        <div className="svc-header" ref={headerRef}>
          <span className="svc-label-pill">Services</span>
          <h2 className="svc-headline">
            Intelligent Solutions Built<br />
            <span className="svc-headline-grad">Around Your Business</span>
          </h2>
          <p className="svc-lead">
            We don&apos;t believe businesses should adjust themselves to software. We believe technology
            should adjust itself to the business. We understand your operations, identify real challenges,
            map workflows, and build systems that simplify processes, improve visibility, and help
            businesses grow through automation and AI.
          </p>
        </div>

        {/* ── Tab + Side Panel ── */}
        <div className="svc-tabpanel" ref={accordionRef}>

          {/* Left: tab list */}
          <div className="svc-tablist">
            {SERVICES.map((s) => {
              const isActive = openId === s.num;
              return (
                <button
                  key={s.num}
                  className={`svc-tab${isActive ? ' svc-tab--active' : ''}`}
                  onClick={() => handleTabClick(s.num)}
                  style={{ '--svc-color': s.color }}
                >
                  <span className="svc-tab-icon">
                    <img src={s.img} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                  </span>
                  <span className="svc-tab-title">{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Right: content panel */}
          {SERVICES.filter(s => s.num === openId).map(s => {
            return (
              <div className="svc-panel" key={s.num}>
                <div className="svc-panel-top">
                  <div className="svc-panel-header">
                    <span className="svc-panel-icon" style={{ '--svc-color': s.color }}>
                      <img src={s.img} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </span>
                    <div>
                      <h3 className="svc-panel-title">{s.title}</h3>
                      <p className="svc-panel-tagline">{s.tagline}</p>
                    </div>
                  </div>
                </div>
                <p className="svc-panel-desc">{s.desc}</p>
                <div className="svc-panel-lists">
                  <div className="svc-panel-col">
                    <div className="svc-panel-col-head">{s.col1Head}</div>
                    {s.col1.map((item, i) => (
                      <div className="svc-panel-item" key={i}>
                        <span className="svc-panel-check" style={{ '--svc-color': s.color }} />
                        {item}
                      </div>
                    ))}
                  </div>
                  {s.col2 && (
                    <div className="svc-panel-col">
                      <div className="svc-panel-col-head">{s.col2Head}</div>
                      {s.col2.map((item, i) => (
                        <div className="svc-panel-item" key={i}>
                          <span className="svc-panel-check" style={{ '--svc-color': s.color }} />
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>

        {/* ── Industries ── */}
        <div className="svc-industries" ref={indRef}>
          <span className="section-label">Industries We Serve</span>
          <div className="svc-industries-list">
            {INDUSTRIES.map((ind) => (
              <span className="svc-industry-tag" key={ind}>{ind}</span>
            ))}
          </div>
        </div>

        {/* ── Why Botivate ── */}
        <div className="svc-why" ref={whyRef}>
          <div className="svc-why-header">
            <span className="section-label">Why Businesses Choose Botivate</span>
            <h3 className="svc-why-headline">
              Every solution we build starts with <span className="svc-accent-text">your reality, not a template.</span>
            </h3>
          </div>
          <div className="why-grid">
            {WHY.map((w, i) => (
              <div className="why-card" key={i}>
                <div className="why-card-num">0{i + 1}</div>
                <div className="why-card-title">{w.title}</div>
                <div className="why-card-desc">{w.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="svc-bottom-cta" ref={ctaRef}>
          <div className="svc-cta-glow-a" />
          <div className="svc-cta-glow-b" />
          <div className="svc-cta-content">
            <h3 className="svc-cta-headline">
              Ready to transform your operations?
            </h3>
            <p className="svc-cta-sub">
              Book a free demo and see how Botivate OS can automate your entire business in just one day.
            </p>
            <div className="svc-cta-buttons">
              <a href="/#contact" className="btn btn-primary btn-lg">Book Free Demo</a>
              <a href="/#contact" className="btn btn-secondary btn-lg">Talk To Our Team</a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
