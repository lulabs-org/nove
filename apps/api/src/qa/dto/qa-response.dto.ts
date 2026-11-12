import {
  QAGeneratedBy,
  QAFeedbackRating,
  QATargetType,
} from '@/generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QACitationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sourceType: string;
  @ApiProperty() sourceId: string;
  @ApiPropertyOptional({ nullable: true }) title: string | null;
  @ApiPropertyOptional({ nullable: true }) location: string | null;
  @ApiProperty() snippet: string;
  @ApiPropertyOptional({ nullable: true }) relevanceScore: number | null;
  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata: unknown;
  @ApiProperty() createdAt: Date;
}

export class QARecordSessionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
}

export class QARecordResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sessionId: string;
  @ApiPropertyOptional({ type: QARecordSessionResponseDto })
  session?: QARecordSessionResponseDto;
  @ApiProperty() question: string;
  @ApiProperty() answer: string;
  @ApiProperty({ enum: QAGeneratedBy }) generatedBy: QAGeneratedBy;
  @ApiPropertyOptional({ nullable: true }) aiModel: string | null;
  @ApiPropertyOptional({ nullable: true }) promptTokens: number | null;
  @ApiPropertyOptional({ nullable: true }) completionTokens: number | null;
  @ApiPropertyOptional({ nullable: true }) totalTokens: number | null;
  @ApiPropertyOptional({ nullable: true }) latencyMs: number | null;
  @ApiPropertyOptional({ enum: QAFeedbackRating, nullable: true })
  rating: QAFeedbackRating | null;
  @ApiPropertyOptional({ nullable: true }) feedbackReason: string | null;
  @ApiPropertyOptional({ nullable: true }) feedbackComment: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata: unknown;
  @ApiProperty({ type: [QACitationResponseDto] })
  citations: QACitationResponseDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class QASessionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() orgId: string;
  @ApiProperty() userId: string;
  @ApiProperty() title: string;
  @ApiProperty({ enum: QATargetType }) targetType: QATargetType;
  @ApiPropertyOptional({ nullable: true }) targetId: string | null;
  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata: unknown;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class QASessionDetailResponseDto extends QASessionResponseDto {
  @ApiProperty({ type: [QARecordResponseDto] }) records: QARecordResponseDto[];
}

export class QASessionListResponseDto {
  @ApiProperty({ type: [QASessionResponseDto] }) items: QASessionResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() totalPages: number;
}

export class QARecordListResponseDto {
  @ApiProperty({ type: [QARecordResponseDto] }) items: QARecordResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() totalPages: number;
}
