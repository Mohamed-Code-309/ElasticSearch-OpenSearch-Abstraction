import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../category/category.entity';
import { ArticleStatus } from './dto/article-status.enum';


@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  author: string;

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.DRAFT })
  status: ArticleStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category, (category) => category.articles, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
