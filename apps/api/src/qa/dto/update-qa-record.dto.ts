import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { CreateQARecordDto } from './create-qa-record.dto';

export class UpdateQARecordDto extends PartialType(CreateQARecordDto) {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  sessionId?: string;
}
