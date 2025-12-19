import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, TrendingUp, AlertCircle, Star } from 'lucide-react';

/**
 * InsightBite - A single rotating insight component
 *
 * Displays one pattern/insight at a time with dismiss functionality.
 * Used to surface key observations without overwhelming the user.
 *
 * Props:
 * - insight: { message, type, priority, entity? }
 * - onDismiss: () => void
 * - onShowMore: () => void - Navigate to full insights panel
 */

const typeConfig = {
  pattern: {
    icon: TrendingUp,
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-500',
    textColor: 'text-purple-800'
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-500',
    textColor: 'text-amber-800'
  },
  encouragement: {
    icon: Star,
    bg: 'bg-green-50',
    border: 'border-green-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-500',
    textColor: 'text-green-800'
  },
  default: {
    icon: Lightbulb,
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-800'
  }
};

const InsightBite = ({
  insight,
  onDismiss,
  onShowMore
}) => {
  if (!insight || !insight.message) return null;

  const config = typeConfig[insight.type] || typeConfig.default;
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={insight.message}
        className={`${config.bg} rounded-2xl p-4 border ${config.border} relative`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/50 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Dismiss insight"
          >
            <X size={14} />
          </button>
        )}

        <div className="flex items-start gap-3 pr-6">
          {/* Icon */}
          <div className={`p-2 rounded-full ${config.iconBg} ${config.iconColor} flex-shrink-0`}>
            <Icon size={16} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-body ${config.textColor} leading-relaxed`}>
              {insight.message}
            </p>

            {/* Entity tag if available */}
            {insight.entity && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-white/60 text-gray-600">
                {insight.entity}
              </span>
            )}
          </div>
        </div>

        {/* Show more link */}
        {onShowMore && (
          <button
            onClick={onShowMore}
            className="mt-3 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1"
          >
            <TrendingUp size={12} />
            View all patterns
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default InsightBite;
