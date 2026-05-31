export interface IndexDocument {
  id: string | number;
  [key: string]: unknown;
}

export interface SearchQuery {
  query: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  from?: number;
  size?: number;
}

export interface SearchHit<T = Record<string, unknown>> {
  id: string;
  score: number;
  source: T;
}

export interface SearchResult<T = Record<string, unknown>> {
  total: number;
  hits: SearchHit<T>[];
}

export interface ISearchService {
  /**
   * Ensure the index exists with the correct mapping.
   * Safe to call on every app startup (idempotent).
   */
  ensureIndex(index: string, mapping: Record<string, unknown>): Promise<void>;

  /** Index (create or overwrite) a single document. */
  index(index: string, document: IndexDocument): Promise<void>;

  /** Update an existing document by id. */
  updateById(
    index: string,
    id: string | number,
    partial: Partial<IndexDocument>,
  ): Promise<void>;

  /** Remove a document by id. */
  delete(index: string, id: string | number): Promise<void>;

  /** Full-text search with optional filters and pagination. */
  search<T = Record<string, unknown>>(
    index: string,
    query: SearchQuery,
  ): Promise<SearchResult<T>>;

  /** Update all documents matching a filter without fetching them first. */
  updateByQuery(
    index: string,
    filter: Record<string, unknown>,
    partial: Record<string, unknown>,
  ): Promise<void>;
}
