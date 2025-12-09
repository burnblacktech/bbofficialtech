// =====================================================
// HELP SEARCH COMPONENT
// Search component with autocomplete for help content
// =====================================================

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useHelpSearch } from '../../features/help/hooks/use-help-search';
import { Link } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';

const HelpSearch = ({ onResultClick, placeholder = 'Search for help articles, FAQs, or topics...' }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);
  const { data: searchResults, isLoading } = useHelpSearch(debouncedQuery, {}, debouncedQuery.length >= 2);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('helpSearchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveToHistory = (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;

    const updatedHistory = [
      searchTerm,
      ...searchHistory.filter((item) => item !== searchTerm),
    ].slice(0, 10); // Keep last 10 searches

    setSearchHistory(updatedHistory);
    localStorage.setItem('helpSearchHistory', JSON.stringify(updatedHistory));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      saveToHistory(query.trim());
      setShowSuggestions(false);
      if (onResultClick) {
        onResultClick(query);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    saveToHistory(suggestion);
    setShowSuggestions(false);
    if (onResultClick) {
      onResultClick(suggestion);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = searchResults?.data?.results?.slice(0, 5) || [];
  const hasResults = suggestions.length > 0;
  const showHistory = showSuggestions && query.length === 0 && searchHistory.length > 0;
  const showSuggestionsList = showSuggestions && (query.length > 0 || hasResults);

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 text-body-md border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gold-500 text-white rounded-md hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 text-body-sm font-medium"
            disabled={isLoading || query.trim().length < 2}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Search History */}
          {showHistory && (
            <div className="p-2 border-b border-gray-200">
              <div className="flex items-center gap-2 px-3 py-2 text-body-xs font-semibold text-gray-500">
                <Clock className="h-4 w-4" />
                Recent Searches
              </div>
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-50 rounded"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query.length >= 2 && (
            <>
              {isLoading ? (
                <div className="p-4 text-center text-body-sm text-gray-500">Searching...</div>
              ) : hasResults ? (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-body-xs font-semibold text-gray-500">
                    <TrendingUp className="h-4 w-4" />
                    Search Results
                  </div>
                  <div className="space-y-1">
                    {suggestions.map((result, index) => (
                      <Link
                        key={index}
                        to={result.url || `/help/articles/${result.id}`}
                        onClick={() => {
                          setShowSuggestions(false);
                          if (onResultClick) {
                            onResultClick(result);
                          }
                        }}
                        className="block px-3 py-2 text-body-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        <div className="font-medium">{result.title}</div>
                        {result.snippet && (
                          <div className="text-body-xs text-gray-500 mt-1 line-clamp-2">{result.snippet}</div>
                        )}
                        {result.category && (
                          <div className="text-body-xs text-gold-600 mt-1">{result.category}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-body-sm text-gray-500">
                  No results found for &quot;{query}&quot;
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HelpSearch;

