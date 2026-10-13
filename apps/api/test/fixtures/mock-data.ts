/**
 * Mock data generators for testing
 */

/**
 * Generate mock user data
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  password: 'hashedpassword',
  phone: '+1234567890',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Generate mock JWT payload
 */
export const mockJwtPayload = {
  sub: mockUser.id,
  email: mockUser.email,
  username: mockUser.username,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
};

/**
 * Generate mock meeting record data
 */
export const mockMeetingRecord = {
  id: 'test-meeting-record-id',
  meetingId: 'test-meeting-id',
  meetingCode: 'test-meeting-code',
  subject: 'Test Meeting Subject',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Generate mock Tencent webhook event data
 */
export const mockTencentWebhookEvent = {
  event: 'meeting.started',
  trace_id: 'test_trace_id',
  payload: [
    {
      operate_time: Date.now(),
      operator: {
        userid: 'test_user_id',
        uuid: 'test_uuid',
        user_name: 'Test User',
        instance_id: 'test_instance_id',
      },
      meeting_info: {
        meeting_id: 'test_meeting_id',
        meeting_code: 'test_meeting_code',
        subject: 'Test Meeting',
        creator: {
          userid: 'test_creator_id',
          uuid: 'test_creator_uuid',
          user_name: 'Test Creator',
        },
        meeting_type: 0,
        start_time: Math.floor(Date.now() / 1000),
        end_time: Math.floor(Date.now() / 1000) + 3600,
      },
    },
  ],
};

/**
 * Generate mock Feishu webhook event data
 */
export const mockFeishuWebhookEvent = {
  encrypt: 'encrypted_data',
  type: 'url_verification',
  token: 'test_token',
  challenge: 'test_challenge',
};

/**
 * Generate mock email data
 */
export const mockEmailData = {
  to: 'recipient@example.com',
  subject: 'Test Email Subject',
  text: 'Test email content',
  html: '<p>Test email content</p>',
};

/**
 * Generate mock SMS verification data
 */
export const mockSmsVerificationData = {
  phone: '+1234567890',
  code: '123456',
  type: 'registration',
};

/**
 * Mock HTTP headers for webhook requests
 */
export const mockWebhookHeaders = {
  tencent: {
    'wechatwork-signature': 'test_signature',
    'wechatwork-timestamp': '1234567890',
    'wechatwork-nonce': 'test_nonce',
  },
  feishu: {
    'x-lark-signature': 'test_signature',
    'x-lark-request-timestamp': '1234567890',
    'x-lark-request-nonce': 'test_nonce',
  },
};
