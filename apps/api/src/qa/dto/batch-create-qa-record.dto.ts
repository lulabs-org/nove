import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateQARecordDto } from './create-qa-record.dto';

export class BatchQARecordItemDto extends CreateQARecordDto {
  @ApiProperty()
  @IsString()
  sessionId: string;
}

export class BatchCreateQARecordDto {
  @ApiProperty({ type: [BatchQARecordItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BatchQARecordItemDto)
  records: BatchQARecordItemDto[];
}
