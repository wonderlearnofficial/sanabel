import { GuideRegistryEntry, GuideStep, TutorialExperience } from './types';
import blue from '../../assets/resources/سنبلة زرقاء.png';
import red from '../../assets/resources/سنبلة حمراء.png';
import yellow from '../../assets/resources/سنبلة صفراء.png';
import xp from '../../assets/resources/اكس بي.png';
import water from '../../assets/resources/ماء.png';
import fertilizer from '../../assets/resources/سماد.png';
import tree from '../../assets/tree/28.png';
import trophy from '../../assets/trophy.png';
import { medalsImgs } from '../../data/Medals';
import allah from '../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الله.png';
import self from '../../assets/sanabeltype/سنابل الإحسان في العلاقة مع النفس.png';
import family from '../../assets/sanabeltype/سنابل الإحسان في العلاقة مع الأسرة والمجتمع.png';
import earth from '../../assets/sanabeltype/سنابل-الإحسان-في-العلاقة-مع-الأرض-والكون.png';

// Domain artwork is deliberately independent of the three wallets.
export const studentVisuals = {
  xp: [{ src: xp, label: 'xpLabel' }],
  balances: [{ src: blue, label: 'blue' }, { src: red, label: 'red' }, { src: yellow, label: 'yellow' }],
  domains: [{ src: allah, label: 'allah' }, { src: self, label: 'self' }, { src: family, label: 'family' }, { src: earth, label: 'earth' }],
  shop: [{ src: water, label: 'water' }, { src: fertilizer, label: 'fertilizer' }],
  tree: [{ src: tree, label: 'treeLabel' }],
  medals: [{ src: medalsImgs[0], label: 'medalsTitle' }],
  trophies: [{ src: trophy, label: 'trophiesTitle' }],
};

export const studentCopy = {
  welcomeTitle: ['أهلًا بك في سنابل', 'Welcome to Sanabel'],
  welcomeBody: ['كل عمل صالح يساعدك على التقدّم. اعتنِ بشجرتك لتنمو معك.', 'Every good deed helps you make progress. Care for your tree as you grow.'],
  startTitle: ['ابدأ بمهمة صغيرة اليوم', 'Start with a small mission today'],
  startBody: ['اختر عملًا صالحًا، ثم سجّل إنجازك بعد القيام به.', 'Choose a good deed, do it, then record your completion.'],
  schoolWelcomeBody: ['أنجز المهمة، ثم أرسلها للتأكيد. تحصل على مكافأتها بعد الموافقة.', 'Do the mission, then send it for confirmation. Its reward arrives after approval.'],
  schoolStartBody: ['افتح قائمة المهام واختر مهمة تستطيع إنجازها اليوم.', 'Open your mission list and choose something you can do today.'],
  openTitle: ['لنبدأ بمهمة', 'Let’s start a mission'],
  openBody: ['افتح مهامك اليومية من هنا.', 'Open your daily missions here.'],
  chooseTitle: ['اختر مهمة تناسب يومك', 'Choose a mission for today'],
  chooseBody: ['إن كانت قائمتك فارغة، أضف مهمة من زر الإضافة. بعد القيام بها، تابع لتسجيل إنجازك.', 'If your list is empty, use Add to choose a mission. Do it, then continue to record your completion.'],
  completeTitle: ['سجّل ما أنجزته', 'Record what you did'],
  completeBody: ['اضغط تأكيد الإنجاز وأكّد المهمة التي قمت بها. تُضاف مكافأتها مباشرةً.', 'Tap the completion control and confirm the mission you did. Its reward is added straight away.'],
  requestTitle: ['أرسل إنجازك للتأكيد', 'Send your work for confirmation'],
  requestBody: ['اضغط تأكيد الإنجاز، واختر من يؤكده، ثم أرسل الطلب. المكافأة بعد الموافقة.', 'Tap the completion control, choose who will confirm it, then send your request. The reward comes after approval.'],
  rewardTitle: ['تم تسجيل إنجازك', 'Your completion is recorded'],
  rewardBody: ['XP يسجّل تقدّمك، والسنابل أرصدة يمكنك إنفاقها في المتجر. راجع أرصدتك المحدّثة.', 'XP records your progress. Snabel are balances you can spend in the Shop. Check your updated balances.'],
  xpTitle: ['تقدّمك مع XP', 'Your progress with XP'],
  xpBody: ['مستواك يُحسب من XP. يعرض المؤشر تقدّمك نحو المستوى التالي؛ إنفاق السنابل لا ينقص XP.', 'Your level is calculated from XP. The meter shows progress toward your next level; spending Snabel does not reduce XP.'],
  xpLive: ['المستوى {{level}} · {{current}} من {{needed}} XP', 'Level {{level}} · {{current}} of {{needed}} XP'],
  xpLabel: ['XP', 'XP'],
  balancesTitle: ['سنابلك الثلاث', 'Your three Snabel balances'],
  balancesBody: ['تجمع السنابل الزرقاء والحمراء والصفراء وتستخدمها في المتجر. لكل لون رصيد مستقل.', 'Collect Blue, Red and Yellow Snabel and use them in the Shop. Each colour has its own balance.'],
  blue: ['الزرقاء', 'Blue'], red: ['الحمراء', 'Red'], yellow: ['الصفراء', 'Yellow'],
  domainsTitle: ['مجالات الإحسان الأربعة', 'Four fields of Ihsan'],
  domainsBody: ['اختر أعمال الخير في هذه العلاقات الأربع. المجالات تختلف عن أرصدة السنابل.', 'Explore good deeds across these four relationships. These fields are separate from your Snabel balances.'],
  allah: ['العلاقة مع الله', 'Allah'], self: ['العلاقة مع النفس', 'Self'],
  family: ['العلاقة مع الأسرة والمجتمع', 'Family & Society'], earth: ['العلاقة مع الأرض والكون', 'Earth & Universe'],
  shopTitle: ['ماء وسماد لشجرتك', 'Water and Fertilizer for your tree'],
  shopBody: ['اشترِ ما تحتاجه بالسنابل. راجع السعر المعروض؛ يُخصم الإجمالي من كل رصيد من الألوان الثلاثة.', 'Buy what you need with Snabel. Check the displayed price: the total is deducted from each of your three colour balances.'],
  fertilizerBody: ['السماد مع الماء يساعدانك على تنمية الشجرة. اختر الكمية وراجع الإجمالي قبل الشراء.', 'Fertilizer and Water let you grow your tree. Choose an amount and review the total before buying.'],
  water: ['ماء', 'Water'], fertilizer: ['سماد', 'Fertilizer'], treeLabel: ['شجرة الزيتون', 'Olive tree'],
  treeTitle: ['هذه شجرة زيتونك', 'This is your olive tree'],
  treeBody: ['اعتنِ بها ونمّها خطوة بخطوة.', 'Care for it and grow it step by step.'],
  growTitle: ['شجرتك جاهزة للنمو', 'Your tree is ready to grow'],
  growBody: ['لديك الماء والسماد المطلوبان. اضغط «كبّر الشجرة» لاستخدامهما وتنميتها.', 'You have the required Water and Fertilizer. Tap Grow to use them and grow your tree.'],
  challengesTitle: ['أهداف تمتد معك', 'Goals to work toward'],
  challengesBody: ['التحديات أهداف أطول. تابع تقدّمك حتى تحقق شرط التحدي وتكسب إنجازه.', 'Challenges are longer goals. Follow your progress until you meet a challenge’s requirement and earn its achievement.'],
  medalsTitle: ['أوسمة التقدّم', 'Progress medals'],
  medalsBody: ['تعكس الأوسمة المستويات التي تصل إليها مع XP. هنا ترى ما حققته وما ينتظرك.', 'Medals reflect the levels you reach through XP. See what you have earned and what lies ahead.'],
  trophiesTitle: ['جوائز إنجازاتك', 'Trophies for your achievements'],
  trophiesBody: ['ترتبط الجوائز بالتحديات. راجع تقدّم كل تحدٍ وشرط الحصول على جائزته.', 'Trophies are linked to challenges. Check each challenge’s progress and the requirement for earning its trophy.'],
  statsTitle: ['انظر إلى أعمالك', 'See your good deeds'],
  statsBody: ['تُظهر هذه الشاشة المهام المنجزة وتوزيعها على المجالات. تابع ما حققته واختر خطوتك التالية.', 'This screen shows completed missions across the fields. See what you have done and choose your next step.'],
  profileTitle: ['حسابك ومساعدتك', 'Your account and help'],
  profileBody: ['من ملفك الشخصي يمكنك تعديل بياناتك وفتح المساعدة والدليل من الإعدادات.', 'Use your profile to edit your details and open Help & Guide from Settings.'],
  pendingTitle: ['قيد الانتظار', 'Pending'],
  pendingBody: ['تم إرسال طلبك وهو ينتظر التأكيد. تُضاف المكافأة بعد الموافقة.', 'Your request was sent and is waiting for confirmation. The reward is added after approval.'],
  approvedTitle: ['تم التأكيد', 'Approved'],
  approvedBody: ['تم تأكيد إنجازك وإضافة مكافأته. يمكنك متابعة تقدّمك الآن.', 'Your work was confirmed and its reward granted. You can now check your progress.'],
  deniedTitle: ['راجع وحاول مجددًا', 'Review and try again'],
  deniedBody: ['لم يُؤكَّد الإنجاز هذه المرة. راجع المهمة ثم حاول مجددًا عندما تكون مستعدًا.', 'Your work was not confirmed this time. Review the mission and try again when you are ready.'],
  todoTitle: ['مهمة أُسندت إليك', 'A mission assigned to you'],
  todoBody: ['هذه مهمة أُسندت إليك. الإسناد لا يمنح مكافأة؛ أنجزها وأرسلها للتأكيد.', 'This mission was assigned to you. Assignment does not grant a reward; do it and send it for confirmation.'],
  leaderboardTitle: ['مكانك في لوحة الترتيب', 'Your place on the leaderboard'],
  leaderboardBody: ['هنا يظهر تقدّمك بين المشاركين بحسب XP. لكل شخص وتيرته.', 'See your progress among participants, ranked by XP. Everyone moves at their own pace.'],
  searchTitle: ['ابحث عن مشارك', 'Find a participant'],
  searchBody: ['استخدم البحث للوصول إلى الاسم الذي تبحث عنه.', 'Use search to find the name you are looking for.'],
  noApprover: ['لم يتم تعيين شخص لتأكيد إنجازاتك بعد. حاول مرة أخرى بعد اكتمال إعداد حسابك.', 'No one is assigned to confirm your work yet. Try again after your account setup is completed.'],
  helpTitle: ['المساعدة والدليل', 'Help & Guide'], topics: ['الموضوعات', 'Topics'],
  replay: ['إعادة دليل', 'Replay a guide'], account: ['الحساب والدعم', 'Account & Support'],
  accountBody: ['عدّل بياناتك من ملفك الشخصي. لاستعادة كلمة المرور، استخدم «نسيت كلمة المرور» في شاشة الدخول.', 'Edit your details from your profile. To reset your password, use Forgot Password on the login screen.'],
  supportBody: ['إذا استمرت مشكلة، دوّن ما حدث ورسالة الخطأ عند طلب المساعدة. لا تشارك كلمة مرورك.', 'If a problem continues, note what happened and the error message when asking for help. Never share your password.'],
  unavailable: ['هذا الدليل غير متاح هنا الآن. يمكنك قراءة الشرح والمحاولة لاحقًا.', 'This guide is not available here right now. Read the explanation and try again later.'],
  next: ['التالي', 'Next'], skip: ['تخطي', 'Skip'], later: ['لاحقًا', 'Later'],
  understood: ['فهمت', 'Understood'], preview: ['معاينة', 'Preview'],
  previous: ['السابق', 'Back'], stepLabel: ['خطوة', 'Step'],
  tap: ['اضغط على العنصر المضيء للمتابعة', 'Use the highlighted control to continue'],
} as const;

export const studentTranslations = (locale: 'ar' | 'en'): Record<string, string> =>
  Object.fromEntries(Object.entries(studentCopy).map(([key, text]) => [`tutorial.student.${key}`, text[locale === 'ar' ? 0 : 1]]));
const key = (name: string) => `tutorial.student.${name}`;
const step = (id: string, title: string, body: string, targetId?: string): GuideStep =>
  ({ id, titleKey: key(title), descriptionKey: key(body), targetId });
const shared: TutorialExperience[] = ['solo', 'school-student'];
const progress = '/student/progress';
const entry = (id: string, route: string, steps: GuideStep[], extras: Partial<GuideRegistryEntry> = {}): GuideRegistryEntry => ({
  id, route, steps, version: 1, bumpPolicy: 'all', experiences: shared,
  autoTrigger: { kind: 'route-enter' }, prerequisites: [], priority: 'gameplay-concept',
  replayable: true, replayTarget: { route, view: extras.view }, helpTopicId: id,
  persistence: 'seen-on-complete', ...extras,
});
const predicate = (id: string) => ({ kind: 'predicate' as const, id });
const firstMission = (school: boolean) => entry(school ? 'school-first-mission' : 'solo-first-mission', '/student/home', [
  { ...step('open', 'openTitle', 'openBody', 'daily-challenges'), advanceOn: 'interaction' },
  { ...step('choose', 'chooseTitle', 'chooseBody', 'mission-add'), advanceOn: 'interaction', advanceWhenTargetPresent: 'mission-action' },
  { ...step('act', school ? 'requestTitle' : 'completeTitle', school ? 'requestBody' : 'completeBody', 'mission-action'), advanceOn: 'interaction', successEvent: school ? 'approval-sent' : 'mission-completed' },
  step('recap', school ? 'pendingTitle' : 'rewardTitle', school ? 'pendingBody' : 'rewardBody'),
], { experiences: [school ? 'school-student' : 'solo'], bumpPolicy: 'new-users-only', priority: 'first-success', prerequisites: [predicate(school ? 'approvalRewardMode' : 'instantRewardMode')] });

export const STUDENT_GUIDES: GuideRegistryEntry[] = [
  ...([false, true] as const).map(school => entry(school ? 'school-orientation' : 'solo-orientation', '/student/home', [
    step('welcome', 'welcomeTitle', school ? 'schoolWelcomeBody' : 'welcomeBody'),
    step('start', 'startTitle', school ? 'schoolStartBody' : 'startBody'),
  ], { experiences: [school ? 'school-student' : 'solo'], priority: 'orientation', bumpPolicy: 'new-users-only', persistence: 'seen-on-any-end' })),
  firstMission(false), firstMission(true),
  entry('solo-reward-xp', progress, [step('xp', 'xpTitle', 'xpBody', 'student-xp-meter'), step('balances', 'balancesTitle', 'balancesBody')], { view: 'student.progress.level' }),
  entry('solo-domains', '/student/challenges', [step('domains', 'domainsTitle', 'domainsBody')]),
  entry('solo-shop-intro', progress, [step('water', 'shopTitle', 'shopBody', 'shop-water'), step('fertilizer', 'shopTitle', 'fertilizerBody', 'shop-fertilizer')], { view: 'student.progress.shop', prerequisites: [{ kind: 'target', id: 'shop-water' }] }),
  entry('solo-tree-intro', progress, [step('tree', 'treeTitle', 'treeBody', 'tree-canvas')], { view: 'student.progress.tree' }),
  entry('solo-tree-grow', progress, [{ ...step('grow', 'growTitle', 'growBody', 'tree-grow'), advanceOn: 'interaction', successEvent: 'tree-grown' }], { view: 'student.progress.tree', autoTrigger: predicate('canGrowTree'), prerequisites: [{ kind: 'target', id: 'tree-grow' }] }),
  entry('solo-challenges', progress, [step('challenges', 'challengesTitle', 'challengesBody', 'student-challenges')], { view: 'student.progress.trophies' }),
  entry('solo-medals', progress, [step('medals', 'medalsTitle', 'medalsBody', 'student-medals')], { view: 'student.progress.level' }),
  entry('solo-trophies', progress, [step('trophies', 'trophiesTitle', 'trophiesBody', 'student-trophies')], { view: 'student.progress.trophies' }),
  entry('solo-stats', progress, [step('stats', 'statsTitle', 'statsBody', 'student-stats')], { view: 'student.progress.stats' }),
  entry('solo-profile-link', '/student/profile', [step('profile', 'profileTitle', 'profileBody')]),
  entry('school-approval-lifecycle', '/student/challenges', [step('approved', 'approvedTitle', 'approvedBody', 'todo-approved-badge')], { experiences: ['school-student'], prerequisites: [{ kind: 'target', id: 'todo-approved-badge' }] }),
  entry('school-approval-pending', '/student/challenges', [step('pending', 'pendingTitle', 'pendingBody', 'todo-pending-badge')], { experiences: ['school-student'], prerequisites: [{ kind: 'target', id: 'todo-pending-badge' }] }),
  entry('school-approval-denied', '/student/challenges', [step('denied', 'deniedTitle', 'deniedBody', 'todo-denied-badge')], { experiences: ['school-student'], prerequisites: [{ kind: 'target', id: 'todo-denied-badge' }] }),
  entry('school-todo', '/student/challenges', [step('todo', 'todoTitle', 'todoBody', 'todo-assigned-mission')], { experiences: ['school-student'], prerequisites: [{ kind: 'target', id: 'todo-assigned-mission' }] }),
  entry('school-leaderboard', '/student/leaderboards', [step('self', 'leaderboardTitle', 'leaderboardBody', 'leaderboard-self-row'), step('search', 'searchTitle', 'searchBody', 'leaderboard-search')], { experiences: ['school-student'], prerequisites: [predicate('hasStudentClass')] }),
];

export const studentGuideVisual = (stepId: string): keyof typeof studentVisuals | undefined =>
  ({ recap: 'balances', xp: 'xp', balances: 'balances', domains: 'domains', water: 'shop', fertilizer: 'shop', tree: 'tree', medals: 'medals', trophies: 'trophies' } as Record<string, keyof typeof studentVisuals>)[stepId];
