import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

// PostgreSQL foreign key violation code
const PG_FK_VIOLATION = '23503';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  async create(dto: CreateArticleDto): Promise<Article> {
    try {
      return await this.articleRepo.save(this.articleRepo.create(dto));
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as any).code === PG_FK_VIOLATION)
        throw new BadRequestException(`Category #${dto.categoryId} not found`);
      throw err;
    }
  }

  findAll(): Promise<Article[]> {
    return this.articleRepo.find({ relations: { category: true } });
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
    const article = await this.findOne(id);
    Object.assign(article, dto);
    try {
      return await this.articleRepo.save(article);
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as any).code === PG_FK_VIOLATION)
        throw new BadRequestException(`Category #${dto.categoryId} not found`);
      throw err;
    }
  }

  async remove(id: number): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepo.remove(article);
  }
}
