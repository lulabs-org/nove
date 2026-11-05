import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireAnyPermission } from '@/admin/permission/decorators/permissions.decorator';
import { Auth } from '@/auth/decorators';
import type { AuthContext } from '@/auth/types/auth-context.interface';
import { CuidPipe } from '@/common/pipes/cuid.pipe';
import {
  CatchUpMeetingPlaybackDto,
  QueryPlaybackSessionDto,
} from './dto/meeting-playback.dto';
import { MeetingPlaybackService } from './meeting-playback.service';
import type { PlaybackCaller } from './meeting-playback.types';

const QUERY_PERMISSIONS = [
  'meeting-playback:read',
  'meeting-playback:grant',
  'mcp-tool:meeting-playback',
] as const;

@ApiTags('Meeting playback')
@ApiBearerAuth()
@Controller('meeting-playbacks')
export class MeetingPlaybackController {
  constructor(private readonly playbackService: MeetingPlaybackService) {}

  @Post('catch-up')
  @RequireAnyPermission(...QUERY_PERMISSIONS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '按企业微信身份查询授权回放并给出补课引导',
  })
  catchUp(
    @Auth() auth: AuthContext | undefined,
    @Body() dto: CatchUpMeetingPlaybackDto,
  ) {
    return this.playbackService.catchUp(callerFromAuth(auth), dto);
  }

  @Get('sessions/:meetingId')
  @RequireAnyPermission(...QUERY_PERMISSIONS)
  @ApiOperation({ summary: '查看单场已授权的会议回放入口' })
  getSession(
    @Auth() auth: AuthContext | undefined,
    @Param('meetingId', CuidPipe) meetingId: string,
    @Query() query: QueryPlaybackSessionDto,
  ) {
    return this.playbackService.getSession(
      callerFromAuth(auth),
      meetingId,
      query,
    );
  }
}

function callerFromAuth(auth: AuthContext | undefined): PlaybackCaller {
  if (!auth?.orgId) {
    throw new UnauthorizedException('需要登录后才能查询会议回放');
  }
  return {
    orgId: auth.orgId,
    userId: auth.userId,
    apiKeyId: auth.apiKeyId ?? null,
    permissions: auth.permissions ?? [],
  };
}
