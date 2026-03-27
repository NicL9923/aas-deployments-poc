import { createContext, useContext, useMemo, useState } from 'react';

interface SlotContextValue {
  selectedSlot: string;
  setSelectedSlot: (slot: string) => void;
}

const SlotContext = createContext<SlotContextValue>({
  selectedSlot: 'production',
  setSelectedSlot: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export const useSlot = () => useContext(SlotContext);

export const SlotProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedSlot, setSelectedSlot] = useState('production');
  const value = useMemo(() => ({ selectedSlot, setSelectedSlot }), [selectedSlot]);

  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
};
