// ============================================================================
// EnvioTrack — SearchBar con debounce
// ============================================================================
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

export function SearchBar() {
  const setFilters = useAppStore((s) => s.setFilters);
  const searchValue = useAppStore((s) => s.filters.search);
  const [localValue, setLocalValue] = useState(searchValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: localValue });
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, setFilters]);

  // Sync external changes
  useEffect(() => {
    setLocalValue(searchValue);
  }, [searchValue]);

  const handleClear = () => {
    setLocalValue('');
    setFilters({ search: '' });
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Buscar por nombre, guía, ciudad..."
        className="input-base !pl-11 !pr-10"
      />
      <AnimatePresence>
        {localValue && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
