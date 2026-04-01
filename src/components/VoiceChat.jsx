import React, { useEffect, useState, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Users, Play, Radio, X } from 'lucide-react';

// Initialize the Agora Client
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// Set log level to 'error' for production
AgoraRTC.setLogLevel(3);

const VoiceChat = ({ channel, onEndCall, isModal = true, isVisible, onClose, isDeafened }) => {
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [volumeLevels, setVolumeLevels] = useState({}); // { uid: volume }
  const [isConnecting, setIsConnecting] = useState(true);

  // Handle Deafen State (Local Audio Mute for Others)
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (isDeafened) {
        user.audioTrack?.stop();
      } else {
        user.audioTrack?.play();
      }
    });
  }, [isDeafened, remoteUsers]);

  useEffect(() => {
    let audioTrack;
    let isMounted = true;

    const startVoiceChat = async () => {
      const appId = import.meta.env.VITE_AGORA_APP_ID; 

      try {
        setIsConnecting(true);
        // Enable volume indicators
        client.enableAudioVolumeIndicator();

        await client.join(appId, channel || 'test', null, null);

        if (!isMounted) return; 

        audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        setLocalAudioTrack(audioTrack);
        
        await client.publish([audioTrack]);
        setIsConnecting(false);

        // Listen for remote users
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") {
            // Only play if not deafened
            if (!isDeafened) {
              user.audioTrack.play();
            }
            
            setRemoteUsers(prev => {
              if (prev.find(u => u.uid === user.uid)) return prev;
              return [...prev, user];
            });
          }
        });

        client.on("user-unpublished", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on("user-left", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        // Volume Indicator
        client.on("volume-indicator", (volumes) => {
          const levels = {};
          volumes.forEach((volume) => {
            levels[volume.uid] = volume.level;
          });
          setVolumeLevels(levels);
        });

      } catch (error) {
        if (isMounted) {
          console.error("Voice Chat Setup Failed:", error);
          setIsConnecting(false);
        }
      }
    };

    startVoiceChat();

    return () => {
      isMounted = false;
      if (audioTrack) {
        audioTrack.stop();
        audioTrack.close();
      }
      client.removeAllListeners();
      client.leave();
    };
  }, [channel]);

  const toggleMute = async () => {
    if (localAudioTrack) {
      const newMutedState = !isMuted;
      await localAudioTrack.setEnabled(!newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const isUserSpeaking = (uid) => {
    // Agora volume level is typically 0-100
    return (volumeLevels[uid] || 0) > 10;
  };

  const renderMinimalUI = () => {
    const activeSpeakers = remoteUsers.filter(u => isUserSpeaking(u.uid));
    const amISpeaking = !isMuted && isUserSpeaking(0);

    if (activeSpeakers.length === 0 && !amISpeaking) return null;

    return (
      <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {amISpeaking && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-orange-500/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3 shadow-2xl"
            >
              <div className="flex gap-0.5 items-center h-3">
                {[1, 2, 3].map(i => <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} className="w-0.5 bg-white" />)}
              </div>
              <span className="text-[10px] font-black uppercase text-white tracking-widest">You are speaking</span>
            </motion.div>
          )}

          {activeSpeakers.map((user, idx) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl"
            >
              <div className="flex gap-0.5 items-center h-3">
                {[1, 2, 3].map(i => <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} className="w-0.5 bg-blue-400" />)}
              </div>
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Manager {(user.uid + "").slice(-4)} is speaking</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderInnerUI = () => {
    if (isConnecting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-white bg-black/20 rounded-3xl backdrop-blur-md border border-white/5">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <Radio className="absolute inset-0 m-auto text-orange-500 animate-pulse" size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/50">Establishing Secure Uplink...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-[#080808] p-6 lg:p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] transition-all duration-1000 blur-[80px] rounded-full opacity-20 ${isMuted ? 'bg-red-600/30' : 'bg-orange-500/30 animate-pulse'}`} />
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
          >
            <X size={20} className="text-gray-400" />
          </button>
        )}

        <div className="relative z-10 flex flex-col h-full gap-4 md:gap-8">
          {/* Header Section */}
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-1 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-red-500' : 'bg-orange-500 animate-pulse ring-4 ring-orange-500/20'}`} />
                Squad Voice Hub
              </h3>
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{channel || 'Lobby'} • Session Active</p>
            </div>
            
            <div className="flex items-center gap-3">
               {isDeafened && (
                 <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Deafened</span>
                 </div>
               )}
               <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 backdrop-blur-xl">
                 <Users size={12} className="text-gray-400" />
                 <span className="text-[10px] font-black text-white">{remoteUsers.length + 1} Online</span>
               </div>
            </div>
          </div>

          {/* Central Pulse Microphone */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-500 relative border-4 shrink-0 ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)]' 
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.2)]'
              }`}
            >
              {!isMuted && isUserSpeaking(0) && (
                <>
                  <motion.div initial={{ scale: 1, opacity: 1 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 rounded-full border-2 border-orange-500/30" />
                  <motion.div initial={{ scale: 1, opacity: 0.5 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} className="absolute inset-0 rounded-full border border-orange-500/20" />
                </>
              )}

              <div className={`transition-all duration-500 flex items-center justify-center ${!isMuted && isUserSpeaking(0) ? 'scale-110' : ''}`}>
                {isMuted ? <MicOff className="size-10 md:size-14" /> : <Mic className="size-10 md:size-14" />}
              </div>
              
              <div className={`absolute -bottom-2 px-6 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl transition-all duration-300 ${
                isMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-white/10 border-white/20 text-white'
              }`}>
                {isMuted ? 'Muted' : 'Speaking'}
              </div>
            </motion.button>
            
            <p className="mt-4 text-[9px] text-center max-w-[200px] text-gray-500 font-bold uppercase tracking-[0.2em] leading-relaxed">
              {isMuted ? 'Microphone is currently suppressed' : 'Tap the microphone to mute / unmute'}
            </p>
          </div>

          {/* Participant Grid */}
          <div className="space-y-4 shrink-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Channels</h4>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            
            <div className="max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                 <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center relative ${!isMuted && isUserSpeaking(0) ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                       <span className="text-[10px] font-black uppercase">Me</span>
                       {!isMuted && isUserSpeaking(0) && (
                          <div className="absolute -top-1 -right-1 flex gap-0.5">
                             {[1, 2, 3].map(i => <motion.div key={i} animate={{ height: [4, 8, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} className="w-0.5 bg-white" />) }
                          </div>
                       )}
                    </div>
                    <div className="overflow-hidden">
                       <p className="text-[10px] font-black text-white uppercase leading-none truncate">Manager</p>
                       <p className="text-[8px] font-bold text-gray-600 uppercase mt-1">{isMuted ? 'Muted' : 'Connected'}</p>
                    </div>
                 </div>

                 {remoteUsers.map((user, idx) => (
                   <div key={user.uid} className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center gap-3 relative group/card">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center relative transition-colors ${isUserSpeaking(user.uid) ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                        <span className="text-[10px] font-black uppercase">U{idx + 1}</span>
                        {isUserSpeaking(user.uid) && (
                          <div className="absolute -top-1 -right-1 flex gap-0.5">
                             {[1, 2, 3].map(i => <motion.div key={i} animate={{ height: [4, 8, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} className="w-0.5 bg-white" />)}
                          </div>
                        )}
                     </div>
                     <div className="overflow-hidden">
                        <p className="text-[10px] font-black text-white uppercase leading-none truncate overflow-hidden">Manager {(user.uid + "").slice(-4)}</p>
                        <p className="text-[8px] font-bold text-gray-600 uppercase mt-1">Live Feed</p>
                     </div>
                   </div>
                 ))}

                 {remoteUsers.length === 0 && (
                   <div className="col-span-2 md:col-span-3 border border-dashed border-white/5 rounded-2xl p-3 flex items-center justify-center opacity-30 grayscale">
                     <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Awaiting connections...</p>
                   </div>
                 )}
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex gap-4 mt-auto">
            <button
              onClick={toggleMute}
              className={`flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              {isMuted ? 'Unmute Mic' : 'Mute Voice'}
            </button>
            
            <button 
              onClick={onEndCall} 
              className="px-6 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center group/exit"
              title="Leave Channel"
            >
              <PhoneOff size={20} className="group-hover/exit:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If isModal is true (Lobby tab or old behavior), render with modal wrapper if isVisible is true
  if (isModal) {
    if (isVisible !== undefined) {
      return (
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-sm"
            >
              <div className="w-full max-w-4xl h-[600px] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {renderInnerUI()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      );
    }
    return renderInnerUI();
  }

  // Headless/Minimal mode (for direct toggle in Auction Room)
  return renderMinimalUI();
};

export default VoiceChat;