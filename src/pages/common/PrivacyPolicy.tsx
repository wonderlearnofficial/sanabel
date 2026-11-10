import React, { useState } from "react";
import { localStore } from "../../utils/safeStorage";

/**
 * Public privacy policy (Google Play requirement): reachable without the app or
 * a sign-in at /privacy-policy, and linked from the Play store listing.
 *
 * Keep it in step with what the app really does and with the Play Data safety
 * answers (docs/PLAY_DATA_SAFETY_DRAFT.md). If you add a data type, an SDK or a
 * third party, update this page in the same change.
 */

type Lang = "ar" | "en";

const CONTACT_EMAIL = "emohamed@wonderlearn.com.eg";
const LAST_UPDATED = { ar: "10 نوفمبر 2026", en: "10 November 2026" };

type Section = { title: string; paragraphs?: string[]; items?: string[] };

const TEXT: Record<Lang, { title: string; updated: string; intro: string; sections: Section[]; switchLang: string; deleteLink: string }> = {
  ar: {
    title: "سياسة الخصوصية لتطبيق سنابل الإحسان",
    updated: "آخر تحديث",
    intro:
      "سنابل الإحسان تطبيق تعليمي من WonderLearn (مصر) يساعد الطلاب على تعلّم القيم الإسلامية من خلال المهام والتحديات، بمتابعة المعلمين وأولياء الأمور والمدارس. توضح هذه السياسة البيانات التي نجمعها وسبب جمعها وكيف نحميها، وكيف يمكنك حذفها.",
    sections: [
      {
        title: "البيانات التي نجمعها",
        items: [
          "بيانات الحساب: الاسم الأول واسم العائلة والبريد الإلكتروني وكلمة المرور (تُحفظ مشفّرة ولا يمكن قراءتها) ونوع الحساب.",
          "بيانات ملف الطالب: تاريخ الميلاد والنوع والصورة الرمزية المختارة.",
          "بيانات الاستخدام داخل التطبيق: المهام والتحديات المنجزة والنقاط وتقدّم الشجرة وترتيب لوحة الصدارة، والربط بين الطالب ومعلمه أو ولي أمره أو مدرسته.",
          "بيانات تسجيل الدخول: وقت آخر تسجيل دخول ونوع المتصفح أو الجهاز، للأمان.",
        ],
      },
      {
        title: "الموقع وتنبيهات الصلاة",
        items: [
          "تنبيهات مواعيد الصلاة اختيارية. في تطبيق الهاتف يطلب التطبيق موقعًا تقريبيًا فقط، ويحسب مواعيد الصلاة على الجهاز نفسه، ولا يُرسل الموقع إلى خوادمنا.",
          "إذا رفضت إذن الموقع يمكنك اختيار مدينتك من قائمة بدلًا منه.",
          "على موقع الويب فقط: عند تفعيل تنبيهات الصلاة يُحفظ موقعك مع حسابك حتى يرسل الخادم التنبيهات في وقتها. يمكنك إيقاف التنبيهات في أي وقت.",
        ],
      },
      {
        title: "كيف نستخدم البيانات",
        items: [
          "تشغيل التطبيق: تسجيل الدخول، وحفظ تقدّم الطالب، وعرضه للمعلم أو ولي الأمر أو المدرسة المرتبطين به.",
          "إدارة الحساب: إرسال رموز التحقق وإعادة تعيين كلمة المرور بالبريد الإلكتروني.",
          "الأمان: منع الدخول غير المصرّح به.",
          "لا نعرض إعلانات، ولا نستخدم أدوات تحليلات أو تتبّع من جهات خارجية، ولا نبيع البيانات أبدًا.",
        ],
      },
      {
        title: "من يرى البيانات",
        items: [
          "يرى المعلم تقدّم طلاب فصله، ويرى ولي الأمر تقدّم أبنائه المرتبطين بحسابه، وترى إدارة المدرسة بيانات طلابها.",
          "نستعين بمزوّدي خدمات يعملون نيابة عنا فقط: استضافة الخوادم وقاعدة البيانات، وإرسال رسائل البريد الإلكتروني. لا يحق لهم استخدام البيانات لأي غرض آخر.",
          "تعرض صفحة مواعيد الصلاة المواعيد من خدمة AlAdhan (api.aladhan.com)، ولا يُرسل إليها إلا اسم المدينة.",
          "لا نشارك البيانات مع أي طرف آخر إلا إذا ألزمنا القانون بذلك.",
        ],
      },
      {
        title: "الأطفال",
        paragraphs: [
          "يستخدم الطلاب، ومنهم أطفال، التطبيق عادةً من خلال مدرستهم أو ولي أمرهم. نجمع من الطالب أقل قدر من البيانات يلزم لتشغيل التطبيق، ولا نعرض له إعلانات. يمكن لولي الأمر طلب الاطلاع على بيانات طفله أو حذفها بالتواصل معنا.",
        ],
      },
      {
        title: "حماية البيانات",
        items: [
          "تنتقل جميع البيانات بين التطبيق وخوادمنا مشفّرة عبر HTTPS.",
          "تُحفظ كلمات المرور مشفّرة (hashed).",
          "يقتصر الوصول إلى البيانات على من يحتاجه حسب دوره.",
        ],
      },
      {
        title: "مدة الاحتفاظ والحذف",
        items: [
          "نحتفظ ببيانات الحساب ما دام الحساب موجودًا.",
          "يمكنك طلب حذف حسابك وبياناته في أي وقت من صفحة حذف الحساب أو من داخل التطبيق. بعد الحذف نحتفظ فقط بسجل إداري بأن الحساب حُذف ومتى، للأمان والتدقيق.",
        ],
      },
      {
        title: "حقوقك",
        items: [
          "الاطلاع على بياناتك وطلب نسخة منها.",
          "تصحيح بياناتك أو تحديثها.",
          "حذف حسابك وبياناتك.",
          "إيقاف تنبيهات الصلاة وإلغاء إذن الموقع أو الإشعارات من إعدادات الجهاز.",
        ],
      },
      {
        title: "التغييرات على هذه السياسة",
        paragraphs: ["إذا غيّرنا هذه السياسة نحدّث تاريخ «آخر تحديث» أعلاه، ونخبرك داخل التطبيق إذا كان التغيير مهمًا."],
      },
      {
        title: "تواصل معنا",
        paragraphs: [`لأي سؤال عن الخصوصية أو لطلب يخص بياناتك، راسلنا على ${CONTACT_EMAIL}.`],
      },
    ],
    switchLang: "English",
    deleteLink: "صفحة حذف الحساب",
  },
  en: {
    title: "Sanabel Al Ehsan privacy policy",
    updated: "Last updated",
    intro:
      "Sanabel Al Ehsan is an educational app by WonderLearn (Egypt) that helps students learn Islamic values through missions and challenges, followed by their teachers, parents and schools. This policy explains what data we collect, why, how we protect it, and how you can delete it.",
    sections: [
      {
        title: "Data we collect",
        items: [
          "Account details: first and last name, email address, password (stored hashed, so it cannot be read) and account type.",
          "Student profile: date of birth, gender and the chosen avatar.",
          "Activity in the app: completed missions and challenges, points, tree progress and leaderboard position, and the links between a student and their teacher, parent or school.",
          "Sign-in details: the time of the last sign-in and the browser or device type, for security.",
        ],
      },
      {
        title: "Location and prayer reminders",
        items: [
          "Prayer-time reminders are optional. In the phone app, the app asks only for approximate location, works out prayer times on the device itself, and does not send your location to our servers.",
          "If you decline location, you can pick your city from a list instead.",
          "On the website only: when you turn on prayer reminders, your location is saved with your account so the server can send reminders on time. You can turn reminders off at any time.",
        ],
      },
      {
        title: "How we use data",
        items: [
          "To run the app: signing in, saving a student's progress, and showing it to the teacher, parent or school linked to that student.",
          "To manage accounts: sending verification and password-reset codes by email.",
          "For security: preventing unauthorised access.",
          "We show no ads, use no third-party analytics or tracking tools, and never sell data.",
        ],
      },
      {
        title: "Who sees the data",
        items: [
          "A teacher sees the progress of students in their classes, a parent sees the children linked to their account, and a school's administrators see their own students.",
          "We use service providers that act only on our behalf: server and database hosting, and email delivery. They may not use the data for anything else.",
          "The prayer times page gets times from the AlAdhan service (api.aladhan.com), which receives only a city name.",
          "We share data with no one else unless the law requires it.",
        ],
      },
      {
        title: "Children",
        paragraphs: [
          "Students, including children, usually use the app through their school or a parent. We collect only the student data the app needs to work, and show students no ads. A parent can ask to see or delete their child's data by contacting us.",
        ],
      },
      {
        title: "How we protect data",
        items: [
          "All data between the app and our servers travels encrypted over HTTPS.",
          "Passwords are stored hashed.",
          "Access to data is limited to the people whose role needs it.",
        ],
      },
      {
        title: "Retention and deletion",
        items: [
          "We keep account data for as long as the account exists.",
          "You can ask for your account and its data to be deleted at any time, from the account deletion page or inside the app. After deletion we keep only an administrative record that the account was deleted, and when, for security and audit.",
        ],
      },
      {
        title: "Your rights",
        items: [
          "See your data and ask for a copy.",
          "Correct or update your data.",
          "Delete your account and its data.",
          "Turn off prayer reminders, and withdraw location or notification permission in your device settings.",
        ],
      },
      {
        title: "Changes to this policy",
        paragraphs: ["If we change this policy we update the \"Last updated\" date above, and tell you in the app if the change is significant."],
      },
      {
        title: "Contact us",
        paragraphs: [`For any privacy question or a request about your data, email ${CONTACT_EMAIL}.`],
      },
    ],
    switchLang: "العربية",
    deleteLink: "Account deletion page",
  },
};

const PrivacyPolicy: React.FC = () => {
  const initialLang: Lang = (() => {
    const saved = localStore.getItem("language") || localStore.getItem("i18nextLng") || navigator.language;
    return saved?.toLowerCase().startsWith("en") ? "en" : "ar";
  })();
  const [lang, setLang] = useState<Lang>(initialLang);
  const tx = TEXT[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="h-full w-full overflow-y-auto bg-white">
      <main dir={dir} lang={lang} className="mx-auto w-full max-w-2xl px-4 py-6 text-black">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{tx.title}</h1>
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-1 text-sm"
          >
            {tx.switchLang}
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          {tx.updated}: {LAST_UPDATED[lang]}
        </p>

        <p className="mb-6 text-base leading-7">{tx.intro}</p>

        {tx.sections.map((section) => (
          <section key={section.title} className="mb-5">
            <h2 className="mb-2 text-lg font-bold">{section.title}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="leading-7">
                {p}
              </p>
            ))}
            {section.items && (
              <ul className="list-disc space-y-1 ps-5 leading-7">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="mt-6 leading-7">
          <a href="/delete-account" className="font-semibold text-blue-700 underline">
            {tx.deleteLink}
          </a>
          {" · "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-blue-700 underline" dir="ltr">
            {CONTACT_EMAIL}
          </a>
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
