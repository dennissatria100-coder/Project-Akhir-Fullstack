import { ValueTransformer } from 'typeorm';

/** Postgres mengembalikan "08:00:00"; API memakai "HH:mm". */
export const timeTransformer: ValueTransformer = {
  to: (v?: string) => v,
  from: (v?: string | null) => (v ? v.slice(0, 5) : v),
};
