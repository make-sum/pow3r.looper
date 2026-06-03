import React, { useEffect, useRef } from "react";
import { useAppStore } from "../store/appStore";

export const GlobalMediaEngine = () => {
  const sequenceBlocks = useAppStore((state) => state.sequenceBlocks);
  const mediaCache = useAppStore((state) => state.mediaCache);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const playhead = useAppStore((state) => state.playhead);
  const setPlayhead = useAppStore((state) => state.setPlayhead);

  // Sync audio refs
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    const speed = 1.0; // Playback speed (units per second)

    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000;
      
      setPlayhead((p) => {
        const next = p + (speed * deltaTime * 10);
        if (next >= 100) {
          // Restart all audios
          Object.values(audioRefs.current).forEach(audio => {
            if (audio) {
              audio.currentTime = 0;
            }
          });
          return 0; // Loop around
        }
        return next;
      });
      
      lastTime = time;
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.currentTime = (playhead / 100) * (audio.duration || 10); // Sync time based on playhead
          audio.play().catch(e => console.error("Audio play failed:", e));
        }
      });
    } else {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) audio.pause();
      });
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  // Volume Sync
  useEffect(() => {
    sequenceBlocks.forEach(block => {
      const audio = audioRefs.current[block.id];
      if (audio) {
        audio.volume = (block.volume ?? 75) / 100;
      }
    });
  }, [sequenceBlocks]);

  return (
    <>
      {sequenceBlocks.map((block) => {
        if (!block.mediaRef || block.mediaRef.toLowerCase().includes("video")) return null;
        
        const audioUrl = mediaCache[block.mediaRef];
        if (!audioUrl) return null;

        return (
          <audio 
             key={block.id}
             ref={(el) => {
                 if (el) {
                     audioRefs.current[block.id] = el;
                 }
             }}
             src={audioUrl}
             loop
             preload="auto"
             className="hidden"
          />
        );
      })}
    </>
  );
};
