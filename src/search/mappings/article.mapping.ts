import { ArticleStatus } from '../../article/dto/article-status.enum';

export const ARTICLE_INDEX = 'articles';

export const ARTICLE_MAPPING = {
  mappings: {
    properties: {
      title: {
        type: 'text',
        analyzer: 'standard',
        fields: {
          keyword: { type: 'keyword', ignore_above: 256 },
        },
      },
      content: { type: 'text', analyzer: 'standard' },
      author: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword', ignore_above: 256 },
        },
      },
      tags: { type: 'keyword' },
      status: { type: 'keyword' },
      categoryId: { type: 'integer' },
      categoryName: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword', ignore_above: 256 },
        },
      },
      viewCount: { type: 'integer' },
      createdAt: { type: 'date' },
    },
  },
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
  },
};

/** Shape of a document stored in the articles index. */
export interface ArticleDocument {
  id: number;
  title: string;
  content: string;
  author: string;
  tags: string[];
  status: ArticleStatus;
  categoryId: number | null;
  categoryName: string | null;
  viewCount: number;
  createdAt: Date;
}
