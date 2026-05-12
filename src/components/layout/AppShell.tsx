'use client'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pt-14 pb-20 lg:pt-0 lg:pb-0">{children}</main>
    </div>
  )
}
