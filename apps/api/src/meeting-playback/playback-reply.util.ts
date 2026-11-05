import { DateTime } from 'luxon';
import type {
  MeetingPlaybackCatchUpResult,
  MeetingPlaybackSession,
  PlaybackKeySegment,
} from './meeting-playback.types';

export function publicApiBase(): string | null {
  const raw = process.env.NOVE_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

export function playbackEntryPath(meetingId: string): string {
  return `/meeting-playbacks/sessions/${meetingId}`;
}

export function playbackEntryUrl(meetingId: string): string | null {
  const base = publicApiBase();
  return base ? `${base}${playbackEntryPath(meetingId)}` : null;
}

export function fileLabel(fileType: string): string {
  switch (fileType) {
    case 'VIDEO':
      return '视频回放';
    case 'AUDIO':
      return '音频回放';
    case 'TRANSCRIPT':
      return '转写文本';
    case 'CHAT':
      return '聊天记录';
    default:
      return '回放文件';
  }
}

export function catchUpSuggestion(
  summary: string | null,
  segments: PlaybackKeySegment[],
): string {
  if (segments.length) {
    const highlights = segments
      .slice(0, 3)
      .map((segment) => segment.title)
      .join('；');
    return `按回放顺序补看。优先抓住这些已有要点：${highlights}。`;
  }

  if (summary) {
    const sentence =
      summary
        .split(/[。！？\n]/)
        .find((part) => part.trim())
        ?.trim() ?? summary;
    return `先看回放，并对照纪要：${sentence.slice(0, 80)}`;
  }

  return '这场已有回放入口，纪要尚未生成，请直接观看回放。';
}

export function buildCatchUpPlan(
  sessions: MeetingPlaybackSession[],
): string | null {
  if (!sessions.length) return null;

  const lines = sessions.map((session) => {
    const when = formatShanghai(session.startAt);
    const hint =
      session.keySegments[0]?.title ??
      (session.summary
        ? session.summary.slice(0, 40)
        : '纪要尚未生成，直接看回放');
    return `${session.catchUp.order}. ${when} ${session.teacherName}《${session.title}》— ${hint}`;
  });

  return `建议按这个顺序补看：\n${lines.join('\n')}`;
}

export function foundPlaybackMessage(
  count: number,
  absence: boolean,
  truncated: boolean,
): string {
  const lead = absence
    ? `缺席的这几天里，找到 ${count} 场可以补看的回放。下面按老师和场次分开说明。`
    : `找到 ${count} 场你有权限查看的回放。下面按老师和场次分开说明。`;
  return truncated ? `${lead}还有更多场次，请缩小时间范围。` : lead;
}

export function emptyPlaybackMessage(teachers: string[]): string {
  if (teachers.length) {
    return `在你有权限查看的范围内，这个时间段没有${teachers.join('、')}的会议回放。`;
  }
  return '在你有权限查看的范围内，这个时间段没有会议回放。';
}

export function formatWorkbuddyReply(
  result: MeetingPlaybackCatchUpResult,
): string {
  const greeting = result.student?.displayName
    ? `${result.student.displayName}，`
    : '';

  if (!result.authorized || !result.matched) {
    return `${greeting}${result.message}`;
  }

  const blocks = result.sessions.map((session) => {
    const when = formatShanghai(session.startAt);
    const link = session.playback.entryUrl ?? session.playback.entryPath;
    const summary = session.summary ?? '纪要尚未生成。';
    const segments = session.keySegments.length
      ? `\n关键片段：${session.keySegments
          .map((segment) =>
            segment.timestamp
              ? `${segment.timestamp} ${segment.title}`
              : segment.title,
          )
          .join('；')}`
      : '';
    const files = session.playback.files.length
      ? `\n包含：${session.playback.files.map((file) => file.label).join('、')}`
      : '';
    return [
      `${session.catchUp.order}. ${session.teacherName} · ${when} · ${session.title}`,
      `回放入口：${link}`,
      `讲了什么：${summary}${segments}${files}`,
      `补看：${session.catchUp.suggestion}`,
    ].join('\n');
  });

  const plan = result.catchUpPlan ? `\n\n${result.catchUpPlan}` : '';
  return `${greeting}${result.message}\n\n${blocks.join('\n\n')}${plan}`;
}

export function formatShanghai(iso: string): string {
  const local = DateTime.fromISO(iso, { zone: 'Asia/Shanghai' });
  if (!local.isValid) return iso;
  return local.toFormat('M月d日 HH:mm');
}

export function readKeySegments(
  summary: {
    aiMinutes: unknown;
    keyPoints: unknown;
  } | null,
): PlaybackKeySegment[] {
  if (!summary) return [];

  const segments: PlaybackKeySegment[] = [];
  const minutes = asRecord(summary.aiMinutes);
  const sections = minutes?.sections;
  if (Array.isArray(sections)) {
    for (const section of sections) {
      const record = asRecord(section);
      if (!record) continue;
      const title = textOf(record.title);
      const content = textOf(record.content);
      if (!title && !content) continue;
      segments.push({
        title: title ?? content!,
        timestamp: textOf(record.timestamp),
        takeaway: content ?? title!,
      });
    }
  }

  if (Array.isArray(summary.keyPoints)) {
    for (const point of summary.keyPoints) {
      const record = asRecord(point);
      if (!record) continue;
      const text = textOf(record.point);
      if (!text) continue;
      segments.push({
        title: text,
        timestamp: textOf(record.timestamp),
        takeaway: text,
      });
    }
  }

  return segments.slice(0, 5);
}

export function summaryFromMinute(minute: {
  summary: { content: string } | null;
  speakerSummaries: {
    partSummary: string;
    platformUser: { displayName: string | null } | null;
  }[];
}): string | null {
  const content = minute.summary?.content?.trim();
  if (content) return content;

  const lines = minute.speakerSummaries
    .map((item) => {
      const text = item.partSummary?.trim();
      if (!text) return null;
      const name = item.platformUser?.displayName?.trim() || '发言人';
      return `${name}：${text}`;
    })
    .filter((line): line is string => Boolean(line));

  return lines.length ? lines.join('\n') : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textOf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
