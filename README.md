# ElasticSearch-OpenSearch-Abstraction
Replace/upgrade Elasticsearch with managed AWS solution (openSearch) by introducing an abstraction over the search engine, enabling the system to use OpenSearch as an alternative to Elasticsearch, while allowing easy switching or integration of new search technologies in the future without impacting core application logic.

## How it works

A NestJS API stores Articles/Categories in PostgreSQL (via TypeORM) and mirrors Article data into a search index. The search index can be backed by either **Elasticsearch** or **AWS OpenSearch** behind a single `ISearchService` interface — switching providers requires only a config change, no code changes.

- `src/search/interfaces/search.interface.ts` defines `ISearchService` — `ensureIndex`, `index`, `updateById`, `delete`, `search`, `updateByQuery`.
- `src/search/providers/elasticsearch.provider.ts` and `opensearch.provider.ts` each implement that interface against their respective client SDK.
- `src/search/search.module.ts` reads the `SEARCH_ENGINE` env var and provides the matching implementation under the `SEARCH_SERVICE` injection token (`src/search/search.tokens.ts`).
- Application code (e.g. `src/article/article.service.ts`) only depends on `SEARCH_SERVICE` / `ISearchService`, never on a concrete provider — so it works unchanged regardless of which engine is active.
- `src/search/mappings/article.mapping.ts` defines the index name and field mapping used for articles.

On startup, `ArticleService` calls `ensureIndex` to create the index if it doesn't exist. Create/update/delete operations on articles in Postgres are mirrored into the search index; search reads (`GET /articles?q=...`) go through the search engine instead of the database.

## API

### Articles (`/articles`)

| Method | Path | Description | Storage |
| --- | --- | --- | --- |
| `POST` | `/articles` | Create an article | DB + index |
| `GET` | `/articles` | List all articles | DB only |
| `GET` | `/articles?q=<query>` | Full-text search | Index only |
| `GET` | `/articles/:id` | Get a single article | DB only |
| `PATCH` | `/articles/:id` | Update an article | DB + index |
| `DELETE` | `/articles/:id` | Delete an article | DB + index |

### Categories (`/categories`)

Standard CRUD endpoints backed by PostgreSQL (`src/category`). Updating or deleting a category also patches the `categoryName`/`categoryId` of its articles in the search index, to keep search results consistent.

| Method | Path | Description | Storage |
| --- | --- | --- | --- |
| `POST` | `/categories` | Create a category | DB only |
| `GET` | `/categories` | List all categories | DB only |
| `GET` | `/categories/:id` | Get a single category | DB only |
| `PATCH` | `/categories/:id` | Update a category | DB + index (syncs `categoryName` on its articles) |
| `DELETE` | `/categories/:id` | Delete a category | DB + index (clears `categoryId`/`categoryName` on its articles) |

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Run in watch mode |
| `npm run build` | Build for production |
| `npm run start:prod` | Run the production build |

