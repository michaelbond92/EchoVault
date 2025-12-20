import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, ChevronDown, ChevronRight, Clock, MessageSquare } from 'lucide-react';

/**
 * SituationTimeline - Visualizes connected entries via continues_situation
 *
 * Shows ongoing situations as threads linking multiple entries,
 * helping users see the narrative continuity of multi-day events.
 */

const SituationTimeline = ({ entries, category, onEntryClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSituation, setExpandedSituation] = useState(null);

  const situations = useMemo(() => {
    const categoryEntries = entries.filter(e => e.category === category);

    // Group entries by situation
    const situationMap = new Map();

    categoryEntries.forEach(entry => {
      // Check for @situation: tags
      const situationTags = entry.tags?.filter(t => t.startsWith('@situation:')) || [];

      situationTags.forEach(tag => {
        const situationName = tag.replace('@situation:', '').replace(/_/g, ' ');

        if (!situationMap.has(situationName)) {
          situationMap.set(situationName, {
            name: situationName,
            tag: tag,
            entries: []
          });
        }

        const entryDate = entry.effectiveDate || entry.createdAt;
        const date = entryDate instanceof Date ? entryDate : entryDate?.toDate?.() || new Date();

        situationMap.get(situationName).entries.push({
          id: entry.id,
          title: entry.title,
          text: entry.text?.substring(0, 100) + (entry.text?.length > 100 ? '...' : ''),
          date: date,
          mood: entry.analysis?.mood_score
        });
      });

      // Also check continues_situation field
      if (entry.continues_situation) {
        const situationName = entry.continues_situation.replace(/_/g, ' ');

        if (!situationMap.has(situationName)) {
          situationMap.set(situationName, {
            name: situationName,
            tag: `@situation:${entry.continues_situation}`,
            entries: []
          });
        }

        const entryDate = entry.effectiveDate || entry.createdAt;
        const date = entryDate instanceof Date ? entryDate : entryDate?.toDate?.() || new Date();

        // Check if this entry is already in the list
        const existing = situationMap.get(situationName);
        if (!existing.entries.some(e => e.id === entry.id)) {
          existing.entries.push({
            id: entry.id,
            title: entry.title,
            text: entry.text?.substring(0, 100) + (entry.text?.length > 100 ? '...' : ''),
            date: date,
            mood: entry.analysis?.mood_score
          });
        }
      }
    });

    // Filter to situations with 2+ entries, sort by recency
    return Array.from(situationMap.values())
      .filter(s => s.entries.length >= 2)
      .map(s => {
        // Sort entries by date
        s.entries.sort((a, b) => a.date - b.date);

        // Calculate date range
        const firstDate = s.entries[0].date;
        const lastDate = s.entries[s.entries.length - 1].date;
        const durationDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));

        // Calculate average mood
        const moodEntries = s.entries.filter(e => e.mood !== null && e.mood !== undefined);
        const avgMood = moodEntries.length > 0
          ? moodEntries.reduce((sum, e) => sum + e.mood, 0) / moodEntries.length
          : null;

        return {
          ...s,
          firstDate,
          lastDate,
          durationDays,
          avgMood
        };
      })
      .sort((a, b) => b.lastDate - a.lastDate)
      .slice(0, 5); // Top 5 situations
  }, [entries, category]);

  // Don't render if no multi-entry situations
  if (situations.length === 0) return null;

  const formatDate = (date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMoodColor = (mood) => {
    if (mood === null || mood === undefined) return 'bg-warm-200';
    if (mood >= 0.65) return 'bg-mood-great';
    if (mood >= 0.45) return 'bg-mood-neutral';
    if (mood >= 0.25) return 'bg-mood-low';
    return 'bg-mood-struggling';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 overflow-hidden mb-4"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100">
            <GitBranch size={14} className="text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-display font-semibold text-indigo-800">
              Ongoing Stories
            </h3>
            <p className="text-xs text-indigo-600">
              {situations.length} situation{situations.length !== 1 ? 's' : ''} across multiple entries
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-indigo-400" />
        </motion.div>
      </button>

      {/* Situations List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {situations.map((situation, index) => (
                <motion.div
                  key={situation.tag}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/60 rounded-xl border border-indigo-100 overflow-hidden"
                >
                  {/* Situation Header */}
                  <button
                    onClick={() => setExpandedSituation(
                      expandedSituation === situation.tag ? null : situation.tag
                    )}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${getMoodColor(situation.avgMood)}`} />
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-medium text-indigo-800 truncate capitalize">
                          {situation.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-indigo-600">
                          <span className="flex items-center gap-1">
                            <MessageSquare size={10} />
                            {situation.entries.length} entries
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {situation.durationDays > 0 ? `${situation.durationDays}d` : 'same day'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedSituation === situation.tag ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={16} className="text-indigo-400" />
                    </motion.div>
                  </button>

                  {/* Entry Timeline */}
                  <AnimatePresence>
                    {expandedSituation === situation.tag && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3">
                          <div className="relative pl-4 border-l-2 border-indigo-200 space-y-2">
                            {situation.entries.map((entry, i) => (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => onEntryClick?.(entry.id)}
                                className="relative cursor-pointer hover:bg-indigo-50 rounded-lg p-2 -ml-4 pl-4 transition-colors"
                              >
                                {/* Timeline dot */}
                                <div className={`absolute left-[-5px] top-3 w-2 h-2 rounded-full ${getMoodColor(entry.mood)} border-2 border-white`} />

                                <p className="text-xs text-indigo-500 mb-0.5">
                                  {formatDate(entry.date)}
                                </p>
                                <p className="text-sm text-indigo-800 font-medium line-clamp-1">
                                  {entry.title}
                                </p>
                                <p className="text-xs text-indigo-600 line-clamp-2 mt-0.5">
                                  {entry.text}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SituationTimeline;
