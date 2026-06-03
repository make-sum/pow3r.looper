export async function generateProceduralAudio(
  bpm: number,
  durationSeconds: number,
  complexity: number = 50,
  promptSeed: string = ""
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();

      const sampleRate = ctx.sampleRate;
      const lengthInSamples = Math.floor(sampleRate * durationSeconds);
      const buffer = ctx.createBuffer(1, lengthInSamples, sampleRate);
      const data = buffer.getChannelData(0);

      const secondsPerBeat = 60.0 / bpm;
      const samplesPerBeat = sampleRate * secondsPerBeat;

      // Generate a deterministic hash from the prompt string
      let seed = 12345;
      for (let i = 0; i < promptSeed.length; i++) {
        seed = (seed * 31 + promptSeed.charCodeAt(i)) % 1000000007;
      }
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      // Musical scales and notes
      const baseNote = 36 + Math.floor(random() * 12); // C2 to B2
      const scaleOffsets = [0, 3, 5, 7, 10]; // Minor pentatonic
      
      const bassNotes = scaleOffsets.map(n => 440 * Math.pow(2, ((baseNote + n) - 69) / 12) * 0.5);
      const arpNotes = scaleOffsets.map(n => 440 * Math.pow(2, ((baseNote + n + 12) - 69) / 12));

      const hasArp = complexity > 40;
      const intenseDrums = complexity > 70;
      
      // Simple One-Pole Lowpass Filter state
      let baseFilterState = 0;
      
      // Pre-compute sequence patterns
      const bassPattern = Array.from({length: 16}, () => Math.random() > 0.4 ? Math.floor(random() * 5) : -1);
      const arpPattern = Array.from({length: 16}, () => Math.floor(random() * 5));

      for (let i = 0; i < lengthInSamples; i++) {
        const beatPosition = i % samplesPerBeat;
        const timeInBeat = beatPosition / sampleRate;

        const absoluteBeat = Math.floor(i / samplesPerBeat);
        const barBeat = absoluteBeat % 4;
        const absolute16th = Math.floor(i / (samplesPerBeat / 4));
        const step16th = absolute16th % 16;
        const timeIn16th = (i % (samplesPerBeat / 4)) / sampleRate;
        const sixteenthLength = secondsPerBeat / 4;

        let sampleValue = 0;

        // 1. Kick drum (909 style)
        if (timeInBeat < 0.25 || (intenseDrums && barBeat === 3 && timeInBeat > secondsPerBeat * 0.75)) {
          const kickTime = timeInBeat % (secondsPerBeat * 0.75);
          const envelope = Math.max(0, 1 - kickTime * 4); // Fast decay
          const pitchEnv = Math.exp(-40 * kickTime);
          const frequency = 50 + 150 * pitchEnv;
          sampleValue += Math.sin(2 * Math.PI * frequency * kickTime) * envelope * 0.9;
          
          // Kick click
          if (kickTime < 0.01) sampleValue += (Math.random() - 0.5) * 0.3 * (1 - kickTime * 100);
        }

        // 2. Snare (808 style)
        if (barBeat === 1 || barBeat === 3) {
          const snareTime = timeInBeat;
          if (snareTime < 0.3) {
             const toneEnv = Math.exp(-25 * snareTime);
             const noiseEnv = Math.exp(-15 * snareTime);
             const noise = Math.random() * 2 - 1;
             
             // High passed noise
             const hpNoise = noise * noiseEnv * 0.5;
             const tonal1 = Math.sin(2 * Math.PI * 180 * snareTime);
             const tonal2 = Math.sin(2 * Math.PI * 330 * snareTime);
             
             sampleValue += (hpNoise + (tonal1 + tonal2) * 0.2 * toneEnv) * 0.6 * (complexity / 100);
          }
        }

        // 3. Hi-hat (Dynamic 16ths)
        const isOffBeat = (step16th % 2 !== 0);
        if (timeIn16th < 0.1) {
          if (isOffBeat || intenseDrums || step16th === 0) {
             const decay = isOffBeat ? 40 : 60; // Open vs closed
             const envelope = Math.exp(-decay * timeIn16th);
             // Simulated metallic noise via FM
             const m1 = Math.sin(2 * Math.PI * 8000 * timeIn16th);
             const m2 = Math.sin(2 * Math.PI * 10500 * timeIn16th);
             const m3 = Math.sin(2 * Math.PI * 315 * timeIn16th);
             const fmNoise = Math.sin(2 * Math.PI * 3000 * timeIn16th + m1 + m2 + m3);
             
             sampleValue += fmNoise * envelope * (isOffBeat ? 0.25 : 0.15);
          }
        }

        // 4. Acid Bassline (303 Style Sawtooth with Filter Sweep)
        const noteIdx = bassPattern[step16th];
        if (noteIdx !== -1) {
          const freq = bassNotes[noteIdx];
          
          // Sawtooth generation
          const phase = (timeIn16th * freq) % 1.0;
          const saw = (phase * 2.0 - 1.0);
          
          // Envelope and Filter
          const ampEnv = Math.exp(-15 * timeIn16th);
          
          // Filter envelope sweep (LFO over sequence)
          const lfo = (Math.sin(2 * Math.PI * (i / sampleRate) * 0.5) + 1.0) * 0.5; 
          const cutoffBase = 100 + lfo * 1000;
          const filterEnv = cutoffBase + 2000 * Math.exp(-20 * timeIn16th);
          
          // Convert cutoff to alpha for 1-pole IIR filter
          const rc = 1.0 / (2 * Math.PI * filterEnv);
          const dt = 1.0 / sampleRate;
          const alpha = dt / (rc + dt);
          
          baseFilterState = baseFilterState + alpha * (saw - baseFilterState);
          
          // Resonance approximation (naive feedback)
          const res = baseFilterState + (saw - baseFilterState) * 0.2;
          
          sampleValue += res * ampEnv * 0.6;
        }

        // 5. Arpeggiator Synth (FM Bells/Plucks)
        if (hasArp) {
           const arpNote = arpPattern[step16th];
           const arpFreq = arpNotes[arpNote];
           
           const envelope = Math.exp(-8 * timeIn16th);
           // FM Synthesis: Carrier + Modulator
           const modRatio = 2.0;
           const modIndex = 1.5 * Math.exp(-10 * timeIn16th);
           const modulator = Math.sin(2 * Math.PI * (arpFreq * modRatio) * timeIn16th);
           const carrier = Math.sin(2 * Math.PI * arpFreq * timeIn16th + modIndex * modulator);
           
           sampleValue += carrier * envelope * 0.15;
        }

        // Soft Clip Limiter / Tape Saturation
        // f(x) = x - (x^3)/3
        let x = Math.max(-1.5, Math.min(1.5, sampleValue * 1.5));
        const sat = x - (Math.pow(x, 3) / 3.0);
        data[i] = sat * 0.8;
      }

      // Convert buffer to WAV
      const wavData = audioBufferToWav(buffer);
      const uint8Array = new Uint8Array(wavData);
      
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize) as any);
      }
      const base64String = btoa(binary);
      const url = `data:audio/wav;base64,${base64String}`;
      
      resolve(url);
    } catch (err) {
      console.error("Procedural audio generation failed", err);
      reject(err);
    }
  });
}

export function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return arrayBuffer;
}
