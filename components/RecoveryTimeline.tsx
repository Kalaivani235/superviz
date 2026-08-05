import SectionHeading from "./SectionHeading";

const tracks = [
  { name: "LIVE", color: "var(--recovery-cyan)", offset: "-36px" },
  { name: "THRIVE", color: "var(--prosperity-gold)", offset: "-12px" },
  { name: "CONNECT", color: "var(--connection-blue)", offset: "12px" },
  { name: "FEEL", color: "var(--wellbeing-lavender)", offset: "36px" },
];

export default function RecoveryTimeline() {
  return (
    <section id="timeline" className="timeline section-shell" aria-labelledby="timeline-heading">
      <SectionHeading eyebrow="01 · The rupture" title="The pandemic was global. The recovery was not." align="center" />
      <div className="year-row" aria-label="Timeline from 2019 to latest available year">
        <strong>2019</strong><span>2020</span><span>2021</span><span>2022</span><strong>LATEST</strong>
      </div>
      <div className="timeline-visual" role="img" aria-label="A single 2019 baseline separates into four recovery tracks: live, thrive, connect and feel.">
        <div className="timeline-baseline"><span>PRE-COVID BASELINE</span></div>
        {tracks.map((track) => (
          <div className="timeline-track" key={track.name} style={{ "--track-color": track.color, "--track-offset": track.offset } as React.CSSProperties}>
            <i /><b>{track.name}</b>
          </div>
        ))}
      </div>
      <p className="timeline-note">One shared starting point. Four signals moving at different speeds.</p>
    </section>
  );
}
