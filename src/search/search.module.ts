import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ElasticsearchProvider } from './providers/elasticsearch.provider';

@Module({
  imports: [ConfigModule],
  providers: [ElasticsearchProvider],
  exports: [ElasticsearchProvider],
})
export class SearchModule { }
