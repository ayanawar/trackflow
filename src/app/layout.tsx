import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: 'TrackFlow — Time Tracking',
  description: 'Professional time tracking for individuals and teams',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Prevent theme flash on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem('trackflow-theme')||'{}').state?.theme||'light';document.documentElement.className=t==='dark'?'dark':'light';}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
