import { ApiProperty } from '@nestjs/swagger';

export class OrderTagOptionListResponse {
  @ApiProperty({
    description: '已有标签',
    type: [String],
    example: ['急需跟进', '大客户'],
  })
  items: string[];
}
