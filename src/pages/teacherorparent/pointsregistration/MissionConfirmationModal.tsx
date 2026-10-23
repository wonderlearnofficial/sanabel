import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaSearch, FaSpinner } from "react-icons/fa";
import PrimaryButton from "../../../components/PrimaryButton";
import GetAvatar from "../../student/tutorial/GetAvatar";
import { sanabelImgs } from "../../../data/SanabelDictionary";
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";

export interface StudentData {
  id: number;
  userId: number;
  user: {
    id?: number;
    userId?: number;
    firstName: string;
    lastName?: string;
    profileImg?: any;
  };
  Class?: any;
  class?: any;
  grade?: string;
  organization?: {
    id?: number;
    name?: string;
  };
}

export interface Task {
  id?: number;
  type: string;
  title: string;
  description?: string;
  categoryId?: number;
  xp?: number;
  kind?: string;
  snabelRed?: number;
  snabelYellow?: number;
  snabelBlue?: number;
}

export interface MissionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTask: Task | null;
  selectedStudents: StudentData[];
  onRemoveStudent: (studentId: number) => void;
  action: "assign" | "complete";
  isSubmitting?: boolean;
}

/**
 * Resilient Mission Confirmation Modal.
 *
 * Designed to scale predictably from 0 to 100+ students:
 * 1. Modal height is bounded to `max-h-[min(90dvh,680px)]` with `flex-col overflow-hidden`.
 * 2. Header and mission summary are `shrink-0`.
 * 3. Selected student list is the ONLY scrollable region (`flex-1 min-h-0 overflow-y-auto`).
 * 4. Inline search appears automatically when count >= 8 students.
 * 5. Compact row design (max 56px) prevents DOM inflation.
 * 6. Action buttons are `shrink-0 sticky bottom-0` and NEVER pushed offscreen.
 * 7. Submitting state prevents duplicate clicks (idempotency).
 */
export const MissionConfirmationModal: React.FC<MissionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedTask,
  selectedStudents,
  onRemoveStudent,
  action,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return selectedStudents;
    const query = searchQuery.toLowerCase().trim();
    return selectedStudents.filter((student) => {
      const fullName = `${student.user.firstName || ""} ${student.user.lastName || ""}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [selectedStudents, searchQuery]);

  if (!isOpen || !selectedTask) return null;

  const getTaskTypeImage = (type: string) => sanabelImgs[type] || null;

  const renderResources = (task: Task) => {
    const resources = [
      { icon: blueSanabel, value: task.snabelBlue ?? 0, label: "سنبلة زرقاء" },
      { icon: redSanabel, value: task.snabelRed ?? 0, label: "سنبلة حمراء" },
      { icon: yellowSanabel, value: task.snabelYellow ?? 0, label: "سنبلة صفراء" },
      { icon: xpIcon, value: task.xp ?? 0, label: "نقاط الخبرة" },
    ];

    return (
      <div className="flex items-center gap-2 sm:gap-3">
        {resources.map((res, index) => (
          <div key={index} className="flex flex-col items-center min-w-[28px]">
            <img
              src={res.icon}
              alt={res.label}
              className="w-auto h-4 object-contain"
              loading="lazy"
            />
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              {res.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mission-confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-contain"
    >
      <div
        className="w-full max-w-md max-h-[min(90dvh,680px)] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. Fixed Header (shrink-0) ────────────────────────────────────── */}
        <header className="px-5 pt-4 pb-2 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide ${
                action === "assign"
                  ? "bg-sky-50 text-blueprimary border border-sky-200/60"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              }`}
            >
              {t(action === "assign" ? "Assign Mission" : "Register Completed Mission")}
            </span>
            <button
              type="button"
              aria-label={t("إلغاء")}
              disabled={isSubmitting}
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40"
            >
              <FaTimes size={14} />
            </button>
          </div>
          <h2
            id="mission-confirm-title"
            className="mt-1 text-lg font-bold text-slate-900 text-start"
          >
            {t("تأكيد تسجيل المهمة")}
          </h2>
        </header>

        {/* ── 2. Fixed Mission Summary Card (shrink-0) ───────────────────────── */}
        <div className="px-5 py-3 shrink-0 bg-slate-50/75 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-xl border border-slate-200/80 shadow-2xs p-1">
              {getTaskTypeImage(selectedTask.type) ? (
                <img
                  src={getTaskTypeImage(selectedTask.type)}
                  alt={selectedTask.type}
                  className="object-contain w-10 h-10"
                />
              ) : (
                <span className="text-xl">🎯</span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-start">
              <h3
                title={selectedTask.title}
                className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug break-words"
              >
                {t(selectedTask.title)}
              </h3>
              <div className="mt-1.5 flex items-center justify-start">
                {renderResources(selectedTask)}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Selected Students Heading & Search (shrink-0) ───────────────── */}
        <div className="px-5 pt-3 pb-2 shrink-0 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("الطلاب المختارين")}
            </h4>
            <span
              data-testid="selected-count-badge"
              className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200/70 tabular-nums"
            >
              {selectedStudents.length}
            </span>
          </div>

          {/* Instant filter when list has 8+ students */}
          {selectedStudents.length >= 8 && (
            <div className="relative mt-2">
              <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none text-slate-400">
                <FaSearch size={11} />
              </div>
              <input
                type="text"
                placeholder={t("ابحث في الطلاب المختارين...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 ps-8 pe-7 text-xs bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blueprimary"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label={t("مسح")}
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 end-0 flex items-center pe-2.5 text-slate-400 hover:text-slate-600"
                >
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 4. Scrollable Student List Body (flex-1 min-h-0) ───────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4 divide-y divide-slate-100">
          {selectedStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p className="text-sm font-medium">{t("لم يتم اختيار أي طالب")}</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <p className="text-sm font-medium">{t("لا يوجد طالب بهذا الاسم")}</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-xs font-semibold text-blueprimary hover:underline"
              >
                {t("مسح البحث")}
              </button>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const fullName = `${student.user.firstName} ${student.user.lastName || ""}`.trim();
              const grade = student.Class?.grade || student.class?.grade || student.grade;
              const className = student.Class?.classname || student.class?.classname;
              const organizationName = student.organization?.name;
              const subtitle = [grade ? t(grade) : null, className, organizationName]
                .filter(Boolean)
                .join(" · ") || t("لا يوجد فصل");

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 py-2 px-1 hover:bg-slate-50/60 rounded-lg transition-colors min-h-[52px]"
                >
                  <div className="flex items-center min-w-0 gap-2.5 flex-1">
                    <div className="flex-shrink-0 w-9 h-9 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                      <GetAvatar userAvatarData={student.user.profileImg} />
                    </div>
                    <div className="flex-1 min-w-0 text-start">
                      <p
                        title={fullName}
                        className="text-xs font-semibold text-slate-900 truncate"
                      >
                        {fullName}
                      </p>
                      <p
                        title={subtitle}
                        className="text-[11px] text-slate-500 truncate"
                      >
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`${t("إزالة")} ${fullName}`}
                    disabled={isSubmitting}
                    onClick={() => onRemoveStudent(student.id)}
                    className="flex items-center justify-center flex-shrink-0 w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-40"
                  >
                    <FaTimes size={11} aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ── 5. Fixed Footer (shrink-0 sticky bottom-0) ────────────────────── */}
        <footer className="p-4 shrink-0 border-t border-slate-100 bg-white flex items-center gap-3">
          <PrimaryButton
            style="stroke flex-1"
            text={t("إلغاء")}
            arrow="none"
            disabled={isSubmitting}
            onClick={onClose}
          />
          <button
            type="button"
            data-guide-id="teacher-confirm"
            disabled={isSubmitting || selectedStudents.length === 0}
            onClick={onConfirm}
            className={`flex-1 h-11 flex items-center justify-center gap-2 px-4 rounded-xl font-bold text-sm text-white transition-all ${
              selectedStudents.length === 0 || isSubmitting
                ? "bg-slate-300 cursor-not-allowed text-slate-500"
                : action === "assign"
                ? "bg-blueprimary hover:bg-blueprimary/90 shadow-sm hover:shadow"
                : "bg-green-600 hover:bg-green-700 shadow-sm hover:shadow"
            }`}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin text-sm" />
                <span>{t("جارٍ التسجيل...")}</span>
              </>
            ) : (
              <span>{t("تأكيد")}</span>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MissionConfirmationModal;
