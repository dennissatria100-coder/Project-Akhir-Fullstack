export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}
export enum FloorType {
  VINYL = 'vinyl',
  INTERLOCK = 'interlock',
  SINTETIS = 'sintetis',
  PARQUET = 'parquet',
}
export enum LocationType {
  INDOOR = 'indoor',
  OUTDOOR = 'outdoor',
}
export enum DayType {
  WEEKDAY = 'weekday',
  WEEKEND = 'weekend',
}
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}
export enum PaymentType {
  DP = 'dp',
  FULL = 'full',
}
export enum PaymentMethod {
  TRANSFER = 'transfer',
  CASH = 'cash',
  E_WALLET = 'e-wallet',
}
export enum PaymentStatus {
  /** dikirim customer, menunggu verifikasi admin */
  UNPAID = 'unpaid',
  /** terverifikasi, tetapi belum lunas (DP) */
  PARTIAL = 'partial',
  /** terverifikasi dan total sudah lunas */
  PAID = 'paid',
  REFUNDED = 'refunded',
}
