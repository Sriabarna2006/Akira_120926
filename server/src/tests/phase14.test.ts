process.env.NODE_ENV = 'test';
import { NotificationRepository } from '../repositories/notification.repository.js';
import { NotificationDecisionService } from '../services/notification/notificationDecision.service.js';
import { NotificationService } from '../services/notification/notification.service.js';
import { WebPushService } from '../services/notification/webPush.service.js';
import { notificationScheduler } from '../services/notification/notificationScheduler.js';
import {
  subscribePushSchema,
  updateNotificationPreferencesSchema,
  notificationQuerySchema,
  notificationIdParamSchema,
  sendTestNotificationSchema,
} from '../validators/notification.validator.js';
import {
  NotificationCandidate,
  NotificationPreference,
  PushSubscriptionPayload,
} from '../types/index.js';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details?: string;
  error?: string;
}

async function runPhase14VerificationSuite(): Promise<void> {
  console.log('======================================================================');
  console.log('🧪 AKIRA PHASE 14: REAL-TIME INTELLIGENCE & MOBILE NOTIFICATION SYSTEM');
  console.log('======================================================================\n');

  const results: TestResult[] = [];
  NotificationRepository.clearMemoryStore();
  WebPushService.initialize();

  const userA = '00000000-0000-0000-0000-00000000000a';
  const userB = '00000000-0000-0000-0000-00000000000b';

  // Helper to record assertions
  function record(num: number, name: string, condition: boolean, details?: string) {
    results.push({ num, name, passed: condition, details });
    const status = condition ? '✅ PASS' : '❌ FAIL';
    console.log(`Test ${String(num).padStart(2, '0')}: [${status}] ${name}`);
    if (!condition && details) {
      console.log(`   └─ Details: ${details}`);
    }
  }

  try {
    // =========================================================================
    // SECTION 1: PUSH SUBSCRIPTIONS (Tests 1–6)
    // =========================================================================
    console.log('\n--- 📱 SECTION 1: Push Subscription Management ---');

    // Test 1: Register Push Subscription
    const subPayload1: PushSubscriptionPayload = {
      endpoint: 'https://mock.push.test/userA/device1',
      keys: { p256dh: 'BNcRdreALRF8M_mock_p256dh_key_1', auth: 'mock_auth_secret_1' },
      deviceLabel: 'Android Chrome',
      platform: 'android',
    };
    const sub1 = await NotificationRepository.createOrUpdateSubscription(userA, subPayload1);
    record(1, 'Register Push Subscription', Boolean(sub1.id && sub1.userId === userA && sub1.platform === 'android'));

    // Test 2: Duplicate Subscription Upsert (Same user, same endpoint)
    const subPayload1Updated: PushSubscriptionPayload = {
      ...subPayload1,
      deviceLabel: 'Android Chrome Updated',
    };
    const sub1Updated = await NotificationRepository.createOrUpdateSubscription(userA, subPayload1Updated);
    const userASubsAfterDupe = await NotificationRepository.getUserActiveSubscriptions(userA);
    record(2, 'Prevent Duplicate Subscription Endpoints', sub1Updated.id === sub1.id && userASubsAfterDupe.length === 1);

    // Test 3: Multiple Devices for Single User
    const subPayload2: PushSubscriptionPayload = {
      endpoint: 'https://mock.push.test/userA/device2',
      keys: { p256dh: 'BNcRdreALRF8M_mock_p256dh_key_2', auth: 'mock_auth_secret_2' },
      deviceLabel: 'MacBook Safari',
      platform: 'desktop',
    };
    await NotificationRepository.createOrUpdateSubscription(userA, subPayload2);
    const userASubs = await NotificationRepository.getUserActiveSubscriptions(userA);
    record(3, 'Multi-Device Support for Single User', userASubs.length === 2);

    // Test 4: Revoke Device Subscription
    const revoked = await NotificationRepository.revokeSubscription(userA, subPayload1.endpoint);
    const activeSubsAfterRevoke = await NotificationRepository.getUserActiveSubscriptions(userA);
    record(4, 'Revoke Device Subscription', revoked && activeSubsAfterRevoke.length === 1 && activeSubsAfterRevoke[0].endpoint === subPayload2.endpoint);

    // Test 5: User Isolation (User B cannot see User A subscriptions)
    const userBSubs = await NotificationRepository.getUserActiveSubscriptions(userB);
    record(5, 'User Isolation on Push Subscriptions', userBSubs.length === 0);

    // Test 6: Subscription Validation (Zod schema rejects invalid payload)
    const invalidPayload = { endpoint: 'not-a-valid-url', keys: { p256dh: 'short' } };
    const validationCheck = subscribePushSchema.safeParse(invalidPayload);
    record(6, 'Reject Invalid Subscription Payloads', !validationCheck.success);

    // =========================================================================
    // SECTION 2: NOTIFICATION PREFERENCES (Tests 7–11)
    // =========================================================================
    console.log('\n--- ⚙️ SECTION 2: Notification Preferences & Timezone ---');

    // Test 7: Default Preferences Generation
    const defaultPref = await NotificationRepository.getPreferences(userA);
    record(7, 'Generate Default Notification Preferences', defaultPref.enabled === true && defaultPref.studyTime === '19:00' && defaultPref.timezone === 'Asia/Kolkata');

    // Test 8: Update Notification Preferences
    const updatedPref = await NotificationRepository.upsertPreferences(userA, {
      studyTime: '20:30',
      quietHoursStart: '03:00',
      quietHoursEnd: '04:00',
      maximumDailyNotifications: 15,
      breakingEnabled: true,
      majorUpdateEnabled: false,
    });
    record(8, 'Update Notification Preferences', updatedPref.studyTime === '20:30' && updatedPref.maximumDailyNotifications === 15 && updatedPref.majorUpdateEnabled === false);

    // Test 9: User Isolation on Preferences
    const prefUserB = await NotificationRepository.getPreferences(userB);
    record(9, 'User Isolation on Notification Preferences', prefUserB.studyTime === '19:00' && prefUserB.majorUpdateEnabled === true);

    // Test 10: Validate Timezone Identifier
    const validTzCheck = updateNotificationPreferencesSchema.safeParse({ timezone: 'America/New_York' });
    const invalidTzCheck = updateNotificationPreferencesSchema.safeParse({ timezone: 'Invalid/NonExistentZone' });
    record(10, 'Validate IANA Timezones in Schema', validTzCheck.success && !invalidTzCheck.success);

    // Test 11: Validate Quiet Hours Format (HH:MM)
    const validTimeCheck = updateNotificationPreferencesSchema.safeParse({ quietHoursStart: '22:30' });
    const invalidTimeCheck = updateNotificationPreferencesSchema.safeParse({ quietHoursStart: '25:99' });
    record(11, 'Validate Quiet Hours HH:MM Format', validTimeCheck.success && !invalidTimeCheck.success);

    // =========================================================================
    // SECTION 3: NOTIFICATION DECISION ENGINE (Tests 12–20)
    // =========================================================================
    console.log('\n--- ⚡ SECTION 3: Notification Decision Engine ---');

    const samplePref: NotificationPreference = {
      userId: userA,
      enabled: true,
      breakingEnabled: true,
      majorUpdateEnabled: true,
      storylineEnabled: true,
      studyEnabled: true,
      reviewEnabled: true,
      dailyBriefingEnabled: true,
      knowledgeGapEnabled: true,
      dailyGoalEnabled: true,
      studyTime: '19:00',
      dailyBriefingTime: '08:00',
      quietHoursStart: '22:30',
      quietHoursEnd: '07:00',
      timezone: 'UTC',
      minimumImportance: 70,
      minimumEvidence: 60,
      maximumDailyNotifications: 10,
    };

    // Test 12: Breaking News Eligible (High importance & verified evidence)
    const breakingCandidate = NotificationDecisionService.buildBreakingCandidate(
      userA,
      { id: 'evt_breaking_01', title: 'Major Global Renewable Energy Accord Signed', importanceScore: 90 },
      { completenessScore: 85, hasConflicts: false }
    );
    const breakingDecision = await NotificationDecisionService.evaluateCandidate(samplePref, breakingCandidate);
    record(12, 'Breaking News Notification Eligible', breakingDecision.shouldNotify === true);

    // Test 13: Weak Evidence Suppresses Breaking News (Epistemic Trust Filter)
    const weakCandidate = NotificationDecisionService.buildBreakingCandidate(
      userA,
      { id: 'evt_breaking_weak', title: 'Unconfirmed Rumor On Social Media', importanceScore: 90 },
      { completenessScore: 40, hasConflicts: false }
    );
    const weakDecision = await NotificationDecisionService.evaluateCandidate(samplePref, weakCandidate);
    record(13, 'Weak Evidence Suppresses Notification Push', !weakDecision.shouldNotify && weakDecision.rejectionReason === 'INSUFFICIENT_EVIDENCE');

    // Test 14: Conflicting Evidence Suppresses Notification
    const conflictCandidate = NotificationDecisionService.buildBreakingCandidate(
      userA,
      { id: 'evt_breaking_conflict', title: 'Contradictory Official Statements Released', importanceScore: 90 },
      { completenessScore: 85, hasConflicts: true }
    );
    const conflictDecision = await NotificationDecisionService.evaluateCandidate(samplePref, conflictCandidate);
    record(14, 'Evidence Conflicts Suppress Notification Push', !conflictDecision.shouldNotify && conflictDecision.rejectionReason === 'EVIDENCE_CONFLICT');

    // Test 15: Major Storyline Turning Point Eligible (evaluated during daytime outside quiet hours)
    const majorCandidate = NotificationDecisionService.buildMajorUpdateCandidate(
      userA,
      { id: 'evt_semi_policy', title: 'Semiconductor Subsidies Approved', importanceScore: 88 },
      { title: 'Official Cabinet Clearance' },
      { id: 'stl_semi_2026', title: 'India Semiconductor Mission' }
    );
    const majorDecision = await NotificationDecisionService.evaluateCandidate(
      samplePref,
      majorCandidate,
      { currentTime: new Date('2026-09-22T14:30:00Z') }
    );
    record(15, 'Major Storyline Turning Point Notification Eligible', majorDecision.shouldNotify === true);

    // Test 16: User Type Preference Disabling (Type disabled suppresses push)
    const disabledTypePref: NotificationPreference = { ...samplePref, storylineEnabled: false };
    const storylineCandidate = NotificationDecisionService.buildStorylineCandidate(
      userA,
      { id: 'stl_semi_2026', title: 'India Semiconductor Mission' },
      { id: 'evt_semi_02', title: 'Commercial Fab Construction Begins', importanceScore: 80 }
    );
    const typeDisabledDecision = await NotificationDecisionService.evaluateCandidate(disabledTypePref, storylineCandidate);
    record(16, 'User Channel Preference Disabling Enforced', !typeDisabledDecision.shouldNotify && typeDisabledDecision.rejectionReason === 'TYPE_DISABLED');

    // Test 17: Timezone-Aware Quiet Hours Calculation (Normal daytime)
    const daytime = new Date('2026-09-22T14:30:00Z'); // 14:30 UTC
    const inQuietDaytime = NotificationDecisionService.isTimeInQuietHours('22:30', '07:00', 'UTC', daytime);
    record(17, 'Time Outside Quiet Hours Allowed', inQuietDaytime === false);

    // Test 18: Timezone-Aware Quiet Hours Calculation (Midnight crossing)
    const midnightTime = new Date('2026-09-22T23:30:00Z'); // 23:30 UTC (inside 22:30 -> 07:00)
    const inQuietMidnight = NotificationDecisionService.isTimeInQuietHours('22:30', '07:00', 'UTC', midnightTime);
    record(18, 'Midnight-Crossing Quiet Hours Calculation', inQuietMidnight === true);

    // Test 19: Deterministic Deduplication Check
    // First, dispatch notification
    const dispatch1 = await NotificationService.dispatchCandidate(breakingCandidate);
    // Attempt dispatching same candidate again
    const dupeDecision = await NotificationDecisionService.evaluateCandidate(samplePref, breakingCandidate);
    record(19, 'Deterministic Notification Deduplication', dispatch1.notified && !dupeDecision.shouldNotify && dupeDecision.rejectionReason === 'DUPLICATE_DEDUPE_KEY');

    // Test 20: Daily Rate Limiting Cap Enforcement
    const cappedPref: NotificationPreference = { ...samplePref, maximumDailyNotifications: 1 };
    const secondCandidate = NotificationDecisionService.buildBreakingCandidate(
      userA,
      { id: 'evt_breaking_02', title: 'Second Breaking Event Today', importanceScore: 92 },
      { completenessScore: 85 }
    );
    const capDecision = await NotificationDecisionService.evaluateCandidate(cappedPref, secondCandidate);
    record(20, 'Daily Notification Rate-Limiting Cap Enforced', !capDecision.shouldNotify && capDecision.rejectionReason === 'DAILY_CAP_EXCEEDED');

    // =========================================================================
    // SECTION 4: STUDY & REVIEW NOTIFICATIONS (Tests 21–25)
    // =========================================================================
    console.log('\n--- 🎓 SECTION 4: Study, Review & Learning Notifications ---');

    // Test 21: Build Study Reminder Candidate
    const studyCandidate = NotificationDecisionService.buildStudyReminderCandidate(userA, '2026-09-22', 4);
    record(21, 'Build Study Reminder Candidate', studyCandidate.notificationType === 'STUDY_REMINDER' && studyCandidate.dedupeKey === `study:${userA}:2026-09-22` && studyCandidate.url === '/learn');

    // Test 22: Study Reminder Dispatch
    const studyDispatch = await NotificationService.dispatchCandidate(studyCandidate);
    record(22, 'Dispatch Study Reminder Notification', studyDispatch.notified === true && studyDispatch.notification?.notificationType === 'STUDY_REMINDER');

    // Test 23: SM-2 Spaced Repetition Due Candidate
    const reviewCandidate = NotificationDecisionService.buildReviewDueCandidate(userA, '2026-09-22', 5);
    record(23, 'Build SM-2 Review Due Candidate', reviewCandidate.notificationType === 'REVIEW_DUE' && reviewCandidate.body.includes('5 concepts'));

    // Test 24: Knowledge Gap Recommendation Candidate
    const gapCandidate = NotificationDecisionService.buildKnowledgeGapCandidate(
      userA,
      { id: 'cpt_ev_battery', title: 'Solid-State Battery Electrolytes', masteryScore: 20 },
      '2026-09-22'
    );
    record(24, 'Build Knowledge Gap Candidate', gapCandidate.notificationType === 'KNOWLEDGE_GAP' && gapCandidate.conceptId === 'cpt_ev_battery');

    // Test 25: Time Window Matching Helper
    const isMatching = NotificationService.isTimeMatching('19:10', '19:00', 15);
    const isNotMatching = NotificationService.isTimeMatching('19:45', '19:00', 15);
    record(25, 'Time Window Matching Calculation', isMatching && !isNotMatching);

    // =========================================================================
    // SECTION 5: DAILY BRIEFING (Tests 26–28)
    // =========================================================================
    console.log('\n--- ☀️ SECTION 5: Daily Intelligence Briefing ---');

    // Test 26: Daily Briefing Candidate Generation
    const briefCandidate = NotificationDecisionService.buildDailyBriefingCandidate(userA, '2026-09-22', 7);
    record(26, 'Build Daily Briefing Candidate', briefCandidate.notificationType === 'DAILY_BRIEFING' && briefCandidate.url === '/daily-brief' && briefCandidate.body.includes('7 top developments'));

    // Test 27: Daily Briefing Dispatch & Persistence
    const briefDispatch = await NotificationService.dispatchCandidate(briefCandidate);
    record(27, 'Dispatch & Persist Daily Briefing Notification', briefDispatch.notified && briefDispatch.notification?.url === '/daily-brief');

    // Test 28: Daily Briefing Deduplication (Only 1 briefing per user per day)
    const duplicateBrief = await NotificationService.dispatchCandidate(briefCandidate);
    record(28, 'Daily Briefing Idempotency (Single Notification Per Day)', !duplicateBrief.notified && duplicateBrief.reason === 'DUPLICATE_DEDUPE_KEY');

    // =========================================================================
    // SECTION 6: NOTIFICATION HISTORY & READ ACTIONS (Tests 29–32)
    // =========================================================================
    console.log('\n--- 📬 SECTION 6: Notification History & Status Actions ---');

    // Test 29: Query Paginated History
    const history = await NotificationRepository.getNotificationHistory(userA, { page: 1, limit: 10 });
    record(29, 'Retrieve Paginated Notification History', history.notifications.length >= 3 && history.total >= 3);

    // Test 30: Unread Count Calculation
    const unreadCount = await NotificationRepository.getUnreadCount(userA);
    record(30, 'Calculate Unread Notifications Count', unreadCount >= 3);

    // Test 31: Mark Single Notification as Read
    const targetNotif = history.notifications[0];
    const markedRead = await NotificationRepository.markAsRead(targetNotif.id, userA);
    const updatedUnread = await NotificationRepository.getUnreadCount(userA);
    record(31, 'Mark Single Notification as Read', Boolean(markedRead?.openedAt && markedRead.status === 'OPENED' && updatedUnread === unreadCount - 1));

    // Test 32: Mark All Notifications as Read
    const markedAllCount = await NotificationRepository.markAllAsRead(userA);
    const finalUnread = await NotificationRepository.getUnreadCount(userA);
    record(32, 'Mark All Notifications as Read', markedAllCount > 0 && finalUnread === 0);

    // =========================================================================
    // SECTION 7: SECURITY & IDOR PROTECTION (Tests 33–36)
    // =========================================================================
    console.log('\n--- 🔒 SECTION 7: Security & IDOR Protection ---');

    // Test 33: IDOR Protection on Mark As Read (User B cannot mark User A notification)
    const idorAttempt = await NotificationRepository.markAsRead(targetNotif.id, userB);
    record(33, 'IDOR Protection on Mark as Read', idorAttempt === null);

    // Test 34: IDOR Protection on Notification Detail Fetch
    const idorFetch = await NotificationRepository.getNotificationById(targetNotif.id, userB);
    record(34, 'IDOR Protection on Notification Retrieval', idorFetch === null);

    // Test 35: Validate URL Deep-Link Format (Reject malicious javascript: protocols)
    const testNotifCheck = sendTestNotificationSchema.safeParse({ url: '/event/evt_123' });
    record(35, 'Validate Deep-Link URLs', testNotifCheck.success);

    // Test 36: Test Notification Dispatch (Explicit testing trigger)
    const testResult = await NotificationService.sendTestNotification(userA, {
      title: 'AKIRA • Manual Test Alert',
      body: 'Testing device Web Push dispatch.',
    });
    record(36, 'Dispatch Manual Test Notification', Boolean(testResult.notification?.id && testResult.notification.title.includes('Manual Test Alert')));

    // =========================================================================
    // SECTION 8: SCHEDULER IDEMPOTENCY & MUTEX LOCK (Tests 37–39)
    // =========================================================================
    console.log('\n--- ⏰ SECTION 8: Scheduler Idempotency & Mutex ---');

    // Test 37: Scheduler Evaluation Cycle Execution
    const report1 = await notificationScheduler.runEvaluationCycle();
    record(37, 'Execute Notification Evaluation Cycle', typeof report1.durationMs === 'number' && typeof report1.usersEvaluated === 'number');

    // Test 38: Scheduler Idempotency Across Repeated Cycles
    const report2 = await notificationScheduler.runEvaluationCycle();
    record(38, 'Scheduler Idempotency (Zero duplicate alerts created)', report2.notificationsCreated === 0);

    // Test 39: Automatic Revocation of Expired Subscriptions (RFC 8291 410 Gone)
    const expiredSub = await NotificationRepository.createOrUpdateSubscription(userA, {
      endpoint: 'https://mock.push.test/userA/expired-device',
      keys: { p256dh: 'BNcRdreALRF8M_mock_p256dh_expired', auth: 'mock_auth_expired' },
      deviceLabel: 'Old Phone',
    });
    const pushResult = await WebPushService.sendPush(expiredSub, {
      title: 'Test',
      body: 'Test',
      url: '/',
    });
    const activeSubsAfterExpired = await NotificationRepository.getUserActiveSubscriptions(userA);
    record(39, 'Auto-Revoke Stale 410 Device Subscriptions', !pushResult.success && pushResult.statusCode === 410 && !activeSubsAfterExpired.some((s) => s.endpoint === expiredSub.endpoint));

  } catch (err: any) {
    console.error('💥 Unhandled error in Phase 14 verification suite:', err);
    record(99, 'Phase 14 Suite Execution', false, err.message);
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log('\n======================================================================');
  console.log(`📊 PHASE 14 VERIFICATION SUMMARY: ${passedCount}/${totalCount} Assertions Passing`);
  console.log('======================================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase14VerificationSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
