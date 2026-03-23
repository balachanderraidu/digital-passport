import { BottomNav } from '@/components/BottomNav'
import { DemoBanner } from '@/components/DemoBanner'
import { AuthGuard } from '@/components/AuthGuard'
import { ProfileReminderBanner } from '@/components/ProfileReminderBanner'
import { PropertyProvider } from '@/components/PropertyProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PropertyProvider>
        <div className="min-h-dvh bg-vault-bg">
          <DemoBanner />
          <ProfileReminderBanner />
          <main className="safe-bottom">
            {children}
          </main>
          <BottomNav />
        </div>
      </PropertyProvider>
    </AuthGuard>
  )
}
