import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '@/admin/permission/decorators/permissions.decorator';
import { Auth } from '@/auth/decorators';
import type { AuthContext } from '@/auth/types/auth-context.interface';
import { CuidPipe } from '@/common/pipes/cuid.pipe';
import {
  BatchCreateMeetingPlaybackGrantDto,
  CreateMeetingPlaybackGrantDto,
  QueryMeetingPlaybackGrantDto,
} from './dto/meeting-playback.dto';
import { MeetingPlaybackGrantService } from './meeting-playback-grant.service';

@ApiTags('Meeting playback grants')
@ApiBearerAuth()
@Controller('admin/meeting-playback-grants')
export class MeetingPlaybackGrantController {
  constructor(private readonly grantService: MeetingPlaybackGrantService) {}

  @Post()
  @RequirePermissions('meeting-playback:grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '为一名同学开通会议回放查看权限' })
  create(
    @Auth() auth: AuthContext | undefined,
    @Body() dto: CreateMeetingPlaybackGrantDto,
  ) {
    const orgId = requireOrg(auth);
    return this.grantService.create(orgId, auth?.userId ?? null, dto);
  }

  @Post('batch')
  @RequirePermissions('meeting-playback:grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量为同学开通会议回放查看权限' })
  createMany(
    @Auth() auth: AuthContext | undefined,
    @Body() dto: BatchCreateMeetingPlaybackGrantDto,
  ) {
    const orgId = requireOrg(auth);
    return this.grantService.createMany(
      orgId,
      auth?.userId ?? null,
      dto.grants,
    );
  }

  @Get()
  @RequirePermissions('meeting-playback:grant')
  @ApiOperation({ summary: '查看会议回放授权' })
  list(
    @Auth() auth: AuthContext | undefined,
    @Query() query: QueryMeetingPlaybackGrantDto,
  ) {
    return this.grantService.list(requireOrg(auth), query);
  }

  @Delete(':id')
  @RequirePermissions('meeting-playback:grant')
  @ApiOperation({ summary: '收回一名同学的会议回放查看权限' })
  revoke(
    @Auth() auth: AuthContext | undefined,
    @Param('id', CuidPipe) id: string,
  ) {
    return this.grantService.revoke(requireOrg(auth), id);
  }
}

function requireOrg(auth: AuthContext | undefined): string {
  if (!auth?.orgId) {
    throw new UnauthorizedException('需要登录后才能管理回放权限');
  }
  return auth.orgId;
}
