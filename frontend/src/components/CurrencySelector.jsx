import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check, X, Search, Sparkles } from 'lucide-react';
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
      {/* Trigger Button - Futuristic Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group relative flex items-center space-x-3 px-4 py-2.5 rounded-full transition-all duration-300
          bg-black border border-neutral-800
          hover:border-yellow-500/50 hover:bg-neutral-900 hover:shadow-[0_0_15px_rgba(234,179,8,0.15)]
          ${isOpen ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : ''}
        `}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20 transition-colors">
          <Globe className="h-3.5 w-3.5" />
        </div>
        
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 group-hover:text-yellow-500/80 transition-colors font-medium">Currency</span>
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-bold text-sm tracking-wide">
              {currentCurrency ? currentCurrency.symbol : selectedCurrency}
            </span>
            <span className="text-white font-medium text-sm tracking-wide">
              {currentCurrency ? currentCurrency.code : selectedCurrency}
            </span>
          </div>
        </div>

        <ChevronDown 
          className={`h-4 w-4 text-neutral-500 group-hover:text-yellow-400 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Mobile full-screen sheet */}
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-black/80 transition-opacity" onClick={() => setIsOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 top-16 bg-neutral-950 border-t border-yellow-500/20 rounded-t-[2rem] shadow-[0_-10px_40px_-10px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
              
              {/* Mobile Header */}
              <div className="relative p-5 pb-4 border-b border-white/5 flex items-center justify-between bg-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Select Currency</h3>
                    <p className="text-xs text-neutral-400">Choose your preferred currency</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-2 pt-4 bg-neutral-950">
                <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-2">
                  {["All", ...Object.keys(CURRENCY_REGIONS)].map(region => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegion(region)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                        ${selectedRegion === region
                          ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                          : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800'}
                      `}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="px-5 py-3 bg-neutral-950 border-b border-white/5">
                <div className="relative group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-yellow-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search globally..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-yellow-500/20 scrollbar-track-transparent bg-black">
                {recentCurrencies.length > 0 && !searchTerm && (
                  <div className="mb-4 px-3 pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Recent</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {recentCurrencies.map(code => (
                        <button
                          key={code}
                          onClick={() => { onCurrencyChange(code); rememberRecent(code); setIsOpen(false); setSearchTerm(''); }}
                          className={`
                            relative overflow-hidden group px-3 py-2.5 rounded-xl border transition-all duration-300
                            ${selectedCurrency === code 
                              ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-700 hover:text-white'}
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold mb-0.5">{code}</span>
                            <span className="text-[10px] opacity-70">{CURRENCIES[code]?.symbol}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  {filteredCurrencies.map(code => {
                    const currency = CURRENCIES[code];
                    const isSelected = selectedCurrency === code;
                    return (
                      <button
                        key={code}
                        onClick={() => { onCurrencyChange(code); rememberRecent(code); setIsOpen(false); setSearchTerm(''); }}
                        className={`
                          w-full group px-4 py-3.5 rounded-xl text-left transition-all duration-200 border border-transparent
                          flex items-center justify-between
                          ${isSelected 
                            ? 'bg-yellow-500/10 border-yellow-500/30' 
                            : 'hover:bg-neutral-900 hover:border-neutral-800'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`
                            flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold transition-transform duration-300 group-hover:scale-110
                            ${isSelected ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' : 'bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700 group-hover:text-white'}
                          `}>
                            {currency.symbol}
                          </div>
                          <div>
                            <div className={`font-bold transition-colors ${isSelected ? 'text-yellow-400' : 'text-white group-hover:text-yellow-100'}`}>
                              {currency.name}
                            </div>
                            <div className="text-xs text-neutral-500 group-hover:text-neutral-400 font-medium tracking-wide">
                              {currency.country}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold tracking-wider px-2 py-1 rounded-md ${isSelected ? 'bg-yellow-500/20 text-yellow-300' : 'bg-neutral-900 text-neutral-500'}`}>
                            {code}
                          </span>
                          {isSelected && <Check className="h-5 w-5 text-yellow-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Dropdown - Solid Black Card */}
          <div className="hidden md:flex absolute top-full left-0 mt-3 w-[26rem] flex-col bg-black border border-neutral-800 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Gradient Line */}
            <div className="h-1 w-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>

            <div className="p-4 bg-black">
              {/* Region Tabs */}
              <div className="flex gap-1.5 mb-4 overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-yellow-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-yellow-500/40 pb-2">
                {["All", ...Object.keys(CURRENCY_REGIONS)].map(region => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`
                      px-4 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold transition-all duration-300 whitespace-nowrap
                      ${selectedRegion === region
                        ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)] scale-105'
                        : 'bg-neutral-900 text-neutral-500 hover:bg-neutral-800 hover:text-white border border-transparent'}
                    `}
                  >
                    {region}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-yellow-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search currency, country or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                />
              </div>
            </div>

            {/* Recent Section */}
            {recentCurrencies.length > 0 && !searchTerm && (
              <div className="px-4 pb-4 bg-black">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Quick Select</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentCurrencies.map(code => (
                    <button
                      key={code}
                      onClick={() => { onCurrencyChange(code); rememberRecent(code); setIsOpen(false); setSearchTerm(''); }}
                      className={`
                        group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200
                        ${selectedCurrency === code 
                          ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white hover:border-neutral-700'}
                      `}
                    >
                      <span className="text-xs font-bold">{code}</span>
                      <span className={`text-[10px] ${selectedCurrency === code ? 'text-yellow-500' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
                        {CURRENCIES[code]?.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto bg-black border-t border-neutral-900 pr-1 mr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-900/50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-yellow-600/50 [&::-webkit-scrollbar-thumb]:to-yellow-400/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:from-yellow-500 hover:[&::-webkit-scrollbar-thumb]:to-yellow-300">
              <div className="grid grid-cols-1">
                {filteredCurrencies.map(code => {
                  const currency = CURRENCIES[code];
                  const isSelected = selectedCurrency === code;
                  return (
                    <button
                      key={code}
                      onClick={() => { onCurrencyChange(code); rememberRecent(code); setIsOpen(false); setSearchTerm(''); }}
                      className={`
                        group relative flex items-center justify-between px-5 py-3 transition-colors border-l-[3px]
                        ${isSelected 
                          ? 'bg-yellow-500/5 border-yellow-500' 
                          : 'border-transparent hover:bg-neutral-900 hover:border-neutral-800'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center font-serif text-sm border 
                          ${isSelected ? 'bg-black border-yellow-500/50 text-yellow-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 group-hover:text-white group-hover:border-neutral-700'}
                        `}>
                          {currency.symbol}
                        </div>
                        <div className="text-left">
                          <div className={`text-sm font-bold ${isSelected ? 'text-yellow-400' : 'text-neutral-200 group-hover:text-white'}`}>
                            {currency.name}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">
                            {currency.country}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <span className={`
                           text-[10px] font-bold px-1.5 py-0.5 rounded border
                           ${isSelected ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500 group-hover:border-neutral-700'}
                         `}>
                           {code}
                         </span>
                         {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,1)] animate-pulse"></div>}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {filteredCurrencies.length === 0 && (
                <div className="p-8 text-center text-neutral-500">
                  <p className="text-xs uppercase tracking-widest">No match found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;
