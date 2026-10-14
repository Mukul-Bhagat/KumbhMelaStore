import { EntityShellPage } from '@/components/cms/cms-page'
import { routes } from '@/shared/config/routes'

export function Component() {
  return (
    <EntityShellPage
      title="Wishlist"
      description="Wishlist features will land in the next commerce phase. The route is ready for the future implementation."
      actionHref={routes.collections}
      actionLabel="Browse collections"
      secondaryActionHref={routes.dashboard.home}
      secondaryActionLabel="Open account"
    />
  )
}
