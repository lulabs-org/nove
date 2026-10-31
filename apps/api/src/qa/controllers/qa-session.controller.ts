import { RequirePermissions } from '@/admin/permission/decorators/permissions.decorator';
import { Auth, CurrentOrg } from '@/auth/decorators';
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
  CreateQASessionDto,
  QASessionDetailResponseDto,
  QASessionListResponseDto,
  QASessionResponseDto,
  QueryQASessionDto,
  UpdateQASessionDto,
} from '../dto';
import { QASessionService } from '../services';

@ApiTags('QA Sessions')
@ApiBearerAuth()
@Controller('api/v1/qa/sessions')
export class QASessionController {
  constructor(private readonly sessions: QASessionService) {}

  @Post()
  @RequirePermissions('qa:session:create')
  @ApiOperation({ summary: '创建问答会话' })
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
  @ApiOperation({ summary: '获取当前用户的问答会话列表' })
  @ApiResponse({ status: 200, type: QASessionListResponseDto })
  findAll(
    @Query() query: QueryQASessionDto,
    @CurrentOrg() orgId: string,
    @Auth('userId') userId?: string | null,
  ) {
    return this.sessions.findAll(
      orgId,
      this.sessions.requireUserId(userId),
      query,
    );
  }

  @Get(':id')
  @RequirePermissions('qa:session:read')
  @ApiOperation({ summary: '获取问答会话及其记录' })
  @ApiResponse({ status: 200, type: QASessionDetailResponseDto })
  findById(
    @Param('id', CuidPipe) id: string,
    @CurrentOrg() orgId: string,
    @Auth('userId') userId?: string | null,
  ) {
    return this.sessions.findById(
      id,
      orgId,
      this.sessions.requireUserId(userId),
    );
  }

  @Patch(':id')
  @RequirePermissions('qa:session:update')
  @ApiOperation({ summary: '编辑问答会话' })
  @ApiResponse({ status: 200, type: QASessionResponseDto })
  update(
    @Param('id', CuidPipe) id: string,
    @Body() dto: UpdateQASessionDto,
    @CurrentOrg() orgId: string,
    @Auth('userId') userId?: string | null,
  ) {
    return this.sessions.update(
      id,
      orgId,
      this.sessions.requireUserId(userId),
      dto,
    );
  }

  @Delete(':id')
  @RequirePermissions('qa:session:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除问答会话' })
  @ApiResponse({ status: 204 })
  delete(
    @Param('id', CuidPipe) id: string,
    @CurrentOrg() orgId: string,
    @Auth('userId') userId?: string | null,
  ) {
    return this.sessions.delete(id, orgId, this.sessions.requireUserId(userId));
  }
}
