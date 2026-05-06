import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { UserMenu } from '@/components/shared/user-menu'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {title && (
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      )}
      <div className="ml-auto flex items-center gap-1">
        <LocaleSwitcher />
        <UserMenu />
      </div>
    </header>
  )
}
