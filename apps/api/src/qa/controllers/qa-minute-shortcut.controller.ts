import { RequirePermissions } from '@/admin/permission/decorators/permissions.decorator';
import { CurrentOrg } from '@/auth/decorators';
import { CuidPipe } from '@/common/pipes/cuid.pipe';
import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QARecordListResponseDto, QueryQARecordDto } from '../dto';
import { QARecordService } from '../services';

@ApiTags('QA Records')
@ApiBearerAuth()
@Controller('api/v1/minutes')
export class QAMinuteShortcutController {
  constructor(private readonly records: QARecordService) {}

  @Get(':minuteId/qa-records')
  @RequirePermissions('qa:record:read')
  @ApiOperation({ summary: '获取指定妙记关联的问答记录' })
  @ApiResponse({ status: 200, type: QARecordListResponseDto })
  findByMinute(
    @Param('minuteId', CuidPipe) minuteId: string,
    @Query() query: QueryQARecordDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.records.findByMinute(orgId, minuteId, query);
  }
}
