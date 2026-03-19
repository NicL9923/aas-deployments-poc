import { createContext, useContext, useState, useMemo } from 'react';
import type { VariantMode } from '../types';

interface VariantContextValue {
  variant: VariantMode;
  setVariant: (v: VariantMode) => void;
}

const VariantContext = createContext<VariantContextValue>({
  variant: 'bold',
  setVariant: () => {},
});

export const useVariant = () => useContext(VariantContext);

export const VariantProvider = ({ children }: { children: React.ReactNode }) => {
  const [variant, setVariant] = useState<VariantMode>('bold');

  const value = useMemo(() => ({ variant, setVariant }), [variant]);

  return (
    <VariantContext.Provider value={value}>
      {children}
    </VariantContext.Provider>
  );
};
