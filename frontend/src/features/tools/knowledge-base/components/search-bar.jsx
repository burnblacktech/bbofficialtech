// =====================================================
// SEARCH BAR COMPONENT
// Search functionality for knowledge base
// =====================================================

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ query, onQueryChange, results, isLoading }) => {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onQueryChange(localQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [localQuery, onQueryChange]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search tax topics, sections, ITR guides..."
          className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
        {localQuery && (
          <button
            onClick={() => {
              setLocalQuery('');
              onQueryChange('');
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-600"></div>
        </div>
      )}
      {results && results.length > 0 && (
        <div className="mt-2 text-body-regular text-slate-600">
          Found {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

