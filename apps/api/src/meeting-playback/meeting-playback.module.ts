import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { MeetingPlaybackGrantController } from './meeting-playback-grant.controller';
import { MeetingPlaybackGrantService } from './meeting-playback-grant.service';
import { MeetingPlaybackController } from './meeting-playback.controller';
import { MeetingPlaybackService } from './meeting-playback.service';

@Module({
  imports: [PrismaModule],
  controllers: [MeetingPlaybackController, MeetingPlaybackGrantController],
  providers: [MeetingPlaybackService, MeetingPlaybackGrantService],
  exports: [MeetingPlaybackService, MeetingPlaybackGrantService],
})
export class MeetingPlaybackModule {}
