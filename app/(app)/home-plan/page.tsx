'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, CheckCircle2, HelpCircle } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import { type HomePlanItem, type FloorPlanRoom } from '@/lib/firestore'
import { FloorPlanCanvas } from '@/components/floorplan/FloorPlanCanvas'
import { ItemPanel } from '@/components/floorplan/ItemPanel'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useDemoDataHook } from '@/lib/demo-data'
import { PageGuide } from '@/components/PageGuide'
import { RoomMinimap } from '@/components/floorplan/RoomMinimap'
import { RoomDetailSheet } from '@/components/floorplan/RoomDetailSheet'

export default function HomePlanPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeProperty: property, activePropertyId: propertyId } = useProperty()

  // Demo mode — use placeholder data when not signed in
  const isDemo = !user
  const demoContext = useDemoDataHook(propertyId)
  
  const effectiveProperty = property ?? (isDemo ? demoContext.property : null)
  const effectiveRooms: FloorPlanRoom[] = property?.rooms?.length
    ? property.rooms
    : isDemo ? demoContext.rooms : []
  const effectiveFloorPlanUrl = property?.floorPlanUrl

  const [items, setItems] = useState<HomePlanItem[]>(property?.homePlan ?? [])
  const [selectedItem, setSelectedItem] = useState<HomePlanItem | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<FloorPlanRoom | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const rooms: FloorPlanRoom[] = effectiveRooms
  const floorPlanUrl = effectiveFloorPlanUrl

  const handleItemsChange = useCallback((next: HomePlanItem[]) => {
    setItems(next)
    setSaved(false)
    // Keep selected item in sync
    setSelectedItem((prev) => prev ? next.find((it) => it.id === prev.id) ?? null : null)
  }, [])

  const handleItemSelect = useCallback((item: HomePlanItem | null) => {
    setSelectedItem(item)
    setSelectedRoom(null)
  }, [])

  const handleRoomSelect = useCallback((room: FloorPlanRoom | null) => {
    setSelectedRoom(room)
    setSelectedItem(null)
  }, [])

  const handleItemUpdate = useCallback((updated: HomePlanItem) => {
    setSelectedItem(updated)
    setItems((prev) => prev.map((it) => it.id === updated.id ? updated : it))
    setSaved(false)
  }, [])

  const handleItemDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setSelectedItem(null)
    setSaved(false)
  }, [])

  const handleSave = async () => {
    if (!user || !propertyId) return
    setSaving(true)
    try {
      const ref = doc(db!, 'users', user.uid, 'properties', propertyId)
      await updateDoc(ref, { homePlan: items })
      setSaved(true)
    } catch (err) {
      console.error('[HomePlan] Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!effectiveProperty && !isDemo) {
    return (
      <div className="min-h-dvh bg-vault-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    )
  }

  const hasRooms = rooms.length > 0

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center"
          >
            <ArrowLeft size={16} className="text-vault-text-muted" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">Home Plan</h1>
            <p className="text-xs text-vault-text-muted">
              {effectiveProperty?.unitTypeLabel ?? effectiveProperty?.unit ?? ''}
              {isDemo && <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-gold-500/10 text-gold-500 border border-gold-500/20">Demo</span>}
            </p>
          </div>
        </div>
        <button
          onClick={isDemo ? () => {} : handleSave}
          disabled={saving || isDemo}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-gradient text-charcoal-300 text-xs font-bold transition-all hover:shadow-gold-glow disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={13} />
          ) : (
            <Save size={13} />
          )}
          {saved ? 'Saved!' : 'Save Plan'}
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 px-4 pb-32 pt-2">
        <PageGuide id="home-plan" title={isDemo && demoContext.property?.occupancy === 'rented' ? 'Rental Property Room Map' : isDemo && demoContext.property?.occupancy === 'renovation' ? 'Construction — Planned Layout' : isDemo && demoContext.property?.occupancy === 'empty' ? 'Bare Shell — Planning Mode' : 'Interactive Blueprint'}>
          {isDemo && demoContext.property?.occupancy === 'rented'
            ? 'Shows the fixed-fitting layout of the property. Tenant furniture is not tracked — only owner-installed appliances, ACs, and sanitary fixtures are recorded here.'
            : isDemo && demoContext.property?.occupancy === 'renovation'
            ? 'Based on the approved architectural drawing for C-801. Rooms reflect the planned layout — actual finishes will be updated post-possession.'
            : isDemo && demoContext.property?.occupancy === 'empty'
            ? 'The bare shell interior floor plan. Rooms will be fitted during renovation. Tap each space to plan future fixtures and finishes.'
            : 'Tap any room to view exact dimensions, linked paint colors, and fixed assets like appliances or sanitary ware specific to that space.'}
        </PageGuide>

        {hasRooms ? (
          <>
            {/* Hint */}
            <div className="flex items-center gap-1.5 mb-3">
              <HelpCircle size={12} className="text-vault-text-muted" />
              <p className="text-xs text-vault-text-muted">
                {isDemo && demoContext.property?.occupancy === 'rented'
                  ? `${rooms.length} rooms — only owner-installed fixtures tracked`
                  : isDemo && demoContext.property?.occupancy === 'renovation'
                  ? `${rooms.length} planned rooms — based on architectural drawing`
                  : isDemo && demoContext.property?.occupancy === 'empty'
                  ? `${rooms.length} bare shell spaces — tap to plan finishes`
                  : isDemo
                  ? `${rooms.length} rooms across ${effectiveProperty?.floorPlanType ?? 'G+2'} — tap to explore`
                  : selectedItem
                  ? 'Item selected — edit below'
                  : 'Tap a room or furniture item'}
              </p>
            </div>

            {isDemo ? (
              <>
                <RoomMinimap
                  rooms={rooms}
                  warrantyAssets={demoContext.assets}
                  propertyLabel={effectiveProperty?.unitTypeLabel}
                  area={effectiveProperty?.area}
                  isDemo
                  onRoomClick={(r) => setSelectedRoom(r)}
                />
                <RoomDetailSheet
                  room={selectedRoom}
                  spec={selectedRoom ? demoContext.roomsSpecs[selectedRoom.name] ?? null : null}
                  warrantyCount={demoContext.assets.filter((a: any) => a.zone === selectedRoom?.name || a.zone?.includes(selectedRoom?.name?.split(' ')[0] ?? '')).length}
                  onClose={() => setSelectedRoom(null)}
                />
              </>
            ) : (
              <FloorPlanCanvas
                rooms={rooms}
                floorPlanUrl={floorPlanUrl}
                initialItems={items.length > 0 ? items : undefined}
                mode="edit"
                totalArea={effectiveProperty?.area}
                onItemsChange={handleItemsChange}
                onItemSelect={handleItemSelect}
                onRoomSelect={handleRoomSelect}
              />
            )}

            {/* Room info strip for edit mode */}
            {!isDemo && selectedRoom && (
              <div className="mt-3 card p-3 border-vault-border rounded-2xl">
                <p className="text-xs font-bold text-white">{selectedRoom.name}</p>
                <p className="text-xs text-vault-text-muted mt-0.5">
                  {items.filter((it) => it.roomName === selectedRoom.name).length} items in this room
                </p>
              </div>
            )}
          </>
        ) : (
          /* No rooms yet — show floor plan image or placeholder */
          <div className="card p-6 rounded-3xl border-vault-border text-center space-y-3 mt-4">
            <p className="text-2xl">🏠</p>
            <p className="text-sm font-bold text-white">No floor plan data yet</p>
            <p className="text-xs text-vault-text-muted">
              Upload your brochure PDF through onboarding to generate the room layout.
              The AI will extract room positions from your floor plan.
            </p>
            {floorPlanUrl && (
              <>
                <p className="text-xs text-gold-500 font-medium">Floor plan image available:</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={floorPlanUrl}
                  alt="Floor plan"
                  className="w-full rounded-xl object-contain max-h-64 mt-2"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Item edit panel (slide-up) */}
      {selectedItem && (
        <ItemPanel
          item={selectedItem}
          onUpdate={handleItemUpdate}
          onDelete={handleItemDelete}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
