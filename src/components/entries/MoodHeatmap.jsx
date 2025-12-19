import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wind, BookOpen, Zap } from 'lucide-react';

const MoodHeatmap = ({ entries, onDayClick }) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const days = useMemo(() => new Array(30).fill(null).map((_, i) => {
    const d = new Date(); d.setDate(new Date().getDate() - (29 - i)); return d;
  }), []);

  const getDayData = (d) => {
    const dayEntries = entries.filter(e => {
      // Use effectiveDate if available (for backdated entries), otherwise createdAt
      const dateField = e.effectiveDate || e.createdAt;
      const entryDate = dateField instanceof Date
        ? dateField
        : dateField?.toDate?.() || new Date();
      return entryDate.getDate() === d.getDate() &&
        entryDate.getMonth() === d.getMonth() &&
        entryDate.getFullYear() === d.getFullYear();
    });
    const moodEntries = dayEntries.filter(e => e.entry_type !== 'task' && typeof e.analysis?.mood_score === 'number');
    const avgMood = moodEntries.length > 0
      ? moodEntries.reduce((sum, e) => sum + e.analysis.mood_score, 0) / moodEntries.length
      : null;
    const moodScores = moodEntries.map(e => e.analysis.mood_score);
    const volatility = moodScores.length > 1
      ? Math.max(...moodScores) - Math.min(...moodScores)
      : 0;

    // Count entry types
    const typeCounts = {
      reflection: dayEntries.filter(e => e.entry_type === 'reflection' || !e.entry_type).length,
      vent: dayEntries.filter(e => e.entry_type === 'vent').length,
      mixed: dayEntries.filter(e => e.entry_type === 'mixed').length
    };

    // Get dominant theme/tag
    const tagCounts = {};
    dayEntries.forEach(e => {
      (e.tags || []).forEach(tag => {
        if (tag.startsWith('@')) {
          const cleanTag = tag.replace(/^@\w+:/, '').replace(/_/g, ' ');
          tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
        }
      });
    });
    const dominantTheme = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      entries: dayEntries,
      avgMood,
      volatility,
      hasEntries: dayEntries.length > 0,
      typeCounts,
      dominantTheme,
      hasVent: typeCounts.vent > 0
    };
  };

  // Using the therapeutic mood colors
  const getMoodColor = (score) => {
    if (typeof score !== 'number') return 'var(--color-warm-200, #e7e5e4)';
    if (score >= 0.75) return 'var(--color-mood-great, #22c55e)';
    if (score >= 0.55) return 'var(--color-mood-good, #84cc16)';
    if (score >= 0.45) return 'var(--color-mood-neutral, #eab308)';
    if (score >= 0.25) return 'var(--color-mood-low, #3b82f6)';
    return 'var(--color-mood-struggling, #8b5cf6)';
  };

  const getMoodLabel = (score) => {
    if (typeof score !== 'number') return '';
    if (score >= 0.75) return 'Great';
    if (score >= 0.55) return 'Good';
    if (score >= 0.45) return 'Okay';
    if (score >= 0.25) return 'Low';
    return 'Struggling';
  };

  const handleMouseEnter = (e, d, dayData) => {
    if (!dayData.hasEntries) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setHoveredDay({ date: d, data: dayData });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-2xl border border-warm-100 shadow-soft mb-6 relative"
    >
      <div className="flex items-center gap-2 mb-3 text-warm-700 font-display font-semibold text-xs uppercase tracking-wide">
        <Activity size={14} className="text-primary-500" /> Mood (30 Days)
      </div>
      <div className="flex justify-between items-end gap-1">
        {days.map((d, i) => {
          const dayData = getDayData(d);
          const { avgMood, hasEntries, hasVent } = dayData;
          return (
            <motion.button
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              whileHover={hasEntries ? { scale: 1.1 } : {}}
              className={`flex-1 rounded-lg transition-all origin-bottom relative ${hasEntries ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
              style={{
                backgroundColor: getMoodColor(avgMood),
                height: avgMood !== null ? `${Math.max(20, avgMood * 60)}px` : '20px',
                minWidth: '8px'
              }}
              onMouseEnter={(e) => handleMouseEnter(e, d, dayData)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => hasEntries && onDayClick && onDayClick(d, dayData)}
              disabled={!hasEntries}
            >
              {/* Vent indicator dot */}
              {hasVent && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-400 border border-white" />
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between items-center text-xs text-warm-500 font-body">
        <span>Low</span>
        <span className="text-warm-600 font-medium">Mood Scale</span>
        <span>High</span>
      </div>

      {/* Enhanced Tooltip */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="bg-warm-800 text-white px-3 py-2 rounded-xl shadow-lg text-xs min-w-[140px]">
              {/* Date */}
              <p className="font-semibold mb-1">
                {hoveredDay.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>

              {/* Mood */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-warm-300">Mood</span>
                <span className="font-medium">
                  {getMoodLabel(hoveredDay.data.avgMood)} {hoveredDay.data.avgMood !== null ? `(${Math.round(hoveredDay.data.avgMood * 100)}%)` : ''}
                </span>
              </div>

              {/* Entries count */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-warm-300">Entries</span>
                <span>{hoveredDay.data.entries.length}</span>
              </div>

              {/* Entry types */}
              <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-warm-700">
                {hoveredDay.data.typeCounts.reflection > 0 && (
                  <div className="flex items-center gap-1 text-primary-300">
                    <BookOpen size={10} />
                    <span>{hoveredDay.data.typeCounts.reflection}</span>
                  </div>
                )}
                {hoveredDay.data.typeCounts.vent > 0 && (
                  <div className="flex items-center gap-1 text-rose-300">
                    <Wind size={10} />
                    <span>{hoveredDay.data.typeCounts.vent}</span>
                  </div>
                )}
                {hoveredDay.data.typeCounts.mixed > 0 && (
                  <div className="flex items-center gap-1 text-teal-300">
                    <Zap size={10} />
                    <span>{hoveredDay.data.typeCounts.mixed}</span>
                  </div>
                )}
              </div>

              {/* Dominant theme */}
              {hoveredDay.data.dominantTheme && (
                <p className="mt-1.5 pt-1 border-t border-warm-700 text-warm-300 capitalize truncate">
                  Theme: {hoveredDay.data.dominantTheme}
                </p>
              )}

              {/* Volatility indicator */}
              {hoveredDay.data.volatility > 0.3 && (
                <p className="mt-1 text-amber-300 text-[10px]">
                  ⚡ High mood variation
                </p>
              )}

              {/* Arrow */}
              <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-warm-800 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MoodHeatmap;
