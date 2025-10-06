// lib/queries/utils/queryBuilder.ts
import { SQL, and, or, ilike, desc, eq, sql } from 'drizzle-orm';

/**
 * Standard pagination parameters used across all queries
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Standard search parameters
 */
export interface SearchParams {
  query?: string;
}

/**
 * Standard paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  nextPage: number | null;
  page: number;
  limit: number;
  total?: number;
}

/**
 * Helper to calculate pagination offset
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Helper to determine if there's a next page
 */
export function getNextPage(currentPage: number, dataLength: number, limit: number): number | null {
  return dataLength === limit ? currentPage + 1 : null;
}

/**
 * Helper to build search conditions for multiple fields
 * @example buildSearchCondition(query, [customers.name, customers.email])
 */
export function buildSearchCondition(query: string | undefined, fields: any[]): SQL | undefined {
  if (!query || query.trim() === '') return undefined;
  
  const searchPattern = `%${query.trim()}%`;
  const conditions = fields.map(field => ilike(field, searchPattern));
  
  return or(...conditions);
}

/**
 * Helper to build pagination response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total?: number
): PaginatedResponse<T> {
  return {
    data,
    nextPage: getNextPage(page, data.length, limit),
    page,
    limit,
    total,
  };
}

/**
 * SQL aggregation helpers for common counting patterns
 */
export const aggregations = {
  /**
   * Count rows in a relation
   */
  count: (field: any) => sql<number>`cast(count(${field}) as integer)`,
  
  /**
   * Count distinct rows
   */
  countDistinct: (field: any) => sql<number>`cast(count(distinct ${field}) as integer)`,
  
  /**
   * Count with a condition
   */
  countWhere: (field: any, condition: SQL) => 
    sql<number>`cast(count(case when ${condition} then 1 end) as integer)`,
  
  /**
   * Sum numeric values
   */
  sum: (field: any) => sql<string>`cast(coalesce(sum(${field}), 0) as text)`,
  
  /**
   * Average
   */
  avg: (field: any) => sql<string>`cast(avg(${field}) as text)`,
};

/**
 * Common filter builders
 */
export const filters = {
  /**
   * Filter by status with 'all' option
   */
  byStatus: <T extends string>(statusField: any, status: T | 'all') => {
    return status === 'all' ? undefined : eq(statusField, status);
  },
  
  /**
   * Filter by date range
   */
  byDateRange: (dateField: any, start?: Date, end?: Date) => {
    const conditions: SQL[] = [];
    if (start) conditions.push(sql`${dateField} >= ${start}`);
    if (end) conditions.push(sql`${dateField} <= ${end}`);
    return conditions.length > 0 ? and(...conditions) : undefined;
  },
  
  /**
   * Filter by boolean
   */
  byBoolean: (field: any, value: boolean | undefined) => {
    return value !== undefined ? eq(field, value) : undefined;
  },
};

/**
 * Standard ordering
 */
export const ordering = {
  createdAtDesc: (table: any) => desc(table.createdAt),
  updatedAtDesc: (table: any) => desc(table.updatedAt),
};