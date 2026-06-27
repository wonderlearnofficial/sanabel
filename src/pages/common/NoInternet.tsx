// components/NoInternetPage.tsx
import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Globe, Frown } from "lucide-react";
import sanabelLogo from "../../assets/onboarding/logo.png";

const NoInternetPage = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  type FloatingIconProps = {
    children: React.ReactNode;
    delay?: number;
    style?: React.CSSProperties;
  };

  const FloatingIcon: React.FC<FloatingIconProps> = ({
    children,
    delay = 0,
    style = {},
  }) => (
    <div
      className={`absolute animate-bounce opacity-20`}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: "2s",
        ...style,
      }}
    >
      {children}u
    </div>
  );

  return (
    <div
      className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
      dir="rtl"
    >
      {/* Floating Background Icons */}
      <FloatingIcon delay={0} style={{ top: "10%", right: "10%" }}>
        <WifiOff className="w-16 h-16 text-blue-200 dark:text-slate-600" />
      </FloatingIcon>
      <FloatingIcon delay={0.5} style={{ top: "20%", left: "15%" }}>
        <Globe className="w-12 h-12 text-purple-200 dark:text-slate-600" />
      </FloatingIcon>
      <FloatingIcon delay={1} style={{ bottom: "20%", right: "20%" }}>
        <Wifi className="text-indigo-200 w-14 h-14 dark:text-slate-600" />
      </FloatingIcon>
      <FloatingIcon delay={1.5} style={{ bottom: "30%", left: "10%" }}>
        <WifiOff className="w-10 h-10 text-blue-200 dark:text-slate-600" />
      </FloatingIcon>

      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 animate-pulse" />
        <div
          className="absolute rounded-full -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-pink-200/20 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto text-center">
        {/* Main WiFi Icon with Animation */}
        <div className="relative mb-8">
          <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r from-red-400 to-pink-500 transition-all duration-1000 ${
                animationPhase === 0
                  ? "scale-100 opacity-100"
                  : animationPhase === 1
                  ? "scale-110 opacity-75"
                  : "scale-95 opacity-90"
              }`}
            />
            <WifiOff className="relative z-10 w-16 h-16 text-white animate-pulse" />
          </div>

          {/* Animated Signal Lines */}
          <div className="absolute -top-2 -right-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`absolute w-1 bg-red-400 rounded-full transition-all duration-500 ${
                  animationPhase === i ? "h-8 opacity-100" : "h-4 opacity-40"
                }`}
                style={{
                  right: `${i * 6}px`,
                  top: `${i * 4}px`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Sad Face Animation */}
        <div className="mb-6">
          <img src={sanabelLogo} alt="" className="w-auto h-32 m-auto" />
        </div>

        {/* Arabic Text */}
        <div className="mb-8 space-y-4">
          <h1 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white animate-fade-in">
            لا يوجد اتصال بالإنترنت
          </h1>
          <p
            className="text-lg text-gray-600 dark:text-slate-300 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            يبدو أن اتصالك بالإنترنت منقطع
          </p>
          <p
            className="text-base text-gray-500 dark:text-slate-400 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            تأكد من اتصالك وحاول مرة أخرى
          </p>
        </div>

        {/* Animated Tips */}
        <div
          className="p-6 mb-8 border bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border-white/20 animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        >
          <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-slate-200">
            نصائح للحل:
          </h3>
          <ul className="space-y-2 text-right text-gray-600 dark:text-slate-300">
            <li className="flex items-center justify-end space-x-2 space-x-reverse">
              <span>تحقق من اتصال الواي فاي</span>
              <Wifi className="w-4 h-4" />
            </li>
            <li className="flex items-center justify-end space-x-2 space-x-reverse">
              <span>أعد تشغيل جهاز التوجيه</span>
              <RefreshCw className="w-4 h-4" />
            </li>
            <li className="flex items-center justify-end space-x-2 space-x-reverse">
              <span>تحقق من البيانات المحمولة</span>
              <Globe className="w-4 h-4" />
            </li>
          </ul>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed ${
            isRefreshing ? "animate-pulse" : "animate-bounce hover:animate-none"
          }`}
          style={{ animationDuration: "2s" }}
        >
          <div className="flex items-center justify-center space-x-3 space-x-reverse">
            <RefreshCw
              className={`w-5 h-5 transition-transform duration-500 ${
                isRefreshing ? "animate-spin" : "group-hover:rotate-180"
              }`}
            />
            <span className="text-lg">
              {isRefreshing ? "جاري التحديث..." : "إعادة المحاولة"}
            </span>
          </div>

          {/* Button Glow Effect */}
          <div className="absolute inset-0 transition-opacity duration-300 opacity-0 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 group-hover:opacity-20 blur-xl" />
        </button>

        {/* Loading Dots */}
        {isRefreshing && (
          <div className="flex justify-center mt-4 space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default NoInternetPage;
