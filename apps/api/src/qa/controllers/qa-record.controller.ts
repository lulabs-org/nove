import { RequirePermissions } from '@/admin/permission/decorators/permissions.decorator';
import { CurrentOrg } from '@/auth/decorators';
import { CuidPipe } from '@/common/pipes/cuid.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  BatchCreateQARecordDto,
  CreateQARecordDto,
  QARecordListResponseDto,
  QARecordResponseDto,
  QueryQARecordDto,
  UpdateQARecordDto,
} from '../dto';
import { QARecordService } from '../services';

@ApiTags('QA Records')
@ApiBearerAuth()
@Controller('api/v1/qa')
export class QARecordController {
  constructor(private readonly records: QARecordService) {}

  @Post('sessions/:sessionId/records')
  @RequirePermissions('qa:record:create')
  @ApiOperation({ summary: '写入单条问答记录及引用' })
  @ApiResponse({ status: 201, type: QARecordResponseDto })
  create(
    @Param('sessionId', CuidPipe) sessionId: string,
    @Body() dto: CreateQARecordDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.records.create(orgId, sessionId, dto);
  }

  @Post('records/batch')
  @RequirePermissions('qa:record:create')
  @ApiOperation({ summary: '批量原子写入问答记录' })
  @ApiResponse({ status: 201, type: [QARecordResponseDto] })
  createBatch(
    @Body() dto: BatchCreateQARecordDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.records.createBatch(orgId, dto);
  }

  @Get('records')
  @RequirePermissions('qa:record:read')
  @ApiOperation({ summary: '跨会话检索当前组织的问答记录' })
  @ApiResponse({ status: 200, type: QARecordListResponseDto })
  findAll(@Query() query: QueryQARecordDto, @CurrentOrg() orgId: string) {
    return this.records.findAll(orgId, query);
  }

  @Patch('records/:recordId')
  @RequirePermissions('qa:record:update')
  @ApiOperation({ summary: '编辑问答记录及引用' })
  @ApiResponse({ status: 200, type: QARecordResponseDto })
  update(
    @Param('recordId', CuidPipe) recordId: string,
    @Body() dto: UpdateQARecordDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.records.update(orgId, recordId, dto);
  }

  @Delete('records/:recordId')
  @RequirePermissions('qa:record:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除问答记录' })
  @ApiResponse({ status: 204 })
  delete(
    @Param('recordId', CuidPipe) recordId: string,
    @CurrentOrg() orgId: string,
  ) {
    return this.records.delete(orgId, recordId);
  }
}
