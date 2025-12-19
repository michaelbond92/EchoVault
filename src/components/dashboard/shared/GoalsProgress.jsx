import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronDown, ChevronUp, TrendingUp, Check, AlertTriangle, Pause } from 'lucide-react';

/**
 * GoalsProgress - Collapsible section showing active goals with status tracking
 *
 * Extracts @goal: tags from entries and tracks their status via goal_update field:
 * - progress: Making headway
 * - achieved: Goal completed
 * - struggling: Having difficulty
 * - abandoned: No longer pursuing
 */

const GoalsProgress = ({ entries, category }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const goals = useMemo(() => {
    // Filter to category
    const categoryEntries = entries.filter(e => e.category === category);

    // Extract all goals from entries
    const goalMap = new Map();

    // Get all entries with goal tags
    categoryEntries.forEach(entry => {
      const goalTags = entry.tags?.filter(t => t.startsWith('@goal:')) || [];

      goalTags.forEach(tag => {
        const goalName = tag.replace('@goal:', '').replace(/_/g, ' ');

        if (!goalMap.has(goalName)) {
          const entryDate = entry.effectiveDate || entry.createdAt;
          const date = entryDate instanceof Date ? entryDate : entryDate?.toDate?.() || new Date();

          goalMap.set(goalName, {
            name: goalName,
            tag: tag,
            firstMentioned: date,
            lastMentioned: date,
            status: 'active',
            mentionCount: 1,
            entries: [entry]
          });
        } else {
          const existing = goalMap.get(goalName);
          const entryDate = entry.effectiveDate || entry.createdAt;
          const date = entryDate instanceof Date ? entryDate : entryDate?.toDate?.() || new Date();

          existing.mentionCount++;
          existing.entries.push(entry);

          if (date > existing.lastMentioned) {
            existing.lastMentioned = date;
          }
          if (date < existing.firstMentioned) {
            existing.firstMentioned = date;
          }
        }
      });

      // Check for goal updates
      if (entry.goal_update?.tag) {
        const goalName = entry.goal_update.tag.replace('@goal:', '').replace(/_/g, ' ');
        if (goalMap.has(goalName)) {
          goalMap.get(goalName).status = entry.goal_update.status;
        }
      }
    });

    // Convert to array and sort by last mentioned
    return Array.from(goalMap.values())
      .sort((a, b) => b.lastMentioned - a.lastMentioned)
      .slice(0, 5); // Show top 5 goals
  }, [entries, category]);

  // Don't render if no goals
  if (goals.length === 0) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'achieved': return <Check size={12} className="text-mood-great" />;
      case 'progress': return <TrendingUp size={12} className="text-primary-500" />;
      case 'struggling': return <AlertTriangle size={12} className="text-amber-500" />;
      case 'abandoned': return <Pause size={12} className="text-warm-400" />;
      default: return <Target size={12} className="text-primary-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'achieved': return 'bg-green-50 border-green-200 text-green-700';
      case 'progress': return 'bg-primary-50 border-primary-200 text-primary-700';
      case 'struggling': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'abandoned': return 'bg-warm-100 border-warm-200 text-warm-500';
      default: return 'bg-white border-warm-200 text-warm-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'achieved': return 'Achieved';
      case 'progress': return 'In Progress';
      case 'struggling': return 'Challenging';
      case 'abandoned': return 'Paused';
      default: return 'Active';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const activeGoals = goals.filter(g => g.status !== 'achieved' && g.status !== 'abandoned');
  const completedGoals = goals.filter(g => g.status === 'achieved');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl border border-primary-100 overflow-hidden mb-4"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary-100">
            <Target size={14} className="text-primary-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-display font-semibold text-primary-800">
              Your Goals
            </h3>
            <p className="text-xs text-primary-600">
              {activeGoals.length} active{completedGoals.length > 0 ? ` · ${completedGoals.length} achieved` : ''}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-primary-400" />
        </motion.div>
      </button>

      {/* Goals List */}
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
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.tag}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl border ${getStatusColor(goal.status)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="mt-0.5">
                        {getStatusIcon(goal.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate capitalize">
                          {goal.name}
                        </p>
                        <p className="text-xs opacity-70 mt-0.5">
                          {goal.mentionCount} mention{goal.mentionCount !== 1 ? 's' : ''} · last {formatDate(goal.lastMentioned)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/50`}>
                      {getStatusLabel(goal.status)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GoalsProgress;
