import {
  RequireAllPermissions,
  RequirePermissions,
} from '@/admin/permission/decorators/permissions.decorator';
import { Auth, CurrentOrg } from '@/auth/decorators';
import { CuidPipe } from '@/common/pipes/cuid.pipe';
import { QATargetType } from '@/generated/prisma/client';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
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
  CreateQASessionDto,
  QASessionDetailResponseDto,
  QASessionListResponseDto,
  QASessionResponseDto,
  QueryQASessionDto,
  UpdateQASessionDto,
} from '../dto';
import { QASessionService } from '../services';

@ApiTags('QA / Sessions')
@ApiBearerAuth()
@Controller('api/v1/qa/sessions')
export class QASessionController {
  constructor(private readonly sessions: QASessionService) { }

  @Post()
  @RequirePermissions('qa:session:create')
  @ApiOperation({ summary: '创建组织共享问答数据集' })
  @ApiResponse({ status: 201, type: QASessionResponseDto })
  create(
    @Body() dto: CreateQASessionDto,
    @CurrentOrg() orgId: string,
    @Auth('userId') userId?: string | null,
  ) {
    return this.sessions.create(
      orgId,
      this.sessions.requireUserId(userId),
      dto,
    );
  }

  @Get()
  @RequirePermissions('qa:session:read')
  @ApiOperation({ summary: '获取当前组织的共享问答数据集' })
  @ApiResponse({ status: 200, type: QASessionListResponseDto })
  findAll(@Query() query: QueryQASessionDto, @CurrentOrg() orgId: string) {
    return this.sessions.findAll(orgId, query);
  }

  @Get('targets/:targetType')
  @RequirePermissions('qa:session:read')
  @ApiOperation({ summary: '获取会话可关联的业务对象' })
  findTargetOptions(
    @Param('targetType', new ParseEnumPipe(QATargetType))
    targetType: QATargetType,
    @Query('keyword') keyword: string | undefined,
    @CurrentOrg() orgId: string,
  ) {
    return this.sessions.findTargetOptions(orgId, targetType, keyword);
  }

  @Get(':id/metadata')
  @RequirePermissions('qa:session:read')
  @ApiOperation({ summary: '获取组织共享数据集信息，不加载问答内容' })
  @ApiResponse({ status: 200, type: QASessionResponseDto })
  findMetadata(@Param('id', CuidPipe) id: string, @CurrentOrg() orgId: string) {
    return this.sessions.findMetadata(id, orgId);
  }

  @Get(':id')
  @RequireAllPermissions('qa:session:read', 'qa:record:read')
  @ApiOperation({ summary: '获取问答会话及其记录' })
  @ApiResponse({ status: 200, type: QASessionDetailResponseDto })
  findById(@Param('id', CuidPipe) id: string, @CurrentOrg() orgId: string) {
    return this.sessions.findById(id, orgId);
  }

  @Patch(':id')
  @RequirePermissions('qa:session:update')
  @ApiOperation({ summary: '编辑组织共享问答数据集' })
  @ApiResponse({ status: 200, type: QASessionResponseDto })
  update(
    @Param('id', CuidPipe) id: string,
    @Body() dto: UpdateQASessionDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.sessions.update(id, orgId, dto);
  }

  @Delete(':id')
  @RequirePermissions('qa:session:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除组织共享问答数据集' })
  @ApiResponse({ status: 204 })
  delete(@Param('id', CuidPipe) id: string, @CurrentOrg() orgId: string) {
    return this.sessions.delete(id, orgId);
  }
}
