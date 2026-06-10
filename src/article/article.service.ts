import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ElasticsearchProvider } from '../search/providers/elasticsearch.provider';
import { ARTICLE_INDEX, ARTICLE_MAPPING, ArticleDocument } from '../search/mappings/article.mapping';

const PG_FK_VIOLATION = '23503';

@Injectable()
export class ArticleService implements OnModuleInit {
  private readonly logger = new Logger(ArticleService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    private readonly searchService: ElasticsearchProvider
  ) { }

  async onModuleInit(): Promise<void> {
    await this.searchService.ensureIndex(ARTICLE_INDEX, ARTICLE_MAPPING);
  }

  async create(dto: CreateArticleDto): Promise<Article> {
    try {
      const saved = await this.articleRepo.save(this.articleRepo.create(dto));
      const article = await this.findOne(saved.id);
      try {
        const { category, ...document } = article;
        await this.searchService.index(ARTICLE_INDEX, {
          ...document,
          categoryId: article.categoryId ?? null,
          categoryName: article.category?.name ?? null,
        });
      } catch (err) {
        this.logger.error(`Failed to index article #${article.id}`, err);
      }
      return article;
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as any).code === PG_FK_VIOLATION)
        throw new BadRequestException(`Category #${dto.categoryId} not found`);
      throw err;
    }
  }

  async findAll(query?: string): Promise<Article[] | ArticleDocument[]> {
    if (!query) {
      return this.articleRepo.find({
        relations: { category: true },
        order: { createdAt: "DESC" }
      });
    }
    const result = await this.searchService.search<ArticleDocument>(ARTICLE_INDEX, {
      query,
      fields: ['title', 'content', 'author', 'tags', 'categoryName'],
      sort: [{ createdAt: { order: 'desc' } }],
    });

    return result.hits.map((hit) => hit.source);
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!article) throw new NotFoundException(`Article #${id} not found`);
    return article;
  }

  async update(id: number, dto: UpdateArticleDto): Promise<Article> {
    // const article = await this.findOne(id);
    // Object.assign(article, dto); //won't work with {"categroyId": 2} or any F.K
    try {
      await this.articleRepo.update(id, dto);
      // const updated = await this.articleRepo.save(article);
      const updated = await this.findOne(id);
      try {
        const { category, ...document } = updated;
        await this.searchService.updateById(ARTICLE_INDEX, updated.id, {
          ...document,
          categoryId: updated.categoryId ?? null,
          categoryName: updated.category?.name ?? null,
        });
      } catch (err) {
        this.logger.error(`Failed to update article #${updated.id} in index`, err);
      }
      return updated;
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as any).code === PG_FK_VIOLATION)
        throw new BadRequestException(`Category #${dto.categoryId} not found`);
      throw err;
    }
  }

  async remove(id: number): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepo.remove(article);
    try {
      await this.searchService.delete(ARTICLE_INDEX, id);
    } catch (err) {
      this.logger.error(`Failed to delete article #${id} from index`, err);
    }
  }
}
