import { Module } from '@nestjs/common';
import { ElasticsearchProvider } from './providers/elasticsearch.provider';

@Module({
  providers: [ElasticsearchProvider],
  exports: [ElasticsearchProvider],
})
export class SearchModule { }
