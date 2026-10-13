import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { LoginType } from '@/auth/enums';

@Injectable()
export class LoginLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  countLoginFailuresByTargetSince(
    target: string,
    since: Date,
  ): Promise<number> {
    return this.prisma.loginLog.count({
      where: { target, success: false, createdAt: { gte: since } },
    });
  }

  countLoginFailuresByIpSince(ip: string, since: Date): Promise<number> {
    return this.prisma.loginLog.count({
      where: { ip, success: false, createdAt: { gte: since } },
    });
  }

  createLoginLog(data: {
    userId: string | null;
    target: string;
    loginType: LoginType;
    success: boolean;
    ip: string;
    userAgent?: string;
    failReason?: string;
  }): Promise<void> {
    return this.prisma.loginLog
      .create({
        data: {
          userId: data.userId,
          target: data.target,
          loginType: data.loginType,
          success: data.success,
          ip: data.ip,
          userAgent: data.userAgent,
          failReason: data.failReason,
        },
      })
      .then(() => undefined);
  }
}
