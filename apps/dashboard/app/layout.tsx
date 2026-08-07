import type { Metadata } from "next"
import { RoleProvider } from "@/lib/role-context"
import { ThemeProvider } from "@/lib/theme-context"
import { DemoToolbar } from "@/components/demo-toolbar"
import { ConditionalShell } from "@/components/conditional-shell"
import "./globals.css"

export const metadata: Metadata = {
  title: "Spectrum Clean Manager",
  description: "Spectrum Clean manager web app",
}

// Blocking script: runs before React hydrates to apply the correct theme class
// and prevent a flash of the wrong theme.
const themeInitScript = `
(function(){try{var t=localStorage.getItem('sc-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex h-screen flex-col overflow-hidden bg-background antialiased">
        <ThemeProvider>
          <RoleProvider>
            <DemoToolbar />
            <ConditionalShell>{children}</ConditionalShell>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
