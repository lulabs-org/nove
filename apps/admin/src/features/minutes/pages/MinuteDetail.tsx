import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CloudDownloadOutlined,
  CopyOutlined,
  DeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Empty from 'antd/es/empty';
import Input from 'antd/es/input';
import List from 'antd/es/list';
import message from 'antd/es/message';
import Popconfirm from 'antd/es/popconfirm';
import Skeleton from 'antd/es/skeleton';
import Space from 'antd/es/space';
import Tabs from 'antd/es/tabs';
import Tag from 'antd/es/tag';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { PERMISSIONS } from '../../../shared/utils/permissions';
import { driveApi } from '../../drive/api/driveApi';
import type { MinuteDriveFile } from '../../drive/model/types';
import {
  formatDateTime,
  formatDuration,
  getMeetingPlatformText,
  getMeetingTypeText,
} from '../../meetings/utils/formatters';
import { minuteApi } from '../api/minuteApi';
import type {
  MeetingParticipant,
  Minute,
  MinuteSummary,
  RelatedMeeting,
  SpeakerSummary,
  TranscriptSegment,
} from '../model/types';
import './MinuteDetail.css';

const SOURCE_LABELS = {
  PLATFORM_AUTO: '平台自动录制',
  USER_MANUAL: '用户手动录制',
  THIRD_PARTY: '第三方录制',
} as const;

const SPEAKER_COLORS = ['#4263b5', '#087f8c', '#8752a1', '#b56527', '#27805b', '#b34f72'];

function speakerColor(identity: string) {
  let hash = 0;
  for (const character of identity) {
    hash = (Math.imul(hash, 31) + character.codePointAt(0)!) | 0;
  }
  return SPEAKER_COLORS[(hash >>> 0) % SPEAKER_COLORS.length];
}

function participantName(participant: MeetingParticipant) {
  return (
    participant.user?.profile?.displayName ||
    participant.user?.username ||
    participant.platformUser?.displayName ||
    participant.user?.email ||
    '未知成员'
  );
}

function participantContact(participant: MeetingParticipant) {
  const user = participant.user;
  if (user) return user.email || [user.countryCode, user.phone].filter(Boolean).join(' ') || '-';
  return participant.platformUser?.platform || '未关联系统账号';
}

function formatBytes(value: string | null) {
  if (!value) return '-';
  let size = Number(value);
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function renderMarkdown(content: string) {
  return DOMPurify.sanitize(marked.parse(content, { gfm: true }) as string);
}

function renderStructuredValue(value: unknown): React.ReactNode {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return (
      <ul className="minute-structured-list">
        {value.map((item, index) => (
          <li key={index}>{renderStructuredValue(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const preferred =
      object.point ?? object.task ?? object.decision ?? object.content ?? object.title;
    if (preferred) return String(preferred);
    return Object.entries(object)
      .map(
        ([key, item]) => `${key}: ${typeof item === 'object' ? JSON.stringify(item) : String(item)}`
      )
      .join(' · ');
  }
  return String(value);
}

function RetryEmpty({ description, onRetry }: { description: string; onRetry: () => void }) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      <Button onClick={onRetry}>重新加载</Button>
    </Empty>
  );
}

export function MinuteDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { checkPermission } = useAuth();
  const canReadSummary = checkPermission(PERMISSIONS.MINUTE_SUMMARY.READ);
  const canReadMeeting = checkPermission(PERMISSIONS.MEETING.READ);
  const canReadSpeakerSummary = checkPermission(PERMISSIONS.SPEAKER_SUMMARY.READ);
  const canReadDrive = checkPermission(PERMISSIONS.DRIVE.READ);
  const canDelete = checkPermission(PERMISSIONS.MINUTE.DELETE);

  const [minute, setMinute] = useState<Minute | null>(null);
  const [meeting, setMeeting] = useState<RelatedMeeting | null>(null);
  const [summary, setSummary] = useState<MinuteSummary | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [participantTotal, setParticipantTotal] = useState(0);
  const [participantSearch, setParticipantSearch] = useState('');
  const [speakerSummaries, setSpeakerSummaries] = useState<SpeakerSummary[]>([]);
  const [files, setFiles] = useState<MinuteDriveFile[]>([]);
  const [activeTab, setActiveTab] = useState(canReadSummary ? 'summary' : 'transcript');
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);
  const [visibleTranscriptCount, setVisibleTranscriptCount] = useState(200);
  const [transcriptLoaded, setTranscriptLoaded] = useState(false);
  const [participantsLoaded, setParticipantsLoaded] = useState(false);
  const [speakerSummariesLoaded, setSpeakerSummariesLoaded] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);

  const [minuteLoading, setMinuteLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [speakerSummariesLoading, setSpeakerSummariesLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [minuteError, setMinuteError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [meetingError, setMeetingError] = useState<string | null>(null);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [speakerSummariesError, setSpeakerSummariesError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);

  const fetchMinute = useCallback(async () => {
    if (!id) return;
    setMinuteLoading(true);
    setMinuteError(null);
    setMeeting(null);
    setSummary(null);
    setTranscript([]);
    setParticipants([]);
    setParticipantTotal(0);
    setParticipantSearch('');
    setSpeakerSummaries([]);
    setFiles([]);
    setExpandedParticipantId(null);
    setSummaryError(null);
    setTranscriptError(null);
    setMeetingError(null);
    setParticipantsError(null);
    setSpeakerSummariesError(null);
    setFilesError(null);
    try {
      const result = await minuteApi.getById(id);
      setMinute(result);
      setVisibleTranscriptCount(200);
      setTranscriptLoaded(false);
      setParticipantsLoaded(false);
      setSpeakerSummariesLoaded(false);
      setFilesLoaded(false);
    } catch {
      setMinute(null);
      setMinuteError('妙记详情暂时无法读取');
    } finally {
      setMinuteLoading(false);
    }
  }, [id]);

  const fetchSummary = useCallback(async () => {
    if (!id || !canReadSummary) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await minuteApi.getSummary(id));
    } catch {
      setSummary(null);
      setSummaryError('纪要暂时无法读取');
    } finally {
      setSummaryLoading(false);
    }
  }, [canReadSummary, id]);

  const fetchTranscript = useCallback(async () => {
    if (!id) return;
    setTranscriptLoading(true);
    setTranscriptError(null);
    try {
      setTranscript(await minuteApi.getTranscript(id));
    } catch {
      setTranscript([]);
      setTranscriptError('逐字稿暂时无法读取');
    } finally {
      setTranscriptLoading(false);
      setTranscriptLoaded(true);
    }
  }, [id]);

  const fetchMeeting = useCallback(async () => {
    if (!minute?.meetingId || !minute.meeting || !canReadMeeting) return;
    setMeetingLoading(true);
    setMeetingError(null);
    try {
      setMeeting(await minuteApi.getMeeting(minute.meetingId));
    } catch {
      setMeeting(null);
      setMeetingError('关联会议信息暂时无法读取');
    } finally {
      setMeetingLoading(false);
    }
  }, [canReadMeeting, minute?.meeting, minute?.meetingId]);

  const fetchParticipants = useCallback(
    async (search?: string) => {
      if (!minute?.meetingId || !minute.meeting || !canReadMeeting) return;
      const normalizedSearch = search?.trim() ?? '';
      setParticipantsLoading(true);
      setParticipantsError(null);
      try {
        const result = await minuteApi.getParticipants(minute.meetingId, {
          page: 1,
          limit: 100,
          search: normalizedSearch || undefined,
        });
        setParticipants(result.data);
        setParticipantTotal(result.total);
        setParticipantSearch(normalizedSearch);
      } catch {
        setParticipants([]);
        setParticipantsError('参会成员暂时无法读取');
      } finally {
        setParticipantsLoading(false);
        setParticipantsLoaded(true);
      }
    },
    [canReadMeeting, minute?.meeting, minute?.meetingId]
  );

  const fetchSpeakerSummaries = useCallback(async () => {
    if (!id || !canReadSpeakerSummary) return;
    setSpeakerSummariesLoading(true);
    setSpeakerSummariesError(null);
    try {
      const result = await minuteApi.getSpeakerSummaries(id);
      setSpeakerSummaries(result.data);
    } catch {
      setSpeakerSummaries([]);
      setSpeakerSummariesError('个人总结暂时无法读取');
    } finally {
      setSpeakerSummariesLoading(false);
      setSpeakerSummariesLoaded(true);
    }
  }, [canReadSpeakerSummary, id]);

  const fetchFiles = useCallback(async () => {
    if (!id || !canReadDrive) return;
    setFilesLoading(true);
    setFilesError(null);
    try {
      setFiles(await minuteApi.getFiles(id));
    } catch {
      setFiles([]);
      setFilesError('妙记文件暂时无法读取');
    } finally {
      setFilesLoading(false);
      setFilesLoaded(true);
    }
  }, [canReadDrive, id]);

  useEffect(() => {
    void fetchMinute();
  }, [fetchMinute]);

  useEffect(() => {
    if (!minute) return;
    if (canReadSummary) void fetchSummary();
    if (canReadMeeting && minute.meetingId && minute.meeting) void fetchMeeting();
  }, [canReadMeeting, canReadSummary, fetchMeeting, fetchSummary, minute]);

  useEffect(() => {
    if (activeTab === 'transcript' && !transcriptLoading && !transcriptLoaded) {
      void fetchTranscript();
    }
  }, [activeTab, fetchTranscript, transcriptLoaded, transcriptLoading]);

  useEffect(() => {
    if (activeTab !== 'participants' || !minute?.meetingId || !minute.meeting) return;
    if (!participantsLoading && !participantsLoaded) void fetchParticipants();
    if (canReadSpeakerSummary && !speakerSummariesLoading && !speakerSummariesLoaded) {
      void fetchSpeakerSummaries();
    }
  }, [
    activeTab,
    canReadSpeakerSummary,
    fetchParticipants,
    fetchSpeakerSummaries,
    minute?.meeting,
    minute?.meetingId,
    participantsLoaded,
    participantsLoading,
    speakerSummariesLoaded,
    speakerSummariesLoading,
  ]);

  useEffect(() => {
    if (activeTab === 'files' && !filesLoading && !filesLoaded) void fetchFiles();
  }, [activeTab, fetchFiles, filesLoaded, filesLoading]);

  const speakerSummaryByPlatformUserId = useMemo(
    () => new Map(speakerSummaries.map((item) => [item.platformUserId, item])),
    [speakerSummaries]
  );

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await minuteApi.delete(id);
      message.success('删除妙记成功');
      navigate('/minutes');
    } catch {
      message.error('删除妙记失败');
    } finally {
      setDeleting(false);
    }
  };

  if (minuteLoading) {
    return (
      <div className="minute-detail-loading">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!minute) {
    return (
      <div className="minute-detail-page minute-detail-empty">
        <RetryEmpty description={minuteError || '妙记不存在'} onRetry={() => void fetchMinute()} />
      </div>
    );
  }

  const title = meeting?.title || minute.meeting?.title || '未关联会议的妙记';
  const summaryPane = summaryLoading ? (
    <Skeleton active paragraph={{ rows: 8 }} />
  ) : summaryError ? (
    <RetryEmpty description={summaryError} onRetry={() => void fetchSummary()} />
  ) : summary ? (
    <div className="minute-summary-pane">
      <div className="minute-section-heading">
        <div>
          <h2>会议纪要</h2>
          <span>更新于 {formatDateTime(summary.updatedAt)}</span>
        </div>
        {summary.keywords?.length ? (
          <Space wrap>
            {summary.keywords.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        ) : null}
      </div>
      <div className="minute-summary-content">{summary.content}</div>
      {summary.keyPoints ? (
        <section>
          <h3>关键要点</h3>
          {renderStructuredValue(summary.keyPoints)}
        </section>
      ) : null}
      {summary.actionItems ? (
        <section>
          <h3>行动项</h3>
          {renderStructuredValue(summary.actionItems)}
        </section>
      ) : null}
      {summary.decisions ? (
        <section>
          <h3>会议决策</h3>
          {renderStructuredValue(summary.decisions)}
        </section>
      ) : null}
    </div>
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无会议纪要" />
  );

  const transcriptPane = transcriptLoading ? (
    <Skeleton active paragraph={{ rows: 8 }} />
  ) : transcriptError ? (
    <RetryEmpty description={transcriptError} onRetry={() => void fetchTranscript()} />
  ) : transcript.length ? (
    <div className="minute-transcript-pane">
      <div className="minute-pane-meta">本条妙记共 {transcript.length} 条转写</div>
      <div className="minute-transcript-list">
        {transcript.slice(0, visibleTranscriptCount).map((segment) => {
          const speakerName =
            segment.user?.fullName ||
            segment.platformUser?.displayName ||
            segment.speakerName ||
            '未知发言人';
          return (
            <div className="minute-transcript-segment" key={segment.id}>
              <Avatar
                size={26}
                style={{
                  backgroundColor: speakerColor(
                    segment.user?.id
                      ? 'user:' + segment.user.id
                      : segment.platformUser?.id
                        ? 'platform:' + segment.platformUser.id
                        : 'name:' + speakerName
                  ),
                }}
              >
                {Array.from(speakerName)[0]}
              </Avatar>
              <div>
                <div className="minute-transcript-meta">
                  <strong>{speakerName}</strong>
                  <span>{segment.startTime}</span>
                </div>
                <div className="minute-transcript-text">{segment.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      {visibleTranscriptCount < transcript.length ? (
        <Button block onClick={() => setVisibleTranscriptCount((count) => count + 200)}>
          再显示 {Math.min(200, transcript.length - visibleTranscriptCount)} 条
        </Button>
      ) : null}
    </div>
  ) : (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前妙记暂无逐字稿" />
  );

  const participantsPane =
    participantsLoading || speakerSummariesLoading ? (
      <Skeleton active paragraph={{ rows: 6 }} />
    ) : participantsError ? (
      <RetryEmpty description={participantsError} onRetry={() => void fetchParticipants()} />
    ) : participants.length ? (
      <div className="minute-participant-pane">
        <div className="minute-participant-toolbar">
          <div>
            共 {participantTotal} 位参会成员
            {participantSearch ? <small> · 当前搜索“{participantSearch}”</small> : null}
          </div>
          <Input.Search
            allowClear
            placeholder="搜索姓名、邮箱或手机号"
            onSearch={(value) => void fetchParticipants(value)}
            onChange={(event) => !event.target.value && void fetchParticipants()}
          />
        </div>
        {speakerSummariesError ? (
          <div className="minute-inline-error">{speakerSummariesError}</div>
        ) : null}
        {!canReadSpeakerSummary ? (
          <div className="minute-inline-note">当前账号没有查看个人总结的权限。</div>
        ) : null}
        <div className="minute-participant-list">
          {participants.map((participant) => {
            const participantSummary = participant.platformUser?.id
              ? speakerSummaryByPlatformUserId.get(participant.platformUser.id)
              : undefined;
            const expanded = expandedParticipantId === participant.id;
            return (
              <div className="minute-participant-item" key={participant.id}>
                <div className="minute-participant-row">
                  <Avatar
                    src={participant.user?.profile?.avatar || participant.platformUser?.avatarUrl}
                  >
                    {participantName(participant).slice(0, 1)}
                  </Avatar>
                  <div className="minute-participant-identity">
                    <strong>{participantName(participant)}</strong>
                    <span>{participantContact(participant)}</span>
                  </div>
                  <div className="minute-participant-time">
                    <span>加入 {formatDateTime(participant.firstJoinTime)}</span>
                    <span>离开 {formatDateTime(participant.lastLeaveTime)}</span>
                  </div>
                  <Tag>{formatDuration(participant.totalDurationSeconds)}</Tag>
                  {participantSummary ? (
                    <Button
                      type="link"
                      onClick={() => setExpandedParticipantId(expanded ? null : participant.id)}
                    >
                      {expanded ? '收起总结' : '查看总结'}
                    </Button>
                  ) : null}
                </div>
                {participantSummary && expanded ? (
                  <div className="minute-participant-summary">
                    {participantSummary.keywords.length ? (
                      <Space wrap size={[4, 4]}>
                        {participantSummary.keywords.map((keyword) => (
                          <Tag key={keyword}>{keyword}</Tag>
                        ))}
                      </Space>
                    ) : null}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(participantSummary.partSummary),
                      }}
                    />
                    <small>更新于 {formatDateTime(participantSummary.updatedAt)}</small>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无参会成员记录" />
    );

  const infoPane = (
    <div className="minute-info-pane">
      <section>
        <h3>妙记信息</h3>
        <dl>
          <div>
            <dt>妙记 ID</dt>
            <dd>
              <code>{minute.id}</code>
            </dd>
          </div>
          <div>
            <dt>外部录制 ID</dt>
            <dd>
              <code>{minute.externalId || '-'}</code>
            </dd>
          </div>
          <div>
            <dt>来源</dt>
            <dd>{SOURCE_LABELS[minute.source] || minute.source}</dd>
          </div>
          <div>
            <dt>录制用户 ID</dt>
            <dd>
              <code>{minute.recorderUserId || '-'}</code>
            </dd>
          </div>
          <div>
            <dt>开始时间</dt>
            <dd>{formatDateTime(minute.startAt)}</dd>
          </div>
          <div>
            <dt>结束时间</dt>
            <dd>{formatDateTime(minute.endAt)}</dd>
          </div>
          <div>
            <dt>创建时间</dt>
            <dd>{formatDateTime(minute.createdAt)}</dd>
          </div>
          <div>
            <dt>更新时间</dt>
            <dd>{formatDateTime(minute.updatedAt)}</dd>
          </div>
        </dl>
        {minute.errorMessage ? (
          <div className="minute-inline-error">{minute.errorMessage}</div>
        ) : null}
      </section>
      <section>
        <h3>关联会议</h3>
        {meetingLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : meetingError ? (
          <RetryEmpty description={meetingError} onRetry={() => void fetchMeeting()} />
        ) : meeting ? (
          <dl>
            <div>
              <dt>标题</dt>
              <dd>{meeting.title}</dd>
            </div>
            <div>
              <dt>平台</dt>
              <dd>{getMeetingPlatformText(meeting.platform)}</dd>
            </div>
            <div>
              <dt>类型</dt>
              <dd>{getMeetingTypeText(meeting.type)}</dd>
            </div>
            <div>
              <dt>会议号</dt>
              <dd>{meeting.meetingCode || '-'}</dd>
            </div>
            <div>
              <dt>开始时间</dt>
              <dd>{formatDateTime(meeting.startAt)}</dd>
            </div>
            <div>
              <dt>结束时间</dt>
              <dd>{formatDateTime(meeting.endAt)}</dd>
            </div>
          </dl>
        ) : minute.meeting ? (
          <dl>
            <div>
              <dt>标题</dt>
              <dd>{minute.meeting.title}</dd>
            </div>
            <div>
              <dt>平台</dt>
              <dd>{getMeetingPlatformText(minute.meeting.platform)}</dd>
            </div>
          </dl>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未关联会议" />
        )}
      </section>
      <section>
        <h3>元数据</h3>
        <pre>{JSON.stringify(minute.metadata ?? {}, null, 2)}</pre>
      </section>
    </div>
  );

  const filesPane = filesLoading ? (
    <Skeleton active paragraph={{ rows: 5 }} />
  ) : filesError ? (
    <RetryEmpty description={filesError} onRetry={() => void fetchFiles()} />
  ) : (
    <List
      className="minute-file-list"
      dataSource={files}
      locale={{ emptyText: '当前妙记暂无云盘文件' }}
      renderItem={(file) => (
        <List.Item
          actions={[
            <Button
              key="download"
              icon={<CloudDownloadOutlined />}
              disabled={file.status !== 'ACTIVE'}
              onClick={async () => {
                try {
                  const result = await driveApi.createDownloadUrl(file.fileId);
                  window.location.assign(result.url);
                } catch {
                  message.error('创建文件下载链接失败');
                }
              }}
            >
              下载
            </Button>,
          ]}
        >
          <List.Item.Meta
            title={file.name}
            description={`${file.contentType || '未知类型'} · ${formatBytes(file.sizeBytes)} · ${file.status || 'UNKNOWN'}`}
          />
        </List.Item>
      )}
    />
  );

  const tabItems = [
    ...(canReadSummary ? [{ key: 'summary', label: '纪要', children: summaryPane }] : []),
    ...(canReadMeeting && minute.meetingId && minute.meeting
      ? [
          {
            key: 'participants',
            label: `参会成员 ${participantTotal || ''}`,
            children: participantsPane,
          },
        ]
      : []),
    { key: 'transcript', label: `逐字稿 ${transcript.length || ''}`, children: transcriptPane },
    ...(canReadDrive ? [{ key: 'files', label: '文件', children: filesPane }] : []),
    { key: 'info', label: '基本信息', children: infoPane },
  ];

  return (
    <div className="minute-detail-page">
      <header className="minute-detail-header">
        <div className="minute-detail-title-group">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/minutes')}>
            返回
          </Button>
          <div>
            <h1>{title}</h1>
            <div className="minute-detail-meta">
              <span>
                <CalendarOutlined /> {formatDateTime(minute.startAt || minute.meeting?.startAt)}
              </span>
              <Tag>{SOURCE_LABELS[minute.source] || minute.source}</Tag>
              {participantTotal ? (
                <span>
                  <TeamOutlined /> {participantTotal} 人
                </span>
              ) : null}
              {minute.errorMessage ? <Tag color="error">处理异常</Tag> : null}
            </div>
          </div>
        </div>
        <Space>
          <Button
            icon={<CopyOutlined />}
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href);
              message.success('详情链接已复制');
            }}
          >
            复制链接
          </Button>
          {canDelete ? (
            <Popconfirm title="确定删除这条妙记吗？" onConfirm={() => void handleDelete()}>
              <Button danger loading={deleting} icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      </header>
      <Card className="minute-detail-card" styles={{ body: { padding: 0 } }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
}
