import { ApiProperty } from '@nestjs/swagger';

export class OrderTagOptionDto {
  @ApiProperty({ description: '标签', example: '急需跟进' })
  tag: string;

  @ApiProperty({ description: '使用该标签的订单数', example: 12 })
  count: number;
}

export class OrderTagOptionListResponse {
  @ApiProperty({ description: '已有标签', type: [OrderTagOptionDto] })
  items: OrderTagOptionDto[];
}
