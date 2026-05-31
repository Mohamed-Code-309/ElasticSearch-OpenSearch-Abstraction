import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ElasticsearchProvider } from '../search/providers/elasticsearch.provider';
import { ARTICLE_INDEX } from '../search/mappings/article.mapping';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly searchService: ElasticsearchProvider
  ) {}

  create(dto: CreateCategoryDto): Promise<Category> {
    return this.categoryRepo.save(this.categoryRepo.create(dto));
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    const updated = await this.categoryRepo.save(category);
    await this.syncArticlesInIndex(id, { categoryName: updated.name });
    return updated;
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepo.remove(category);
    await this.syncArticlesInIndex(id, { categoryId: null, categoryName: null });
  }

  private async syncArticlesInIndex(
    categoryId: number,
    partial: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.searchService.updateByQuery(
        ARTICLE_INDEX,
        { categoryId },
        partial,
      );
    } catch (err) {
      this.logger.error(
        `Failed to update articles for category #${categoryId} in search index`,
        err,
      );
    }
  }
}
