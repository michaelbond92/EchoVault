import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingDown, TrendingUp, AlertTriangle, Heart, Calendar, Sparkles, BarChart3 } from 'lucide-react';
import { analyzeLongitudinalPatterns } from '../../services/safety';

const InsightsPanel = ({ entries, onClose }) => {
  const patterns = useMemo(() => analyzeLongitudinalPatterns(entries), [entries]);

  const getPatternIcon = (type) => {
    switch (type) {
      case 'weekly_low': return <TrendingDown size={16} className="text-accent" />;
      case 'weekly_high': return <TrendingUp size={16} className="text-mood-great" />;
      case 'trigger_correlation': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'recovery_pattern': return <Heart size={16} className="text-pink-500" />;
      case 'monthly_summary': return <Calendar size={16} className="text-primary-500" />;
      default: return <Sparkles size={16} className="text-secondary-500" />;
    }
  };

  const getPatternColor = (type) => {
    switch (type) {
      case 'weekly_low': return 'bg-accent-light border-accent';
      case 'weekly_high': return 'bg-green-50 border-green-200';
      case 'trigger_correlation': return 'bg-amber-50 border-amber-200';
      case 'recovery_pattern': return 'bg-pink-50 border-pink-200';
      case 'monthly_summary': return 'bg-primary-50 border-primary-200';
      default: return 'bg-secondary-50 border-secondary-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-soft-lg"
      >
        <div className="p-6 border-b border-primary-100 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-display font-bold flex items-center gap-2"><BarChart3 size={20} /> Your Patterns</h2>
              <p className="text-sm opacity-80 mt-1 font-body">Insights from your journal entries</p>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-white/80 hover:text-white"
            >
              <X size={24} />
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {patterns.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-warm-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={32} className="text-warm-400" />
              </div>
              <h3 className="text-lg font-display font-medium text-warm-800">Not enough data yet</h3>
              <p className="text-sm text-warm-500 mt-2 font-body">Keep journaling! Patterns will appear after you have at least 7 entries with mood data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patterns.map((pattern, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-2xl border ${getPatternColor(pattern.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getPatternIcon(pattern.type)}</div>
                    <div>
                      <p className="text-sm font-medium text-warm-800 font-body">{pattern.message}</p>
                      {pattern.type === 'trigger_correlation' && (
                        <p className="text-xs text-warm-500 mt-1">Based on {Math.round(pattern.percentDiff)}% mood difference</p>
                      )}
                      {pattern.type === 'recovery_pattern' && (
                        <p className="text-xs text-warm-500 mt-1">Based on {pattern.samples} recovery instances</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-warm-100 bg-warm-50">
          <p className="text-xs text-warm-500 text-center font-body">Patterns are calculated from your recent entries and update automatically</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InsightsPanel;
