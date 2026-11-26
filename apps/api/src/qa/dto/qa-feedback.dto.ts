import { QAFeedbackRating } from '@/generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class QAFeedbackDto {
  @ApiProperty({ enum: QAFeedbackRating, nullable: true })
  @ValidateIf((_object, value) => value !== null)
  @IsEnum(QAFeedbackRating)
  rating: QAFeedbackRating | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comment?: string;
}
