/**
 * Interactive Card Component with Drag-and-Drop and Micro-interactions
 * Implements Material Design 3 principles with smooth animations
 */

import React, { useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import {
  GripVertical, Star, Heart, Share2, MoreVertical,
  CheckCircle, Clock, AlertCircle, Info,
} from 'lucide-react';

const InteractiveCard = ({
  id,
  title,
  description,
  status = 'pending',
  priority = 'medium',
  onSelect,
  onFavorite,
  onShare,
  onMore,
  isSelected = false,
  isFavorite = false,
  isDraggable = true,
  className = '',
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const dragControls = useDragControls();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const cardVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    hover: {
      y: -2,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
    drag: {
      rotate: 2,
      transition: {
        duration: 0.1,
      },
    },
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(id);
    }
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(id);
    }
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    if (onMore) {
      onMore(id);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      whileDrag="drag"
      drag={isDraggable}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onTapStart={() => setIsPressed(true)}
      onTapEnd={() => setIsPressed(false)}
      className={`
        relative bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer
        transition-all duration-200 overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
        ${getPriorityColor(priority)}
        ${className}
      `}
      onClick={handleCardClick}
      style={{
        borderLeftWidth: '4px',
      }}
    >
      {/* Drag Handle */}
      {isDraggable && (
        <motion.div
          className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
        </motion.div>
      )}

      {/* Card Content */}
      <div className="p-4 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <motion.div
            className="flex items-center space-x-1"
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFavoriteClick}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'
                }`}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShareClick}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Share2 className="h-4 w-4 text-gray-400" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMoreClick}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </motion.button>
          </motion.div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
            <span className="ml-1 capitalize">{status}</span>
          </span>

          {priority === 'high' && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="h-4 w-4 text-red-500 fill-current" />
            </motion.div>
          )}
        </div>

        {/* Children Content */}
        {children && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {children}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-2 right-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default InteractiveCard;
