import React, { useState, useEffect, useRef } from 'react';
import { useAuction } from '../contexts/AuctionContext';
import { useAuth } from '../contexts/AuthContext';
import { TEAMS } from '../data/teams';
import { Send, MessageSquare, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

const TextChat = ({ roomId, isCollapsed, onToggleCollapse }) => {
   const { messages, sendMessage } = useAuction();
   const { user } = useAuth();
   const [text, setText] = useState('');
   const messagesEndRef = useRef(null);

   // Filter only text and gif chat messages
   const chatMessages = messages.filter(m => m.type === 'text' || m.type === 'gif' || !m.type);

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };


   useEffect(() => {
      scrollToBottom();
   }, [chatMessages.length]);

   const handleSend = async (e) => {
      e.preventDefault();
      if (!text.trim() || !roomId) return;
      
      try {
         await sendMessage(roomId, text.trim(), 'text');
         setText('');
      } catch (err) {
         // Send failed silently or handled by context
      }
   };

   const [showGifPicker, setShowGifPicker] = useState(false);
   const [gifSearchQuery, setGifSearchQuery] = useState('');
   const [searchedGifs, setSearchedGifs] = useState([]);
   const [isSearchingGifs, setIsSearchingGifs] = useState(false);

   const fetchGifs = async (query = '') => {
      setIsSearchingGifs(true);
      try {
         const url = query.trim()
            ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query.trim())}&limit=16&rating=g`
            : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=16&rating=g`;
            
         const res = await fetch(url);
         const json = await res.json();
         if (json && json.data) {
            const list = json.data.map(item => ({
               id: item.id,
               name: item.title || 'GIF',
               url: item.images?.fixed_height?.url || item.images?.original?.url
            }));
            setSearchedGifs(list);
         } else {
            setSearchedGifs(IPL_GIFS);
         }
      } catch (err) {
         setSearchedGifs(IPL_GIFS);
      } finally {
         setIsSearchingGifs(false);
      }
   };

   const handleSearchGifs = async (e) => {
      if (e) e.preventDefault();
      await fetchGifs(gifSearchQuery);
   };

   useEffect(() => {
      if (showGifPicker) {
         fetchGifs('');
      }
   }, [showGifPicker]);

   return (
      <div className="relative flex flex-col h-full bg-black/20 rounded-3xl overflow-hidden border border-white/5 backdrop-blur-md">
         {/* Feed Header */}
         <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-2">
               <MessageSquare size={14} className="text-yellow-500" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Chat
               </span>
            </div>
            {onToggleCollapse && (
               <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title={isCollapsed ? "Expand Chat" : "Collapse Chat"}
               >
                  {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
               </button>
            )}
         </div>

         {!isCollapsed && (
            <>
               {/* Messages Scroll Area */}
               <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col min-h-0">
                  {chatMessages.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center opacity-30 p-8 text-center my-auto">
                        <MessageSquare size={24} className="text-gray-500 mb-2 animate-pulse" />
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">No banter yet</p>
                        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">Start the conversation</p>
                     </div>
                  ) : (
                     chatMessages.map((msg, index) => {
                        const isMe = msg.userId === user?.uid;
                        
                        // Find bidder's team logo
                        const userTeamId = TEAMS.find(t => t.id === msg.teamId || t.name === msg.teamId)?.logo;

                        return (
                           <motion.div
                              key={msg.id || index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}
                           >
                              {/* Name and Team Header (only for other users) */}
                              {!isMe && (
                                 <div className="flex items-center gap-1.5 mb-1 px-1">
                                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-tight">
                                       {msg.userName}
                                    </span>
                                    {msg.teamId && (
                                       <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[7px] font-black text-gray-400 uppercase tracking-widest">
                                          {msg.teamId}
                                       </span>
                                    )}
                                 </div>
                              )}

                              {/* Speech Bubble */}
                              <div
                                 className={`rounded-2xl text-[11px] leading-relaxed break-words shadow-lg overflow-hidden ${
                                    msg.type === 'gif' || (msg.text?.startsWith('http') && msg.text?.includes('.gif'))
                                       ? 'border border-white/10 max-w-[200px]'
                                       : isMe
                                          ? 'px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-100 rounded-tr-none'
                                          : 'px-4 py-3 bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                 }`}
                              >
                                 {msg.type === 'gif' || (msg.text?.startsWith('http') && msg.text?.includes('.gif')) ? (
                                    <img src={msg.text} alt="gif" className="w-full h-auto object-cover block" />
                                 ) : (
                                    msg.text
                                 )}
                              </div>
                           </motion.div>
                        );
                     })
                  )}
                  <div ref={messagesEndRef} />
               </div>

               {/* Message Input Box */}
               <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-white/[0.01] flex gap-2 relative">
                  <button
                     type="button"
                     onClick={() => setShowGifPicker(!showGifPicker)}
                     className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 ${showGifPicker ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                     title="Send a GIF"
                  >
                     <ImageIcon size={14} />
                  </button>
                  <input
                     type="text"
                     value={text}
                     onChange={(e) => setText(e.target.value)}
                     placeholder="Type a message..."
                     className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-white focus:outline-none focus:border-yellow-500/50 transition-colors placeholder:text-gray-700"
                     maxLength={150}
                  />
                  <button
                     type="submit"
                     disabled={!text.trim()}
                     className="w-10 h-10 bg-yellow-500 disabled:opacity-40 hover:bg-yellow-400 text-[#050505] rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:scale-100 cursor-pointer shrink-0"
                  >
                     <Send size={14} fill="currentColor" />
                  </button>
               </form>

               {showGifPicker && (
                  <div className="absolute bottom-16 right-3 left-3 bg-[#0d0d0e]/98 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-[60] flex flex-col gap-3">
                     <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Global GIF Search</span>
                        <button
                           type="button"
                           onClick={() => {
                              setShowGifPicker(false);
                              setGifSearchQuery('');
                           }}
                           className="text-[8px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
                        >
                           Close
                        </button>
                     </div>

                     {/* Search input field */}
                     <form onSubmit={handleSearchGifs} className="flex gap-2">
                        <input
                           type="text"
                           value={gifSearchQuery}
                           onChange={(e) => setGifSearchQuery(e.target.value)}
                           placeholder="Search any GIF (e.g. Dhoni, Kohli...)"
                           className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-yellow-500/50 transition-colors placeholder:text-gray-700"
                        />
                        <button
                           type="submit"
                           className="px-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                           Search
                        </button>
                     </form>

                     <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[160px] custom-scrollbar min-h-[80px]">
                        {isSearchingGifs ? (
                           <div className="col-span-4 flex items-center justify-center py-8 opacity-50">
                              <span className="text-[9px] font-black text-white uppercase tracking-widest animate-pulse">Searching Giphy...</span>
                           </div>
                        ) : searchedGifs.length === 0 ? (
                           <div className="col-span-4 flex items-center justify-center py-8 opacity-50">
                              <span className="text-[9px] font-black text-white uppercase tracking-widest">No GIFs Found</span>
                           </div>
                        ) : (
                           searchedGifs.map((gif) => (
                              <button
                                 key={gif.id}
                                 type="button"
                                 onClick={async () => {
                                    try {
                                       await sendMessage(roomId, gif.url, 'gif');
                                       setShowGifPicker(false);
                                       setGifSearchQuery('');
                                    } catch (e) {}
                                 }}
                                 className="relative rounded-lg overflow-hidden border border-white/5 hover:border-yellow-500/50 aspect-video group cursor-pointer transition-all active:scale-95 bg-white/5"
                              >
                                 <img src={gif.url} alt={gif.name} className="w-full h-full object-cover animate-pulse" />
                                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-[7px] font-black text-white uppercase tracking-tight truncate max-w-[90%] px-1">{gif.name}</span>
                                 </div>
                              </button>
                           ))
                        )}
                     </div>
                  </div>
               )}
            </>
         )}
      </div>
   );
};

export default TextChat;
