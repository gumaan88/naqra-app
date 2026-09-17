// Cloudflare D1 Helper and Utility Methods

export interface Env {
  DB: D1Database;
  AI?: any;
  ASSETS?: Fetcher;
  JWT_SECRET?: string;
  ENVIRONMENT?: string;
}

export class DbHelper {
  constructor(private db: D1Database) {}

  get raw(): D1Database {
    return this.db;
  }

  async query<T = any>(sql: string, ...params: any[]): Promise<T[]> {
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    return result.results || [];
  }

  async first<T = any>(sql: string, ...params: any[]): Promise<T | null> {
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.first<T>();
    return result || null;
  }

  async run(sql: string, ...params: any[]): Promise<D1Response> {
    const stmt = this.db.prepare(sql).bind(...params);
    return await stmt.run();
  }

  async batch(statements: D1PreparedStatement[]): Promise<D1Response[]> {
    return await this.db.batch(statements);
  }
}
