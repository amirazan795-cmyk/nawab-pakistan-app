import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ArrowLeft,
  MessageSquare,
  Send,
  MapPin,
  Phone,
  Home,
  CheckCircle2,
  Clock,
  Camera,
  Mic,
  Square,
  Play,
  Pause,
  Check,
  CheckCheck,
  Navigation,
  ShoppingBag,
  Loader2,
} from 'lucide-react';

interface LiveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  perspective?: 'buyer' | 'seller';
}

const compressImageFile = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read photo'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const maxSide = 900;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const VoiceMessagePlayer: React.FC<{
  audioUrl: string;
  durationSec?: number;
  isMine: boolean;
}> = ({ audioUrl, durationSec = 0, isMine }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const formattedDur = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
          isMine
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-0.5 h-4">
          {[35, 65, 50, 90, 60, 80, 45, 75, 55, 40, 70, 50].map((h, idx) => (
            <span
              key={idx}
              className={`w-1 rounded-full ${
                isMine ? 'bg-white/75' : 'bg-emerald-600/70'
              } ${isPlaying ? 'animate-pulse' : ''}`}
              style={{ height: `${Math.round((h / 100) * 16)}px` }}
            />
          ))}
        </div>
        <span
          className={`text-[10px] font-mono font-bold block ${
            isMine ? 'text-emerald-100' : 'text-slate-500'
          }`}
        >
          Voice Message · {formattedDur}
        </span>
      </div>
    </div>
  );
};

export const LiveChatModal: React.FC<LiveChatModalProps> = ({
  isOpen,
  onClose,
  perspective,
}) => {
  const {
    chatThreads,
    activeChatThreadId,
    setActiveChatThreadId,
    sendChatMessage,
    markThreadRead,
    authUser,
    selectedCity,
    selectedArea,
    currentSeller,
    isUserOnline,
    startInAppCall,
  } = useApp();

  const viewerRole: 'buyer' | 'seller' =
    perspective || (authUser?.role === 'seller' ? 'seller' : 'buyer');

  const [inputText, setInputText] = useState('');
  const [showLocationBox, setShowLocationBox] = useState(false);
  const [addressDraft, setAddressDraft] = useState(
    authUser?.address ||
      (selectedArea && selectedCity ? `${selectedArea}, ${selectedCity}` : selectedCity || '')
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordDurationRef = useRef(0);
  const cancelRecordingRef = useRef(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const visibleThreads = chatThreads.filter((t) => {
    if (viewerRole === 'seller') {
      return (
        t.sellerId === currentSeller.id ||
        t.sellerName === currentSeller.shopName ||
        t.sellerName === currentSeller.name ||
        (authUser?.phone &&
          t.sellerPhone.replace(/\D/g, '') === authUser.phone.replace(/\D/g, ''))
      );
    }
    if (authUser?.phone) {
      return t.buyerPhone.replace(/\D/g, '') === authUser.phone.replace(/\D/g, '');
    }
    return true;
  });

  const activeThread =
    visibleThreads.find((t) => t.id === activeChatThreadId) ||
    chatThreads.find((t) => t.id === activeChatThreadId) ||
    null;

  useEffect(() => {
    if (isOpen && activeThread) {
      markThreadRead(activeThread.id, viewerRole);
    }
  }, [isOpen, activeThread?.id, activeThread?.messages.length, viewerRole]);

  useEffect(() => {
    if (isOpen && activeThread) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeThread?.id, activeThread?.messages.length]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        cancelRecordingRef.current = true;
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  const partnerName = activeThread
    ? viewerRole === 'buyer'
      ? activeThread.sellerName
      : activeThread.buyerName
    : '';
  const partnerPhone = activeThread
    ? viewerRole === 'buyer'
      ? activeThread.sellerPhone
      : activeThread.buyerPhone
    : '';
  const partnerOnline = activeThread
    ? isUserOnline(
        viewerRole === 'buyer' ? activeThread.sellerId : activeThread.buyerPhone,
        partnerName
      ) || isUserOnline(partnerPhone, partnerName)
    : false;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;
    sendChatMessage(activeThread.id, inputText.trim(), viewerRole, 'text');
    setInputText('');
  };

  const handleSendManualLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressDraft.trim() || !activeThread) return;
    sendChatMessage(
      activeThread.id,
      `📍 Home Location: ${addressDraft.trim()}`,
      viewerRole,
      'location',
      {
        locationInfo: {
          address: addressDraft.trim(),
        },
      }
    );
    setShowLocationBox(false);
  };

  const handleSendLiveGPSLocation = () => {
    if (!activeThread) return;
    if (!navigator.geolocation) {
      setMediaNotice('GPS supported nahi hai. Neeche apna home address likh kar bhejein.');
      return;
    }
    setMediaNotice(null);
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const label =
          addressDraft.trim() ||
          authUser?.address ||
          `${selectedArea || 'My Area'}, ${selectedCity || 'Pakistan'}`;
        const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        sendChatMessage(
          activeThread.id,
          `📍 Live GPS Location: ${label}`,
          viewerRole,
          'location',
          {
            locationInfo: {
              address: label,
              lat: Number(latitude.toFixed(6)),
              lng: Number(longitude.toFixed(6)),
              mapUrl,
            },
          }
        );
        setGpsLoading(false);
        setShowLocationBox(false);
      },
      () => {
        setGpsLoading(false);
        setMediaNotice('GPS permission deny ho gayi. Apna home address likh kar bhejein.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeThread) return;
    setMediaNotice(null);
    try {
      const compressed = await compressImageFile(file);
      sendChatMessage(activeThread.id, '📷 Photo bheji gayi', viewerRole, 'photo', {
        imageUrl: compressed,
      });
    } catch {
      setMediaNotice('Photo upload nahi ho saki. Dobara try karein.');
    }
  };

  const startVoiceRecording = async () => {
    if (!activeThread || isRecording) return;
    setMediaNotice(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMediaNotice('Is browser/device me voice recording available nahi hai.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordDurationRef.current = 0;
      cancelRecordingRef.current = false;
      setRecordingSeconds(0);
      setIsRecording(true);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {
            // ignore
          }
        });
        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setIsRecording(false);

        if (cancelRecordingRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (dataUrl && activeThread) {
            const dur = Math.max(1, recordDurationRef.current);
            sendChatMessage(
              activeThread.id,
              `🎤 Voice message (${dur}s)`,
              viewerRole,
              'voice',
              {
                audioUrl: dataUrl,
                audioDurationSec: dur,
              }
            );
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      recordTimerRef.current = window.setInterval(() => {
        recordDurationRef.current += 1;
        setRecordingSeconds(recordDurationRef.current);
      }, 1000);
    } catch {
      setIsRecording(false);
      setMediaNotice('Mic permission allow karein voice message bhejne ke liye.');
    }
  };

  const stopVoiceRecording = (cancel: boolean) => {
    cancelRecordingRef.current = cancel;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
    }
  };

  const handleInAppCallClick = () => {
    if (!activeThread) return;
    startInAppCall({
      calleeId: viewerRole === 'buyer' ? activeThread.sellerId : activeThread.buyerPhone,
      calleeName: partnerName,
      calleePhone: partnerPhone,
      calleeRole: viewerRole === 'buyer' ? 'seller' : 'buyer',
      productTitle: activeThread.productTitle,
    });
  };

  const renderTicks = (isMine: boolean, seen?: boolean, delivered?: boolean) => {
    if (!isMine) return null;
    if (seen) {
      return <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline shrink-0" aria-label="Seen" />;
    }
    if (delivered !== false) {
      return <CheckCheck className="w-3.5 h-3.5 text-slate-400 inline shrink-0" aria-label="Delivered" />;
    }
    return <Check className="w-3.5 h-3.5 text-slate-400 inline shrink-0" aria-label="Sent" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl h-[90vh] sm:h-[640px] shadow-2xl flex flex-col overflow-hidden border border-emerald-100">
        {/* Top NAWAB Secure Chat Header */}
        <div className="bg-emerald-800 text-white shrink-0">
          <div className="p-3.5 sm:p-4 border-b border-emerald-700/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeThread ? (
                <button
                  type="button"
                  onClick={() => setActiveChatThreadId(null)}
                  className="p-1.5 hover:bg-white/15 rounded-xl text-white cursor-pointer shrink-0"
                  aria-label="Back to chats"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-white/15 text-amber-300 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
              )}

              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base leading-tight truncate text-white">
                  NAWAB Secure Chat
                </h3>
                <p className="text-[11px] text-emerald-100 truncate">
                  Direct Chat with Seller - Fast, Private &amp; Secure
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeThread && (
                <button
                  type="button"
                  onClick={handleInAppCallClick}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  title="In-App Voice Call"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-300" />
                  <span>Call</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 hover:bg-white/15 rounded-xl text-white cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {activeThread && (
            <div className="px-4 py-2 bg-emerald-900/60 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <strong className="font-extrabold text-white truncate">{partnerName}</strong>
                <span className="text-[11px] text-emerald-200 truncate">
                  {activeThread.productTitle ? `· ${activeThread.productTitle}` : `· ${partnerPhone}`}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                  partnerOnline
                    ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/50'
                    : 'bg-white/10 text-emerald-100/80'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    partnerOnline ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span>{partnerOnline ? 'Online' : 'Offline'}</span>
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        {!activeThread ? (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-slate-50/40">
            {visibleThreads.length === 0 ? (
              <div className="p-10 text-center space-y-2.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-amber-500 mx-auto flex items-center justify-center border border-emerald-100">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Abhi koi chat nahi hai
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {viewerRole === 'buyer'
                    ? 'Kisi bhi product ya service par click karke "Chat Now", "Order via Chat", ya "Book at Home" dabayein.'
                    : 'Jab koi buyer aapko chat, order, ya Home Service booking bhejega to woh yahan nazar aayegi.'}
                </p>
              </div>
            ) : (
              visibleThreads.map((thread) => {
                const lastMsg = thread.messages[thread.messages.length - 1];
                const unreadCount =
                  viewerRole === 'buyer'
                    ? thread.unreadForBuyer || 0
                    : thread.unreadForSeller || 0;
                const displayName =
                  viewerRole === 'buyer' ? thread.sellerName : thread.buyerName;
                const threadOnline = isUserOnline(
                  viewerRole === 'buyer' ? thread.sellerId : thread.buyerPhone,
                  displayName
                );

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setActiveChatThreadId(thread.id);
                      markThreadRead(thread.id, viewerRole);
                    }}
                    className="w-full p-4 hover:bg-emerald-50/60 transition-colors flex items-center gap-3 text-left cursor-pointer bg-white"
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-amber-300 font-extrabold flex items-center justify-center text-base">
                        {(displayName || 'NW')[0].toUpperCase()}
                      </div>
                      {threadOnline && (
                        <span className="w-3 h-3 rounded-full bg-[#25D366] border-2 border-white absolute -bottom-0.5 -right-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm font-extrabold text-slate-900 truncate">
                          {displayName}
                        </strong>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {thread.updatedAt}
                        </span>
                      </div>
                      {thread.productTitle && (
                        <p className="text-[11px] text-emerald-700 font-bold truncate">
                          {thread.productTitle}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-slate-500 truncate">
                          {lastMsg ? lastMsg.text : 'Tap to start chatting'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-[#25D366] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-[#EFEAE2]">
            {/* Messages list */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
              {activeThread.messages.length === 0 ? (
                <div className="text-center py-8 px-4 bg-white/90 rounded-2xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <p className="text-xs font-extrabold text-emerald-950">
                    NAWAB Secure Chat
                  </p>
                  <p className="text-[11px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Text, Photo, Voice Message ya apna Home Location bhejein. Payment Direct Seller ko Cash on spot dein.
                  </p>
                </div>
              ) : (
                activeThread.messages.map((msg) => {
                  const isMine = msg.senderRole === viewerRole;

                  if (msg.type === 'booking' && msg.bookingInfo) {
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div className="max-w-[88%] bg-white border-2 border-emerald-500 rounded-2xl p-3.5 shadow-sm space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                            <Home className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Book at Home Request</span>
                          </div>
                          <p className="font-bold text-slate-900">
                            {msg.bookingInfo.productTitle}
                            {msg.bookingInfo.packageName ? ` · ${msg.bookingInfo.packageName}` : ''}
                          </p>
                          <p className="font-extrabold text-emerald-700 tabular-nums">
                            Rs {msg.bookingInfo.price.toLocaleString()}
                          </p>
                          <div className="bg-emerald-50/80 rounded-xl p-2 space-y-1 text-[11px] text-slate-700">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span>
                                <strong>Address:</strong> {msg.bookingInfo.address}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>
                                <strong>Time:</strong> {msg.bookingInfo.preferredTime}
                              </span>
                            </div>
                            {msg.bookingInfo.notes && (
                              <p className="text-slate-600">
                                <strong>Note:</strong> {msg.bookingInfo.notes}
                              </p>
                            )}
                          </div>
                          <p className="text-[10px] font-bold text-emerald-800">
                            Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-600 mt-0.5 px-1 flex items-center gap-1">
                          <span>{msg.time}</span>
                          {renderTicks(isMine, msg.seen, msg.delivered)}
                        </span>
                      </div>
                    );
                  }

                  if (msg.type === 'order' && msg.orderInfo) {
                    const totalPrice = msg.orderInfo.price * msg.orderInfo.quantity;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div className="max-w-[88%] bg-white border-2 border-[#25D366] rounded-2xl p-3.5 shadow-sm space-y-2 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                            <ShoppingBag className="w-4 h-4 text-[#25D366] shrink-0" />
                            <span>Order via Chat</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            {msg.orderInfo.productImage && (
                              <img
                                src={msg.orderInfo.productImage}
                                alt={msg.orderInfo.productTitle}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 truncate">
                                {msg.orderInfo.quantity}x {msg.orderInfo.productTitle}
                              </p>
                              <p className="font-black text-emerald-700 tabular-nums">
                                Rs {totalPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-2 text-[11px] font-bold text-emerald-900">
                            Cash on Delivery · Payment Direct Seller ko Dein - Cash / JazzCash / Easypaisa
                          </div>
                          {viewerRole === 'buyer' && (
                            <button
                              type="button"
                              onClick={() => setShowLocationBox(true)}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-amber-300" />
                              <span>Send Location</span>
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600 mt-0.5 px-1 flex items-center gap-1">
                          <span>{msg.time}</span>
                          {renderTicks(isMine, msg.seen, msg.delivered)}
                        </span>
                      </div>
                    );
                  }

                  if (msg.type === 'location' || msg.type === 'address') {
                    const addr = msg.locationInfo?.address || msg.text;
                    const mapUrl = msg.locationInfo?.mapUrl;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div className="max-w-[85%] bg-amber-50 border-2 border-amber-300 rounded-2xl p-3 shadow-xs space-y-1.5 text-xs text-amber-950">
                          <div className="flex items-center gap-1.5 font-extrabold text-emerald-900">
                            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                            <span>Buyer Home Location</span>
                          </div>
                          <p className="font-bold text-slate-900 leading-snug">{addr}</p>
                          {msg.locationInfo?.lat !== undefined && msg.locationInfo?.lng !== undefined && (
                            <p className="text-[10px] font-mono text-slate-600">
                              GPS: {msg.locationInfo.lat}, {msg.locationInfo.lng}
                            </p>
                          )}
                          {mapUrl && (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 hover:underline"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>View on Map</span>
                            </a>
                          )}
                          <p className="text-[10px] text-emerald-800 font-semibold pt-0.5 border-t border-amber-200/80">
                            Seller ghar aakar deliver / kaam karega · Cash on spot
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-600 mt-0.5 px-1 flex items-center gap-1">
                          <span>{msg.time}</span>
                          {renderTicks(isMine, msg.seen, msg.delivered)}
                        </span>
                      </div>
                    );
                  }

                  if (msg.type === 'photo' && msg.imageUrl) {
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl p-1.5 shadow-xs ${
                            isMine
                              ? 'bg-emerald-700 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(msg.imageUrl || null)}
                            className="block rounded-xl overflow-hidden cursor-pointer"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Chat photo"
                              className="w-full max-h-56 object-cover rounded-xl"
                            />
                          </button>
                          <div className="flex items-center justify-end gap-1 px-1.5 pt-1 text-[10px]">
                            <span className={isMine ? 'text-emerald-100' : 'text-slate-400'}>
                              {msg.time}
                            </span>
                            {renderTicks(isMine, msg.seen, msg.delivered)}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'voice' && msg.audioUrl) {
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3 py-2 shadow-xs ${
                            isMine
                              ? 'bg-emerald-700 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <VoiceMessagePlayer
                            audioUrl={msg.audioUrl}
                            durationSec={msg.audioDurationSec}
                            isMine={isMine}
                          />
                        </div>
                        <span className="text-[10px] text-slate-600 mt-0.5 px-1 flex items-center gap-1">
                          <span>{msg.time}</span>
                          {renderTicks(isMine, msg.seen, msg.delivered)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs font-medium shadow-2xs ${
                          isMine
                            ? 'bg-emerald-700 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <span className="whitespace-pre-wrap break-words">{msg.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-600 mt-0.5 px-1 flex items-center gap-1">
                        <span>{msg.time}</span>
                        {renderTicks(isMine, msg.seen, msg.delivered)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {mediaNotice && (
              <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-between gap-2">
                <span>{mediaNotice}</span>
                <button
                  type="button"
                  onClick={() => setMediaNotice(null)}
                  className="text-amber-700 font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Send Location Drawer */}
            {showLocationBox && (
              <form
                onSubmit={handleSendManualLocation}
                className="p-3 bg-emerald-50 border-t border-emerald-200 space-y-2.5 shrink-0"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Send Location (Ghar Ka Address / GPS)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationBox(false)}
                    className="text-slate-500 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSendLiveGPSLocation}
                  disabled={gpsLoading}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Getting Live Location...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-amber-300" />
                      <span>Share Live GPS Location Now</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={addressDraft}
                    onChange={(e) => setAddressDraft(e.target.value)}
                    placeholder="House #, Street, Mohalla, City..."
                    className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 bg-white text-base font-medium focus:outline-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}

            {/* Quick Action Strip: Send Location + Photo + Voice Note */}
            {!showLocationBox && (
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLocationBox(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Send Location</span>
                </button>

                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Photo</span>
                </button>

                <span className="text-[11px] text-slate-400 truncate">
                  Cash on spot · Direct Seller
                </span>
              </div>
            )}

            {/* Hidden Photo File Input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Voice Recording Bar OR Standard Chat Input */}
            {isRecording ? (
              <div className="p-3 bg-red-50 border-t border-red-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 text-red-700 text-xs font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                  <span>Recording Voice... {recordingSeconds}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(true)}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => stopVoiceRecording(false)}
                    className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Send Voice</span>
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-1.5 sm:gap-2 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer shrink-0"
                  aria-label="Send photo"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="Message likhein..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 text-base bg-slate-50/50"
                />

                {inputText.trim() ? (
                  <button
                    type="submit"
                    className="p-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                    aria-label="Record voice message"
                    title="Hold / Tap for Voice Message"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </form>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Photo Preview Modal */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImageUrl}
            alt="Full preview"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
