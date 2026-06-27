import React, { useState } from "react";
import { ChevronLeft, ArrowLeft } from "lucide-react";
import appLogo from "../../../assets/login/logo.png";

import { useTranslation } from "react-i18next";
import GoBackButton from "../../../components/GoBackButton";
const PrivacyPolicy = () => {
  // Use React state instead of localStorage
  const [currentLanguage, setCurrentLanguage] = useState("ar");

  const { t } = useTranslation();
  // Privacy Policy content data
  const privacyPolicyContent = [
    {
      title: t("مقدمة"),
      content: [
        t(
          "نحن ملتزمون بحماية خصوصيتك. تشرح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام تطبيقنا."
        ),
      ],
    },
    {
      title: t("المعلومات التي نجمعها"),
      content: [
        t("المعلومات الشخصية مثل الاسم والعمر والبريد الإلكتروني."),
        t("معلومات الحساب مثل اسم المستخدم وكلمة المرور."),
        t("بيانات الاستخدام مثل الأنشطة والتفاعلات داخل التطبيق."),
        t("معلومات تقنية مثل نوع الجهاز وعنوان IP لتحسين الأداء."),
      ],
    },
    {
      title: t("كيفية استخدام المعلومات"),
      content: [
        t("تقديم وتحسين خدماتنا وميزات التطبيق."),
        t("تخصيص تجربة المستخدم حسب الاحتياجات."),
        t("إرسال إشعارات مهمة حول الخدمة."),
        t("تحليل البيانات لتطوير منتجات أفضل."),
      ],
    },
    {
      title: t("مشاركة المعلومات"),
      content: [
        t("لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة."),
        t("قد نشارك المعلومات في الحالات التالية:"),
        t("بموافقتك الصريحة والمسبقة."),
        t("للامتثال للقوانين والأنظمة المعمول بها."),
        t("لحماية حقوقنا وسلامة المستخدمين."),
      ],
    },
    {
      title: t("أمان البيانات"),
      content: [
        t("نستخدم تقنيات التشفير المتقدمة لحماية بياناتك."),
        t("نطبق إجراءات أمنية صارمة للوصول إلى المعلومات."),
        t("نقوم بمراجعة وتحديث أنظمة الأمان بانتظام."),
        t("نحتفظ بالبيانات فقط للمدة اللازمة لتحقيق الأغراض المحددة."),
      ],
    },
    {
      title: t("حقوقك"),
      content: [
        t("الحق في الوصول إلى بياناتك الشخصية ومراجعتها."),
        t("الحق في تصحيح أو تحديث معلوماتك."),
        t("الحق في طلب حذف حسابك وبياناتك."),
        t("الحق في سحب موافقتك على معالجة البيانات."),
        t("الحق في تقديم شكوى إلى السلطات المختصة."),
      ],
    },
    {
      title: t("ملفات تعريف الارتباط"),
      content: [
        t("نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح."),
        t("يمكنك التحكم في إعدادات ملفات تعريف الارتباط من متصفحك."),
        t("بعض الميزات قد لا تعمل بشكل صحيح بدون ملفات تعريف الارتباط."),
      ],
    },
    {
      title: t("تحديثات السياسة"),
      content: [
        t("قد نقوم بتحديث هذه السياسة من وقت لآخر."),
        t("سيتم إشعارك بأي تغييرات مهمة عبر التطبيق أو البريد الإلكتروني."),
        t("استمرار استخدام التطبيق يعني موافقتك على السياسة المحدثة."),
      ],
    },
    {
      title: t("اتصل بنا"),
      content: [
        t("إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا."),
        t("يمكنك إرسال استفساراتك عبر البريد الإلكتروني أو من خلال التطبيق."),
        t("نحن ملتزمون بالرد على جميع الاستفسارات في أقرب وقت ممكن."),
      ],
    },
  ];

  const isRTL = currentLanguage === "en";

  return (
    <div className="flex flex-col w-full h-full p-2 bg-white overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <div className="w-12 h-12"></div>
        <h1 className="text-2xl font-bold text-black" dir="ltr">
          {t("سياسة الخصوصية")}
        </h1>
        <GoBackButton />
      </div>

      {/* Logo */}
      <img src={appLogo} alt="Logo" className="w-1/2 mx-auto my-4" />

      <div className={`flex flex-col w-full h-full gap-2 p-1 text-black`}>
        {/* Privacy Policy Sections */}
        <div className="flex flex-col flex-1 w-full overflow-y-auto">
          {privacyPolicyContent.map((section, index) => (
            <section key={index} className="mb-6">
              <h2 className="mb-3 text-lg font-bold text-blueprimary">
                {section.title}
              </h2>
              {Array.isArray(section.content) ? (
                <ul className={`space-y-2 ${isRTL ? "pr-4" : "pl-4"}`}>
                  {section.content.map((item, i) => (
                    <li
                      key={i}
                      className={`text-sm leading-relaxed flex items-start`}
                    >
                      <span
                        className={`inline-block w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2 `}
                      ></span>
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed">{section.content}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
