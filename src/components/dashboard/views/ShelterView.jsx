import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Mic, MessageCircle, Leaf, X } from 'lucide-react';

/**
 * ShelterView - Minimalist, soothing view for low mood states
 *
 * Trigger: mood_score < 0.35
 *
 * Design Philosophy:
 * - Remove Stats / Streaks / Tasks (reduce pressure)
 * - Warmer, softer colors
 * - Validation-first messaging
 * - Single primary action: "Vent" (voice recorder)
 *
 * Content:
 * - Hero: "It's okay to have a hard day." (Validation)
 * - Action: "Vent" button (voice recorder auto-start)
 * - Resource: CBT reframe if available
 * - Exit: Option to return to normal view
 *
 * Props:
 * - cbtReframe: string | null - Perspective from challenges
 * - onVent: () => void - Start voice recording
 * - onTextEntry: () => void - Alternative text entry
 * - onExit: () => void - Return to normal view
 */

const ShelterView = ({
  cbtReframe,
  onVent,
  onTextEntry,
  onExit
}) => {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Exit button - subtle, top right */}
      <div className="flex justify-end">
        <motion.button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs text-warm-400 hover:text-warm-600 transition-colors px-2 py-1 rounded-full hover:bg-warm-100"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <X size={12} />
          <span>Return to normal view</span>
        </motion.button>
      </div>

      {/* Hero - Validation first */}
      <motion.div
        className="bg-gradient-to-br from-rose-50 via-pink-50 to-warm-50 rounded-3xl p-6 border border-rose-100 shadow-soft text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mb-4">
          <Heart size={24} className="text-rose-400" />
        </div>

        <h2 className="text-xl font-display font-bold text-rose-800 mb-2">
          It's okay to have a hard day.
        </h2>

        <p className="text-sm font-body text-rose-600 leading-relaxed max-w-xs mx-auto">
          Sometimes we just need to let it out. No judgment here.
        </p>
      </motion.div>

      {/* Primary Action - Vent (Voice) */}
      <motion.button
        onClick={onVent}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-2xl p-5 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Mic size={20} />
        </div>
        <div className="text-left">
          <span className="font-display font-semibold text-lg block">Vent</span>
          <span className="text-rose-100 text-sm font-body">Let it all out</span>
        </div>
      </motion.button>

      {/* Secondary Action - Text Entry */}
      <motion.button
        onClick={onTextEntry}
        className="w-full bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-2xl p-4 flex items-center justify-center gap-2 transition-all"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <MessageCircle size={18} />
        <span className="font-medium">Or write it down</span>
      </motion.button>

      {/* CBT Reframe - If available */}
      {cbtReframe && (
        <motion.div
          className="bg-white rounded-2xl p-5 border border-warm-100 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Leaf size={16} className="text-green-500" />
            <span className="text-xs font-semibold text-warm-600 uppercase tracking-wide">
              A different perspective
            </span>
          </div>
          <p className="text-sm font-body text-warm-700 leading-relaxed italic">
            "{cbtReframe}"
          </p>
        </motion.div>
      )}

      {/* Gentle reminder */}
      <motion.p
        className="text-center text-xs text-warm-400 font-body px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        This view appears when you might need extra support. You can always return to the regular dashboard.
      </motion.p>
    </motion.div>
  );
};

export default ShelterView;
