import { BottomNav } from '@/components/BottomNav'
import { DemoBanner } from '@/components/DemoBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col">
      <DemoBanner />
      <main className="flex-1 safe-bottom overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
