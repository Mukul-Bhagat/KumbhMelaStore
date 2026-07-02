export interface UserProfile {
  name: string
  email: string
  phone: string
  avatarInitials: string
  tier: 'Connoisseur' | 'Heritage' | 'Circle'
  location: string
}
