import { useContext } from 'react';
import { SlotContext } from './SlotContext';

export const useSlot = () => useContext(SlotContext);
