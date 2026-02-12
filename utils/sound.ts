
// Premium Sound Synthesis Utility - Optimized for Cyber Vault Aesthetic
const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

export const playClick = () => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.05);
};

export const playSuccess = () => {
  const ctx = initAudio();
  // Deep Vault Opening Sound
  [100, 150, 200, 250].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime + (i * 0.1);
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + 0.5);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.05, startTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(startTime); osc.stop(startTime + 0.8);
  });
};

export const triggerHaptic = () => {
  if (navigator.vibrate) navigator.vibrate(10);
};
