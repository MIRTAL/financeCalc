import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('currency') || 'RUB');

  const setCurrency = useCallback((val) => {
    localStorage.setItem('currency', val);
    setCurrencyState(val);
  }, []);

  const value = useMemo(() => ({ currency, setCurrency }), [currency, setCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
