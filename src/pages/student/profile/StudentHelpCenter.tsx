import React, { useState, useEffect } from "react";
import GoBackButton from "../../../components/GoBackButton";
import appLogo from "../../../assets/login/logo.png";
import { IoIosArrowDown } from "react-icons/io";

const HelpCenter = () => {
  const [openQuestionIndex, setOpenQuestionIndex] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [textDirection, setTextDirection] = useState("ltr");

  // Built-in translations
  const translations: any = {
    helpCenter: {
      ar: "مركز المساعدة",
      en: "Help Center",
    },
    helpCenterDescription: {
      ar: "نحن هنا لمساعدتك في الإجابة عن أي أسئلة أو مشكلات قد تواجهها أثناء استخدام تطبيقنا. يمكنك تصفح الموضوعات الشائعة أدناه، أو التواصل معنا مباشرةً للحصول على دعم شخصي.",
      en: "We're here to help you with any questions or issues you might encounter while using our application. You can browse the common topics below, or contact us directly for personalized support.",
    },
    howToResetPassword: {
      ar: "كيف أستعيد كلمة المرور الخاصة بي؟",
      en: "How do I reset my password?",
    },
    resetPasswordAnswer: {
      ar: "يمكنك استعادة كلمة المرور الخاصة بك عن طريق النقر على خيار 'نسيت كلمة المرور' في شاشة تسجيل الدخول، ثم اتباع التعليمات لإعادة تعيين كلمة المرور.",
      en: "You can reset your password by clicking on the 'Forgot Password' option on the login screen, then following the instructions to reset your password.",
    },
    howToCreateAccount: {
      ar: "كيف يمكنني إنشاء حساب جديد؟",
      en: "How do I create a new account?",
    },
    createAccountAnswer: {
      ar: "لإنشاء حساب جديد، افتح التطبيق وانقر على زر 'تسجيل'، ثم قم بإدخال البيانات المطلوبة مثل الاسم، البريد الإلكتروني، وكلمة المرور.",
      en: "To create a new account, open the application and click on the 'Sign Up' button, then enter the required information such as name, email, and password.",
    },
    howToUpdateProfile: {
      ar: "كيف يمكنني تحديث بياناتي الشخصية؟",
      en: "How do I update my personal information?",
    },
    updateProfileAnswer: {
      ar: "يمكنك تحديث بياناتك الشخصية عن طريق الذهاب إلى صفحة 'الإعدادات' داخل التطبيق، ثم تعديل المعلومات وحفظ التغييرات.",
      en: "You can update your personal information by going to the 'Settings' page within the application, then editing the information and saving the changes.",
    },
    howToContactSupport: {
      ar: "كيف يمكنني التواصل مع فريق الدعم؟",
      en: "How do I contact the support team?",
    },
    contactSupportAnswer: {
      ar: "يمكنك التواصل مع فريق الدعم من خلال قسم 'الدعم' داخل التطبيق، أو إرسال استفساراتك عبر البريد الإلكتروني الخاص بالدعم.",
      en: "You can contact the support team through the 'Support' section within the application, or send your inquiries via the support email.",
    },
    howToReportIssue: {
      ar: "كيف أبلغ عن مشكلة في التطبيق؟",
      en: "How do I report an issue with the application?",
    },
    reportIssueAnswer: {
      ar: "إذا واجهتك مشكلة، يمكنك الإبلاغ عنها من خلال قسم 'الدعم' داخل التطبيق، أو التواصل معنا عبر البريد الإلكتروني مع وصف مفصل للمشكلة.",
      en: "If you encounter an issue, you can report it through the 'Support' section within the application, or contact us via email with a detailed description of the problem.",
    },
    howToDeleteAccount: {
      ar: "هل يمكنني حذف حسابي؟",
      en: "Can I delete my account?",
    },
    deleteAccountAnswer: {
      ar: "نعم، يمكنك طلب حذف حسابك من خلال إعدادات التطبيق، أو عن طريق التواصل مع فريق الدعم لتقديم طلب حذف الحساب.",
      en: "Yes, you can request to delete your account through the application settings, or by contacting the support team to submit an account deletion request.",
    },
    privacyAndSecurity: {
      ar: "كيف تحمون بياناتي الشخصية؟",
      en: "How do you protect my personal data?",
    },
    privacySecurityAnswer: {
      ar: "نحن ملتزمون بحماية بياناتك الشخصية باستخدام أحدث تقنيات التشفير وبروتوكولات الأمان. يمكنك مراجعة سياسة الخصوصية الخاصة بنا لمزيد من التفاصيل.",
      en: "We are committed to protecting your personal data using the latest encryption technologies and security protocols. You can review our privacy policy for more details.",
    },
    troubleshooting: {
      ar: "التطبيق لا يعمل بشكل صحيح، ماذا أفعل؟",
      en: "The application is not working properly, what should I do?",
    },
    troubleshootingAnswer: {
      ar: "إذا كان التطبيق لا يعمل بشكل صحيح، جرب إعادة تشغيله أو تحديثه إلى أحدث إصدار. إذا استمرت المشكلة، تواصل مع فريق الدعم.",
      en: "If the application is not working properly, try restarting it or updating it to the latest version. If the problem persists, contact the support team.",
    },
  };

  // Translation function
  const t = (key: any) => {
    return translations[key]
      ? translations[key][currentLanguage] || translations[key]["en"]
      : key;
  };

  // Get language from localStorage and set text direction
  useEffect(() => {
    const language = localStorage.getItem("language") || "en";
    setCurrentLanguage(language);
    setTextDirection(language === "ar" ? "rtl" : "ltr");
  }, []);

  // Generic help center content data
  const helpCenterQuestions = [
    {
      question: t("howToResetPassword"),
      answer: t("resetPasswordAnswer"),
    },
    {
      question: t("howToCreateAccount"),
      answer: t("createAccountAnswer"),
    },
    {
      question: t("howToUpdateProfile"),
      answer: t("updateProfileAnswer"),
    },
    {
      question: t("howToContactSupport"),
      answer: t("contactSupportAnswer"),
    },
    {
      question: t("howToReportIssue"),
      answer: t("reportIssueAnswer"),
    },
    {
      question: t("howToDeleteAccount"),
      answer: t("deleteAccountAnswer"),
    },
    {
      question: t("privacyAndSecurity"),
      answer: t("privacySecurityAnswer"),
    },
    {
      question: t("troubleshooting"),
      answer: t("troubleshootingAnswer"),
    },
  ];

  const toggleQuestion = (index: any) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  };

  return (
    <div
      className="flex flex-col w-full h-full gap-2 p-4 text-black  overflow-y-auto"
      dir={textDirection}
    >
      {/* Header Section */}
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <div className="w-12 h-12"></div>
        <h1 className="text-2xl font-bold text-black">{t("helpCenter")}</h1>
        <GoBackButton />
      </div>

      {/* Logo */}
      <img
        src={appLogo}
        alt="Help Center Logo"
        className="w-1/2 mx-auto my-4 max-w-48"
      />

      <p className={`text-[#666] text-sm mb-4`}>{t("helpCenterDescription")}</p>

      {/* Help Center Sections */}
      <div className="flex flex-col w-full overflow-y-auto h-2/3">
        <div className="">
          {helpCenterQuestions.map((section, index) => (
            <section
              key={index}
              className="mb-4 border-gray-300 border-b-[1px]"
            >
              <h2
                className="flex items-center justify-between w-full py-2 mb-2 font-bold cursor-pointer text-blueprimary text-md"
                onClick={() => toggleQuestion(index)}
              >
                <span className="flex-1">{section.question}</span>
                <IoIosArrowDown
                  className={`text-blue-600 transition-transform duration-200 ${
                    textDirection === "rtl" ? "mr-2" : "ml-2"
                  } ${openQuestionIndex === index ? "rotate-180" : "rotate-0"}`}
                />
              </h2>
              {openQuestionIndex === index && (
                <div className="pb-3 mt-2 text-sm leading-6 text-black">
                  {section.answer}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
