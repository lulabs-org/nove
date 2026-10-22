import { QAFeedbackRating } from '@/generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class QAFeedbackDto {
  @ApiProperty({ enum: QAFeedbackRating })
  @IsEnum(QAFeedbackRating)
  rating: QAFeedbackRating;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  comment?: string;
}
