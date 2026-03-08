import { BottomNav } from '@/components/BottomNav'
import { DemoBanner } from '@/components/DemoBanner'
import { AuthGuard } from '@/components/AuthGuard'
import { ProfileReminderBanner } from '@/components/ProfileReminderBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-dvh bg-vault-bg flex flex-col">
        <DemoBanner />
        <ProfileReminderBanner />
        <main className="flex-1 safe-bottom overflow-y-auto">
          {children}
        </main>
        <BottomNav />
      </div>
    </AuthGuard>
  )
}
