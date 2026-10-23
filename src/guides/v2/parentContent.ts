import { GuideRegistryEntry, GuideStep } from './types';

const copy = {
  welcome: ['Welcome to Sanabel', 'مرحباً بك في سنابل'],
  welcomeBody: ["Follow your child's progress and support their achievements.", 'تابع تقدّم طفلك وسانده في إنجازاته.'],
  connect: ['Connect your child', 'اربط حساب طفلك'],
  connectBody: ["Connect your child to begin following their progress. Ask them for the connection code in their profile.", 'اربط حساب طفلك لتبدأ متابعة تقدّمه. اطلب منه كود الربط الموجود في ملفه الشخصي.'],
  search: ['Find your child', 'ابحث عن طفلك'],
  searchBody: ['Enter their connection code and search. Check the name before confirming the connection.', 'أدخل كود الربط ثم ابحث. تأكّد من الاسم قبل تأكيد الربط.'],
  confirm: ['Confirm the connection', 'أكّد الربط'],
  confirmBody: ['Check that this is your child, then connect. This guide continues only when the connection succeeds.', 'تأكّد أن الحساب لطفلك، ثم أكّد الربط. يستمر الدليل بعد نجاح الربط فقط.'],
  linked: ['Your child is connected', 'تم ربط حساب طفلك'],
  linkedBody: ['You can now open their progress and support their next steps.', 'يمكنك الآن متابعة تقدّمه ومساندته في خطواته القادمة.'],
  select: ["Open your child's progress", 'افتح صفحة تقدّم طفلك'],
  selectBody: ["Choose your child's card to see their progress. You do not need to connect them again.", 'اختر بطاقة طفلك للاطّلاع على تقدّمه. لا تحتاج إلى ربط حسابه مرة أخرى.'],
  progress: ["Understand your child's progress", 'تعرّف على تقدّم طفلك'],
  progressBody: ['The overview shows completed missions and XP. The Tree and Activity tabs offer other ways to follow progress. Use these to start a supportive conversation.', 'تعرض النظرة العامة المهام المكتملة ونقاط الخبرة. ويمكنك متابعة المزيد من تبويبي الشجرة والنشاط. اجعل هذه المعلومات بداية لحوار داعم.'],
  support: ['Support and approvals', 'المساندة والموافقات'],
  supportBody: ['Encourage their effort. Open Approvals to review requests addressed to you; an empty list means there is nothing to review now.', 'شجّع جهده. افتح الموافقات لمراجعة الطلبات الموجّهة إليك؛ القائمة الفارغة تعني أنه لا توجد طلبات للمراجعة الآن.'],
  approval: ['Review, then decide', 'راجع الطلب ثم اتخذ قرارك'],
  approvalBody: ['Review the child, mission and date. Approve confirms completion and records the reward under the current mission rules. Deny means this request is not confirmed this time; your child can review it and try again. Choose only after checking.', 'راجع اسم الطفل والمهمة وتاريخها. الموافقة تؤكّد الإكمال وتُسجّل المكافأة وفق قواعد المهمة الحالية. الرفض يعني عدم تأكيد هذا الطلب هذه المرة؛ ويمكن لطفلك مراجعته والمحاولة مجدداً. اختر بعد التحقّق.'],
  switch: ['Move between your children', 'تنقّل بين أبنائك'],
  switchBody: ['Each card opens that child’s progress. Return to this list to choose another child. Always check the name before reviewing progress or a request.', 'تفتح كل بطاقة صفحة تقدّم صاحبها. عُد إلى هذه القائمة لاختيار طفل آخر. تحقّق دائماً من الاسم قبل متابعة التقدّم أو مراجعة طلب.'],
  help: ['Parent Help', 'مساعدة ولي الأمر'],
  unavailable: ['This walkthrough is not available in the current state. You can read the guidance here and try again when the relevant controls are available.', 'هذا الشرح التفاعلي غير متاح في الوضع الحالي. يمكنك قراءة الإرشادات هنا والمحاولة عندما تتاح الأدوات المطلوبة.'],
  replay: ['Show me how', 'أرني الخطوات'],
  account: ['Account & Support', 'الحساب والدعم'],
  accountBody: ['Open account settings to update your details or password. For a connection problem, check the child’s code together and try again. A child already linked to another parent cannot be linked here.', 'افتح إعدادات الحساب لتحديث بياناتك أو كلمة المرور. عند تعذّر الربط، راجع الكود مع طفلك وحاول مجدداً. لا يمكن ربط طفل مرتبط بولي أمر آخر من هنا.'],
  settings: ['Account settings', 'إعدادات الحساب'],
} satisfies Record<string, [string, string]>;
export const parentTranslations = (locale: 'ar' | 'en'): Record<string, string> =>
  Object.fromEntries(Object.entries(copy).map(([key, values]) => [`tutorial.parent.${key}`, values[locale === 'en' ? 0 : 1]]));
const step = (id: string, key: keyof typeof copy, targetId?: string, extra: Partial<GuideStep> = {}): GuideStep => ({
  id, titleKey: `tutorial.parent.${key}`, descriptionKey: `tutorial.parent.${key}Body`, targetId, onMissingTarget: 'park', ...extra,
});
const guide = (id: string, route: string, predicate: string, priority: GuideRegistryEntry['priority'], steps: GuideStep[]): GuideRegistryEntry => ({
  id, version: 1, experiences: ['parent'], route, priority, steps,
  bumpPolicy: priority === 'orientation' || priority === 'first-success' ? 'new-users-only' : 'all',
  prerequisites: [{ kind: 'predicate', id: 'parentChildrenKnown' }, { kind: 'predicate', id: predicate }],
  autoTrigger: { kind: 'route-enter' }, replayable: true, replayTarget: { route }, helpTopicId: id,
  persistence: priority === 'orientation' ? 'seen-on-any-end' : 'seen-on-complete',
});
export const PARENT_GUIDES: GuideRegistryEntry[] = [
  guide('parent-orientation-empty', '/parent/home', 'noLinkedChild', 'orientation', [step('welcome', 'welcome', undefined, { onMissingTarget: 'center' }), step('connect', 'connect', 'parent-invite-cta')]),
  guide('parent-orientation-linked', '/parent/home', 'hasLinkedChild', 'orientation', [step('welcome', 'welcome', undefined, { onMissingTarget: 'center' }), step('progress', 'select', 'parent-progress-cta')]),
  guide('parent-first-link', '/parent/invite', 'noLinkedChild', 'first-success', [
    step('search', 'search', 'parent-link-form', { advanceOn: 'interaction', advanceWhenTargetPresent: 'parent-link-confirm' }),
    step('confirm', 'confirm', 'parent-link-confirm', { advanceOn: 'interaction', successEvent: 'child-linked' }),
    step('linked', 'linked', undefined, { onMissingTarget: 'center' }),
  ]),
  guide('parent-first-progress', '/parent/view', 'hasLinkedChild', 'first-success', [
    step('select', 'select', 'parent-child-list', { advanceOn: 'interaction', successEvent: 'parent-progress-opened' }),
    step('progress', 'progress', 'parent-progress-overview'),
    step('support', 'support', 'parent-support'),
  ]),
  guide('parent-child-progress', '/parent/view', 'hasLinkedChild', 'gameplay-concept', [step('progress', 'progress', 'parent-child-list')]),
  { ...guide('parent-approval-pending', '/approvals', 'hasPendingRequest', 'gameplay-concept', [
    step('decision', 'approval', 'parent-approval-request', { advanceOn: 'interaction', successEvent: 'parent-approval-decided' }),
  ]), prerequisites: [{ kind: 'predicate', id: 'hasPendingRequest' }] },
  guide('parent-child-switch', '/parent/view', 'multipleChildren', 'tip', [step('switch', 'switch', 'parent-child-switch')]),
];
