import { PartialType } from '@nestjs/swagger';
import { CreateQARecordDto } from './create-qa-record.dto';

export class UpdateQARecordDto extends PartialType(CreateQARecordDto) {}
