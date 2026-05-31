import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SEARCH_ENGINE, SEARCH_SERVICE, SearchEngine } from './search.tokens';
import { ElasticsearchProvider } from './providers/elasticsearch.provider';
import { OpenSearchProvider } from './providers/opensearch.provider';

function resolveProvider(engine: SearchEngine, config: ConfigService) {
  switch (engine) {
    case SEARCH_ENGINE.ELASTICSEARCH:
      return new ElasticsearchProvider(config);
    case SEARCH_ENGINE.OPENSEARCH:
      return new OpenSearchProvider(config);
    default:
      throw new Error(`Unknown search engine: "${engine}"`);
  }
}

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SEARCH_SERVICE,
      useFactory: (config: ConfigService) => {
        const engine = config.get<SearchEngine>(
          'SEARCH_ENGINE',
          SEARCH_ENGINE.ELASTICSEARCH,
        );
        return resolveProvider(engine, config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [SEARCH_SERVICE],
})
export class SearchModule {}
