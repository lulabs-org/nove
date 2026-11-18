import { PartialType } from '@nestjs/swagger';
import { ValidateIf, IsString, Length } from 'class-validator';
import { CreateQARecordDto } from './create-qa-record.dto';

export class UpdateQARecordDto extends PartialType(CreateQARecordDto, {
  skipNullProperties: false,
}) {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(1, 100)
  sessionId?: string;
}
