// Generic overlay chrome, in one neutral namespace.
//
// These strings belong to the engine, not to a role: the step counter, the
// navigation buttons, the preview marker and the "not available here" note are
// identical for a learner, a Teacher and a Parent. They used to live under
// `tutorial.student.*` because the Student lane shipped first, which is how a
// Teacher card ended up announcing "خطوة 1 / 2" in the English UI once the
// lookup fell back to a raw Arabic literal (Phase 3 integration).
//
// Role content keys are untouched: only engine chrome moved here.

export const chromeCopy = {
  step: ['خطوة', 'Step'],
  next: ['التالي', 'Next'],
  previous: ['السابق', 'Back'],
  skip: ['تخطي', 'Skip'],
  later: ['لاحقًا', 'Later'],
  understood: ['فهمت', 'Understood'],
  preview: ['معاينة', 'Preview'],
  tap: ['اضغط على العنصر المضيء للمتابعة', 'Use the highlighted control to continue'],
  unavailable: [
    'هذا الدليل غير متاح هنا الآن. يمكنك قراءة الشرح والمحاولة لاحقًا.',
    'This guide is not available here right now. Read the explanation and try again later.',
  ],
} as const;

export const CHROME_KEY_PREFIX = 'guide.common.';

export const chromeKey = (name: keyof typeof chromeCopy): string =>
  `${CHROME_KEY_PREFIX}${name}`;

export const chromeTranslations = (locale: 'ar' | 'en'): Record<string, string> =>
  Object.fromEntries(
    Object.entries(chromeCopy).map(([key, values]) => [
      `${CHROME_KEY_PREFIX}${key}`,
      values[locale === 'ar' ? 0 : 1],
    ]),
  );
