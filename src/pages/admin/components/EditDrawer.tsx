import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FaTimes, FaPlus } from "react-icons/fa";

type Tab =
  | "users"
  | "students"
  | "teachers"
  | "parents"
  | "admins"
  | "classes"
  | "organizations"
  | "grades"
  | "scores"
  | "history"
  | "app_version";

interface EditDrawerProps {
  activeTab: Tab;
  editingRow: any;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  accentColor: string;

  // Edit states & setters
  editFirstName: string;
  setEditFirstName: (v: string) => void;
  editLastName: string;
  setEditLastName: (v: string) => void;
  editEmail: string;
  setEditEmail: (v: string) => void;
  editGrade: string;
  setEditGrade: (v: string) => void;
  editOrgId: string;
  setEditOrgId: (v: string) => void;
  editClassId: string;
  setEditClassId: (v: string) => void;
  editClassIds: string[];
  setEditClassIds: React.Dispatch<React.SetStateAction<string[]>>;
  addClassGradeFilter: string;
  setAddClassGradeFilter: (v: string) => void;
  classToAdd: string;
  setClassToAdd: (v: string) => void;
  editClassName: string;
  setEditClassName: (v: string) => void;
  editOrgName: string;
  setEditOrgName: (v: string) => void;
  editGradeName: string;
  setEditGradeName: (v: string) => void;

  // Lists
  gradesList: { id: number; name: string; organizationId?: number | null }[];
  organizations: { id: number; name: string }[];
  classesOptions: { id: number; classname: string; grade: string; organizationId?: number; gradeId?: number | null }[];
}

export const EditDrawer: React.FC<EditDrawerProps> = ({
  activeTab,
  editingRow,
  onClose,
  onSave,
  isSaving,
  accentColor,

  editFirstName,
  setEditFirstName,
  editLastName,
  setEditLastName,
  editEmail,
  setEditEmail,
  editGrade,
  setEditGrade,
  editOrgId,
  setEditOrgId,
  editClassId,
  setEditClassId,
  editClassIds,
  setEditClassIds,
  addClassGradeFilter,
  setAddClassGradeFilter,
  classToAdd,
  setClassToAdd,
  editClassName,
  setEditClassName,
  editOrgName,
  setEditOrgName,
  editGradeName,
  setEditGradeName,

  gradesList,
  organizations,
  classesOptions,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (!editingRow) return null;

  const isNew = !!editingRow.isNew;

  const resolvedRole =
    activeTab === "students"
      ? "Student"
      : activeTab === "teachers"
      ? "Teacher"
      : activeTab === "parents"
      ? "Parent"
      : activeTab === "admins"
      ? "Admin"
      : editingRow?.role;

  const isStudent = resolvedRole === "Student";
  const isTeacher = resolvedRole === "Teacher";

  const labelCls = "block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right";
  const inputCls =
    "w-full p-3 text-sm text-slate-800 border border-slate-200 outline-none bg-slate-50/50 rounded-xl focus:border-blueprimary focus:ring-4 focus:ring-blueprimary/10 transition-all text-right";
  const selectCls =
    "w-full p-3 text-sm text-slate-800 border border-slate-200 outline-none bg-slate-50/50 rounded-xl focus:border-blueprimary focus:ring-4 focus:ring-blueprimary/10 transition-all text-right appearance-none";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Slide Drawer Panel */}
      <motion.div
        initial={{ x: isRTL ? "-100%" : "100%" }}
        animate={{ x: 0 }}
        exit={{ x: isRTL ? "-100%" : "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        className={`fixed inset-y-0 z-50 w-full max-w-md bg-white shadow-2xl p-6 flex flex-col gap-6 ${
          isRTL ? "left-0" : "right-0"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <FaTimes size={18} />
          </button>
          <h2 className="text-lg font-bold text-slate-800">
            {isNew
              ? activeTab === "classes"
                ? t("admin.modal.createClass")
                : activeTab === "organizations"
                ? t("admin.modal.createOrg")
                : activeTab === "grades"
                ? t("admin.modal.createGrade")
                : t("admin.modal.createNewBtn")
              : activeTab === "classes"
              ? t("admin.modal.editClass")
              : activeTab === "organizations"
              ? t("admin.modal.editOrg")
              : activeTab === "grades"
              ? t("admin.modal.editGrade")
              : t("admin.modal.editUser")}
          </h2>
        </div>

        {/* Drawer Forms Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === "classes" ? (
            <>
              <div>
                <label className={labelCls}>{t("admin.modal.className")}</label>
                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t("admin.modal.org")}</label>
                <select
                  value={editOrgId}
                  onChange={(e) => {
                    setEditOrgId(e.target.value);
                    setEditGrade("");
                  }}
                  className={selectCls}
                >
                  <option value="">{t("admin.modal.selectOrg")}</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t("admin.modal.grade")}</label>
                <select
                  value={editGrade}
                  onChange={(e) => setEditGrade(e.target.value)}
                  disabled={!editOrgId}
                  className={`${selectCls} disabled:opacity-50`}
                >
                  <option value="">{t("admin.modal.selectGrade")}</option>
                  {gradesList
                    .filter((g) => String(g.organizationId) === editOrgId)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {t(`admin.grade.${g.name}`) !== `admin.grade.${g.name}`
                          ? t(`admin.grade.${g.name}`)
                          : g.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          ) : activeTab === "organizations" ? (
            <div>
              <label className={labelCls}>{t("admin.modal.orgName")}</label>
              <input
                type="text"
                value={editOrgName}
                onChange={(e) => setEditOrgName(e.target.value)}
                className={inputCls}
              />
            </div>
          ) : activeTab === "grades" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>{t("admin.modal.org")}</label>
                <select
                  value={editOrgId}
                  onChange={(e) => setEditOrgId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t("admin.modal.selectOrg")}</option>
                  {organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t("admin.modal.gradeName")}</label>
                <input
                  type="text"
                  value={editGradeName}
                  onChange={(e) => setEditGradeName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          ) : (
            <>
              {/* User Fields */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={labelCls}>{t("admin.modal.lastName")}</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>{t("admin.modal.firstName")}</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>{t("admin.modal.email")}</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  dir="ltr"
                  className={`${inputCls} text-left`}
                />
              </div>

              {(isStudent || isTeacher) && (
                <div>
                  <label className={labelCls}>{t("admin.modal.org")}</label>
                  <select
                    value={editOrgId}
                    onChange={(e) => {
                      setEditOrgId(e.target.value);
                      setEditClassId("");
                    }}
                    className={selectCls}
                  >
                    <option value="">{t("admin.modal.selectOrg")}</option>
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isStudent && (
                <div>
                  <label className={labelCls}>{t("admin.modal.grade")}</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className={selectCls}
                    disabled={!editOrgId}
                  >
                    <option value="">{t("admin.modal.selectGrade")}</option>
                    {gradesList
                      .filter((g) => classesOptions.some((c) => String(c.gradeId) === String(g.id)))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {t(`admin.grade.${g.name}`) !== `admin.grade.${g.name}`
                            ? t(`admin.grade.${g.name}`)
                            : g.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {isStudent && (
                <div>
                  <label className={labelCls}>{t("admin.th.class")}</label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    disabled={!editOrgId}
                    className={`${selectCls} disabled:opacity-50`}
                  >
                    <option value="">{t("admin.modal.noClass")}</option>
                    {classesOptions
                      .filter((c) => String(c.organizationId) === editOrgId && String(c.gradeId) === editGrade)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.classname}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {isTeacher && (
                <div className="flex flex-col gap-3">
                  <label className={labelCls}>{t("admin.th.class")}</label>
                  {/* Current assigned classes chips */}
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl min-h-[42px] items-center">
                    {editClassIds.length === 0 ? (
                      <span className="text-xs text-slate-400 font-medium px-2">
                        {t("admin.modal.noClassesAssigned")}
                      </span>
                    ) : (
                      editClassIds.map((id) => {
                        const c = classesOptions.find((x) => String(x.id) === id);
                        if (!c) return null;
                        const gradeLabel =
                          t(`admin.grade.${c.grade}`) !== `admin.grade.${c.grade}`
                            ? t(`admin.grade.${c.grade}`)
                            : c.grade;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            <span>
                              {c.classname} ({gradeLabel})
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditClassIds((prev) => prev.filter((x) => x !== id))}
                              className="text-indigo-400 hover:text-indigo-700 transition-colors"
                            >
                              <FaTimes size={10} />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  {/* Add Class selectors */}
                  <div className="flex flex-col gap-2 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
                    <div className="flex gap-2">
                      <select
                        value={addClassGradeFilter}
                        onChange={(e) => {
                          setAddClassGradeFilter(e.target.value);
                          setClassToAdd("");
                        }}
                        disabled={!editOrgId}
                        className={`${selectCls} text-xs py-2 px-2.5`}
                      >
                        <option value="">{t("admin.modal.allGrades")}</option>
                        {Array.from(new Set(classesOptions.map((c) => c.grade))).map((g) => (
                          <option key={g} value={g}>
                            {t(`admin.grade.${g}`) !== `admin.grade.${g}` ? t(`admin.grade.${g}`) : g}
                          </option>
                        ))}
                      </select>

                      <select
                        value={classToAdd}
                        onChange={(e) => setClassToAdd(e.target.value)}
                        disabled={!editOrgId}
                        className={`${selectCls} text-xs py-2 px-2.5`}
                      >
                        <option value="">{t("admin.modal.selectClass")}</option>
                        {classesOptions
                          .filter((c) => !addClassGradeFilter || c.grade === addClassGradeFilter)
                          .filter((c) => !editClassIds.includes(String(c.id)))
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.classname}
                            </option>
                          ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (classToAdd && !editClassIds.includes(classToAdd)) {
                          setEditClassIds((prev) => [...prev, classToAdd]);
                          setClassToAdd("");
                        }
                      }}
                      disabled={!classToAdd}
                      className="w-full py-2 text-xs font-bold text-white rounded-lg disabled:opacity-40 bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <FaPlus size={10} />
                      <span>{t("admin.modal.addClass")}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            {t("إلغاء")}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 py-3 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-all shadow-md"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 12px ${accentColor}20`,
            }}
          >
            {isSaving
              ? t("admin.modal.saving")
              : isNew
              ? t("admin.modal.createNewBtn")
              : t("admin.modal.saveBtn")}
          </button>
        </div>
      </motion.div>
    </>
  );
};
