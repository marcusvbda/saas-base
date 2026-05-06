'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { UpgradePrompt } from '@/components/shared/upgrade-prompt'
import { Separator } from '@/components/ui/separator'
type Role = 'OWNER' | 'EDITOR' | 'VIEWER'

interface Member {
  id: string
  userId: string
  role: Role
  createdAt: Date
  user: { id: string; name: string | null; email: string; avatarUrl: string | null }
}

interface Invite {
  id: string
  email: string
  role: Role
  expiresAt: Date
}

interface MembersContentProps {
  projectId: string
  members: Member[]
  invites: Invite[]
  myUserId: string
  myRole: Role
  canInvite: boolean
}

export function MembersContent({
  projectId,
  members,
  invites,
  myUserId,
  myRole,
  canInvite,
}: MembersContentProps) {
  const t = useTranslations()
  const utils = trpc.useUtils()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER')

  const isOwner = myRole === 'OWNER'
  const isEditor = myRole === 'EDITOR' || isOwner

  const invite = trpc.invites.create.useMutation({
    onSuccess: () => {
      toast.success(t('members.invite'))
      utils.invites.list.invalidate({ projectId })
      setInviteOpen(false)
      setEmail('')
    },
    onError: (err) => toast.error(err.message),
  })

  const revoke = trpc.invites.revoke.useMutation({
    onSuccess: () => utils.invites.list.invalidate({ projectId }),
    onError: (err) => toast.error(err.message),
  })

  const remove = trpc.members.remove.useMutation({
    onSuccess: () => utils.members.list.invalidate({ projectId }),
    onError: (err) => toast.error(err.message),
  })

  const updateRole = trpc.members.updateRole.useMutation({
    onSuccess: () => utils.members.list.invalidate({ projectId }),
    onError: (err) => toast.error(err.message),
  })

  function handleInviteClick() {
    if (!canInvite) { setShowUpgrade(true); return }
    setInviteOpen(true)
  }

  return (
    <div className="space-y-8">
      {isEditor && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleInviteClick}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('members.invite')}
          </Button>
        </div>
      )}

      {showUpgrade && <UpgradePrompt size="card" />}

      <div className="rounded-md border divide-y">
        {members.map((m) => {
          const initials = (m.user.name ?? m.user.email).slice(0, 2).toUpperCase()
          const isMe = m.userId === myUserId
          return (
            <div key={m.id} className="flex items-center gap-3 p-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.user.avatarUrl ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.user.name ?? m.user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
              </div>
              {isOwner && !isMe && m.role !== 'OWNER' ? (
                <Select
                  value={m.role}
                  onValueChange={(v) =>
                    updateRole.mutate({ projectId, memberId: m.id, role: v as 'EDITOR' | 'VIEWER' })
                  }
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['EDITOR', 'VIEWER'] as Role[]).map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {t(`members.roles.${r}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {t(`members.roles.${m.role}`)}
                </Badge>
              )}
              {isOwner && !isMe && m.role !== 'OWNER' && (
                <ConfirmDialog
                  title={t('members.remove')}
                  description={`Remove ${m.user.name ?? m.user.email}?`}
                  confirmLabel={t('members.remove')}
                  variant="destructive"
                  onConfirm={() => remove.mutate({ projectId, memberId: m.id })}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </ConfirmDialog>
              )}
            </div>
          )
        })}
      </div>

      {invites.length > 0 && (
        <div>
          <Separator className="mb-4" />
          <h3 className="text-sm font-semibold mb-3">{t('members.pendingInvites')}</h3>
          <div className="rounded-md border divide-y">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('members.expires')} {format(new Date(inv.expiresAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">{t(`members.roles.${inv.role}`)}</Badge>
                {isEditor && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => revoke.mutate({ projectId, inviteId: inv.id })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('members.invite')}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              invite.mutate({ projectId, email, role })
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>{t('members.inviteEmailLabel')}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('members.inviteRoleLabel')}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'EDITOR' | 'VIEWER')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">{t('members.roles.EDITOR')}</SelectItem>
                  <SelectItem value="VIEWER">{t('members.roles.VIEWER')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending ? t('common.loading') : t('members.invite')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
