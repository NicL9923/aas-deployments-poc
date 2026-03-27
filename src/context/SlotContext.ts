import { createContext } from 'react';

export interface SlotContextValue {
  selectedSlot: string;
  setSelectedSlot: (slot: string) => void;
}

export const SlotContext = createContext<SlotContextValue>({
  selectedSlot: 'production',
  setSelectedSlot: () => {},
});
