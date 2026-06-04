'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import citiesData from '@/lib/data/colombia-cities.json';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CityAutocomplete({ value, onChange, error }: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar query con valor externo cuando sea necesario
  useEffect(() => {
    if (!isOpen) {
      setQuery(value);
    }
  }, [value, isOpen]);

  // Cerrar al hacer clic afuera — compatibilidad iOS (touchstart) y desktop (mousedown)
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery(value); // Restaurar si no se seleccionó
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside as EventListener, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside as EventListener);
    };
  }, [value]);

// ── Normalizar texto: quitar tildes, comas, caracteres especiales ──
function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes/acentos
    .replace(/[,.\-]/g, '')          // quitar comas, puntos, guiones
    .replace(/\s+/g, ' ')            // colapsar espacios
    .toLowerCase()
    .trim();
}

// ── Distancia de Levenshtein simplificada (para detectar errores ortográficos) ──
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

// ── Búsqueda fuzzy: primero los que contienen el texto, luego los cercanos por ortografía ──
function fuzzyFilter(items: typeof citiesData, rawQuery: string) {
  const q = normalize(rawQuery);
  if (q.length < 2) return [];

  const scored = items.map((item) => {
    const cityNorm = normalize(item.city);
    const fullNorm = normalize(`${item.city} ${item.department}`);

    // Coincidencia exacta normalizada (sin tildes/comas)
    if (cityNorm.includes(q) || fullNorm.includes(q)) {
      // Priorizar si empieza con la búsqueda
      const startsBonus = cityNorm.startsWith(q) ? 0 : 1;
      return { item, score: startsBonus };
    }

    // Tolerancia a errores ortográficos (máx 2 caracteres de diferencia)
    const dist = levenshtein(q, cityNorm.slice(0, q.length + 2));
    const threshold = q.length <= 4 ? 1 : 2; // más estricto con palabras cortas
    if (dist <= threshold) {
      return { item, score: 10 + dist };
    }

    return null;
  });

  return scored
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, 15)
    .map((s) => s.item);
}

  const handleSelect = (cityString: string) => {
    setQuery(cityString);
    onChange(cityString);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    onChange('');
    setIsOpen(true);
  };

  // Resultados filtrados (memoizado para no recalcular dos veces en el render)
  const filteredCities = fuzzyFilter(citiesData, query);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={`input-base !pl-10 ${query ? '!pr-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/15' : ''}`}
          placeholder="Buscar ciudad... (Ej: Bogotá)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.length > 1 && (
        <div
          className="absolute z-50 w-full mt-2 bg-surface/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {filteredCities.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">
              No se encontraron ciudades
            </div>
          ) : (
            <ul className="py-2">
              {filteredCities.map((item, index) => {
                const cityString = `${item.city}, ${item.department}`;
                return (
                  <li key={`${item.city}-${item.department}-${index}`}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-elevated active:bg-surface-elevated/70 transition-colors flex flex-col"
                      onClick={() => handleSelect(cityString)}
                    >
                      <span className="font-medium text-foreground">{item.city}</span>
                      <span className="text-xs text-muted">{item.department}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
