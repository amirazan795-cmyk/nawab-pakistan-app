import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneCall,
  User,
  X,
  WifiOff,
  Clock,
} from 'lucide-react';

const formatDuration = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const VoiceCallModal: React.FC = () => {
  const {
    activeVoiceCall,
    authUser,
    currentSeller,
    acceptInAppCall,
    rejectInAppCall,
    markInAppCallMissed,
    endInAppCall,
    dismissVoiceCall,
  } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [ringSeconds, setRingSeconds] = useState(0);
  const [callSeconds, setCallSeconds] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const myDigits = (authUser?.phone || '').replace(/\D/g, '');
  const callerDigits = (activeVoiceCall?.callerPhone || '').replace(/\D/g, '');
  const calleeDigits = (activeVoiceCall?.calleePhone || '').replace(/\D/g, '');

  const isCallerOnThisTab = !!activeVoiceCall && (
    (myDigits && callerDigits && myDigits === callerDigits) ||
    (!myDigits &&
      activeVoiceCall.callerRole === (authUser?.role === 'seller' ? 'seller' : 'buyer'))
  );

  const isCalleeOnThisTab =
    !!activeVoiceCall &&
    !isCallerOnThisTab &&
    (activeVoiceCall.calleeId === currentSeller.id ||
      (myDigits && calleeDigits && myDigits === calleeDigits) ||
      (authUser?.role === activeVoiceCall.calleeRole &&
        (!callerDigits || callerDigits !== myDigits)));

  // Stop local audio/WebRTC streams cleanly
  const cleanupWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      try {
        peerRef.current.close();
      } catch {
        // ignore
      }
      peerRef.current = null;
    }
  };

  // Ringing countdown & 20-second unanswered timeout
  useEffect(() => {
    if (!activeVoiceCall) {
      setRingSeconds(0);
      setCallSeconds(0);
      setIsMuted(false);
      setIsSpeakerOn(true);
      cleanupWebRTC();
      return;
    }

    if (activeVoiceCall.status === 'ringing') {
      const updateTimer = () => {
        const elapsed = Math.max(0, Math.floor((Date.now() - activeVoiceCall.startedAtMs) / 1000));
        setRingSeconds(elapsed);
        if (elapsed >= 20 && isCallerOnThisTab) {
          markInAppCallMissed();
        }
      };
      updateTimer();
      const iv = window.setInterval(updateTimer, 500);
      return () => window.clearInterval(iv);
    }

    if (activeVoiceCall.status === 'connected') {
      const baseMs = activeVoiceCall.connectedAtMs || Date.now();
      const updateConnected = () => {
        setCallSeconds(Math.max(0, Math.floor((Date.now() - baseMs) / 1000)));
      };
      updateConnected();
      const iv = window.setInterval(updateConnected, 1000);
      return () => window.clearInterval(iv);
    }

    if (activeVoiceCall.status === 'ended') {
      cleanupWebRTC();
      const t = window.setTimeout(() => {
        dismissVoiceCall();
      }, 1100);
      return () => window.clearTimeout(t);
    }
  }, [activeVoiceCall?.id, activeVoiceCall?.status, isCallerOnThisTab]);

  // Web Audio API Ringing Sound (Outgoing Ringback / Incoming NAWAB Call Chime)
  useEffect(() => {
    if (!activeVoiceCall || activeVoiceCall.status !== 'ringing') {
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
        audioCtxRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const playToneBurst = () => {
        if (cancelled || ctx.state === 'closed') return;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        if (isCalleeOnThisTab) {
          // Incoming NAWAB voice call pleasant chime (G5 - B5 - D6)
          const notes = [783.99, 987.77, 1174.66];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.16);
            gain.gain.setValueAtTime(0.001, now + idx * 0.16);
            gain.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.16 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.16);
            osc.stop(now + idx * 0.16 + 0.26);
          });
        } else {
          // Outgoing gentle ringback tone (440Hz + 480Hz)
          [440, 480].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.06, now + 0.04);
            gain.gain.setValueAtTime(0.06, now + 0.85);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 1.0);
          });
        }
      };

      playToneBurst();
      const ringInterval = window.setInterval(playToneBurst, isCalleeOnThisTab ? 2100 : 2800);

      return () => {
        cancelled = true;
        window.clearInterval(ringInterval);
        try {
          ctx.close();
        } catch {
          // ignore
        }
        audioCtxRef.current = null;
      };
    } catch {
      return;
    }
  }, [activeVoiceCall?.id, activeVoiceCall?.status, isCalleeOnThisTab]);

  // Optional live cross-tab WebRTC audio when call connects
  useEffect(() => {
    if (!activeVoiceCall || activeVoiceCall.status !== 'connected') return;
    if (typeof BroadcastChannel === 'undefined' || typeof RTCPeerConnection === 'undefined') return;

    let closed = false;
    const signalChannel = new BroadcastChannel('nawab_webrtc_signaling');
    const callId = activeVoiceCall.id;

    const setupPeer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (closed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((t) => {
          t.enabled = !isMuted;
        });

        const pc = new RTCPeerConnection();
        peerRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (ev) => {
          if (remoteAudioRef.current && ev.streams[0]) {
            remoteAudioRef.current.srcObject = ev.streams[0];
            remoteAudioRef.current.muted = !isSpeakerOn;
            remoteAudioRef.current.play().catch(() => {});
          }
        };

        pc.onicecandidate = (ev) => {
          if (ev.candidate) {
            signalChannel.postMessage({
              callId,
              fromCaller: isCallerOnThisTab,
              type: 'ice',
              candidate: ev.candidate.toJSON(),
            });
          }
        };

        signalChannel.onmessage = async (ev) => {
          const data = ev.data;
          if (!data || data.callId !== callId || data.fromCaller === isCallerOnThisTab) return;
          try {
            if (data.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              signalChannel.postMessage({
                callId,
                fromCaller: isCallerOnThisTab,
                type: 'answer',
                sdp: answer,
              });
            } else if (data.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } else if (data.type === 'ice' && data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch {
            // ignore WebRTC negotiation errors gracefully
          }
        };

        if (isCallerOnThisTab) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          signalChannel.postMessage({
            callId,
            fromCaller: true,
            type: 'offer',
            sdp: offer,
          });
        }
      } catch {
        // Microphone unavailable or denied: call UI timer/controls still continue cleanly
      }
    };

    setupPeer();

    return () => {
      closed = true;
      signalChannel.close();
      cleanupWebRTC();
    };
  }, [activeVoiceCall?.id, activeVoiceCall?.status]);

  // Sync Mute & Speaker state to live tracks
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn]);

  if (!activeVoiceCall) return null;

  const isIncoming = isCalleeOnThisTab;
  const displayName = isIncoming ? activeVoiceCall.callerName : activeVoiceCall.calleeName;
  const displayPhone = isIncoming ? activeVoiceCall.callerPhone : activeVoiceCall.calleePhone;
  const cleanPhone = displayPhone.replace(/[^\d+]/g, '');
  const initials = (displayName || 'NW')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const remainingTimeout = Math.max(0, 20 - ringSeconds);
  const showPhoneFallback =
    !isIncoming &&
    (activeVoiceCall.status === 'missed' ||
      activeVoiceCall.status === 'rejected' ||
      (activeVoiceCall.status === 'ringing' && !!activeVoiceCall.isCalleeOffline));

  return (
    <div className="fixed inset-0 z-[80] bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-950 text-white flex flex-col justify-between p-6 select-none">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pt-2">
        <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>NAWAB Voice Call · End-to-End</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (activeVoiceCall.status === 'ringing' || activeVoiceCall.status === 'connected') {
              endInAppCall();
            }
            dismissVoiceCall();
          }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          aria-label="Close Call Screen"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Contact Profile + Status */}
      <div className="flex flex-col items-center text-center space-y-4 max-w-md w-full mx-auto my-auto">
        <div className="relative">
          {activeVoiceCall.status === 'ringing' && (
            <>
              <span className="absolute -inset-4 rounded-full border-2 border-emerald-400/40 animate-ping" />
              <span className="absolute -inset-2 rounded-full border-2 border-amber-300/40 animate-pulse" />
            </>
          )}
          <div className="w-28 h-28 rounded-full bg-emerald-700 border-4 border-amber-300/80 shadow-2xl flex items-center justify-center overflow-hidden relative z-10">
            {!isIncoming && activeVoiceCall.calleePhoto ? (
              <img
                src={activeVoiceCall.calleePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-black text-amber-300">
                {initials || <User className="w-12 h-12" />}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {displayName}
          </h2>
          {activeVoiceCall.productTitle && (
            <p className="text-xs font-bold text-amber-300">
              {activeVoiceCall.productTitle}
            </p>
          )}
          <p className="text-xs font-mono text-emerald-200/90">
            {displayPhone}
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-extrabold flex items-center gap-2">
          {activeVoiceCall.status === 'ringing' && (
            <>
              <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>
                {isIncoming
                  ? 'Incoming NAWAB Voice Call...'
                  : activeVoiceCall.isCalleeOffline
                  ? `Offline · Ringing (${remainingTimeout}s)...`
                  : `Ringing... (${remainingTimeout}s)`}
              </span>
            </>
          )}
          {activeVoiceCall.status === 'connected' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-sm text-emerald-200">
                Connected · {formatDuration(callSeconds)}
              </span>
            </>
          )}
          {activeVoiceCall.status === 'missed' && (
            <span className="text-amber-300">No Answer (20s timeout)</span>
          )}
          {activeVoiceCall.status === 'rejected' && (
            <span className="text-red-300">Call Declined</span>
          )}
          {activeVoiceCall.status === 'ended' && (
            <span className="text-slate-200">Call Ended</span>
          )}
        </div>

        {/* Offline / 20s No Answer Fallback: "Call on Phone Number" */}
        {showPhoneFallback && (
          <div className="w-full bg-white/10 backdrop-blur-md border border-amber-300/50 rounded-2xl p-4 space-y-3 mt-2">
            <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-extrabold">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                {activeVoiceCall.status === 'missed'
                  ? 'Seller ne 20 seconds me answer nahi kiya'
                  : activeVoiceCall.status === 'rejected'
                  ? 'Seller ne in-app call decline kar di'
                  : 'Seller abhi app par offline hain'}
              </span>
            </div>
            <a
              href={`tel:${cleanPhone}`}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <PhoneCall className="w-4 h-4 text-amber-300" />
              <span>Call on Phone Number ({displayPhone})</span>
            </a>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="max-w-md w-full mx-auto pb-6">
        {isIncoming && activeVoiceCall.status === 'ringing' ? (
          /* Incoming Call Accept / Reject */
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={rejectInAppCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-xl cursor-pointer transition-all"
                aria-label="Reject Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-extrabold text-red-200">Reject</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={acceptInAppCall}
                className="w-16 h-16 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] active:scale-95 text-white flex items-center justify-center shadow-xl cursor-pointer transition-all animate-bounce"
                aria-label="Accept Call"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-xs font-extrabold text-emerald-200">Accept</span>
            </div>
          </div>
        ) : activeVoiceCall.status === 'missed' || activeVoiceCall.status === 'rejected' ? (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={dismissVoiceCall}
              className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-sm cursor-pointer transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          /* Active / Outgoing Call Controls: Mute, End Call, Speaker */
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                isMuted ? 'text-amber-300' : 'text-white'
              }`}
            >
              <div
                className={`w-13 h-13 rounded-full flex items-center justify-center ${
                  isMuted ? 'bg-white text-emerald-950' : 'bg-white/15 hover:bg-white/25'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </div>
              <span className="text-[11px] font-bold">{isMuted ? 'Muted' : 'Mute'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                endInAppCall();
              }}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white flex items-center justify-center shadow-xl transition-all">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-extrabold text-red-200">End Call</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSpeakerOn((prev) => !prev)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                isSpeakerOn ? 'text-amber-300' : 'text-white/70'
              }`}
            >
              <div
                className={`w-13 h-13 rounded-full flex items-center justify-center ${
                  isSpeakerOn ? 'bg-white text-emerald-950' : 'bg-white/15 hover:bg-white/25'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <span className="text-[11px] font-bold">Speaker</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
