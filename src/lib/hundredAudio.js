const TEAM_ROOT_SEMITONES = {
  bph: 0,  // C
  lsp: 2,  // D
  mor: 4,  // E
  nsc: 5,  // F
  oin: 7,  // G
  sbr: 9,  // A
  trt: -2, // Bb
  wfr: 3,  // Eb
};

const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Plays an intense, goosebumps-inducing ~4.2s stadium anthem celebration
 * using detuned supersaw brass, sub-bass impact drop, filtered stadium noise
 * crash, driving kick/snare pulse, and stereo echo/reverb space.
 */
export function playHundredCelebration(audioCtxRef, teamId = '') {
  if (typeof window === 'undefined') return () => {};
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  try {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const activeNodes = [];
    const offset = TEAM_ROOT_SEMITONES[String(teamId || '').toLowerCase()] ?? 0;
    const rootMidi = 60 + offset;
    const now = ctx.currentTime + 0.03;
    const beat = 0.21; // ~142 BPM stadium energy

    // Master bus: Compressor -> Master Gain -> Destination
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, now);
    compressor.knee.setValueAtTime(18, now);
    compressor.ratio.setValueAtTime(6, now);

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.42, now);
    compressor.connect(master);
    master.connect(ctx.destination);

    // Stadium echo/reverb bus (slap + tail delay through warm lowpass)
    const delay = ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.24, now);
    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.34, now);
    const wetFilter = ctx.createBiquadFilter();
    wetFilter.type = 'lowpass';
    wetFilter.frequency.setValueAtTime(1800, now);
    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.32, now);

    delay.connect(wetFilter);
    wetFilter.connect(feedback);
    feedback.connect(delay);
    wetFilter.connect(wetGain);
    wetGain.connect(compressor);

    const connectOut = (node) => {
      node.connect(compressor);
      node.connect(delay);
    };

    // 1. White-noise buffer for impact crash + stadium snare hits
    const noiseLen = Math.floor(ctx.sampleRate * 1.4);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const ch = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      ch[i] = Math.random() * 2 - 1;
    }

    const triggerNoise = (start, dur, filterType, freq, peak) => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const flt = ctx.createBiquadFilter();
      flt.type = filterType;
      flt.frequency.setValueAtTime(freq, start);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(peak, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      src.connect(flt);
      flt.connect(g);
      connectOut(g);
      src.start(start);
      src.stop(start + dur + 0.02);
      activeNodes.push(src);
    };

    // Helper: Detuned 3-oscillator supersaw brass + octave sub
    const triggerSupersaw = (start, midi, dur, peak = 0.22) => {
      const freq = midiToFreq(midi);
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.Q.setValueAtTime(2.2, start);
      flt.frequency.setValueAtTime(650, start);
      flt.frequency.exponentialRampToValueAtTime(3600, start + Math.min(0.14, dur * 0.4));
      flt.frequency.exponentialRampToValueAtTime(1400, start + dur);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, start);
      env.gain.linearRampToValueAtTime(peak, start + 0.025);
      env.gain.setValueAtTime(peak * 0.85, start + dur * 0.7);
      env.gain.exponentialRampToValueAtTime(0.001, start + dur);

      flt.connect(env);
      connectOut(env);

      for (const detune of [-11, 0, 11]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);
        osc.detune.setValueAtTime(detune, start);
        osc.connect(flt);
        osc.start(start);
        osc.stop(start + dur + 0.03);
        activeNodes.push(osc);
      }

      const sub = ctx.createOscillator();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(freq * 0.5, start);
      sub.connect(flt);
      sub.start(start);
      sub.stop(start + dur + 0.03);
      activeNodes.push(sub);
    };

    // 2. Opening cinematic sub-drop + crash (hammer-down impact)
    const impact = ctx.createOscillator();
    const impactGain = ctx.createGain();
    impact.type = 'sine';
    impact.frequency.setValueAtTime(130, now);
    impact.frequency.exponentialRampToValueAtTime(34, now + 0.55);
    impactGain.gain.setValueAtTime(0.75, now);
    impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    impact.connect(impactGain);
    impactGain.connect(compressor);
    impact.start(now);
    impact.stop(now + 0.68);
    activeNodes.push(impact);

    triggerNoise(now, 1.1, 'highpass', 2200, 0.28);

    // 3. Heroic rising stadium brass melody (octave leap climax!)
    const melody = [
      { t: 0, note: 0, dur: 0.34, peak: 0.24 },
      { t: 1.5, note: 4, dur: 0.24, peak: 0.20 },
      { t: 2.5, note: 7, dur: 0.34, peak: 0.24 },
      { t: 4, note: 12, dur: 0.52, peak: 0.28 },
      { t: 6.5, note: 11, dur: 0.22, peak: 0.22 },
      { t: 7.5, note: 12, dur: 0.22, peak: 0.24 },
      { t: 8.5, note: 14, dur: 0.34, peak: 0.26 },
      { t: 10, note: 16, dur: 0.42, peak: 0.28 },
      { t: 12, note: 19, dur: 1.25, peak: 0.32 }, // High G climax!
    ];
    for (const m of melody) {
      triggerSupersaw(now + m.t * beat, rootMidi + m.note, m.dur, m.peak);
    }

    // 4. Deep heroic bassline progression (I -> V -> vi -> IV -> I)
    const bassline = [
      { t: 0, note: -24, dur: 0.8 },
      { t: 4, note: -17, dur: 0.8 },
      { t: 8, note: -15, dur: 0.8 },
      { t: 12, note: -12, dur: 1.35 },
    ];
    for (const b of bassline) {
      const start = now + b.t * beat;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(280, start);
      osc.frequency.setValueAtTime(midiToFreq(rootMidi + b.note), start);
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.35, start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, start + b.dur);
      osc.connect(flt);
      flt.connect(g);
      g.connect(compressor);
      osc.start(start);
      osc.stop(start + b.dur + 0.03);
      activeNodes.push(osc);
    }

    // 5. Driving stadium kick + snare/clap groove
    for (let step = 0; step < 14; step += 2) {
      const kStart = now + step * beat;
      const kick = ctx.createOscillator();
      const kGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(145, kStart);
      kick.frequency.exponentialRampToValueAtTime(42, kStart + 0.13);
      kGain.gain.setValueAtTime(0.55, kStart);
      kGain.gain.exponentialRampToValueAtTime(0.001, kStart + 0.16);
      kick.connect(kGain);
      kGain.connect(compressor);
      kick.start(kStart);
      kick.stop(kStart + 0.18);
      activeNodes.push(kick);

      if (step % 4 === 2) {
        triggerNoise(kStart, 0.16, 'bandpass', 1800, 0.24);
      }
    }

    // 6. Climax power chord + crash at t = 12 * beat
    const climaxTime = now + 12 * beat;
    triggerNoise(climaxTime, 1.25, 'highpass', 2400, 0.24);
    for (const interval of [0, 7, 12, 16]) {
      triggerSupersaw(climaxTime, rootMidi + interval, 1.3, 0.14);
    }

    return () => {
      try {
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.disconnect();
        activeNodes.forEach((n) => {
          try { n.stop(); } catch {}
        });
      } catch {}
    };
  } catch {
    return () => {};
  }
}
