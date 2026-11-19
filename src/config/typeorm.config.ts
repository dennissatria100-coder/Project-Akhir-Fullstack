import { DataSourceOptions } from 'typeorm';
import { entities } from './entities';

export function buildTypeOrmOptions(
  env: Record<string, string | undefined>,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities,
    synchronize: env.DB_SYNCHRONIZE !== 'false',
    ssl: env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  };
}
