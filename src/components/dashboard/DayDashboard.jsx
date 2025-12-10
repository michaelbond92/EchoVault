import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Cloud, CloudRain, Sparkles, Target, AlertCircle,
  CheckCircle2, Circle, TrendingUp, Loader2, RefreshCw,
  ChevronRight, Lightbulb
} from 'lucide-react';
import { generateDashboardPrompts, generateDaySummary } from '../../services/prompts';

/**
 * DayDashboard - The main dashboard view showing today's summary
 *
 * States:
 * - Empty: No entries today - shows contextual prompts
 * - Active: Has entries - shows summary sections
 */

const PromptCard = ({ prompt, type, onClick }) => {
  const typeIcons = {
    situation: <ChevronRight size={16} className="text-primary-500" />,
    goal: <Target size={16} className="text-green-500" />,
    pattern: <TrendingUp size={16} className="text-blue-500" />,
    mood: <Cloud size={16} className="text-amber-500" />,
    generic: <Lightbulb size={16} className="text-warm-400" />
  };

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-2xl border border-warm-100 shadow-soft hover:shadow-soft-lg hover:border-primary-200 transition-all group"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          {typeIcons[type] || typeIcons.generic}
        </div>
        <p className="text-warm-700 font-body text-sm leading-relaxed">{prompt}</p>
      </div>
    </motion.button>
  );
};

const SectionHeader = ({ icon: Icon, title, iconColor = 'text-warm-500' }) => (
  <div className="flex items-center gap-2 mb-2">
    <Icon size={16} className={iconColor} />
    <h3 className="text-sm font-display font-semibold text-warm-700">{title}</h3>
  </div>
);

const WinsSection = ({ wins }) => {
  if (!wins?.items || wins.items.length === 0) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <SectionHeader icon={Sparkles} title="What's Going Well" iconColor="text-green-500" />
      <ul className="space-y-2">
        {wins.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-green-800">
            <CheckCircle2 size={14} className="mt-0.5 text-green-500 flex-shrink-0" />
            <span className="font-body">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const ChallengesSection = ({ challenges }) => {
  if (!challenges?.items || challenges.items.length === 0) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <SectionHeader icon={Cloud} title="What's on Your Mind" iconColor="text-amber-500" />
      <ul className="space-y-2 mb-3">
        {challenges.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
            <AlertCircle size={14} className="mt-0.5 text-amber-500 flex-shrink-0" />
            <span className="font-body">{item}</span>
          </li>
        ))}
      </ul>
      {challenges.cbt_reframe && (
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-700 italic font-body">
            <span className="font-semibold not-italic">Perspective:</span> {challenges.cbt_reframe}
          </p>
        </div>
      )}
    </motion.div>
  );
};

const ActionItemsSection = ({ actionItems, onToggleTask }) => {
  const hasItems = actionItems?.today?.length > 0 ||
    actionItems?.carried_forward?.length > 0 ||
    actionItems?.suggested?.length > 0;

  if (!hasItems) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <SectionHeader icon={Target} title="Action Items" iconColor="text-blue-500" />
      <ul className="space-y-2">
        {actionItems.carried_forward?.map((item, i) => (
          <li key={`cf-${i}`} className="flex items-start gap-2 text-sm text-blue-800">
            <button
              onClick={() => onToggleTask?.(item, 'carried_forward', i)}
              className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
            >
              <Circle size={14} className="text-blue-400" />
            </button>
            <span className="font-body">
              {item}
              <span className="text-xs text-blue-500 ml-1">(from yesterday)</span>
            </span>
          </li>
        ))}
        {actionItems.today?.map((item, i) => (
          <li key={`today-${i}`} className="flex items-start gap-2 text-sm text-blue-800">
            <button
              onClick={() => onToggleTask?.(item, 'today', i)}
              className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
            >
              <Circle size={14} className="text-blue-400" />
            </button>
            <span className="font-body">{item}</span>
          </li>
        ))}
        {actionItems.suggested?.map((item, i) => (
          <li key={`sug-${i}`} className="flex items-start gap-2 text-sm text-blue-600 opacity-75">
            <Lightbulb size={14} className="mt-0.5 text-blue-400 flex-shrink-0" />
            <span className="font-body italic">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const PatternsSection = ({ patterns }) => {
  if (!patterns?.observations || patterns.observations.length === 0) return null;

  return (
    <motion.div
      className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 border border-purple-100"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <SectionHeader icon={TrendingUp} title="Patterns & Insights" iconColor="text-purple-500" />
      <ul className="space-y-2">
        {patterns.observations.map((item, i) => (
          <li key={i} className="text-sm text-purple-800 font-body">{item}</li>
        ))}
      </ul>
      {patterns.mood_note && (
        <p className="mt-2 text-xs text-purple-600 font-body">{patterns.mood_note}</p>
      )}
    </motion.div>
  );
};

const MoodIndicator = ({ mood }) => {
  if (mood === null || mood === undefined) return null;

  const getMoodEmoji = (score) => {
    if (score >= 0.7) return { icon: Sun, color: 'text-amber-500', bg: 'bg-amber-100' };
    if (score >= 0.4) return { icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-100' };
    return { icon: CloudRain, color: 'text-gray-500', bg: 'bg-gray-100' };
  };

  const { icon: Icon, color, bg } = getMoodEmoji(mood);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${bg}`}>
      <Icon size={14} className={color} />
      <span className={`text-xs font-medium ${color}`}>
        {mood >= 0.7 ? 'Good' : mood >= 0.4 ? 'Mixed' : 'Tough'}
      </span>
    </div>
  );
};

const DayDashboard = ({
  entries,
  category,
  onPromptClick,
  onToggleTask
}) => {
  const [prompts, setPrompts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter today's entries
  const todayEntries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return entries.filter(e => {
      const entryDate = e.createdAt instanceof Date
        ? e.createdAt
        : e.createdAt?.toDate?.() || new Date();
      return entryDate >= today && e.category === category;
    });
  }, [entries, category]);

  const hasEntriesToday = todayEntries.length > 0;

  // Load prompts or summary based on state
  useEffect(() => {
    const loadDashboardContent = async () => {
      setLoading(true);
      try {
        if (hasEntriesToday) {
          // Active state - generate summary
          const summaryData = await generateDaySummary(todayEntries, entries, category);
          setSummary(summaryData);
          setPrompts([]);
        } else {
          // Empty state - generate prompts
          const promptData = await generateDashboardPrompts(entries, category);
          setPrompts(promptData);
          setSummary(null);
        }
      } catch (e) {
        console.error('Failed to load dashboard content:', e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardContent();
  }, [hasEntriesToday, todayEntries.length, category]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (hasEntriesToday) {
        const summaryData = await generateDaySummary(todayEntries, entries, category);
        setSummary(summaryData);
      } else {
        const promptData = await generateDashboardPrompts(entries, category);
        setPrompts(promptData);
      }
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-warm-400">
        <Loader2 className="animate-spin mb-2" size={24} />
        <span className="text-sm font-body">Loading your day...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-warm-800">
            {hasEntriesToday ? "Today's Summary" : "Start Your Day"}
          </h2>
          <p className="text-xs text-warm-500 font-body">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {summary && <MoodIndicator mood={summary.overall_mood} />}
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-warm-400 hover:text-warm-600 hover:bg-warm-100 rounded-full transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!hasEntriesToday ? (
          /* Empty State - Show Prompts */
          <motion.div
            key="empty"
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-sm text-warm-500 font-body">
              What would you like to reflect on?
            </p>
            {prompts.map((p, i) => (
              <PromptCard
                key={i}
                prompt={p.prompt}
                type={p.type}
                onClick={() => onPromptClick?.(p.prompt)}
              />
            ))}
          </motion.div>
        ) : (
          /* Active State - Show Summary Sections */
          <motion.div
            key="active"
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* One-liner summary */}
            {summary?.one_liner && (
              <motion.div
                className="bg-white rounded-2xl p-4 border border-warm-100 shadow-soft"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-warm-700 font-body text-sm italic">
                  "{summary.one_liner}"
                </p>
              </motion.div>
            )}

            {/* Sections */}
            <WinsSection wins={summary?.wins} />
            <ChallengesSection challenges={summary?.challenges} />
            <ActionItemsSection
              actionItems={summary?.action_items}
              onToggleTask={onToggleTask}
            />
            <PatternsSection patterns={summary?.patterns} />

            {/* Entry count */}
            <p className="text-xs text-warm-400 text-center font-body pt-2">
              {todayEntries.length} {todayEntries.length === 1 ? 'entry' : 'entries'} today
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DayDashboard;
