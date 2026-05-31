import { ConfigService } from '@nestjs/config';

export interface OpenSearchClientOptions {
  node: string;
  auth?: { username: string; password: string };
  ssl?: { rejectUnauthorized: boolean };
}

export function buildOpenSearchConfig(config: ConfigService): OpenSearchClientOptions {
  const node = config.get<string>('OPENSEARCH_NODE', 'https://localhost:9200');
  const username = config.get<string>('OPENSEARCH_USERNAME');
  const password = config.get<string>('OPENSEARCH_PASSWORD');

  const options: OpenSearchClientOptions = {
    node,
    ssl: { rejectUnauthorized: false },
  };

  if (username && password) {
    options.auth = { username, password };
  }

  return options;
}
