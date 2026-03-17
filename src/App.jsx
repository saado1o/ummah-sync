import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, MoreVertical, Paperclip, Smile, Send, MessageSquare,
  Phone, Video, ShieldCheck, HeartPulse, Sparkles, LogOut,
  Mic, Square, PhoneOff, MicOff, VideoOff, Settings, User,
  FileText, X, ChevronLeft, Circle, Bell, Check,
  Camera, Image, Type, Plus, CheckCheck, Volume2, VolumeX,
  Menu, Globe, Lock, Cpu, Database, Users, Mail, MapPin, Linkedin, Github
} from 'lucide-react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import './index.css';

// Import new components
import LandingLayout from './components/LandingLayout';
import Home from './pages/Home';
import Features from './pages/Features';
import TechStack from './pages/TechStack';
import Contact from './pages/Contact';

import { auth, db, storage } from './firebase';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  GoogleAuthProvider, signInWithPopup
} from 'firebase/auth';
import { io } from 'socket.io-client';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  playMessageReceived, playMessageSent,
  startVoiceRingtone, startVideoRingtone, stopRingtone,
  playCallConnected, playCallEnded,
  requestNotificationPermission, showNotification,
  resumeAudio, registerServiceWorker
} from './sounds.js';

// Backend URL resolution: Use environment variable for production, or fallback to LAN/localhost for dev
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  `${window.location.protocol}//${window.location.hostname}:3001`;

const socket = io(BACKEND_URL, { 
    secure: true, 
    rejectUnauthorized: false,
    transports: ['websocket', 'polling'] // Better compatibility for cloud hosting
});

// Helper: format timestamp nicely
const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};
function Login() {
  const [authMethod, setAuthMethod] = useState('email'); // 'email', 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setError('');
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Phone + PIN: map phone to pseudo-email so Firebase Auth handles it like email+password
  const phoneToEmail = (phoneNumber) => {
    // Normalize: strip spaces/dashes, ensure it starts with +
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
    const normalized = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
    return `${normalized}@ummah-sync.app`;
  };

  const handlePhonePinAuth = async (e) => {
    e.preventDefault();
    if (!phone || !pin) return;
    if (pin.length < 4) { setError('PIN must be at least 4 digits.'); return; }
    setError('');
    setLoading(true);
    const pseudoEmail = phoneToEmail(phone);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, pseudoEmail, pin);
      } else {
        await signInWithEmailAndPassword(auth, pseudoEmail, pin);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setError('No account found for this number. Register first.');
      else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') setError('Incorrect PIN. Please try again.');
      else if (err.code === 'auth/email-already-in-use') setError('This phone number is already registered. Login instead.');
      else if (err.code === 'auth/invalid-email') setError('Invalid phone number format. Use: +923001234567');
      else setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="ummah-sync Logo" style={{ width: 240, height: 240, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          {isRegistering && (
            <button
              onClick={() => { setIsRegistering(false); setError(''); }}
              style={{ position: 'absolute', left: '-0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-navy)' }}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h2 style={{ flex: 1, textAlign: 'center', margin: 0, color: 'var(--color-primary-navy)', fontSize: '1.3rem', fontWeight: 'bold' }}>
            {isRegistering ? 'Create Account' : 'Ummah-Sync'}
          </h2> 
        </div>

        {error && <div style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            style={{ flex: 1, padding: '0.5rem', backgroundColor: authMethod === 'email' ? 'var(--color-primary-navy)' : '#E2E8F0', color: authMethod === 'email' ? 'white' : 'var(--color-text-main)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => { setAuthMethod('email'); setError(''); }}
          >Email</button>
          <button
            style={{ flex: 1, padding: '0.5rem', backgroundColor: authMethod === 'phone' ? 'var(--color-primary-navy)' : '#E2E8F0', color: authMethod === 'phone' ? 'white' : 'var(--color-text-main)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: '600' }}
            onClick={() => { setAuthMethod('phone'); setError(''); }}
          >Phone + PIN</button>
        </div>

        {authMethod === 'email' && (
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder="Email Address"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', width: '100%', fontSize: '0.95rem' }}
              autoComplete="email"
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', width: '100%', fontSize: '0.95rem' }}
              autoComplete="current-password"
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.85rem', backgroundColor: 'var(--color-accent-emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Processing...' : (isRegistering ? 'Register with Email' : 'Login with Email')}
            </button>
            <p
              style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Already have an account? Login here' : 'Need an account? Register here'}
            </p>
          </form>
        )}

        {authMethod === 'phone' && (
          <form onSubmit={handlePhonePinAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#F0FDF4', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
              Your phone number is your account ID. Choose a memorable PIN.
            </div>
            <input
              type="tel"
              placeholder="Phone Number (e.g. +923001234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', width: '100%', fontSize: '0.95rem' }}
              autoComplete="tel"
              required
            />
            <input
              type="password"
              placeholder="PIN (4-8 digits)"
              value={pin}
              maxLength={8}
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', width: '100%', fontSize: '1.2rem', letterSpacing: '0.3rem' }}
              autoComplete={isRegistering ? "new-password" : "current-password"}
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.85rem', backgroundColor: 'var(--color-accent-emerald)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 'bold', fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Processing...' : (isRegistering ? 'Register with Phone + PIN' : 'Login with Phone + PIN')}
            </button>
            <p
              style={{ textAlign: 'center', marginTop: '0.25rem', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Already have an account? Login here' : 'New here? Register with Phone + PIN'}
            </p>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--color-text-muted)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
          <span style={{ padding: '0 1rem', fontSize: '0.85rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }}></div>
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{ width: '100%', padding: '0.85rem', backgroundColor: 'white', color: '#475569', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: '600', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
          Continue with Google
        </button>

        {/* No recaptcha container needed for PIN auth */}
      </div>
    </div>
  );
}

function ChatApp({ user }) {
  const [activeChat, setActiveChat] = useState("SBF Global Team");
  const [contacts, setContacts] = useState(["SBF Global Team"]);
  const [newContact, setNewContact] = useState("");
  // For phone+PIN users, the Firebase email is +number@ummah-sync.app  show the real number
  const rawIdentifier = user.email || user.phoneNumber || user.uid;
  const myIdentifier = rawIdentifier.endsWith('@ummah-sync.app')
    ? rawIdentifier.replace('@ummah-sync.app', '')
    : rawIdentifier;

  const [profile, setProfile] = useState({ name: myIdentifier, about: 'Available', theme: 'light', wallpaper: '', photoURL: '' });

  // Status feature state
  const [myStatuses, setMyStatuses] = useState([]);
  const [contactStatuses, setContactStatuses] = useState([]);
  const [viewingStatus, setViewingStatus] = useState(null); // { owner, items, idx }
  const [showStatusCompose, setShowStatusCompose] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusBg, setStatusBg] = useState('#128C7E');

  // Sidebar tab + mobile panel
  const [sidebarTab, setSidebarTab] = useState('chats'); // 'chats' | 'status' | 'calls'
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Sync state with Firebase directly 
  useEffect(() => {
    let unsubscribe = () => { };
    const fetchUserData = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.profile) {
            setProfile(data.profile);
            document.documentElement.setAttribute('data-theme', data.profile.theme || 'light');
          }
          if (data.contacts) setContacts(data.contacts);
        } else {
          await setDoc(userDocRef, { profile, contacts });
          document.documentElement.setAttribute('data-theme', 'light');
        }

        // Listen to live updates on contacts/profile
        unsubscribe = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.profile) {
              setProfile(data.profile);
              document.documentElement.setAttribute('data-theme', data.profile.theme || 'light');
            }
            if (data.contacts) setContacts(data.contacts);
          }
        });
      } catch (e) { console.error(e) }
    };
    fetchUserData();
    return () => unsubscribe();
  }, [user.uid]);

  const handleSaveProfile = async () => {
    document.documentElement.setAttribute('data-theme', profile.theme);
    try {
      await setDoc(doc(db, 'users', user.uid), { profile, contacts }, { merge: true });
    } catch (e) { console.error(e); }
    setShowModal(null);
  };

  // Register SW and request notification permission once on load
  useEffect(() => {
    registerServiceWorker();
    requestNotificationPermission();
  }, []);

  // Automated 1AM Daily Backup System
  useEffect(() => {
    const backupRoutine = async () => {
      const now = new Date();
      if (now.getHours() >= 1) { // After 1 AM
        const todayStr = now.toISOString().split('T')[0];
        if (profile.lastBackup !== todayStr) {
          console.log("Triggering automated 1 AM backup to Firestore...");
          try {
            // Grab history, filtering client-side to bypass composite index constraints for MVP
            const snapshot = await getDocs(collection(db, 'messages'));
            const myHistory = [];
            snapshot.forEach(docSnap => {
              const d = docSnap.data();
              if (d.roomId && d.roomId.includes(myIdentifier) || d.roomId === 'global') {
                myHistory.push({ id: docSnap.id, ...d });
              }
            });

            // Push isolated backup document to user subcollection
            await setDoc(doc(db, 'users', user.uid, 'backups', todayStr), {
              profile,
              contacts,
              history: myHistory,
              timestamp: serverTimestamp()
            });

            // Update profile with last backup marker
            const newProfile = { ...profile, lastBackup: todayStr };
            await setDoc(doc(db, 'users', user.uid), {
              profile: newProfile
            }, { merge: true });
            setProfile(newProfile);
            console.log("Backup complete!");
          } catch (e) {
            console.error("Backup failed:", e);
          }
        }
      }
    };

    // Check every hour (3600000ms). Also check initially on load.
    const interval = setInterval(backupRoutine, 3600000);
    backupRoutine();
    return () => clearInterval(interval);
  }, [profile.lastBackup, profile.name, profile.theme, contacts, user.uid, myIdentifier]);

  const [showModal, setShowModal] = useState(null); // 'zakat', 'consult', 'profile'
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const profilePicInputRef = useRef(null);
  const [attachment, setAttachment] = useState(null);

  const getRoomId = (chatId) => {
    if (chatId === 'SBF Global Team') return 'global';
    if (chatId.startsWith('Group: ')) return chatId; // Groups have universal ID
    return [myIdentifier, chatId].sort().join('_');
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    const contactInfo = newContact.trim();
    if (contactInfo && !contacts.includes(contactInfo) && contactInfo !== myIdentifier) {
      const newContactsList = [...contacts, contactInfo];
      setContacts(newContactsList);
      setNewContact("");
      try {
        await setDoc(doc(db, 'users', user.uid), { contacts: newContactsList }, { merge: true });
      } catch (err) {
        console.error("Error saving contact", err);
      }
    }
  };

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const messagesEndRef = useRef(null);

  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use timeslice so we get chunks continuously
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      let chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const chatAtStop = activeChatRef.current; // Stable reference
        const audioBlob = new Blob(chunks, { type: mimeType });

        // Convert to base64 so any device can play it from Firestore directly
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result; // data:audio/webm;base64,...
          try {
            await addDoc(collection(db, 'messages'), {
              text: 'Voice Note',
              audioBase64: base64Audio,
              senderId: user.uid,
              senderEmail: profile?.name || myIdentifier,
              roomId: getRoomId(chatAtStop),
              timestamp: serverTimestamp()
            });
          } catch (err) {
            console.error('Voice Note Firestore save failed:', err);
            alert('Failed to send voice note. Please try again.');
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for Voice Notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // --- WebRTC Call State ---
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [callStream, setCallStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const iceCandidateQueue = useRef([]);   // Queue candidates until remote desc is set
  const callStreamRef = useRef(null);     // Stable ref to avoid stale closures in toggles

  // Imperatively set srcObject on video elements when streams change
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream || null;
  }, [remoteStream, activeCall]);

  useEffect(() => {
    callStreamRef.current = callStream;
    if (localVideoRef.current) localVideoRef.current.srcObject = callStream || null;
  }, [callStream, activeCall]);

  const flushIceCandidates = async (peer) => {
    while (iceCandidateQueue.current.length) {
      const candidate = iceCandidateQueue.current.shift();
      try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (e) { console.warn('ICE flush error:', e); }
    }
  };

  useEffect(() => {
    socket.emit('join', myIdentifier);

    socket.on('user-joined', (data) => {
      console.log('Team member joined:', data.email);
    });

    // Incoming ring  store offer for answering + start ringtone
    socket.on('call-made', (data) => {
      const isMyGroup = data.to?.startsWith('Group: ') && contacts.includes(data.to);
      if (data.to === myIdentifier || data.to === 'global' || isMyGroup) {
        setIncomingCallData(data);
        setActiveCall(prev => prev ? prev : 'incoming');
        resumeAudio();
        if (data.type === 'video') startVideoRingtone();
        else startVoiceRingtone();
        showNotification(
          `Incoming ${data.type === 'video' ? 'Video' : 'Voice'} Call`,
          `From: ${data.from}`
        );
      }
    });

    // Caller receives callee's answer  stop ring, play connected, set remote desc
    socket.on('call-answered', async (data) => {
      if (data.to === myIdentifier) {
        stopRingtone();
        playCallConnected();
        if (peerRef.current && data.answer) {
          try {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            await flushIceCandidates(peerRef.current);
          } catch (e) { console.error('setRemoteDescription (caller):', e); }
        }
      }
    });

    // ICE candidates  queue if remote desc not yet set
    socket.on('ice-candidate', async (data) => {
      const isMyGroup = data.to?.startsWith('Group: ') && contacts.includes(data.to);
      if ((data.to === myIdentifier || data.to === 'global' || isMyGroup) && data.from !== myIdentifier) {
        if (!peerRef.current || !peerRef.current.remoteDescription) {
          iceCandidateQueue.current.push(data.candidate); // Queue until ready
        } else {
          try { await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)); }
          catch (e) { console.warn('addIceCandidate:', e); }
        }
      }
    });

    socket.on('call-ended', (data) => {
      const isMyGroup = data.to?.startsWith('Group: ') && contacts.includes(data.to);
      if (data.to === myIdentifier || data.to === 'global' || isMyGroup) endCall(false);
    });

    return () => {
      socket.off('user-joined');
      socket.off('call-made');
      socket.off('call-answered');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [myIdentifier, contacts]);

  const initiateCall = async (type, isAnswering = false) => {
    setActiveCall(type);
    setIsMuted(false);
    setIsCameraOff(false);
    iceCandidateQueue.current = []; // Reset queue for new call
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      setCallStream(stream);
      callStreamRef.current = stream; // Set ref immediately for controls

      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      });
      peerRef.current = peer;

      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      peer.ontrack = (e) => {
        const incomingStream = e.streams[0];
        console.log('Remote track received, kind:', e.track.kind, incomingStream);
        setRemoteStream(incomingStream);
      };

      peer.onconnectionstatechange = () => {
        console.log('Connection state:', peer.connectionState);
      };

      const callTarget = isAnswering
        ? incomingCallData.from
        : (activeChat === 'SBF Global Team' ? 'global' : activeChat);

      peer.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { to: callTarget, from: myIdentifier, candidate: e.candidate });
        }
      };

      if (!isAnswering) {
        const offer = await peer.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === 'video' });
        await peer.setLocalDescription(offer);
        socket.emit('call-user', { to: callTarget, from: myIdentifier, type, offer });
      } else {
        if (incomingCallData?.offer) {
          await peer.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
          await flushIceCandidates(peer); // Drain queued ICE candidates
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socket.emit('answer-call', { to: incomingCallData.from, from: myIdentifier, answer });
        }
      }
    } catch (e) {
      console.error('initiateCall error:', e);
      alert('Microphone/Camera permission required for calling.');
      setActiveCall(null);
    }
  };

  const toggleMute = () => {
    const stream = callStreamRef.current;
    if (stream) {
      const newMuted = !isMuted;
      // Mute outgoing mic tracks only
      stream.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
      setIsMuted(newMuted);
    }
  };

  const toggleCamera = () => {
    const stream = callStreamRef.current;
    if (stream) {
      const newCameraOff = !isCameraOff;
      // Toggle video tracks
      stream.getVideoTracks().forEach(t => { t.enabled = !newCameraOff; });
      setIsCameraOff(newCameraOff);
    }
  };

  const endCall = (emitEvent = true) => {
    stopRingtone();
    playCallEnded();
    setActiveCall(null);
    setIncomingCallData(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    iceCandidateQueue.current = [];
    const s = callStreamRef.current;
    if (s) { s.getTracks().forEach(t => t.stop()); setCallStream(null); }
    if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
    if (emitEvent) {
      const target = (activeCall === 'incoming' && incomingCallData)
        ? incomingCallData.from
        : (activeChat === 'SBF Global Team' ? 'global' : activeChat);
      socket.emit('end-call', { to: target, from: myIdentifier });
    }
  };

  //  Status Utilities 
  const postStatus = async (type, content) => {
    const statusEntry = {
      type,           // 'text' | 'image' | 'video'
      content,        // text string or URL
      bg: statusBg,
      ownerUid: user.uid,
      ownerName: profile.name || myIdentifier,
      ownerPhoto: profile.photoURL || '',
      timestamp: serverTimestamp(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    };
    try {
      await addDoc(collection(db, 'statuses'), statusEntry);
      setShowStatusCompose(false);
      setStatusText('');
    } catch (e) { console.error('Status post failed:', e); }
  };

  // Load statuses from contacts
  useEffect(() => {
    if (!contacts.length) return;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(collection(db, 'statuses'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => {
        if (!s.timestamp) return false;
        const ts = s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
        return ts > cutoff;
      });
      const mine = all.filter(s => s.ownerUid === user.uid);
      const others = all.filter(s => s.ownerUid !== user.uid);
      setMyStatuses(mine);
      setContactStatuses(others);
    });
    return () => unsub();
  }, [contacts, user.uid]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMessages = [];
      const currentRoom = getRoomId(activeChat);
      snapshot.forEach((doc) => {
        const data = doc.data();
        const msgRoom = data.roomId || 'global';
        if (msgRoom === currentRoom) liveMessages.push({ id: doc.id, ...data });
      });
      // Play sound + notification for new incoming messages
      if (liveMessages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
        const newest = liveMessages[liveMessages.length - 1];
        if (newest.senderId !== user.uid) {
          resumeAudio();
          playMessageReceived();
          showNotification(
            (newest.senderEmail || 'New Message'),
            newest.audioBase64 ? 'Voice Note' : (newest.text || 'Attachment'),
          );
        }
      }
      prevMessageCountRef.current = liveMessages.length;
      setMessages(liveMessages);
    });
    return () => unsubscribe();
  }, [activeChat, myIdentifier]);

  const handleSendMessage = async () => {
    if (!message.trim() && !attachment) return;
    resumeAudio();
    playMessageSent();
    const msgText = message.trim();
    const currentAttachment = attachment;
    setMessage('');
    setAttachment(null);
    setShowEmojiPicker(false);
    try {
      await addDoc(collection(db, 'messages'), {
        text: msgText,
        fileUrl: currentAttachment?.url || null,
        fileName: currentAttachment?.name || null,
        fileType: currentAttachment?.type || null,
        senderId: user.uid,
        senderEmail: profile.name || myIdentifier,
        roomId: getRoomId(activeChat),
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error sending to Firestore: ", err);
      alert("Error sending message. Please check your connection.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) { // 15MB limit
      alert("File is too large! Please select a file smaller than 15MB.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BACKEND_URL}/api/upload-file`, {
        method: 'POST', body: formData
      });
      if (!res.ok) throw new Error("Backend response error.");
      const data = await res.json();
      setAttachment(data);
    } catch (err) {
      console.error(err);
      alert("File upload failed. Ensure the server is running.");
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("Profile picture is too large! Please upload under 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${BACKEND_URL}/api/upload-file`, {
        method: 'POST', body: formData
      });
      if (!res.ok) throw new Error("Backend response error");
      const data = await res.json();
      setProfile(prev => ({ ...prev, photoURL: data.url }));
    } catch (err) {
      console.error("Profile picture upload failed:", err);
      alert("Profile picture upload failed. Ensure the server is running.");
    }
  };

  const handleAISuggestion = async (action) => {
    if (!message.trim() && action !== 'islamic_greeting') return;

    setIsAILoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: message,
          context: "Professional project communication inside SBF-Consultancy."
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.result);
      }
    } catch (error) {
      console.error("AI processing failed:", error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleLogout = () => { signOut(auth); };
  const STATUS_BG_PRESETS = ['#128C7E', '#075E54', '#25D366', '#1565C0', '#6A1B9A', '#D32F2F', '#F57F17', '#1B1B1B'];

  return (
    <div className="app-container" onClick={resumeAudio}>
      {/* SIDE TOOLBAR (Desktop Only) */}
      <div className="side-toolbar">
        <div className={`toolbar-icon ${sidebarTab === 'chats' ? 'active' : ''}`} onClick={() => setSidebarTab('chats')} title="Chats">
          <MessageSquare size={24} />
        </div>
        <div className={`toolbar-icon ${sidebarTab === 'status' ? 'active' : ''}`} onClick={() => setSidebarTab('status')} title="Status">
          <Circle size={24} />
        </div>
        <div className={`toolbar-icon ${sidebarTab === 'calls' ? 'active' : ''}`} onClick={() => setSidebarTab('calls')} title="Calls">
          <Phone size={24} />
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="toolbar-icon" onClick={() => setShowModal('profile')} title="Settings">
            <Settings size={22} />
          </div>
          <div className="avatar" style={{ width: 34, height: 34, cursor: 'pointer' }} onClick={() => setShowModal('profile')}>
            {profile.photoURL ? <img src={profile.photoURL} alt="me" /> : (profile.name || myIdentifier).charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="sidebar" style={{ display: mobileChatOpen ? 'none' : 'flex' }}>
        <div className="sidebar-header" style={{ minHeight: 120 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15, flex: 1 }}>
            <img src="/logo.png" alt="ummah-sync" style={{ width: 96, height: 96, borderRadius: 12 }} />
            <h1 className="sidebar-title" style={{ fontSize: '1.5rem' }}>{sidebarTab.charAt(0).toUpperCase() + sidebarTab.slice(1)}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {sidebarTab === 'chats' && <button className="icon-btn" style={{ color: 'var(--wa-icon)' }} onClick={() => setShowModal('createGroup')}><Plus size={22} /></button>}
            <button className="icon-btn" style={{ color: 'var(--wa-icon)' }} onClick={() => setShowModal('profile')}><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Search Only in Chats */}
        {sidebarTab === 'chats' && (
          <div className="search-container">
            <form className="search-box" onSubmit={handleAddContact}>
              <Search size={18} className="search-icon" />
              <input placeholder="Search or start new chat" value={newContact} onChange={e => setNewContact(e.target.value)} />
            </form>
          </div>
        )}

        {/* BOTTOM NAVIGATION (Mobile only via CSS) */}
        <div className="sidebar-tabs">
          <button className={`sidebar-tab ${sidebarTab === 'chats' ? 'active' : ''}`} onClick={() => setSidebarTab('chats')}>
            <MessageSquare size={20} className="mobile-only-icon" />
            <span>Chats</span>
          </button>
          <button className={`sidebar-tab ${sidebarTab === 'status' ? 'active' : ''}`} onClick={() => setSidebarTab('status')}>
            <Circle size={20} className="mobile-only-icon" />
            <span>Status</span>
          </button>
          <button className={`sidebar-tab ${sidebarTab === 'calls' ? 'active' : ''}`} onClick={() => setSidebarTab('calls')}>
            <Phone size={20} className="mobile-only-icon" />
            <span>Calls</span>
          </button>
          <button className="sidebar-tab" onClick={() => setShowModal('profile')}>
            <Settings size={20} className="mobile-only-icon" />
            <span>Settings</span>
          </button>
        </div>

        {sidebarTab === 'chats' && (
          <div className="contact-list">
            {contacts.map((contact, idx) => {
              const lastMsg = activeChat === contact && messages.length > 0 ? messages[messages.length - 1] : null;
              const isGlobal = contact === 'SBF Global Team';
              return (
                <div key={idx} className={`contact-item ${activeChat === contact ? 'active' : ''} ${isGlobal ? 'global-team-item' : ''}`}
                  onClick={() => { setActiveChat(contact); setMobileChatOpen(true); }}>
                  <div className="avatar">{contact.startsWith('Group: ') ? '#' : contact.charAt(0).toUpperCase()}</div>
                  <div className="contact-info">
                    <div className="contact-name">{contact}</div>
                    <div className="contact-preview">{lastMsg ? (lastMsg.audioBase64 ? 'Voice Note' : (lastMsg.text || 'Attachment')) : 'Tap to open chat'}</div>
                  </div>
                  <div className="contact-meta">
                    {lastMsg?.timestamp && <span className="contact-time">{formatTimestamp(lastMsg.timestamp)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sidebarTab === 'status' && (
          <div className="contact-list">
            <div className="status-section">
              <div className="status-section-title">My Status</div>
              <div className="status-item" onClick={() => setShowStatusCompose(true)}>
                <div className="status-avatar-wrap">
                  <div className="status-avatar">{profile.photoURL ? <img src={profile.photoURL} alt="me" /> : (profile.name || myIdentifier).charAt(0).toUpperCase()}</div>
                  <span className="add-status-btn">+</span>
                </div>
                <div className="status-info">
                  <div className="status-name">My Status</div>
                  <div className="status-time">{myStatuses.length > 0 ? `${myStatuses.length} update(s)` : 'Tap to add status update'}</div>
                </div>
              </div>
            </div>
            {contactStatuses.length > 0 && (
              <div className="status-section">
                <div className="status-section-title">Recent Updates</div>
                {Object.entries(contactStatuses.reduce((acc, s) => {
                  if (!acc[s.ownerUid]) acc[s.ownerUid] = { name: s.ownerName, photo: s.ownerPhoto, items: [] };
                  acc[s.ownerUid].items.push(s); return acc;
                }, {})).map(([uid, group]) => (
                  <div key={uid} className="status-item" onClick={() => setViewingStatus({ owner: group.name, items: group.items, idx: 0 })}>
                    <div className="status-avatar-wrap">
                      <div className="status-avatar">{group.photo ? <img src={group.photo} alt={group.name} /> : group.name.charAt(0).toUpperCase()}</div>
                      <div className="status-ring unseen" />
                    </div>
                    <div className="status-info">
                      <div className="status-name">{group.name}</div>
                      <div className="status-time">{formatTimestamp(group.items[0].timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {sidebarTab === 'calls' && (
          <div className="contact-list" style={{ padding: '12px 0' }}>
            <p style={{ textAlign: 'center', color: 'var(--wa-text-sub)', fontSize: '0.85rem', padding: '2rem 1rem' }}>Start a call from any chat using the call buttons in the header.</p>
            {contacts.filter(c => c !== 'SBF Global Team').map((c, i) => (
              <div key={i} className="contact-item" onClick={() => { setActiveChat(c); setSidebarTab('chats'); }}>
                <div className="avatar">{c.charAt(0).toUpperCase()}</div>
                <div className="contact-info"><div className="contact-name">{c}</div><div className="contact-preview">Tap to call</div></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="icon-btn" style={{ color: 'var(--wa-teal)' }} onClick={e => { e.stopPropagation(); setActiveChat(c); initiateCall('voice'); setSidebarTab('chats'); setMobileChatOpen(true); }}><Phone size={18} /></button>
                  <button className="icon-btn" style={{ color: 'var(--wa-teal)' }} onClick={e => { e.stopPropagation(); setActiveChat(c); initiateCall('video'); setSidebarTab('chats'); setMobileChatOpen(true); }}><Video size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--wa-border)', display: 'flex', gap: 8 }}>
          <button onClick={() => setShowModal('zakat')} style={{ flex: 1, background: '#F0FDF4', color: '#166534', fontSize: '0.78rem', padding: '8px', borderRadius: 8, fontWeight: 600 }}>Zakat</button>
          <button onClick={() => setShowModal('consult')} style={{ flex: 1, background: '#EFF6FF', color: '#1E3A8A', fontSize: '0.78rem', padding: '8px', borderRadius: 8, fontWeight: 600 }}> Consult</button>
        </div>
      </div>

      {/* CHAT PANEL */}
      <div className={`chat-panel ${mobileChatOpen ? 'mobile-open' : ''}`}>
        {activeChat ? (
          <>
            <div className="chat-header">
              <button className="icon-btn" onClick={() => { setMobileChatOpen(false); setActiveChat(null); }} style={{ marginRight: 8 }}>
                <ChevronLeft size={24} />
              </button>
              <div className="avatar">{activeChat.startsWith('Group: ') ? '#' : activeChat.charAt(0).toUpperCase()}</div>
              <div className="chat-header-info">
                <div className="chat-header-name">{activeChat}</div>
                <div className="chat-header-status">End-to-end encrypted</div>
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn" onClick={() => initiateCall('voice')}><Phone size={20} /></button>
                <button className="icon-btn" onClick={() => initiateCall('video')}><Video size={20} /></button>
                <button className="icon-btn" onClick={() => handleAISuggestion('formal')} style={{ fontSize: '0.65rem', width: 'auto', padding: '0 6px' }}><Sparkles size={16} />&nbsp;AI</button>
                <button className="icon-btn"><MoreVertical size={20} /></button>
              </div>
            </div>

            <div className="message-list" style={profile.wallpaper ? { backgroundImage: `url(${profile.wallpaper})`, backgroundSize: 'cover' } : {}}>
              <div className="system-message">Messages are end-to-end encrypted</div>
              {messages.map(msg => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`message ${isMe ? 'sent' : 'received'}`}>
                    {!isMe && <div className="message-sender-name">{msg.senderEmail}</div>}
                    <div className="message-bubble">
                      {msg.text && msg.text !== 'Voice Note' && <span>{msg.text}</span>}
                      {(msg.audioUrl || msg.audioBase64) && (
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                          <Mic size={16} style={{ color: 'var(--wa-teal)', flexShrink: 0 }} />
                          <audio controls src={msg.audioBase64 || msg.audioUrl} style={{ flex: 1 }} />
                        </div>
                      )}
                      {msg.fileUrl && (msg.fileType?.startsWith('image/') ? (
                        <img src={msg.fileUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 6, marginTop: 4, display: 'block' }} />
                      ) : (
                        <div className="file-bubble">
                          <FileText size={18} style={{ color: 'var(--wa-teal)' }} />
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer">{msg.fileName || 'Download File'}</a>
                        </div>
                      ))}
                    </div>
                    <div className="message-meta">
                      <span>{formatTimestamp(msg.timestamp)}</span>
                      {isMe && <span className="msg-ticks read"><CheckCheck size={14} /></span>}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: 'flex', gap: 6, padding: '4px 12px', background: 'var(--wa-bg-panel)', overflowX: 'auto' }}>
              {[['Formal', 'formal'], ['Urdu', 'urdu'], ['Islamic', 'islamic_greeting']].map(([label, action]) => (
                <button key={action} onClick={() => handleAISuggestion(action)}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '4px 10px', borderRadius: 12, background: 'var(--wa-teal)', color: 'white', fontWeight: 600, opacity: isAILoading ? 0.5 : 1 }}>
                  {isAILoading ? '...' : label}
                </button>
              ))}
            </div>

            <div className="input-area">
              {attachment && (
                <div className="attachment-preview">
                  <FileText size={14} /> {attachment.name}
                  <X size={14} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setAttachment(null)} />
                </div>
              )}
              {isRecording && <div className="recording-indicator"><span className="recording-dot" /> Recording...</div>}
              <div className="input-container" style={{ position: 'relative' }}>
                {showEmojiPicker && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 10, background: 'white', borderRadius: 8, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--wa-border)' }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--wa-border)', display: 'flex', alignItems: 'center' }}>
                      <button className="icon-btn" onClick={() => setShowEmojiPicker(false)} style={{ marginRight: 8 }}><ChevronLeft size={18} /></button>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Choose Emoji</span>
                    </div>
                    <EmojiPicker onEmojiClick={(e) => setMessage(prev => prev + e.emoji)} />
                  </div>
                )}
                <button className="icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <Smile size={22} color={showEmojiPicker ? 'var(--wa-teal)' : 'var(--wa-icon)'} />
                </button>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={22} color={attachment ? 'var(--wa-teal)' : 'var(--wa-icon)'} />
                </button>
                <textarea className="message-input" placeholder={isRecording ? 'Recording...' : "Type a message"} rows={1}
                  value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                {message.trim() || attachment ? (
                  <button className="send-btn" onClick={handleSendMessage}><Send size={18} /></button>
                ) : isRecording ? (
                  <button className="send-btn recording" onClick={stopRecording}><Square size={18} fill="white" /></button>
                ) : (
                  <button className="send-btn" onClick={startRecording} style={{ background: 'var(--wa-icon)' }}><Mic size={18} /></button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="no-chat">
            <img src="/logo.png" alt="ummah-sync" style={{ width: 300, height: 300, opacity: 0.15, filter: 'grayscale(1)', marginBottom: 30 }} />
            <h3>ummah-sync</h3>
            <p>Your private, Shariah-compliant messaging platform. Select a chat to begin.</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--wa-text-sub)', marginTop: 8 }}>End-to-end encrypted</p>
          </div>
        )}
      </div>

      {/* STATUS COMPOSE */}
      {showStatusCompose && (
        <div className="modal-overlay" onClick={() => setShowStatusCompose(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <button className="icon-btn" style={{ marginRight: 8 }} onClick={() => setShowStatusCompose(false)}><ChevronLeft size={20} /></button>
              <h3>Add Status Update</h3>
              <X size={20} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setShowStatusCompose(false)} />
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--wa-text-sub)' }}>Disappears after 24 hours</p>
              <div style={{ background: statusBg, borderRadius: 10, padding: '1.5rem', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <textarea placeholder="Type a status..." value={statusText} onChange={e => setStatusText(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'center', fontSize: '1.2rem', fontWeight: 500, width: '100%', resize: 'none', outline: 'none' }} rows={3} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUS_BG_PRESETS.map(c => (
                  <div key={c} onClick={() => setStatusBg(c)}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: statusBg === c ? '3px solid white' : '2px solid transparent', boxShadow: statusBg === c ? '0 0 0 2px var(--wa-teal)' : 'none' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="file" id="status-file-input" accept="image/*,video/*" style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files[0]; if (!file) return;
                    const type = file.type.startsWith('video/') ? 'video' : 'image';
                    const sRef = ref(storage, `statuses/${user.uid}/${Date.now()}_${file.name}`);
                    const snap = await uploadBytes(sRef, file);
                    const url = await getDownloadURL(snap.ref);
                    await postStatus(type, url);
                  }} />
                <button className="modal-btn" style={{ flex: 1, textAlign: 'center' }} onClick={() => document.getElementById('status-file-input').click()}>Photo / Video</button>
                <button className="modal-btn" style={{ flex: 1, textAlign: 'center' }} onClick={() => { if (statusText.trim()) postStatus('text', statusText); }}>Send Status</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUS VIEWER */}
      {viewingStatus && (
        <div className="status-viewer" onClick={() => setViewingStatus(null)}>
          <div className="status-viewer-bar">
            {viewingStatus.items.map((_, i) => (
              <div key={i} className="status-progress">
                {i === viewingStatus.idx && <div className="status-progress-fill" onAnimationEnd={() => {
                  if (viewingStatus.idx < viewingStatus.items.length - 1) setViewingStatus(prev => ({ ...prev, idx: prev.idx + 1 }));
                  else setViewingStatus(null);
                }} />}
              </div>
            ))}
          </div>
          <div className="status-viewer-header">
            <button style={{ color: 'white', marginRight: 12 }} onClick={() => setViewingStatus(null)}><ChevronLeft size={24} /></button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--wa-teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {viewingStatus.owner.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 600 }}>{viewingStatus.owner}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{formatTimestamp(viewingStatus.items[viewingStatus.idx]?.timestamp)}</div>
            </div>
            <button style={{ marginLeft: 'auto', color: 'white' }} onClick={() => setViewingStatus(null)}><X size={24} /></button>
          </div>
          <div className="status-viewer-content" onClick={e => e.stopPropagation()}>
            {(() => {
              const s = viewingStatus.items[viewingStatus.idx];
              if (!s) return null;
              if (s.type === 'image') return <img src={s.content} alt="status" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />;
              if (s.type === 'video') return <video src={s.content} autoPlay controls style={{ maxWidth: '100%', maxHeight: '70vh' }} />;
              return <div className="status-text-display" style={{ background: s.bg || '#128C7E' }}>{s.content}</div>;
            })()}
          </div>
        </div>
      )}

      {/* INCOMING CALL */}
      {activeCall === 'incoming' && incomingCallData && (
        <div className="incoming-call-banner">
          <div className="call-avatar-ring" style={{ width: 52, height: 52, fontSize: '1.5rem', animation: 'none' }}>
            {(incomingCallData.from || '?').charAt(0).toUpperCase()}
          </div>
          <div className="caller-info">
            <div className="caller-name">{incomingCallData.from}</div>
            <div className="call-type-label">Incoming {incomingCallData.type === 'video' ? 'Video' : 'Voice'} Call</div>
          </div>
          <button className="call-reject-btn" onClick={() => endCall(true)}><PhoneOff size={22} /></button>
          <button className="call-accept-btn" onClick={() => { stopRingtone(); playCallConnected(); initiateCall(incomingCallData.type || 'voice', true); }}><Phone size={22} /></button>
        </div>
      )}

      {/* VOICE CALL */}
      {activeCall === 'voice' && (
        <div className="call-overlay">
          <div style={{ textAlign: 'center' }}>
            <div className="call-avatar-ring">{(activeChat || '?').charAt(0).toUpperCase()}</div>
            <div className="call-name">{activeChat}</div>
            <div className="call-status">End-to-End Encrypted Voice</div>
          </div>
          <div className="call-controls">
            <button className={`call-ctrl-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>{isMuted ? <MicOff size={24} /> : <Mic size={24} />}</button>
            <button className="call-end-btn" onClick={endCall}><PhoneOff size={28} /></button>
            <button className="call-ctrl-btn" onClick={() => { if (remoteAudioRef.current) remoteAudioRef.current.volume = remoteAudioRef.current.volume > 0 ? 0 : 1; }}><Volume2 size={24} /></button>
          </div>
        </div>
      )}

      {/* VIDEO CALL */}
      {activeCall === 'video' && (
        <div className="video-call-overlay">
          <video autoPlay playsInline ref={remoteVideoRef} className="remote-video" />
          <video autoPlay playsInline muted ref={localVideoRef} className="local-video-pip" />
          <div style={{ position: 'absolute', top: 20, left: 20, color: 'white' }}>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{activeChat}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>Video Call</div>
          </div>
          <div className="video-controls">
            <button className={`call-ctrl-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>{isMuted ? <MicOff size={22} /> : <Mic size={22} />}</button>
            <button className={`call-ctrl-btn ${isCameraOff ? 'active' : ''}`} onClick={toggleCamera}>{isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}</button>
            <button className="call-end-btn" onClick={endCall}><PhoneOff size={26} /></button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>

            {showModal === 'profile' && (<>
              <div className="modal-header">
                <button className="icon-btn" style={{ marginRight: 8 }} onClick={() => setShowModal(null)}><ChevronLeft size={20} /></button>
                <h3>Profile &amp; Settings</h3>
                <X size={20} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setShowModal(null)} />
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--wa-border)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--wa-teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => profilePicInputRef.current?.click()}>
                    {profile.photoURL ? <img src={profile.photoURL} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{profile.name || myIdentifier}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--wa-text-sub)' }}>{profile.about}</div>
                    <input type="file" ref={profilePicInputRef} style={{ display: 'none' }} onChange={handleProfilePicUpload} accept="image/*" />
                    <button style={{ fontSize: '0.78rem', marginTop: 4, color: 'var(--wa-teal)', fontWeight: 600 }} onClick={() => profilePicInputRef.current?.click()}>Change Photo</button>
                  </div>
                </div>
                <input className="modal-input" placeholder="Your Name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                <input className="modal-input" placeholder="About" value={profile.about} onChange={e => setProfile({ ...profile, about: e.target.value })} />
                <select className="modal-input" value={profile.theme} onChange={e => setProfile({ ...profile, theme: e.target.value })}>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--wa-text-sub)', marginBottom: 8 }}>Chat Wallpaper</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <div onClick={() => setProfile({ ...profile, wallpaper: '' })}
                      style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--wa-bg-chat)', border: !profile.wallpaper ? '2px solid var(--wa-teal)' : '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--wa-text-sub)' }}>
                      None
                    </div>
                    {['https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=300&q=80',
                      'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=300&q=80',
                      'https://images.unsplash.com/photo-1623800331002-3f1fb89eb133?w=300&q=80',
                      'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=300&q=80',
                      'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=300&q=80',
                      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&q=80',
                    ].map((url, i) => (
                      <div key={i} onClick={() => setProfile({ ...profile, wallpaper: url })}
                        style={{ width: 44, height: 44, borderRadius: 6, backgroundImage: `url(${url})`, backgroundSize: 'cover', border: profile.wallpaper === url ? '2px solid var(--wa-teal)' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                <button className="modal-btn" onClick={handleSaveProfile} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>Save Settings</button>
              </div>
            </>)}

            {showModal === 'createGroup' && (<>
              <div className="modal-header">
                <button className="icon-btn" style={{ marginRight: 8 }} onClick={() => setShowModal(null)}><ChevronLeft size={20} /></button>
                <h3>New Group</h3>
                <X size={20} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setShowModal(null)} />
              </div>
              <div className="modal-body">
                <input id="groupNameInput" className="modal-input" placeholder="Group Subject (e.g. Sales Team Alpha)" />
                <button className="modal-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                  onClick={async () => {
                    const gn = document.getElementById('groupNameInput').value.trim();
                    if (gn) {
                      const fg = `Group: ${gn}`; const nc = [...contacts, fg]; setContacts(nc);
                      try { await setDoc(doc(db, 'users', user.uid), { contacts: nc }, { merge: true }); } catch (e) { console.error(e); }
                      setShowModal(null);
                    }
                  }}>Create Group</button>
              </div>
            </>)}

            {showModal === 'zakat' && (<>
              <div className="modal-header">
                <button className="icon-btn" style={{ marginRight: 8 }} onClick={() => setShowModal(null)}><ChevronLeft size={20} /></button>
                <h3>Donate Zakat</h3>
                <X size={20} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setShowModal(null)} />
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--wa-text-sub)', fontSize: '0.9rem' }}>Calculate and donate Zakat to verified Ummah initiatives.</p>
                <input type="number" className="modal-input" placeholder="Amount (USD)" />
                <button className="modal-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => { alert('Redirecting to Zakat Payment Gateway...'); setShowModal(null); }}>Proceed Securely</button>
              </div>
            </>)}
            {showModal === 'consult' && (<>
              <div className="modal-header">
                <button className="icon-btn" style={{ marginRight: 8 }} onClick={() => setShowModal(null)}><ChevronLeft size={20} /></button>
                <h3>Consult SBF</h3>
                <X size={20} style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => setShowModal(null)} />
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--wa-text-sub)', fontSize: '0.9rem' }}>Request Shariah-compliant corporate or legal consultation.</p>
                <textarea className="modal-input" placeholder="Describe your inquiry..." rows={4} style={{ resize: 'none' }} />
                <button className="modal-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => { alert('Consultation submitted!'); setShowModal(null); }}>Submit Request</button>
              </div>
            </>)}
          </div>
        </div>
      )
      }
      {/* Hidden Remote Audio Element */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div >
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#075E54' }}>
        <ShieldCheck size={64} color="#25D366" style={{ animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Site Routes */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/tech" element={<TechStack />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Messaging App Route */}
      <Route 
        path="/app" 
        element={user ? <ChatApp user={user} /> : <Login />} 
      />

      {/* Catch-all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
