export const SEARCH_SERVICE = Symbol('SEARCH_SERVICE');

export const SEARCH_ENGINE = {
  ELASTICSEARCH: 'elasticsearch',
  OPENSEARCH: 'opensearch',
} as const;

export type SearchEngine = (typeof SEARCH_ENGINE)[keyof typeof SEARCH_ENGINE];
