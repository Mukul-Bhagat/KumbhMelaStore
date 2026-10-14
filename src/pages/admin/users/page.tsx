import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { LoadingScreen } from '@/components/layout/loading-screen'
import { SectionHeading } from '@/components/layout/section-heading'
import { Seo } from '@/components/layout/seo'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/ui/error-state'
import { AdminResourcePanel, type CrudField } from '@/features/admin/ui/admin-resource-panel'
import { queryKeys } from '@/shared/api/keys'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import type { Database } from '@/shared/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type RoleRow = Database['public']['Tables']['roles']['Row']
type UserRoleRow = Database['public']['Tables']['user_roles']['Row']
type UserRoleView = UserRoleRow & {
  id: string
  user_label: string
  role_slug: string
  granted_at_label: string
}

type UsersWorkspace = {
  profiles: ProfileRow[]
  roles: RoleRow[]
  userRoles: UserRoleRow[]
  currentUserId: string
}

async function fetchUsersWorkspace(): Promise<UsersWorkspace> {
  const supabase = getSupabaseBrowserClient()
  const [profiles, roles, userRoles, authUser] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, display_name, avatar_url, phone, locale_code, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('roles').select('id, slug, name, description, is_system, created_at, updated_at'),
    supabase.from('user_roles').select('user_id, role_id, granted_at, granted_by'),
    supabase.auth.getUser(),
  ])

  const error = profiles.error ?? roles.error ?? userRoles.error ?? authUser.error
  if (error) throw error
  if (!authUser.data.user) throw new Error('Your Supabase session has expired. Sign in again.')
  return {
    profiles: profiles.data ?? [],
    roles: roles.data ?? [],
    userRoles: userRoles.data ?? [],
    currentUserId: authUser.data.user.id,
  }
}

function fullName(profile: ProfileRow | undefined) {
  return profile?.display_name || profile?.full_name || 'Unnamed account'
}

const profileFields: CrudField[] = [
  { name: 'display_name', label: 'Display name', type: 'text' },
  { name: 'full_name', label: 'Full name', type: 'text' },
  { name: 'phone', label: 'Phone', type: 'text' },
  {
    name: 'avatar_url',
    label: 'Avatar URL',
    type: 'url',
    helperText: 'This changes the profile link only; it does not upload an image.',
  },
  {
    name: 'locale_code',
    label: 'Preferred language',
    type: 'select',
    required: true,
    nullable: false,
    options: [
      { label: 'Hindi', value: 'hi' },
      { label: 'English', value: 'en' },
    ],
  },
  {
    name: 'status',
    label: 'Profile status',
    type: 'select',
    required: true,
    nullable: false,
    helperText: 'This updates the profile record only; it does not disable Supabase Auth sign-in.',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Pending', value: 'pending' },
      { label: 'Suspended', value: 'suspended' },
    ],
  },
]

export function Component() {
  const queryClient = useQueryClient()
  const workspace = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: fetchUsersWorkspace,
  })

  const profileById = useMemo(
    () => new Map((workspace.data?.profiles ?? []).map((profile) => [profile.id, profile])),
    [workspace.data?.profiles],
  )
  const roleById = useMemo(
    () => new Map((workspace.data?.roles ?? []).map((role) => [role.id, role])),
    [workspace.data?.roles],
  )
  const rolesByUser = useMemo(() => {
    const result = new Map<string, string[]>()
    for (const assignment of workspace.data?.userRoles ?? []) {
      const role = roleById.get(assignment.role_id)
      if (!role) continue
      const names = result.get(assignment.user_id) ?? []
      names.push(role.slug)
      result.set(assignment.user_id, names)
    }
    return result
  }, [roleById, workspace.data?.userRoles])

  const userRoleRows = useMemo<UserRoleView[]>(
    () =>
      (workspace.data?.userRoles ?? []).flatMap((assignment) => {
        const role = roleById.get(assignment.role_id)
        if (!role || role.slug === 'super_admin') return []
        return [
          {
            ...assignment,
            id: `${assignment.user_id}:${assignment.role_id}`,
            user_label: fullName(profileById.get(assignment.user_id)),
            role_slug: role.slug,
            granted_at_label: new Date(assignment.granted_at).toLocaleString(),
          },
        ]
      }),
    [profileById, roleById, workspace.data?.userRoles],
  )

  const roleFields = useMemo<CrudField[]>(
    () => [
      {
        name: 'user_id',
        label: 'User profile',
        type: 'select',
        nullable: false,
        required: true,
        options: (workspace.data?.profiles ?? []).map((profile) => ({
          label: `${fullName(profile)} · ${profile.id.slice(0, 8)}`,
          value: profile.id,
        })),
      },
      {
        name: 'role_id',
        label: 'Role',
        type: 'select',
        nullable: false,
        required: true,
        helperText: 'Super Admin assignment is intentionally managed through the guarded database provisioning script.',
        options: (workspace.data?.roles ?? [])
          .filter((role) => role.slug !== 'super_admin')
          .map((role) => ({ label: role.name, value: role.id })),
      },
    ],
    [workspace.data?.profiles, workspace.data?.roles],
  )

  if (workspace.isLoading) {
    return <LoadingScreen className="min-h-[70svh]" />
  }

  if (workspace.error) {
    return (
      <main className="container space-y-8 py-10">
        <Seo title="Users" />
        <ErrorState
          title="User records could not be loaded"
          description={workspace.error instanceof Error ? workspace.error.message : 'Supabase could not return the profile and role records.'}
          onRetry={() => void workspace.refetch()}
        />
      </main>
    )
  }

  return (
    <main className="container space-y-8 py-10">
      <Seo title="Users" />
      <SectionHeading
        eyebrow="Super Admin"
        title="Users"
        description="Review real profile records and maintain non-Super-Admin role assignments. Supabase Auth users are not created or deleted from this screen."
      />
      <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <p className="font-semibold">Identity and access safety</p>
        <p className="mt-1 text-muted-foreground">
          The public profiles table does not contain account email addresses or email-confirmation state. Profile status changes do not disable Auth sign-in. The Super Admin role is read-only here to prevent accidental self-escalation or lockout; use the guarded SQL provisioning workflow for that role.
        </p>
      </div>
      <AdminResourcePanel<ProfileRow>
        title="Customer and staff profiles"
        description={`Showing up to 500 profiles. ${workspace.data?.profiles.length ?? 0} loaded.`}
        rows={workspace.data?.profiles ?? []}
        fields={profileFields}
        rowKey="id"
        canCreate={false}
        columns={[
          {
            label: 'Profile',
            render: (profile) => (
              <div className="space-y-1">
                <p className="font-semibold">{fullName(profile)}</p>
                <p className="text-xs text-muted-foreground">{profile.id}</p>
              </div>
            ),
          },
          {
            label: 'Phone',
            render: (profile) => profile.phone || '—',
          },
          {
            label: 'Roles',
            render: (profile) => (
              <div className="flex flex-wrap gap-1">
                {(rolesByUser.get(profile.id) ?? ['customer']).map((role) => (
                  <Badge key={role} variant={role === 'super_admin' ? 'premium' : 'outline'}>
                    {role.replaceAll('_', ' ')}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            label: 'Profile status',
            render: (profile) => <Badge variant={profile.status === 'active' ? 'success' : 'warning'}>{profile.status}</Badge>,
          },
        ]}
        onUpdate={async (row, values) => {
          if (row.id === workspace.data?.currentUserId && values.status === 'suspended') {
            throw new Error('You cannot suspend your own profile from this screen.')
          }
          if (values.locale_code !== 'hi' && values.locale_code !== 'en') {
            throw new Error('Select a supported language.')
          }
          if (values.status !== 'active' && values.status !== 'pending' && values.status !== 'suspended') {
            throw new Error('Select a valid profile status.')
          }
          const { error } = await getSupabaseBrowserClient()
            .from('profiles')
            .update({
              display_name: typeof values.display_name === 'string' ? values.display_name : null,
              full_name: typeof values.full_name === 'string' ? values.full_name : null,
              phone: typeof values.phone === 'string' ? values.phone : null,
              avatar_url: typeof values.avatar_url === 'string' ? values.avatar_url : null,
              locale_code: values.locale_code,
              status: values.status,
            })
            .eq('id', row.id)
          if (error) throw error
        }}
        onRefresh={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
        }}
      />
      <AdminResourcePanel<UserRoleView>
        title="Role assignments"
        description="Assign customer, admin, or vendor roles using the existing user_roles table. Super Admin grants are intentionally excluded."
        rows={userRoleRows}
        fields={roleFields}
        rowKey="id"
        createLabel="Assign role"
        canCreate={(workspace.data?.profiles.length ?? 0) > 0}
        columns={[
          {
            label: 'User',
            render: (row) => (
              <div className="space-y-1">
                <p className="font-semibold">{row.user_label}</p>
                <p className="text-xs text-muted-foreground">{row.user_id}</p>
              </div>
            ),
          },
          { label: 'Role', render: (row) => <Badge variant="outline">{row.role_slug}</Badge> },
          { label: 'Granted', render: (row) => row.granted_at_label },
          { label: 'Granted by', render: (row) => row.granted_by ?? '—' },
        ]}
        onCreate={async (values) => {
          const userId = values.user_id
          const roleId = values.role_id
          if (typeof userId !== 'string' || !profileById.has(userId)) {
            throw new Error('Select an existing profile.')
          }
          const role = roleById.get(typeof roleId === 'string' ? roleId : '')
          if (!role || role.slug === 'super_admin') {
            throw new Error('Select an assignable role.')
          }
          const { data: authData, error: authError } = await getSupabaseBrowserClient().auth.getUser()
          if (authError) throw authError
          const { error } = await getSupabaseBrowserClient().from('user_roles').insert({
            user_id: userId,
            role_id: role.id,
            granted_by: authData.user?.id ?? null,
          })
          if (error) throw error
        }}
        onDelete={async (row) => {
          if (row.user_id === workspace.data?.currentUserId && row.role_slug === 'admin') {
            throw new Error('You cannot remove your own admin assignment from this screen.')
          }
          const { error } = await getSupabaseBrowserClient()
            .from('user_roles')
            .delete()
            .eq('user_id', row.user_id)
            .eq('role_id', row.role_id)
          if (error) throw error
        }}
        onRefresh={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
        }}
      />
    </main>
  )
}
