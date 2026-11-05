import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MeetingPlaybackScopeType } from '@/generated/prisma/client';

export class CatchUpMeetingPlaybackDto {
  @ApiPropertyOptional({
    description:
      '同学的原话。例如：过去两三天我都没来，张老师那边、叶老师那边都讲了什么？',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  question?: string;

  @ApiPropertyOptional({
    description:
      '企业微信成员 userid。Workbuddy 必须使用会话发送人，不能从问题文本里拿姓名。',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  wecomUserId?: string;

  @ApiPropertyOptional({ description: '企业微信平台用户 ID' })
  @IsOptional()
  @IsString()
  wecomPlatformUserId?: string;

  @ApiPropertyOptional({ type: [String], description: '老师过滤，如 张老师' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  teachers?: string[];

  @ApiPropertyOptional({
    description: '同学说明自己缺席时设为 true，默认回看最近三天',
  })
  @IsOptional()
  @IsBoolean()
  absence?: boolean;

  @ApiPropertyOptional({ description: '范围开始，ISO 8601' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: '范围结束，ISO 8601' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class QueryPlaybackSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  wecomUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wecomPlatformUserId?: string;
}

export class MeetingPlaybackGrantHostDto {
  @ApiProperty({ example: '张老师' })
  @IsString()
  @MaxLength(100)
  hostName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hostPlatformUserId?: string;
}

export class CreateMeetingPlaybackGrantDto {
  @ApiProperty()
  @IsString()
  studentUserId!: string;

  @ApiProperty({ description: '已绑定到该同学的企业微信平台用户 ID' })
  @IsString()
  wecomPlatformUserId!: string;

  @ApiProperty({ enum: MeetingPlaybackScopeType })
  @IsEnum(MeetingPlaybackScopeType)
  scopeType!: MeetingPlaybackScopeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ type: [MeetingPlaybackGrantHostDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => MeetingPlaybackGrantHostDto)
  hosts?: MeetingPlaybackGrantHostDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    description: '若填写，只有这把 API Key 能代表该同学查询回放',
  })
  @IsOptional()
  @IsString()
  boundApiKeyId?: string;
}

export class BatchCreateMeetingPlaybackGrantDto {
  @ApiProperty({ type: [CreateMeetingPlaybackGrantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateMeetingPlaybackGrantDto)
  grants!: CreateMeetingPlaybackGrantDto[];
}

export class QueryMeetingPlaybackGrantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  wecomUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }): boolean | undefined => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  active?: boolean;
}
