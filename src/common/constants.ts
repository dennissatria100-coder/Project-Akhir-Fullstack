/** Aturan bisnis FutsalKu. Ubah di sini bila aturan venue berubah. */
export const OPEN_HOUR = 8; // 08:00
export const CLOSE_HOUR = 23; // 23:00
export const MIN_DURATION_HOURS = 1;
export const MAX_DURATION_HOURS = 3;
export const MAX_ADVANCE_DAYS = 30;
export const CANCEL_LIMIT_HOURS = 3;
export const DP_PERCENT = 0.5;
export const MAX_PENDING_BOOKINGS = 3;
export const PAYMENT_TIMEOUT_MINUTES = 60;

export const HOUR_REGEX = /^([01]\d|2[0-3]):00$/;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
