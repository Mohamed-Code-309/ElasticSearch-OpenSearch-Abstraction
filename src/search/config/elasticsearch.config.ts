import { ConfigService } from '@nestjs/config';
import { ClientOptions } from '@elastic/elasticsearch';

export function buildElasticsearchConfig(config: ConfigService): ClientOptions {
  const node = config.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9201');
  const username = config.get<string>('ELASTICSEARCH_USERNAME');
  const password = config.get<string>('ELASTICSEARCH_PASSWORD');

  const options: ClientOptions = { node };

  if (username && password) {
    options.auth = { username, password };
  }

  return options;
}
