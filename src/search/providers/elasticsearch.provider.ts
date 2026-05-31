import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import {
  ISearchService,
  IndexDocument,
  SearchQuery,
  SearchResult,
} from '../interfaces/search.interface';
import { buildElasticsearchConfig } from '../config/elasticsearch.config';

@Injectable()
export class ElasticsearchProvider implements ISearchService, OnModuleInit {
  private readonly client: Client;
  private readonly logger = new Logger(ElasticsearchProvider.name);

  constructor(private readonly config: ConfigService) {
    this.client = new Client(buildElasticsearchConfig(config));
  }

  async onModuleInit(): Promise<void> {
    try {
      const info = await this.client.info();
      this.logger.log(`Connected to Elasticsearch ${info.version.number}`);
    } catch (err) {
      this.logger.error('Failed to connect to Elasticsearch', err);
    }
  }

  async ensureIndex(
    index: string,
    mapping: Record<string, unknown>,
  ): Promise<void> {
    const exists = await this.client.indices.exists({ index });

    if (exists) {
      this.logger.log(`Index "${index}" already exists — skipping creation`);
      return;
    }

    await this.client.indices.create({
      index,
      body: mapping,
    });

    this.logger.log(`Index "${index}" created`);
  }

  async index(index: string, document: IndexDocument): Promise<void> {
    const { id, ...body } = document;

    await this.client.index({
      index,
      id: String(id),
      body,
    });
  }

  async updateById(
    index: string,
    id: string | number,
    partial: Partial<IndexDocument>,
  ): Promise<void> {
    const { id: _id, ...doc } = partial;

    await this.client.update({
      index,
      id: String(id),
      body: { doc },
    });
  }

  async delete(index: string, id: string | number): Promise<void> {
    await this.client.delete({
      index,
      id: String(id),
    });
  }

  async updateByQuery(
    index: string,
    filter: Record<string, unknown>,
    partial: Record<string, unknown>,
  ): Promise<void> {
    const params = Object.entries(partial)
      .map(([k]) => `ctx._source['${k}'] = params['${k}'];`)
      .join(' ');

    const filterClauses = Object.entries(filter).map(([field, value]) => ({
      term: { [field]: value },
    }));

    await this.client.updateByQuery({
      index,
      body: {
        script: {
          source: params,
          lang: 'painless',
          params: partial,
        },
        query: { bool: { filter: filterClauses } },
      },
    });
  }

  async search<T = Record<string, unknown>>(
    index: string,
    query: SearchQuery,
  ): Promise<SearchResult<T>> {
    const { query: queryString, fields, filters, from = 0, size = 10 } = query;

    const must: Record<string, unknown>[] = [
      {
        multi_match: {
          query: queryString,
          fields: fields ?? ['*'],
          fuzziness: 'AUTO',
        },
      },
    ];

    if (filters) {
      for (const [field, value] of Object.entries(filters)) {
        must.push({ term: { [field]: value } });
      }
    }

    const response = await this.client.search<T>({
      index,
      body: {
        from,
        size,
        query: { bool: { must } },
      },
    });

    const hitsData = response.hits;
    const total =
      typeof hitsData.total === 'number'
        ? hitsData.total
        : (hitsData.total?.value ?? 0);

    return {
      total,
      hits: hitsData.hits.map((hit) => ({
        id: hit._id as string,
        score: hit._score ?? 0,
        source: hit._source as T,
      })),
    };
  }
}
