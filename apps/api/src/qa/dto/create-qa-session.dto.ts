import { QATargetType } from '@/generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateQASessionDto {
  @ApiProperty({ maxLength: 200 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiPropertyOptional({ enum: QATargetType, default: QATargetType.GLOBAL })
  @IsOptional()
  @IsEnum(QATargetType)
  targetType?: QATargetType;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  targetId?: string | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    default: {},
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
