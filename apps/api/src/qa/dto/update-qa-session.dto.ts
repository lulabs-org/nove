import { PartialType } from '@nestjs/swagger';
import { CreateQASessionDto } from './create-qa-session.dto';

export class UpdateQASessionDto extends PartialType(CreateQASessionDto) {}
