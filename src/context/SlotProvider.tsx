import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { SlotContext } from './SlotContext';

interface SlotProviderProps {
  children: ReactNode;
}

export const SlotProvider = ({ children }: SlotProviderProps) => {
  const [selectedSlot, setSelectedSlot] = useState('production');
  const value = useMemo(() => ({ selectedSlot, setSelectedSlot }), [selectedSlot]);

  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
};
