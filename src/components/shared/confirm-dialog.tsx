'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
  children: React.ReactNode
  requireTyping?: string
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  variant = 'default',
  onConfirm,
  children,
  requireTyping,
}: ConfirmDialogProps) {
  const t = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)

  const canConfirm = !requireTyping || typed === requireTyping

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
      setTyped('')
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setTyped('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{description}</p>
          {requireTyping && (
            <div className="space-y-1.5">
              <p className="text-sm">
                Type <span className="font-mono font-medium">{requireTyping}</span> to confirm
              </p>
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={requireTyping}
                autoFocus
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button
              variant={variant}
              onClick={handleConfirm}
              disabled={!canConfirm || loading}
            >
              {loading ? t('loading') : (confirmLabel ?? t('confirm'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
