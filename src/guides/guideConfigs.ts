import { GuideConfig } from "./types";

// Copy is stored as literal Arabic strings, matching this codebase's i18n
// convention (translation keys ARE the Arabic text) — see languages/en.ts.
// Every key used below has a matching entry added to languages/en.ts and
// languages/ar.ts.
//
// Auto-start guides are intentionally one short landing note: explain the
// main job of the current page, then let the user explore the real UI.

// First-run "teach by doing" flow: welcome → tap the real missions row →
// tap the real send/complete button (the guide waits across pages until the
// button mounts) → success. XP/tree/shop/leaderboard/medals are deliberately
// NOT here — each has its own progressive guide below, shown on first visit.
export const studentHomeGuide: GuideConfig = {
  id: "student-home",
  role: "Student",
  titleKey: "جولة الصفحة الرئيسية",
  steps: [
    {
      id: "welcome",
      titleKey: "أهلًا بك! 🎉",
      descriptionKey: "لنتعلم معًا كيف تنجز أول مهمة لك.",
    },
    {
      id: "missions",
      titleKey: "مهامك اليومية",
      descriptionKey: "هنا تظهر مهامك اليومية. اضغط عليها لتبدأ.",
      targetId: "daily-challenges",
      advanceOn: "interaction",
    },
    {
      id: "request",
      titleKey: "أرسل إنجازك",
      descriptionKey:
        "عند إنهاء المهمة اضغط هنا لإرسالها إلى معلمك أو ولي أمرك.",
      targetId: "mission-action",
      advanceOn: "interaction",
    },
    {
      id: "done",
      titleKey: "تم إرسال طلبك بنجاح! 🎉",
      descriptionKey: "أحسنت! ستحصل على مكافأتك بعد الموافقة.",
    },
  ],
};

export const studentMissionPersonalGuide: GuideConfig = {
  id: "student-mission-personal",
  role: "Student",
  titleKey: "جولة إنجاز المهام",
  steps: [
    {
      id: "missions",
      titleKey: "مهامك اليومية",
      descriptionKey:
        "اختر مهمة، أنجزها، ثم اضغط تم الإنجاز لتحصل على المكافأة.",
    },
  ],
};

export const studentMissionSchoolGuide: GuideConfig = {
  id: "student-mission-school",
  role: "Student",
  titleKey: "جولة طلب الموافقة على المهام",
  steps: [
    {
      id: "missions",
      titleKey: "التحديات",
      descriptionKey:
        "ابدأ باختيار قسم واحد. بعد إنجاز المهمة أرسل طلب الموافقة.",
    },
  ],
};

export const studentXpGuide: GuideConfig = {
  id: "student-xp",
  role: "Student",
  titleKey: "جولة نقاط الخبرة",
  steps: [
    {
      id: "xp",
      titleKey: "المستوى ونقاط الخبرة",
      descriptionKey:
        "تكسب XP من المهام. عندما يزيد مستواك تفتح أوسمة ومكافآت جديدة.",
    },
  ],
};

export const studentTreeGuide: GuideConfig = {
  id: "student-tree",
  role: "Student",
  titleKey: "جولة الشجرة",
  steps: [
    {
      id: "tree",
      titleKey: "التقدم والشجرة",
      descriptionKey:
        "هنا ترى نمو الشجرة ومواردك. استخدم المتجر فقط عندما تريد رعاية الشجرة.",
    },
  ],
};

export const studentShopGuide: GuideConfig = {
  id: "student-shop",
  role: "Student",
  titleKey: "جولة المتجر",
  steps: [
    {
      id: "shop",
      titleKey: "المتجر",
      descriptionKey: "اشتر الماء أو السماد عندما تحتاجهما لرعاية الشجرة.",
    },
  ],
};

export const studentLeaderboardGuide: GuideConfig = {
  id: "student-leaderboard",
  role: "Student",
  titleKey: "جولة لوحة المتصدرين",
  steps: [
    {
      id: "leaderboard",
      titleKey: "لوحة المتصدرين",
      descriptionKey: "هنا ترى ترتيبك بين زملائك وتستخدم البحث أو الفلاتر عند الحاجة.",
    },
  ],
};

export const studentMedalGuide: GuideConfig = {
  id: "student-medal",
  role: "Student",
  titleKey: "جولة الأوسمة",
  steps: [
    {
      id: "medal",
      titleKey: "الأوسمة والمستويات",
      descriptionKey:
        "هذه الصفحة تعرض مستواك الحالي والأوسمة التي فتحتها أو اقتربت منها.",
    },
  ],
};

export const parentHomeGuide: GuideConfig = {
  id: "parent-home",
  role: "Parent",
  titleKey: "جولة الصفحة الرئيسية لولي الأمر",
  steps: [
    {
      id: "link",
      titleKey: "اربط طفلك",
      descriptionKey: "ابدأ بربط حساب طفلك باستخدام كود الدعوة الخاص به.",
      targetId: "link-child",
    },
    {
      id: "approvals",
      titleKey: "طلبات الموافقة",
      descriptionKey: "من الإشعارات تصلك طلبات إنجاز المهام لتوافق عليها.",
      targetId: "notifications-bell",
    },
  ],
};

export const teacherHomeGuide: GuideConfig = {
  id: "teacher-home",
  role: "Teacher",
  titleKey: "جولة الصفحة الرئيسية للمعلم",
  steps: [
    {
      id: "students",
      titleKey: "تابع طلابك",
      descriptionKey: "من هنا تسجل إنجازات طلابك وتتابع تقدمهم.",
      targetId: "teacher-students",
    },
    {
      id: "approvals",
      titleKey: "طلبات الموافقة",
      descriptionKey: "من الإشعارات تصلك طلبات إنجاز المهام لتوافق عليها.",
      targetId: "notifications-bell",
    },
  ],
};

export const adminHomeGuide: GuideConfig = {
  id: "admin-home",
  role: "Admin",
  titleKey: "جولة لوحة تحكم المشرف",
  steps: [
    {
      id: "tabs",
      titleKey: "إدارة المستخدمين",
      descriptionKey: "تنقّل بين الطلاب والمعلمين وأولياء الأمور من هنا.",
      targetId: "admin-tabs",
    },
    {
      id: "import",
      titleKey: "الاستيراد",
      descriptionKey: "أضف دفعة كاملة من ملف إكسل بضغطة واحدة.",
      targetId: "admin-import",
    },
  ],
};

export const ALL_GUIDES: GuideConfig[] = [
  studentHomeGuide,
  studentMissionPersonalGuide,
  studentMissionSchoolGuide,
  studentXpGuide,
  studentTreeGuide,
  studentShopGuide,
  studentLeaderboardGuide,
  studentMedalGuide,
  parentHomeGuide,
  teacherHomeGuide,
  adminHomeGuide,
];
