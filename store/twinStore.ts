import { create } from 'zustand'

interface TwinState {
  selectedAssetId: string | null
  drawerOpen: boolean
  selectAsset: (id: string) => void
  closeDrawer: () => void
}

export const useTwinStore = create<TwinState>((set) => ({
  selectedAssetId: null,
  drawerOpen: false,
  selectAsset: (id) => set({ selectedAssetId: id, drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false, selectedAssetId: null }),
}))
