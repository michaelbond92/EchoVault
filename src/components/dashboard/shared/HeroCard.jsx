import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Cloud, Heart, Mic, Sparkles } from 'lucide-react';

/**
 * HeroCard - Adaptive hero component that changes visual style by mode
 *
 * Props:
 * - type: 'morning' | 'midday' | 'evening' | 'shelter'
 * - title: Main headline
 * - subtitle: Supporting text (optional)
 * - isQuote: If true, renders title as a quote
 * - action: { label, type, onClick } - Primary action button
 * - children: Additional content to render below
 */

const modeStyles = {
  morning: {
    gradient: 'from-amber-50 via-orange-50 to-yellow-50',
    border: 'border-amber-200',
    icon: Sun,
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-900',
    subtitleColor: 'text-amber-700'
  },
  midday: {
    gradient: 'from-sky-50 via-blue-50 to-indigo-50',
    border: 'border-blue-200',
    icon: Cloud,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900',
    subtitleColor: 'text-blue-700'
  },
  evening: {
    gradient: 'from-violet-50 via-purple-50 to-indigo-50',
    border: 'border-violet-200',
    icon: Moon,
    iconColor: 'text-violet-500',
    titleColor: 'text-violet-900',
    subtitleColor: 'text-violet-700'
  },
  shelter: {
    gradient: 'from-rose-50 via-pink-50 to-warm-50',
    border: 'border-rose-200',
    icon: Heart,
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-800',
    subtitleColor: 'text-rose-600'
  }
};

const HeroCard = ({
  type = 'midday',
  title,
  subtitle,
  isQuote = false,
  action,
  onAction,
  children
}) => {
  const style = modeStyles[type] || modeStyles.midday;
  const Icon = style.icon;

  return (
    <motion.div
      className={`bg-gradient-to-br ${style.gradient} rounded-2xl p-5 border ${style.border} shadow-soft`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-full bg-white/60 ${style.iconColor}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          {isQuote ? (
            <blockquote className={`text-lg font-display italic ${style.titleColor} leading-relaxed`}>
              "{title}"
            </blockquote>
          ) : (
            <h2 className={`text-xl font-display font-bold ${style.titleColor}`}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className={`text-sm font-body mt-1 ${style.subtitleColor}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Optional children content */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}

      {/* Action button */}
      {action && (
        <motion.button
          onClick={onAction}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
            bg-white/70 hover:bg-white/90 ${style.titleColor} font-medium text-sm
            border ${style.border} transition-all shadow-sm hover:shadow-md`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {action.type === 'voice_record' && <Mic size={16} />}
          {action.type === 'celebrate' && <Sparkles size={16} />}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

export default HeroCard;
