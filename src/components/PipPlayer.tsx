import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { Play, Pause, Maximize2, Minimize2, X, Move } from "lucide-react";
import { motion, useDragControls } from "motion/react";

export const PipPlayer = () => {
    const isPlaying = useAppStore(state => state.isPlaying);
    const setIsPlaying = useAppStore(state => state.setIsPlaying);
    const isPipOpen = useAppStore(state => state.isPipOpen);
    const setIsPipOpen = useAppStore(state => state.setIsPipOpen);
    const sequenceBlocks = useAppStore(state => state.sequenceBlocks);
    const mediaCache = useAppStore(state => state.mediaCache);

    const [isMinimized, setIsMinimized] = useState(false);
    const dragControls = useDragControls();

    if (!isPipOpen || sequenceBlocks.length === 0) return null;

    const togglePlayback = () => setIsPlaying(!isPlaying);

    const activeBlocksWithMedia = sequenceBlocks.filter(b => b.mediaRef && mediaCache[b.mediaRef]);
    
    // Just rendering one video block for visual representation, in a real scenario we'd use a unified composite logic
    const firstVideo = activeBlocksWithMedia.find(b => {
        const url = mediaCache[b.mediaRef!];
        return url?.endsWith('.mp4') || url?.startsWith('blob:http'); // crude video check
    });
    
    return (
        <motion.div 
            drag
            dragControls={dragControls}
            dragMomentum={false}
            className="fixed bottom-6 right-6 z-[9999] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
            style={{ width: isMinimized ? 200 : 320 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="bg-zinc-900 border-b border-zinc-800 p-2 flex items-center justify-between cursor-move"
                 onPointerDown={(e) => dragControls.start(e)}
                 style={{ touchAction: "none" }}
            >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 select-none">
                    <Move className="w-3 h-3 text-zinc-600" />
                    <span>PiP Runtime</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="text-zinc-500 hover:text-zinc-300">
                        {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                    </button>
                    <button onClick={() => setIsPipOpen(false)} className="text-zinc-500 hover:text-red-400">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="relative aspect-video bg-black flex items-center justify-center">
                    {/* Render active layers */}
                    {activeBlocksWithMedia.map(b => (
                         <video 
                             key={`pip_${b.id}`}
                             src={mediaCache[b.mediaRef!]} 
                             className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen"
                             autoPlay={isPlaying}
                             loop
                             muted
                             playsInline
                         />
                    ))}
                    
                    {activeBlocksWithMedia.length === 0 && (
                       <div className="text-center">
                          <div className="w-8 h-8 rounded-full border border-zinc-700 border-t-zinc-400 animate-spin mx-auto opacity-50 mb-2"></div>
                          <div className="text-[10px] text-zinc-600 font-mono">NO MEDIA SOURCE</div>
                       </div>
                    )}
                    
                    {/* Visual Overlay of status */}
                    <div className="absolute inset-0 flex flex-col justify-end p-2 pb-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                          <div className="text-xs text-white font-bold">{firstVideo ? firstVideo.name : (sequenceBlocks[0]?.name || "Loop")}</div>
                          <div className="text-[10px] text-zinc-400">{sequenceBlocks.length} Active Layer{sequenceBlocks.length > 1 ? 's' : ''}</div>
                    </div>
                </div>
            )}
            
            <div className="p-2 flex items-center justify-center bg-zinc-900 border-t border-zinc-800">
                <button onClick={togglePlayback} className={`p-2 rounded-full ${isPlaying ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 hover:bg-emerald-500/30'}`}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
            </div>
        </motion.div>
    );
};
