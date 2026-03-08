// sounds.js  Web Audio API synthesized sounds + SW-backed notifications for UmmahSync
// All sounds generated programmatically  no audio files needed

let audioCtx = null;
let ringtoneInterval = null;

const getCtx = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
};

export const resumeAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
};

//  Short beep utility 
const beep = (freq, duration, vol = 0.3, type = 'sine', delay = 0) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
};

//  Sounds 
export const playMessageReceived = () => {
    beep(880, 0.08, 0.2, 'sine', 0);
    beep(1320, 0.12, 0.15, 'sine', 0.07);
};

export const playMessageSent = () => {
    beep(1046, 0.06, 0.12, 'sine', 0);
    beep(1318, 0.05, 0.08, 'sine', 0.04);
};

const voiceRingCycle = () => {
    beep(480, 0.35, 0.4, 'sine', 0);
    beep(480, 0.35, 0.4, 'sine', 0.45);
};
export const startVoiceRingtone = () => {
    stopRingtone();
    voiceRingCycle();
    ringtoneInterval = setInterval(voiceRingCycle, 2200);
};

const videoRingCycle = () => {
    beep(523, 0.12, 0.35, 'triangle', 0);
    beep(659, 0.12, 0.35, 'triangle', 0.14);
    beep(784, 0.20, 0.35, 'triangle', 0.28);
    beep(523, 0.12, 0.35, 'triangle', 0.60);
    beep(659, 0.12, 0.35, 'triangle', 0.74);
    beep(784, 0.20, 0.35, 'triangle', 0.88);
};
export const startVideoRingtone = () => {
    stopRingtone();
    videoRingCycle();
    ringtoneInterval = setInterval(videoRingCycle, 2400);
};

export const stopRingtone = () => {
    if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
};

export const playCallConnected = () => {
    beep(880, 0.10, 0.3, 'sine', 0);
    beep(1108, 0.15, 0.3, 'sine', 0.12);
};

export const playCallEnded = () => {
    beep(440, 0.12, 0.3, 'sine', 0);
    beep(370, 0.20, 0.3, 'sine', 0.14);
};

//  Service Worker Registration 
let swRegistration = null;

export const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;
    try {
        swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('UmmahSync SW registered:', swRegistration.scope);
    } catch (err) {
        console.warn('SW registration failed:', err);
    }
};

//  Notification Permission 
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        await Notification.requestPermission();
    }
};

//  Show Notification (works in foreground AND background via SW) 
export const showNotification = (title, body, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const payload = {
        title,
        body,
        tag: options.tag || 'ummahsync',
        vibrate: options.vibrate || [200, 100, 200],
        ...options,
    };

    // Prefer SW-backed notification (works when tab is backgrounded or minimized)
    if (swRegistration) {
        swRegistration.active?.postMessage({ type: 'SHOW_NOTIFICATION', ...payload });
    } else if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SHOW_NOTIFICATION', ...payload });
    } else {
        // Fallback: direct Notification API (only reliable when tab is focused)
        new Notification(title, { body, icon: '/vite.svg', tag: payload.tag });
    }
};
