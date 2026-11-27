import { QAGeneratedBy } from '@/generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateQACitationDto {
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @Length(1, 50)
  sourceType: string;

  @ApiProperty()
  @IsString()
  @Length(1, 255)
  sourceId: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 10000)
  snippet: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore?: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    default: {},
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateQARecordDto {
  @ApiProperty()
  @IsString()
  @Length(1, 20000)
  question: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100000)
  answer: string;

  @ApiPropertyOptional({ enum: QAGeneratedBy, default: QAGeneratedBy.AI })
  @IsOptional()
  @IsEnum(QAGeneratedBy)
  generatedBy?: QAGeneratedBy;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  aiModel?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  promptTokens?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  completionTokens?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalTokens?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  latencyMs?: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    default: {},
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [CreateQACitationDto], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQACitationDto)
  citations?: CreateQACitationDto[];
}
