import { PolicyPage } from '@/components/policies/policy-page'
import { policyContent } from '@/shared/config/policy-content'

export function Component() {
  return <PolicyPage meta={policyContent.cancellation} />
}
