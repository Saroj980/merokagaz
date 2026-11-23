'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface CustomSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  hideChevron?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'छान्नुहोस् / Select...',
  searchPlaceholder = 'खोज्नुहोस् / Search options...',
  searchable = true,
  icon,
  trailingIcon,
  hideChevron = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(query);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(query) : false;
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(query) : false;
      return matchLabel || matchSub || matchBadge;
    });
  }, [options, searchQuery]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      if (searchable && options.length > 5) {
        const timer = setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
        return () => clearTimeout(timer);
      }
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, searchable, options.length]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const chosen = filteredOptions[highlightedIndex];
        onChange(String(chosen.value));
        setIsOpen(false);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative w-full text-left font-outfit ${isOpen ? 'z-[90]' : 'z-auto'} ${className}`}
    >
      {/* Trigger Button - Professional styled input */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-normal text-slate-800 shadow-2xs transition-all hover:border-[#18A999] hover:bg-slate-50/40 focus:border-[#18A999] focus:outline-none focus:ring-3 focus:ring-[#18A999]/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-60 cursor-pointer ${
          isOpen ? 'border-[#18A999] ring-3 ring-[#18A999]/15' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-slate-400 group-hover:text-[#18A999] transition-colors">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-[#148C7E]">
              {selectedOption.badge}
            </span>
          )}
        </div>

        {trailingIcon ? (
          <span className="shrink-0 text-slate-400 group-hover:text-[#18A999] transition-colors">
            {trailingIcon}
          </span>
        ) : !hideChevron ? (
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
              isOpen ? 'rotate-180 text-[#18A999]' : ''
            }`}
          />
        ) : null}
      </button>

      {/* Dropdown Menu - Ant Design floating card with clean shadow and item selection */}
      {isOpen && (
        <div
          className={`absolute left-0 z-[100] mt-1.5 w-full min-w-[220px] rounded-xl border border-slate-200 bg-white shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${dropdownClassName}`}
        >
          {/* Search Box Header (if searchable and > 4 options) */}
          {(searchable && options.length > 4) && (
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 p-2 backdrop-blur-xs">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#18A999] focus:outline-none focus:ring-1 focus:ring-[#18A999]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div ref={listRef} className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-xs font-medium text-slate-500">कुनै विकल्प भेटिएन</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No options matching &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => {
                      onChange(String(option.value));
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#E6F6F3] text-[#0F766E] font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate text-left">
                      {option.icon && <span className="shrink-0">{option.icon}</span>}
                      <div className="truncate">
                        <p className="truncate font-medium">{option.label}</p>
                        {option.subLabel && (
                          <p
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-[#0F766E]/80' : 'text-slate-400'
                            }`}
                          >
                            {option.subLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {option.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isSelected
                              ? 'bg-teal-100 text-[#0F766E]'
                              : 'bg-slate-100 border border-slate-200 text-slate-600'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#18A999]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
