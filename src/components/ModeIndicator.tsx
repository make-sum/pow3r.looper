import { useWorkflowStore } from "../store/useWorkflowStore";
import { motion } from "motion/react";
import { Network, Smartphone } from "lucide-react";

export default function ModeIndicator() {
  const viewMode = useWorkflowStore((state) => state.viewMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-40"
    >
      <div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg">
        {viewMode === "xmap" ? (
          <>
            <Network className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              XMAP Architect Mode
            </span>
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4 text-neon-pink" />
            <span className="text-xs font-mono font-bold text-neon-pink uppercase tracking-widest">
              Runtime Surface Mode
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
