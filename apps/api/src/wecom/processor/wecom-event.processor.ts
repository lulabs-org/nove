import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SingleOrgContextService } from '@/admin/org';
import { MeetingPlaybackService } from '@/meeting-playback/meeting-playback.service';

import { WecomCustomerService } from '../service/wecom-customer.service';
import { WecomClientService } from '../service/wecom-client.service';

@Processor('wecom-event')
export class WecomEventProcessor extends WorkerHost {
  private readonly logger = new Logger(WecomEventProcessor.name);

  constructor(
    private readonly wecomCustomerService: WecomCustomerService,
    private readonly wecomClientService: WecomClientService,
    private readonly playbackService: MeetingPlaybackService,
    private readonly orgContext: SingleOrgContextService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(
      `Processing WeCom event job ${job.id} of type ${job.name}`,
    );

    try {
      if (job.name === 'sync_external_contact') {
        const { externalUserId } = job.data as { externalUserId: string };
        if (!externalUserId) {
          throw new Error('Missing externalUserId in job data');
        }
        await this.wecomCustomerService.syncExternalContact(externalUserId);
      } else if (job.name === 'workbuddy_text') {
        const { wecomUserId, content } = job.data as {
          wecomUserId: string;
          content: string;
        };
        if (!wecomUserId || !content) {
          throw new Error('Missing Workbuddy text payload');
        }
        const result = await this.playbackService.answerForWecomUser(
          this.orgContext.getOrgId(),
          wecomUserId,
          content,
        );
        const delivery = await this.wecomClientService.sendWorkbuddyText(
          wecomUserId,
          result.replyText,
        );
        this.logger.log(
          `Workbuddy reply for ${wecomUserId}: sent=${delivery.sent} authorized=${result.authorized} matched=${result.matched}`,
        );
      } else {
        this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process WeCom event job ${job.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
