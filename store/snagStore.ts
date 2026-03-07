import { create } from 'zustand'

export type SnagStep = 1 | 2 | 3

export interface NewSnag {
  photo: string | null      // data URL or Firebase URL
  location: string
  category: string
  urgency: 'low' | 'medium' | 'high' | ''
  description: string
}

interface SnagState {
  step: SnagStep
  newSnag: NewSnag
  setStep: (step: SnagStep) => void
  updateSnag: (data: Partial<NewSnag>) => void
  resetSnag: () => void
}

const defaultSnag: NewSnag = {
  photo: null,
  location: '',
  category: '',
  urgency: '',
  description: '',
}

export const useSnagStore = create<SnagState>((set) => ({
  step: 1,
  newSnag: defaultSnag,
  setStep: (step) => set({ step }),
  updateSnag: (data) => set((s) => ({ newSnag: { ...s.newSnag, ...data } })),
  resetSnag: () => set({ step: 1, newSnag: defaultSnag }),
}))
