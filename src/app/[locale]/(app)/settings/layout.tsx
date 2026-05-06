import { SettingsLayout } from '@/components/layouts/settings-layout'

export default function SettingsGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <SettingsLayout>{children}</SettingsLayout>
}
