import { RequirePermissions } from '@/admin/permission/decorators/permissions.decorator';
import { CurrentOrg } from '@/auth/decorators';
import { CuidPipe } from '@/common/pipes/cuid.pipe';
import { Body, Controller, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QAFeedbackDto, QARecordResponseDto } from '../dto';
import { QAFeedbackService } from '../services';

@ApiTags('QA Feedback')
@ApiBearerAuth()
@Controller('api/v1/qa/records')
export class QAFeedbackController {
  constructor(private readonly feedback: QAFeedbackService) {}

  @Post(':recordId/feedback')
  @RequirePermissions('qa:feedback:create')
  @ApiOperation({ summary: '提交问答记录满意度反馈' })
  @ApiResponse({ status: 201, type: QARecordResponseDto })
  submit(
    @Param('recordId', CuidPipe) recordId: string,
    @Body() dto: QAFeedbackDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.feedback.submit(orgId, recordId, dto);
  }
}
