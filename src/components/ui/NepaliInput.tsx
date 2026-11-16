'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Languages, Sparkles, Keyboard } from 'lucide-react';
import {
  transliterateWord,
  transliterateSentence,
  getTransliterationSuggestions,
} from '@/lib/transliterate';
import NepaliVirtualKeyboard from '@/components/ui/NepaliVirtualKeyboard';

export interface NepaliInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  className?: string;
  enableTransliteration?: boolean;
  isNe?: boolean;
  icon?: React.ReactNode;
  defaultNepaliMode?: boolean;
}

export default function NepaliInput({
  value,
  onChange,
  placeholder,
  hasError = false,
  className = '',
  enableTransliteration = true,
  isNe = false,
  icon,
  defaultNepaliMode,
  ...rest
}: NepaliInputProps) {
  // Transliteration mode active state (defaults to English by default unless defaultNepaliMode is true)
  const [isNepaliMode, setIsNepaliMode] = useState<boolean>(
    defaultNepaliMode !== undefined ? defaultNepaliMode : false
  );

  useEffect(() => {
    if (defaultNepaliMode !== undefined) {
      setIsNepaliMode(defaultNepaliMode);
    }
  }, [defaultNepaliMode]);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check current word at cursor to calculate suggestions (Instant local + Online Google ML)
  const updateCurrentWord = (val: string, pos: number) => {
    if (!enableTransliteration || !isNepaliMode) {
      setSuggestions([]);
      setCurrentWord('');
      return;
    }

    const textBeforeCursor = val.slice(0, pos);
    const match = textBeforeCursor.match(/([a-zA-Z0-9]+)$/);
    if (match && match[1]) {
      const word = match[1];
      setCurrentWord(word);

      // 1. Instant local engine candidates (0ms latency)
      const localCandidates = getTransliterationSuggestions(word);
      setSuggestions(localCandidates);
      setSelectedSuggestionIndex(0);

      // 2. Fetch Google Input Tools ML candidates in background
      fetch(`/api/transliterate?text=${encodeURIComponent(word)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
            setSuggestions(data.candidates);
          }
        })
        .catch(() => {});
    } else {
      setSuggestions([]);
      setCurrentWord('');
    }
  };

  const applySelectedWord = (chosenWord: string, appendSeparator: string = '') => {
    const input = inputRef.current;
    if (!input || !currentWord) return;

    const cursorPos = input.selectionStart ?? value.length;
    const wordStart = cursorPos - currentWord.length;
    const textAfterCursor = value.slice(cursorPos);

    const newValue = value.slice(0, wordStart) + chosenWord + appendSeparator + textAfterCursor;
    onChange(newValue);

    setSuggestions([]);
    setCurrentWord('');

    const newPos = wordStart + chosenWord.length + appendSeparator.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = newPos;
        inputRef.current.selectionEnd = newPos;
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Toggle mode via Ctrl+G (standard Nepali phonetic toggle)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      setIsNepaliMode((prev) => !prev);
      setSuggestions([]);
      setCurrentWord('');
      return;
    }

    if (!enableTransliteration || !isNepaliMode) return;

    // If suggestions are visible, handle keyboard selection
    if (suggestions.length > 0) {
      // Space or Enter: commit current selected suggestion
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const chosen = suggestions[selectedSuggestionIndex] || suggestions[0] || currentWord;
        applySelectedWord(chosen, e.key === 'Enter' ? '\n' : ' ');
        return;
      }

      // Escape: dismiss suggestions
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        return;
      }

      // Number keys 1, 2, 3, 4, 5: direct pick suggestion
      if (/^[1-5]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < suggestions.length) {
          e.preventDefault();
          applySelectedWord(suggestions[idx], ' ');
          return;
        }
      }

      // Arrow keys or Tab to navigate suggestions
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Tab') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
    } else {
      // If no suggestion popup, space/enter transliterates the last word
      if (e.key === ' ' || e.key === 'Enter') {
        const input = inputRef.current;
        if (!input) return;

        const cursorPos = input.selectionStart ?? value.length;
        const textBeforeCursor = value.slice(0, cursorPos);
        const match = textBeforeCursor.match(/([a-zA-Z0-9]+)$/);
        if (match && match[1]) {
          const lastWord = match[1];
          const nepaliWord = transliterateWord(lastWord);
          if (nepaliWord !== lastWord) {
            e.preventDefault();
            const wordStart = cursorPos - lastWord.length;
            const textAfterCursor = value.slice(cursorPos);
            const sep = e.key === 'Enter' ? '\n' : ' ';
            const newValue = value.slice(0, wordStart) + nepaliWord + sep + textAfterCursor;
            onChange(newValue);

            const newPos = wordStart + nepaliWord.length + sep.length;
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.selectionStart = newPos;
                inputRef.current.selectionEnd = newPos;
              }
            }, 0);
          }
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    updateCurrentWord(newVal, e.target.selectionStart ?? newVal.length);
  };

  const handleConvertEntire = () => {
    if (!value) return;
    const converted = transliterateSentence(value);
    onChange(converted);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full">
      {/* ── Input Box & Centered Toggle Row ── */}
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="pointer-events-none absolute left-3 flex items-center text-slate-400 text-xs z-10">
            {icon}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') {
              updateCurrentWord(value, e.currentTarget.selectionStart ?? value.length);
            }
          }}
          onBlur={() => {
            // Delay closing suggestions so clicks can register
            setTimeout(() => setSuggestions([]), 250);
          }}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-[#F7F9FC] ${
            icon ? 'pl-9' : 'pl-3.5'
          } pr-36 py-2.5 text-xs font-outfit text-slate-800 placeholder-slate-400 transition focus:border-[#18A999] focus:bg-white focus:outline-hidden ${
            hasError ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
          } ${className}`}
          {...rest}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
        />

        {/* ── Mode Toggle Button - Explicitly Centered Vertically Inside Input Box ── */}
        {enableTransliteration && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
            {/* Quick translate full string button if English characters exist */}
            {/[a-zA-Z]/.test(value) && (
              <button
                type="button"
                onClick={handleConvertEntire}
                title={isNe ? 'नेपालीमा रूपान्तरण गर्नुहोस्' : 'Convert Roman to Nepali'}
                className="flex items-center gap-1 h-7 rounded-lg bg-teal-50 px-2 text-[10px] font-bold text-[#148C7E] hover:bg-teal-100 transition border border-teal-200/80 cursor-pointer shadow-2xs leading-none"
              >
                <Sparkles className="h-2.5 w-2.5 text-[#18A999]" />
                <span className="text-[9px]">अनुवाद</span>
              </button>
            )}

            {/* Virtual Keyboard Toggle Button */}
            <button
              type="button"
              onClick={() => setIsKeyboardOpen((prev) => !prev)}
              title={isKeyboardOpen ? 'किबोर्ड बन्द गर्नुहोस्' : 'अन-स्क्रिन नेपाली किबोर्ड खोल्नुहोस्'}
              className={`flex items-center justify-center h-7 w-7 rounded-lg transition shadow-2xs cursor-pointer border leading-none shrink-0 ${
                isKeyboardOpen
                  ? 'bg-[#18A999] text-white border-teal-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <Keyboard className="h-3.5 w-3.5" />
            </button>

            {/* Language Switch Button (Identical dimensions in En and Ne) */}
            <button
              type="button"
              onClick={() => {
                setIsNepaliMode((prev) => !prev);
                setSuggestions([]);
              }}
              title={
                isNepaliMode
                  ? 'नेपाली टाइपिङ सक्रिय छ (Ctrl+G थिचेर अङ्ग्रेजीमा बदल्नुहोस्)'
                  : 'English typing active (Press Ctrl+G for Nepali)'
              }
              className={`flex items-center gap-1.5 h-7 rounded-lg px-2.5 text-[10px] font-bold transition shadow-2xs cursor-pointer border leading-none shrink-0 ${
                isNepaliMode
                  ? 'bg-gradient-to-r from-teal-500 to-[#148C7E] text-white border-teal-600'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
              }`}
            >
              <Languages className="h-3 w-3 shrink-0" />
              <span>{isNepaliMode ? '🇳🇵 ने' : '🔤 En'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Multi-Choice Candidate Suggestions Bar (Under Input) ── */}
      {suggestions.length > 0 && (
        <div className="absolute left-0 top-full mt-1.5 z-30 flex flex-wrap items-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-xs p-1.5 shadow-xl border border-teal-200 animate-in fade-in zoom-in-95 duration-100 max-w-full">
          <span className="text-[10px] font-bold text-slate-400 pl-1 select-none flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            {isNe ? 'विकल्प छान्नुहोस्:' : 'Suggestions:'}
          </span>
          {suggestions.map((cand, idx) => {
            const isSelected = idx === selectedSuggestionIndex;
            return (
              <button
                key={idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySelectedWord(cand, ' ');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#18A999] text-white shadow-xs ring-1 ring-teal-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-[#148C7E]'
                }`}
              >
                <span className={`text-[9px] font-mono px-1 py-0.5 rounded leading-none ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {idx + 1}
                </span>
                <span className="font-outfit">{cand}</span>
              </button>
            );
          })}
          <span className="text-[9px] text-slate-400 font-mono pl-1 select-none hidden sm:inline">
            (Space वा १-{suggestions.length} थिच्नुहोस्)
          </span>
        </div>
      )}

      {/* ── Nepali Virtual Keyboard Drawer/Popup ── */}
      <NepaliVirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        onKeyPress={(char) => {
          const input = inputRef.current;
          const start = input?.selectionStart ?? value.length;
          const end = input?.selectionEnd ?? value.length;
          const nextVal = value.slice(0, start) + char + value.slice(end);
          onChange(nextVal);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.selectionStart = start + char.length;
              inputRef.current.selectionEnd = start + char.length;
              inputRef.current.focus();
            }
          }, 0);
        }}
        onBackspace={() => {
          const input = inputRef.current;
          const start = input?.selectionStart ?? value.length;
          const end = input?.selectionEnd ?? value.length;
          if (start === end && start > 0) {
            const nextVal = value.slice(0, start - 1) + value.slice(end);
            onChange(nextVal);
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.selectionStart = start - 1;
                inputRef.current.selectionEnd = start - 1;
                inputRef.current.focus();
              }
            }, 0);
          } else if (start !== end) {
            const nextVal = value.slice(0, start) + value.slice(end);
            onChange(nextVal);
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.selectionStart = start;
                inputRef.current.selectionEnd = start;
                inputRef.current.focus();
              }
            }, 0);
          }
        }}
        onSpace={() => {
          const input = inputRef.current;
          const start = input?.selectionStart ?? value.length;
          const nextVal = value.slice(0, start) + ' ' + value.slice(start);
          onChange(nextVal);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.selectionStart = start + 1;
              inputRef.current.selectionEnd = start + 1;
              inputRef.current.focus();
            }
          }, 0);
        }}
        onClear={() => {
          onChange('');
          inputRef.current?.focus();
        }}
      />
    </div>
  );
}
