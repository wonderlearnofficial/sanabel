import { GuideRegistryEntry, GuideStep } from './types';

export const teacherCopy = {
  welcomeTitle: ['مرحبًا بك في سنابل', 'Welcome to Sanabel'],
  welcomeBody: ['هنا يمكنك توجيه طلابك ومتابعة تقدّمهم.', 'Guide your students and follow their progress here.'],
  startTitle: ['ابدأ بإسناد مهمة', 'Start by assigning a mission'],
  startBody: ['افتح الطلاب واختر طالبًا واحدًا لتسند إليه مهمة. الإسناد يضيف عملًا مطلوبًا ولا يمنح مكافأة.', 'Open Students and choose one student to assign a mission. Assignment gives work to do and grants no reward.'],
  openTitle: ['افتح قائمة الطلاب', 'Open your students'],
  openBody: ['ابدأ من هنا لإسناد مهمة إلى طالب من طلابك.', 'Start here to assign a mission to one of your students.'],
  selectTitle: ['اختر طالبًا واحدًا أولًا', 'Choose one student first'],
  selectBody: ['حدّد طالبًا واحدًا ثم اضغط متابعة. يمكنك البحث بالاسم للوصول إليه.', 'Select one student, then choose Continue. Search by name to find them.'],
  modeTitle: ['الإسناد يختلف عن تأكيد الإنجاز', 'Assign and Complete are different'],
  modeBody: ['«إسناد مهمة» يعطي الطالب عملًا لينجزه دون مكافأة الآن. «تسجيل مهمة مكتملة» يؤكد عملًا أنجزه بالفعل وقد يمنح مكافأته. اترك الإجراء على الإسناد في هذه الجولة.', 'Assign gives the student work to do, with no reward now. Complete records work already done and may grant its reward. Keep Assign selected for this walkthrough.'],
  chooseTitle: ['اختر المهمة', 'Choose the mission'],
  chooseBody: ['اختر المجال ثم النوع والمهمة المناسبة، وافتح التأكيد. راجع الطالب والمهمة قبل الإرسال.', 'Choose the field, type and mission, then open confirmation. Review the student and mission before sending.'],
  confirmTitle: ['راجع الإسناد وأكّده', 'Review and confirm the assignment'],
  confirmBody: ['تحقّق من الطالب والمهمة وأن الإجراء هو «إسناد مهمة»، ثم أكّد. لن تُمنح مكافأة بالإسناد.', 'Check the student, mission and Assign action, then confirm. Assignment grants no reward.'],
  assignedTitle: ['تم الإسناد', 'Assignment recorded'],
  assignedBody: ['المهمة متاحة للطالب لينجزها. لم تُمنح مكافأة بالإسناد؛ يمكنه إرسال إنجازه للتأكيد لاحقًا.', 'The mission is available for the student to do. Assignment granted no reward; the student can submit their completion for confirmation later.'],
  studentsTitle: ['طلابك', 'Your students'],
  studentsBody: ['ابحث عن الطالب ثم حدّده للإسناد. لعرض تفاصيله وتقدّمه، افتح «عرض الطلاب والفصول» من الصفحة الرئيسية واختر الطالب.', 'Search for a student and select them for assignment. To inspect their details and progress, open the students and classes view from Home and choose the student.'],
  distinctionTitle: ['ثلاثة إجراءات مختلفة', 'Three different actions'],
  distinctionBody: ['الإسناد يضيف عملًا مطلوبًا بلا مكافأة. الموافقة تؤكد إنجازًا أرسله الطالب. التسجيل المباشر يؤكد عملًا مكتملًا دون انتظار طلب منه، وقد يمنح المكافأة.', 'Assign gives work to do without a reward. Approval confirms a completion submitted by the student. Direct Complete records work already done without waiting for a request and may grant its reward.'],
  bulkTitle: ['إسناد لعدة طلاب', 'Assign to several students'],
  bulkBody: ['راجع العدد المحدّد والأسماء قبل التأكيد. يمكن للإجراء نفسه إسناد المهمة لعدة طلاب؛ الإسناد وحده لا يمنح مكافآت.', 'Review the selected count and names before confirming. One action can assign the mission to several students; assignment alone grants no rewards.'],
  pendingTitle: ['طلبات تحتاج إلى مراجعتك', 'Requests awaiting your review'],
  pendingBody: ['توجد طلبات إنجاز بانتظارك. افتح الموافقات لمراجعة الطالب والمهمة قبل اتخاذ القرار.', 'Completion requests are waiting. Open Approvals to review the student and mission before deciding.'],
  decisionTitle: ['راجع ثم وافق أو ارفض', 'Review, then approve or deny'],
  decisionBody: ['الموافقة تؤكد أن الطالب أنجز المهمة وتسجّل المكافأة. الرفض يعني أن هذا الطلب لم يُؤكّد، ويمكن للطالب مراجعته والمحاولة مجددًا. اختر القرار المناسب بعد المراجعة.', 'Approve confirms the student completed the mission and records its reward. Deny means this request is not confirmed; the student can review it and try again. Decide after reviewing the work.'],
  decidedTitle: ['تم تسجيل قرارك', 'Your decision was recorded'],
  decidedBody: ['تعرض القائمة المحدّثة الطلبات التي ما زالت بانتظار المراجعة.', 'The updated list shows requests still awaiting review.'],
  completeTitle: ['تأكيد عمل أُنجز بالفعل', 'Confirm work already done'],
  completeBody: ['استخدم التسجيل المباشر فقط عندما تكون المهمة قد أُنجزت بالفعل. راجع الأسماء والمهمة قبل التأكيد؛ قد تُسجّل المكافأة الآن.', 'Use direct Complete only when the mission has already been done. Review the names and mission before confirming; its reward may be recorded now.'],
  completedTitle: ['تم تسجيل الإنجاز', 'Completion recorded'],
  completedBody: ['سجّل الخادم الإنجاز. يعكس تقدّم الطالب النتيجة؛ لا تُمنح مكافأة ثانية لطلب مكرّر.', 'The server recorded the completion. Student progress reflects the result; a duplicate request does not grant a second reward.'],
  progressTitle: ['متابعة تقدّم الطالب', 'Follow student progress'],
  progressBody: ['افتح طالبًا من العرض للاطلاع على النظرة العامة والشجرة والجوائز والنشاط. تعكس هذه الصفحات البيانات المسجّلة، ولا تسجّل إنجازًا بمجرد فتحها.', 'Open a student from this view to inspect Overview, Tree, Trophies and Activity. These pages show recorded data; opening them does not record a completion.'],
  classesTitle: ['الفصول المتاحة لك', 'Your accessible classes'],
  classesBody: ['تظهر الفصول المرتبطة بك. اختر فصلًا لمراجعة طلابه، ثم راجع الأسماء قبل أي إسناد جماعي. لا يوسّع الدليل صلاحياتك.', 'Your connected classes appear here. Choose a class to review its students, then check the names before any batch assignment.'],
  emptyTitle: ['لم يظهر طلاب بعد', 'No students available yet'],
  emptyBody: ['سيظهر الطلاب بعد ربطهم بفصل متاح لك. تواصل مع مسؤول المدرسة لاستكمال الربط، ثم عُد للإسناد.', 'Students will appear once connected to a class you can access. Contact your school administrator to complete the connection, then return to assign a mission.'],
  noPending: ['لا توجد طلبات بانتظار المراجعة حاليًا. يمكنك قراءة الشرح والعودة عند وصول طلب.', 'There are no pending requests right now. Read the explanation and return when a request arrives.'],
  helpTitle: ['مساعدة المعلم', 'Teacher Help & Guide'],
  topics: ['الموضوعات', 'Topics'], replay: ['إعادة الدليل', 'Replay guide'],
  accountTitle: ['الحساب والدعم', 'Account & Support'],
  accountBody: ['يمكنك تغيير اللغة وكلمة المرور من إعدادات حسابك. عند طلب الدعم، وضّح المشكلة دون مشاركة كلمة المرور.', 'Change language and password in your account settings. When asking for support, describe the problem without sharing your password.'],
  unavailable: ['هذا الدليل غير متاح في الحالة الحالية. اقرأ الشرح ثم حاول لاحقًا.', 'This guide is unavailable in the current state. Read the explanation and try later.'],
} as const;
export const teacherTranslations = (locale: 'ar' | 'en'): Record<string, string> =>
  Object.fromEntries(Object.entries(teacherCopy).map(([key, values]) => [`tutorial.teacher.${key}`, values[locale === 'ar' ? 0 : 1]]));
const step = (id: string, title: keyof typeof teacherCopy, body: keyof typeof teacherCopy, targetId?: string): GuideStep =>
  ({ id, titleKey: `tutorial.teacher.${title}`, descriptionKey: `tutorial.teacher.${body}`, targetId });
const predicate = (id: string) => ({ kind: 'predicate' as const, id });
const entry = (id: string, route: string, steps: GuideStep[], extra: Partial<GuideRegistryEntry> = {}): GuideRegistryEntry => ({
  id, route, steps, version: 1, experiences: ['teacher'], bumpPolicy: 'all', priority: 'gameplay-concept',
  autoTrigger: { kind: 'route-enter' }, prerequisites: [], replayable: true, replayTarget: { route },
  helpTopicId: id, persistence: 'seen-on-complete', ...extra,
});
export const TEACHER_GUIDES: GuideRegistryEntry[] = [
  entry('teacher-orientation', '/teacher/home', [step('welcome', 'welcomeTitle', 'welcomeBody'), step('start', 'startTitle', 'startBody')], { priority: 'orientation', bumpPolicy: 'new-users-only', persistence: 'seen-on-any-end' }),
  entry('teacher-first-assignment', '/teacher/home', [
    { ...step('open', 'openTitle', 'openBody', 'teacher-students'), advanceOn: 'interaction' },
    { ...step('select', 'selectTitle', 'selectBody', 'teacher-student-checkbox'), advanceOn: 'interaction', successEvent: 'teacher-selection-ready' },
    step('mode', 'modeTitle', 'modeBody', 'teacher-action-mode'),
    { ...step('choose', 'chooseTitle', 'chooseBody', 'teacher-mission-picker'), advanceOn: 'interaction', successEvent: 'teacher-confirm-ready' },
    { ...step('confirm', 'confirmTitle', 'confirmBody', 'teacher-confirm'), advanceOn: 'interaction', successEvent: 'teacher-assigned-single' },
    step('assigned', 'assignedTitle', 'assignedBody'),
  ], { priority: 'first-success', bumpPolicy: 'new-users-only', prerequisites: [predicate('teacherHasStudents')] }),
  entry('teacher-students', '/teacher/studentslist', [step('students', 'studentsTitle', 'studentsBody', 'teacher-student-search')], { priority: 'route-tour', prerequisites: [predicate('teacherHasStudents')] }),
  entry('teacher-assign-vs-complete', '/teacher/studentslist', [step('distinction', 'distinctionTitle', 'distinctionBody', 'teacher-action-mode')], { prerequisites: [{ kind: 'target', id: 'teacher-action-mode' }] }),
  entry('teacher-bulk-assignment', '/teacher/studentslist', [step('bulk', 'bulkTitle', 'bulkBody', 'teacher-selected-count')], { autoTrigger: predicate('teacherBulkReady'), prerequisites: [{ kind: 'target', id: 'teacher-selected-count' }] }),
  entry('teacher-approval-pending', '/teacher/home', [step('pending', 'pendingTitle', 'pendingBody', 'approvals-card')], { autoTrigger: predicate('teacherHasPending') }),
  entry('teacher-approval-decision', '/approvals', [
    { ...step('decision', 'decisionTitle', 'decisionBody', 'notif-decision'), advanceOn: 'interaction', successEvent: 'teacher-decision-recorded' },
    step('decided', 'decidedTitle', 'decidedBody'),
  ], { prerequisites: [predicate('teacherHasPending'), { kind: 'target', id: 'notif-decision' }] }),
  entry('teacher-direct-complete', '/teacher/studentslist', [
    { ...step('complete', 'completeTitle', 'completeBody', 'teacher-confirm'), advanceOn: 'interaction', successEvent: 'teacher-completed' },
    step('completed', 'completedTitle', 'completedBody'),
  ], { autoTrigger: predicate('teacherCompleting'), prerequisites: [{ kind: 'target', id: 'teacher-confirm' }] }),
  entry('teacher-student-progress', '/teacher/view', [step('progress', 'progressTitle', 'progressBody', 'teacher-roster')], { prerequisites: [predicate('teacherHasStudents'), { kind: 'target', id: 'teacher-roster' }], view: 'teacher.view.students', replayTarget: { route: '/teacher/view', view: 'teacher.view.students' } }),
  entry('teacher-classes', '/teacher/classlist', [step('classes', 'classesTitle', 'classesBody', 'teacher-class-list')], { prerequisites: [predicate('teacherHasClasses')] }),
];
