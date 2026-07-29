import React, { useState, useRef, useEffect, useCallback } from "react";
import * as Tone from "tone";
import { Play, Pause, Lock, CheckCircle2, XCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// T.H.E. — "Which One's On The Standard" A/B comparator + lead capture
// Design: analog console aesthetic. Ink-navy body, brass/amber signal accent,
// cold cyan for the "raw" state. Condensed slab display type for the
// equipment-label feel, mono for readouts.
// ---------------------------------------------------------------------------

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');

  .the-root {
    --ink: #0E1013;
    --ink-2: #171A1F;
    --panel: #1C2027;
    --brass: #C99A4B;
    --brass-dim: #7A6234;
    --cyan: #8FD9DE;
    --off: #EDE8DE;
    --off-dim: #9A9690;
    --red: #C15B4A;
    font-family: 'Inter', sans-serif;
    background: var(--ink);
    color: var(--off);
    min-height: 100vh;
    padding: 32px 16px 64px;
    box-sizing: border-box;
  }
  .the-root * { box-sizing: border-box; }
  .the-wrap { max-width: 560px; margin: 0 auto; }

  .the-eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--brass);
    margin: 0 0 6px;
  }
  .the-h1 {
    font-family: 'Oswald', sans-serif;
    font-weight: 600;
    font-size: 28px;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    margin: 0 0 10px;
    line-height: 1.15;
  }
  .the-sub {
    font-size: 14.5px;
    color: var(--off-dim);
    line-height: 1.5;
    margin: 0 0 28px;
    max-width: 46ch;
  }

  .the-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  @media (max-width: 460px) { .the-panels { grid-template-columns: 1fr; } }

  .the-panel {
    background: var(--panel);
    border: 1px solid #2A2F38;
    border-radius: 3px;
    padding: 18px 16px;
    position: relative;
  }
  .the-panel.is-active { border-color: var(--brass-dim); }
  .the-panel-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: var(--off-dim);
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
  }
  .the-playbtn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: transparent;
    border: 1px solid #363c47;
    color: var(--off);
    padding: 10px 0;
    border-radius: 2px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }
  .the-playbtn:hover { border-color: var(--brass); color: var(--brass); }
  .the-playbtn.is-playing { border-color: var(--brass); color: var(--brass); }

  .the-meter { display: flex; gap: 3px; align-items: flex-end; height: 22px; margin-top: 12px; }
  .the-meter-bar {
    flex: 1;
    background: #2A2F38;
    border-radius: 1px;
    transition: height 0.09s linear, background 0.09s linear;
  }

  .the-guess-row { display: flex; gap: 10px; margin-bottom: 22px; }
  .the-guess-btn {
    flex: 1;
    background: var(--brass);
    color: var(--ink);
    border: none;
    padding: 13px 0;
    font-family: 'Oswald', sans-serif;
    font-size: 14px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 500;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity 0.15s ease, transform 0.1s ease;
  }
  .the-guess-btn:hover { opacity: 0.88; }
  .the-guess-btn:active { transform: scale(0.98); }
  .the-guess-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .the-gauge-wrap { display: flex; flex-direction: column; align-items: center; margin: 8px 0 24px; }
  .the-gauge-caption {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.1em;
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .the-gauge-caption.correct { color: var(--brass); }
  .the-gauge-caption.wrong { color: var(--red); }

  .the-card {
    background: var(--panel);
    border: 1px solid #2A2F38;
    border-radius: 3px;
    padding: 22px 20px;
  }
  .the-card h3 {
    font-family: 'Oswald', sans-serif;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin: 0 0 8px;
    font-weight: 500;
  }
  .the-card p { font-size: 13.5px; color: var(--off-dim); line-height: 1.5; margin: 0 0 16px; }

  .the-form { display: flex; gap: 8px; }
  @media (max-width: 460px) { .the-form { flex-direction: column; } }
  .the-input {
    flex: 1;
    background: var(--ink-2);
    border: 1px solid #363c47;
    color: var(--off);
    padding: 11px 12px;
    border-radius: 2px;
    font-family: 'Inter', sans-serif;
    font-size: 13.5px;
    outline: none;
  }
  .the-input:focus { border-color: var(--brass); }
  .the-submit {
    background: var(--brass);
    color: var(--ink);
    border: none;
    padding: 11px 18px;
    font-family: 'Oswald', sans-serif;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 2px;
    cursor: pointer;
    white-space: nowrap;
  }
  .the-submit:hover { opacity: 0.9; }
  .the-error { font-size: 12px; color: var(--red); margin-top: 8px; font-family: 'IBM Plex Mono', monospace; }

  .the-breakdown-list { list-style: none; padding: 0; margin: 0 0 18px; }
  .the-breakdown-list li {
    font-size: 13.5px;
    color: var(--off);
    padding: 10px 0;
    border-bottom: 1px solid #262b33;
    display: flex;
    gap: 10px;
  }
  .the-breakdown-list li:last-child { border-bottom: none; }
  .the-breakdown-list li .tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    color: var(--brass);
    letter-spacing: 0.06em;
    flex-shrink: 0;
    padding-top: 1px;
  }

  .the-cta {
    display: block;
    width: 100%;
    text-align: center;
    background: transparent;
    border: 1px solid var(--brass);
    color: var(--brass);
    padding: 13px 0;
    font-family: 'Oswald', sans-serif;
    font-size: 13.5px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-radius: 2px;
    cursor: pointer;
    text-decoration: none;
  }
  .the-cta:hover { background: var(--brass); color: var(--ink); }

  .the-footer {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    color: #4A4F58;
    letter-spacing: 0.08em;
    text-align: center;
    margin-top: 36px;
  }

  .the-hint {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #4A4F58;
    text-align: center;
    margin-top: 10px;
  }
`;

const BAR_COUNT = 14;

export default function MixComparator() {
  const [audioReady, setAudioReady] = useState(false);
  const [playing, setPlaying] = useState(null); // 'A' | 'B' | null
  const [guess, setGuess] = useState(null); // 'A' | 'B' | null
  const [mixedKey] = useState(() => (Math.random() < 0.5 ? "A" : "B"));
  const [bars, setBars] = useState(Array(BAR_COUNT).fill(0));
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  const toneState = useRef(null);
  const meterRef = useRef(null);
  const rafRef = useRef(null);

  const correct = guess !== null && guess === mixedKey;

  // Build the synthesized A/B loop once, on first interaction.
  const buildAudio = useCallback(async () => {
    if (toneState.current) return toneState.current;
    await Tone.start();
    Tone.Transport.bpm.value = 96;

    const channelRaw = new Tone.Channel({ volume: -Infinity }).toDestination();
    const channelMixed = new Tone.Channel({ volume: -Infinity }).toDestination();

    const meter = new Tone.Meter({ smoothing: 0.6 });
    Tone.Destination.connect(meter);
    meterRef.current = meter;

    // Raw chain: thin, a harsh 3.5k bump, no glue.
    const harsh = new Tone.Filter({ type: "peaking", frequency: 3500, Q: 1.2, gain: 7 });
    const thin = new Tone.Filter({ type: "highpass", frequency: 160 });
    harsh.chain(thin, channelRaw);

    // Mixed chain: shaped low end, compressor glue, short reverb, limiter.
    const eq = new Tone.EQ3({ low: 2.5, mid: 0, high: 1.5 });
    const comp = new Tone.Compressor({ threshold: -20, ratio: 4, attack: 0.004, release: 0.22 });
    const verb = new Tone.Reverb({ decay: 1.1, wet: 0.14 });
    const limiter = new Tone.Limiter(-1);
    eq.chain(comp, verb, limiter, channelMixed);
    await verb.generate();

    const kickRaw = new Tone.MembraneSynth({ octaves: 4, envelope: { attack: 0.001, decay: 0.35, sustain: 0 } }).connect(harsh);
    const kickMixed = new Tone.MembraneSynth({ octaves: 4, envelope: { attack: 0.001, decay: 0.35, sustain: 0 } }).connect(eq);
    const hatRaw = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -14 }).connect(harsh);
    const hatMixed = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 }, volume: -18 }).connect(eq);
    const bassRaw = new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.2 }, volume: -8 }).connect(harsh);
    const bassMixed = new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.2 }, volume: -10 }).connect(eq);

    const kickSteps = [0, 4];
    const bassNotes = ["C2", "C2", "Eb2", "C2", "F2", "F2", "Eb2", "G2"];

    new Tone.Sequence((time, step) => {
      if (kickSteps.includes(step)) {
        kickRaw.triggerAttackRelease("C1", "8n", time);
        kickMixed.triggerAttackRelease("C1", "8n", time);
      }
      hatRaw.triggerAttackRelease("16n", time);
      hatMixed.triggerAttackRelease("16n", time);
      bassRaw.triggerAttackRelease(bassNotes[step], "8n", time);
      bassMixed.triggerAttackRelease(bassNotes[step], "8n", time);
    }, [0, 1, 2, 3, 4, 5, 6, 7], "8n").start(0);

    toneState.current = { channelRaw, channelMixed };
    setAudioReady(true);
    return toneState.current;
  }, []);

  const stopMeterLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const runMeterLoop = useCallback(() => {
    const tick = () => {
      const level = meterRef.current ? meterRef.current.getValue() : -Infinity;
      const norm = Math.max(0, Math.min(1, (level + 50) / 50));
      setBars((prev) =>
        prev.map((_, i) => {
          const jitter = Math.random() * 0.25;
          return Math.max(3, Math.round((norm + jitter) * 22));
        })
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const handlePlay = async (key) => {
    const { channelRaw, channelMixed } = await buildAudio();
    if (Tone.Transport.state !== "started") Tone.Transport.start();

    if (playing === key) {
      // Toggle off — mute both, stop meter.
      channelRaw.volume.rampTo(-Infinity, 0.05);
      channelMixed.volume.rampTo(-Infinity, 0.05);
      setPlaying(null);
      stopMeterLoop();
      setBars(Array(BAR_COUNT).fill(0));
      return;
    }

    const isKeyMixed = key === mixedKey;
    channelMixed.volume.rampTo(isKeyMixed ? 0 : -Infinity, 0.05);
    channelRaw.volume.rampTo(isKeyMixed ? -Infinity : 0, 0.05);
    setPlaying(key);
    stopMeterLoop();
    runMeterLoop();
  };

  useEffect(() => {
    return () => {
      stopMeterLoop();
      if (toneState.current) {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
    };
  }, []);

  const handleGuess = (key) => {
    if (guess) return;
    setGuess(key);
  };

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailErr("Enter a real email — that's where the breakdown goes.");
      return;
    }
    
  };
setEmailErr("");
    setSaving(true);
    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbwP5BDQuspkCTamr4mYBw5sclaClZgn01Xm4UMQKn0qZGztgtbh6Koloai5i0lvN7ix/exec",
        {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({
            email,
            guessedKey: guess,
            correct,
            timestamp: new Date().toISOString(),
            source: "compare.thehouseentertainmentrecords.com",
          }),
        }
      );
    } catch (err) {
      console.error("Webhook error:", err);
    }
    setSaving(false);
    setUnlocked(true);
  const breakdown = [
    { tag: "LOW END", text: "The standard version has controlled, shaped low end — nothing fighting the kick and bass for space." },
    { tag: "GLUE", text: "Compression ties every hit together into one performance instead of separate loud/quiet moments." },
    { tag: "TONE", text: "The harsh upper-mid buildup on the raw version is tamed — that's what reads as 'thin' or 'fatiguing' on repeat listens." },
    { tag: "SPACE", text: "A short, controlled reverb gives the mixed version depth without washing out the transients." },
  ];

  return (
    <div className="the-root">
      <style>{STYLES}</style>
      <div className="the-wrap">
        <p className="the-eyebrow">T.H.E. — a standard not a genre</p>
        <h1 className="the-h1">Which one's on the standard?</h1>
        <p className="the-sub">
          Same performance, two versions. Press play on each, then guess which one's been
          through the standard. Most people get it wrong the first time.
        </p>

        <div className="the-panels">
          {["A", "B"].map((key) => (
            <div key={key} className={`the-panel ${playing === key ? "is-active" : ""}`}>
              <div className="the-panel-label">
                <span>VERSION {key}</span>
                <span>{playing === key ? "PLAYING" : "—"}</span>
              </div>
              <button
                className={`the-playbtn ${playing === key ? "is-playing" : ""}`}
                onClick={() => handlePlay(key)}
              >
                {playing === key ? <Pause size={14} /> : <Play size={14} />}
                {playing === key ? "STOP" : "PLAY"}
              </button>
              <div className="the-meter">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="the-meter-bar"
                    style={{
                      height: `${playing === key ? h : 3}px`,
                      background: playing === key ? "var(--brass)" : "#2A2F38",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {!guess ? (
          <>
            <div className="the-guess-row">
              <button className="the-guess-btn" onClick={() => handleGuess("A")} disabled={!audioReady}>
                It's A
              </button>
              <button className="the-guess-btn" onClick={() => handleGuess("B")} disabled={!audioReady}>
                It's B
              </button>
            </div>
            {!audioReady && <p className="the-hint">Press play on either version to load the comparison.</p>}
          </>
        ) : (
          <>
            <div className="the-gauge-wrap">
              <Gauge correct={correct} />
              <div className={`the-gauge-caption ${correct ? "correct" : "wrong"}`}>
                {correct ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {correct ? "You caught it." : `That was version ${mixedKey}.`}
              </div>
            </div>

            {!unlocked ? (
              <div className="the-card">
                <h3><Lock size={13} style={{ marginRight: 6, verticalAlign: -1 }} />Unlock the full breakdown</h3>
                <p>
                  See exactly what separates the two versions — the four decisions that
                  make one of them the standard. Sent nowhere else, no spam.
                </p>
                <form className="the-form" onSubmit={handleSubmitEmail}>
                  <input
                    className="the-input"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="the-submit" type="submit" disabled={saving}>
                    {saving ? "..." : "Unlock"}
                  </button>
                </form>
                {emailErr && <p className="the-error">{emailErr}</p>}
              </div>
            ) : (
              <div className="the-card">
                <h3>What actually separates them</h3>
                <ul className="the-breakdown-list">
                  {breakdown.map((b) => (
                    <li key={b.tag}>
                      <span className="tag">{b.tag}</span>
                      <span>{b.text}</span>
                    </li>
                  ))}
                </ul>
                <a className="the-cta" href="#" onClick={(e) => e.preventDefault()}>
                  Get your track evaluated
                </a>
              </div>
            )}
          </>
        )}

        <p className="the-footer">THE HOUSE ENTERTAINMENT · LATHAPRODUCER</p>
      </div>
    </div>
  );
}

function Gauge({ correct }) {
  const angle = correct ? 55 : -55; // swing right (brass zone) or left (red zone)
  return (
    <svg width="140" height="82" viewBox="0 0 140 82">
      <path d="M 10 76 A 60 60 0 0 1 130 76" fill="none" stroke="#2A2F38" strokeWidth="8" />
      <path d="M 10 76 A 60 60 0 0 1 60 17" fill="none" stroke="#5A2E26" strokeWidth="8" />
      <path d="M 80 17 A 60 60 0 0 1 130 76" fill="none" stroke="#5C4520" strokeWidth="8" />
      <g style={{ transition: "transform 0.6s cubic-bezier(.2,1.5,.4,1)", transform: `rotate(${angle}deg)`, transformOrigin: "70px 76px" }}>
        <line x1="70" y1="76" x2="70" y2="24" stroke={correct ? "#C99A4B" : "#C15B4A"} strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="70" cy="76" r="5" fill="#EDE8DE" />
    </svg>
  );
}
