import type { ReactNode } from 'react'
import { SessionGuard } from '@/components/session-guard'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <SessionGuard>{children}</SessionGuard>
}
