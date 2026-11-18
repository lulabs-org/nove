import { QATargetType } from '@/generated/prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryQASessionDto {
  @ApiPropertyOptional({ description: '按数据集名称搜索', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ enum: QATargetType })
  @IsOptional()
  @IsEnum(QATargetType)
  targetType?: QATargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetId?: string;
}
