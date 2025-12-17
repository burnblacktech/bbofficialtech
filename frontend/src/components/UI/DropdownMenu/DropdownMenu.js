// =====================================================
// DROPDOWN MENU COMPONENT
// Custom dropdown menu with keyboard navigation
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

const DropdownMenu = ({
  trigger,
  items = [],
  position = 'bottom', // 'top' | 'bottom' | 'left' | 'right'
  align = 'start', // 'start' | 'end' | 'center'
  className = '',
  onItemClick,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        setFocusedIndex(-1);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        handleItemClick(items[focusedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, items]);

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    if (onItemClick) {
      onItemClick(item);
    }
    if (!item.items || item.items.length === 0) {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const positionClasses = {
    bottom: 'top-full mt-1',
    top: 'bottom-full mb-1',
    left: 'right-full mr-1',
    right: 'left-full ml-1',
  };

  const alignClasses = {
    start: position === 'bottom' || position === 'top' ? 'left-0' : 'top-0',
    end: position === 'bottom' || position === 'top' ? 'right-0' : 'bottom-0',
    center: position === 'bottom' || position === 'top' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
  };

  return (
    <div className={cn('relative', className)} {...props}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            'absolute z-50 bg-white border border-slate-200 rounded-xl shadow-floating min-w-[200px] py-1',
            positionClasses[position],
            alignClasses[align],
          )}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.separator) {
              return <div key={index} className="my-1 border-t border-slate-200" />;
            }

            const hasSubmenu = item.items && item.items.length > 0;

            return (
              <div key={index} className="relative group">
                <button
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2 text-left text-body-md transition-colors',
                    'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                    {
                      'bg-slate-50': focusedIndex === index,
                      'text-slate-500 cursor-not-allowed': item.disabled,
                      'text-gray-800': !item.disabled,
                    },
                  )}
                  style={{ fontSize: '14px', lineHeight: '22px' }}
                  disabled={item.disabled}
                  role="menuitem"
                >
                  <div className="flex items-center space-x-3">
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </div>
                  {hasSubmenu && <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>

                {/* Submenu */}
                {hasSubmenu && (
                  <div className="absolute left-full top-0 ml-1 bg-white border border-slate-200 rounded-xl shadow-floating min-w-[200px] py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    {item.items.map((subItem, subIndex) => (
                      <button
                        key={subIndex}
                        onClick={() => handleItemClick(subItem)}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-left text-body-md text-gray-800 hover:bg-slate-50 transition-colors"
                        style={{ fontSize: '14px', lineHeight: '22px' }}
                        role="menuitem"
                      >
                        {subItem.icon && <subItem.icon className="w-4 h-4" />}
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;

