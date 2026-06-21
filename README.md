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


## Adding a new search engine (Extend abstraction with a new engine)

To support another engine (e.g. Algolia, MeiliSearch, Solr), wire it into the same abstraction:

1. **Add the engine's connection config** — create `src/search/config/<engine>.config.ts` exporting a `build<Engine>Config(config: ConfigService)` function that reads the engine's env vars (node URL, credentials, etc.), following the pattern in `elasticsearch.config.ts` / `opensearch.config.ts`.
2. **Implement the provider** — create `src/search/providers/<engine>.provider.ts` with a class implementing `ISearchService` (`src/search/interfaces/search.interface.ts`): `ensureIndex`, `index`, `updateById`, `delete`, `search`, `updateByQuery`. Use the engine's SDK client, constructed from the config built in step 1.
3. **Register the engine name** — add a new key to `SEARCH_ENGINE` in `src/search/search.tokens.ts` (e.g. `ALGOLIA: 'algolia'`).
4. **Wire it into the factory** — add a `case` for the new engine in `resolveProvider()` in `src/search/search.module.ts`, returning `new <Engine>Provider(config)`.
5. **Document the env vars** — add the new engine's variables to `.env.example` (node/URL, credentials), following the existing Elasticsearch/OpenSearch blocks.
6. **Switch to it** — set `SEARCH_ENGINE=<engine>` in `.env` and restart the app, as described above.

No changes are needed in `article.service.ts` or anywhere else that depends on `SEARCH_SERVICE` — they only ever talk to `ISearchService`.

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

