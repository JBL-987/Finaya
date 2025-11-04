import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check, X } from 'lucide-react';
import { CURRENCIES, CURRENCY_REGIONS, getCurrencyInfo } from '../services/currencies';

const CurrencySelector = ({ selectedCurrency, onCurrencyChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Major');
  const [recentCurrencies, setRecentCurrencies] = useState([]);

  // Get currencies for selected region
  const getCurrenciesForRegion = (region) => {
    if (region === 'All') {
      return Object.keys(CURRENCIES);
    }
    return CURRENCY_REGIONS[region] || [];
  };

  // Filter currencies based on search and region
  const filteredCurrencies = getCurrenciesForRegion(selectedRegion)
    .filter(code => {
      if (!searchTerm) return true;
      const currency = CURRENCIES[code];
      const searchLower = searchTerm.toLowerCase();
      return code.toLowerCase().includes(searchLower) ||
             currency.name.toLowerCase().includes(searchLower) ||
             currency.country.toLowerCase().includes(searchLower);
    });

  const currentCurrency = getCurrencyInfo(selectedCurrency);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.currency-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load recent currencies from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentCurrencies') || '[]');
      if (Array.isArray(stored)) setRecentCurrencies(stored);
    } catch {}
  }, []);

  const rememberRecent = (code) => {
    const updated = [code, ...recentCurrencies.filter(c => c !== code)].slice(0, 6);
    setRecentCurrencies(updated);
    try { localStorage.setItem('recentCurrencies', JSON.stringify(updated)); } catch {}
  };

  // lock body scroll when open on mobile for better UX
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div className={`relative currency-selector ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-900/80 border border-yellow-500/40 rounded-full hover:bg-gray-800 transition-all min-w-[160px] shadow-sm hover:shadow-md"
      >
        <Globe className="h-4 w-4 text-yellow-400" />
        <span className="text-white font-semibold">
          {currentCurrency ? currentCurrency.symbol : selectedCurrency}
        </span>
        <span className="text-gray-300 text-sm">
          {currentCurrency ? currentCurrency.code : selectedCurrency}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Mobile full-screen sheet */}
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
            <div className="absolute inset-x-0 top-0 bottom-0 bg-gray-900 border-t border-yellow-500/40 rounded-t-2xl shadow-2xl flex flex-col">
              <div className="p-4 pb-3 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-yellow-400" />
                  <div className="text-white font-semibold">Currency</div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-gray-800">
                  <X className="h-5 w-5 text-gray-300" />
                </button>
              </div>

              {/* Current selection */}
              <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/80">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Current</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-yellow-400">{currentCurrency?.symbol}</span>
                    <div>
                      <div className="text-white font-medium">{currentCurrency?.name || selectedCurrency}</div>
                      <div className="text-xs text-gray-400">{currentCurrency?.country || ''}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 px-2 py-1 border border-gray-700 rounded">
                    {currentCurrency?.code || selectedCurrency}
                  </span>
                </div>
              </div>

              {/* Tabs + Search sticky */}
              <div className="sticky top-0 bg-gray-900 z-10">
                <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-gray-700 px-2">
                  {["All", ...Object.keys(CURRENCY_REGIONS)].map(region => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                        selectedRegion === region
                          ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-400/40'
                          : 'text-gray-300 hover:text-gray-100 border border-transparent'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
                <div className="p-3 border-b border-gray-700">
                  <input
                    type="text"
                    placeholder="Search currencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              {/* Content scroll */}
              <div className="flex-1 overflow-y-auto">
                {recentCurrencies.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-800">
                    <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Recent</div>
                    <div className="flex flex-wrap gap-2">
                      {recentCurrencies.map(code => (
                        <button
                          key={code}
                          onClick={() => {
                            onCurrencyChange(code);
                            rememberRecent(code);
                            setIsOpen(false);
                            setSearchTerm('');
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs border transition ${selectedCurrency === code ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                        >
                          {CURRENCIES[code]?.symbol} {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="divide-y divide-gray-800">
                  {filteredCurrencies.map(code => {
                    const currency = CURRENCIES[code];
                    return (
                      <button
                        key={code}
                        onClick={() => {
                          onCurrencyChange(code);
                          rememberRecent(code);
                          setIsOpen(false);
                          setSearchTerm('');
                        }}
                        className={`w-full px-4 py-4 text-left hover:bg-gray-800 transition-colors flex items-center justify-between ${
                          selectedCurrency === code ? 'bg-yellow-900/10 text-yellow-300' : 'text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl font-semibold text-yellow-400">{currency.symbol}</span>
                          <div>
                            <div className="font-medium text-white">{currency.name}</div>
                            <div className="text-xs text-gray-400">{currency.country}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">{code}</span>
                          {selectedCurrency === code && <Check className="h-4 w-4 text-yellow-400" />}
                        </div>
                      </button>
                    );
                  })}
                  {filteredCurrencies.length === 0 && (
                    <div className="px-3 py-6 text-center text-gray-400">No currencies found</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop dropdown */}
          <div className="hidden md:block absolute top-full left-0 mt-2 w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 max-h-[28rem] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 bg-gray-900/80 backdrop-blur">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Current</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-semibold text-yellow-400">{currentCurrency?.symbol}</span>
                  <div>
                    <div className="text-white font-medium">{currentCurrency?.name || selectedCurrency}</div>
                    <div className="text-xs text-gray-400">{currentCurrency?.country || ''}</div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 px-2 py-1 border border-gray-700 rounded">
                  {currentCurrency?.code || selectedCurrency}
                </span>
              </div>
            </div>
            <div className="flex border-b border-gray-700 px-2">
              {["All", ...Object.keys(CURRENCY_REGIONS)].map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-2 text-sm font-medium rounded-t-md transition-colors ${
                    selectedRegion === region
                      ? 'text-yellow-400 border-b-2 border-yellow-400'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
            <div className="p-3 border-b border-gray-700">
              <input
                type="text"
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            {recentCurrencies.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-800">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Recent</div>
                <div className="flex flex-wrap gap-2">
                  {recentCurrencies.map(code => (
                    <button
                      key={code}
                      onClick={() => {
                        onCurrencyChange(code);
                        rememberRecent(code);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`px-2.5 py-1.5 rounded-full text-xs border transition ${selectedCurrency === code ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
                    >
                      {CURRENCIES[code]?.symbol} {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="max-h-80 overflow-y-auto">
              {filteredCurrencies.map(code => {
                const currency = CURRENCIES[code];
                return (
                  <button
                    key={code}
                    onClick={() => {
                      onCurrencyChange(code);
                      rememberRecent(code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center justify-between ${
                      selectedCurrency === code ? 'bg-yellow-900/20 text-yellow-300' : 'text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-semibold text-yellow-400">{currency.symbol}</span>
                      <div>
                        <div className="font-medium text-white">{currency.name}</div>
                        <div className="text-xs text-gray-400">{currency.country}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">{code}</span>
                      {selectedCurrency === code && <Check className="h-4 w-4 text-yellow-400" />}
                    </div>
                  </button>
                );
              })}
              {filteredCurrencies.length === 0 && (
                <div className="px-3 py-4 text-center text-gray-400">No currencies found</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;
