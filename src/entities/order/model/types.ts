export type OrderStatus =
  | 'Placed'
  | 'Packed'
  | 'In Transit'
  | 'Delivered'
  | 'Returned'

export interface Order {
  id: string
  number: string
  date: string
  status: OrderStatus
  total: number
  itemCount: number
  eta?: string
  payment: 'Prepaid' | 'Cash on Delivery'
}
