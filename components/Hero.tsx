"use client";

import { motion } from "framer-motion";

const particles = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 29) % 97}%`,
  top: `${12 + ((index * 47) % 76)}%`,
  delay: `${(index % 7) * 0.42}s`,
  size: `${2 + (index % 3)}px`,
}));

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-field" aria-hidden="true">
        {particles.map((particle, index) => (
          <span key={index} style={{ left: particle.left, top: particle.top, animationDelay: particle.delay, width: particle.size, height: particle.size }} />
        ))}
      </div>
      <div className="hero-grid" aria-hidden="true" />
      <motion.div
        className="hero-content section-shell"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="status-pill"><span /> POST-COVID RECOVERY · PILOT EXPERIENCE</p>
        <h1 id="hero-title">
          <span>THE WORLD REOPENED.</span>
          <em>DID LIFE RECOVER?</em>
        </h1>
        <p className="hero-subtitle">A visual story of how the world lived, thrived, and reconnected after COVID.</p>
        <p className="hero-context">Using 2019 as the pre-pandemic baseline, we examine whether countries recovered economically, physically, digitally, and emotionally.</p>
        <a className="scroll-cue" href="#timeline"><span>Scroll to examine the world’s vital signs</span><b aria-hidden="true">↓</b></a>
      </motion.div>
      <div className="hero-index" aria-hidden="true">2019 <span>→</span> LATEST</div>
    </section>
  );
}
