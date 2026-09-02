import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCopy, FaCheck } from "react-icons/fa";

interface CreateWizardProps {
  open: boolean;
  onClose: () => void;
  onCreate: (userData: any) => Promise<void>;
  isCreating: boolean;
  createdCredentials: { email: string; password: string } | null;
  onDone: () => void;
  accentColor: string;

  // Option lists
  gradesList: { id: number; name: string }[];
  organizations: { id: number; name: string }[];
  classes: { id: number; classname: string; grade: string; organizationId?: number; gradeId?: number | null }[];
  fetchClassesForOrg: (orgId: string) => Promise<void>;
  /** School id a scoped admin is locked to; null for super admins. */
  scopedOrganizationId?: number | null;
}

export const CreateWizard: React.FC<CreateWizardProps> = ({
  open,
  onClose,
  onCreate,
  isCreating,
  createdCredentials,
  onDone,
  accentColor,
  gradesList,
  organizations,
  classes,
  fetchClassesForOrg,
  scopedOrganizationId = null,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // School admins cannot create admin accounts (the server rejects it too)
  const availableRoles =
    scopedOrganizationId !== null
      ? (["Student", "Teacher", "Parent"] as const)
      : (["Student", "Teacher", "Parent", "Admin"] as const);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"Student" | "Teacher" | "Parent" | "Admin">("Student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [orgId, setOrgId] = useState(
    scopedOrganizationId !== null ? String(scopedOrganizationId) : "",
  );
  const [classId, setClassId] = useState("");
  const [classIds, setClassIds] = useState<string[]>([]);
  const [addTeacherClassGradeFilter, setAddTeacherClassGradeFilter] = useState("");
  const [teacherClassToAdd, setTeacherClassToAdd] = useState("");

  // A scoped admin's school is fixed: preselect it and load its classes so
  // the school step needs no interaction.
  useEffect(() => {
    if (!open || scopedOrganizationId === null) return;
    const locked = String(scopedOrganizationId);
    setOrgId(locked);
    fetchClassesForOrg(locked);
  }, [open, scopedOrganizationId, fetchClassesForOrg]);

  if (!open) return null;

  const handleOrgChange = async (val: string) => {
    setOrgId(val);
    setClassId("");
    setClassIds([]);
    if (val) {
      await fetchClassesForOrg(val);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!firstName || !email) {
        return; // Validation fails
      }
      if (role === "Parent" || role === "Admin") {
        // Direct Submit
        handleSubmit();
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      if (!orgId) return; // Validation fails
      setStep(4);
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    await onCreate({
      role,
      firstName,
      lastName,
      email,
      organizationId: orgId ? Number(orgId) : undefined,
      gradeId: gradeId ? Number(gradeId) : undefined,
      classId: role === "Student" && classId ? Number(classId) : undefined,
      classIds: role === "Teacher" ? classIds.map(Number) : undefined,
    });
  };

  const resetForm = () => {
    setStep(1);
    setRole("Student");
    setFirstName("");
    setLastName("");
    setEmail("");
    setGradeId("");
    setOrgId("");
    setClassId("");
    setClassIds([]);
    onDone();
  };

  const totalSteps = role === "Parent" || role === "Admin" ? 2 : 4;

  const labelCls = "block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right";
  const inputCls =
    "w-full p-3 text-sm text-slate-800 border border-slate-200 outline-none bg-slate-50/50 rounded-xl focus:border-blueprimary focus:ring-4 focus:ring-blueprimary/10 transition-all text-right";
  const selectCls =
    "w-full p-3 text-sm text-slate-800 border border-slate-200 outline-none bg-slate-50/50 rounded-xl focus:border-blueprimary focus:ring-4 focus:ring-blueprimary/10 transition-all text-right appearance-none";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !createdCredentials && onClose()}
    >
      <motion.div
        className="relative bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col gap-5 max-h-[90vh] max-h-[90dvh] overflow-y-auto"
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {createdCredentials ? (
          /* SUCCESS SCREEN */
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl text-white shadow-lg shadow-emerald-500/20"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              <FaCheck size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t("admin.created.title")}</h3>
            <div className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl text-right flex flex-col gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("admin.created.email")}
                </span>
                <p className="font-semibold text-slate-700 mt-0.5 text-left font-mono text-sm">
                  {createdCredentials.email}
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdCredentials.password);
                    // show copied alert
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FaCopy size={14} />
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("admin.created.tempPassword")}
                  </span>
                  <p className="font-mono text-lg font-bold text-slate-800 mt-0.5">
                    {createdCredentials.password}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed px-4">
              {t("admin.created.shareNote")}
            </p>
            <button
              onClick={resetForm}
              className="w-full py-3.5 font-bold text-white rounded-2xl hover:opacity-95 transition-all text-sm"
              style={{ backgroundColor: accentColor }}
            >
              {t("admin.created.done")}
            </button>
          </div>
        ) : (
          /* WIZARD FLOW */
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FaTimes size={16} />
              </button>
              <h3 className="text-base font-bold text-slate-800">{t("admin.modal.createUser")}</h3>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
              <span className="text-slate-500 font-bold">
                {t("الخطوة")} {step} {t("من")} {totalSteps}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <span
                    key={idx}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: step === idx + 1 ? "24px" : "6px",
                      backgroundColor: step >= idx + 1 ? accentColor : "#e2e8f0",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step Body */}
            <div className="flex-1 min-h-[180px]">
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <label className={labelCls}>{t("admin.modal.accountType")}</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {availableRoles.map((roleVal) => (
                      <button
                        key={roleVal}
                        onClick={() => setRole(roleVal)}
                        className={`py-4 px-4 text-xs font-bold rounded-2xl border transition-all ${
                          role === roleVal
                            ? "text-white border-transparent"
                            : "text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                        style={{
                          backgroundColor: role === roleVal ? accentColor : undefined,
                          boxShadow: role === roleVal ? `0 4px 12px ${accentColor}25` : undefined,
                        }}
                      >
                        {t(`admin.role.${roleVal}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className={labelCls}>{t("admin.modal.lastName")}</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={labelCls}>{t("admin.modal.firstName")}</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{t("admin.modal.email")}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputCls} text-left`}
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelCls}>{t("admin.modal.org")}</label>
                    <select
                      value={orgId}
                      onChange={(e) => handleOrgChange(e.target.value)}
                      className={selectCls}
                      disabled={scopedOrganizationId !== null}
                    >
                      <option value="">{t("admin.modal.selectOrg")}</option>
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {role === "Student" && (
                    <div>
                      <label className={labelCls}>{t("admin.modal.grade")}</label>
                      <select
                        value={gradeId}
                        onChange={(e) => setGradeId(e.target.value)}
                        className={selectCls}
                        disabled={!orgId}
                      >
                        <option value="">{t("admin.modal.selectGrade")}</option>
                        {gradesList
                          .filter((g) => classes.some((c) => String(c.gradeId) === String(g.id)))
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
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-4">
                  {role === "Student" ? (
                    <div>
                      <label className={labelCls}>{t("admin.modal.class")}</label>
                      <select
                        value={classId}
                        onChange={(e) => setClassId(e.target.value)}
                        disabled={!orgId}
                        className={`${selectCls} disabled:opacity-50`}
                      >
                        <option value="">{t("admin.modal.selectClass")}</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.classname} ({
                              t(`admin.grade.${c.grade}`) !== `admin.grade.${c.grade}`
                                ? t(`admin.grade.${c.grade}`)
                                : c.grade
                            })
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    /* Teacher class multi-select assignment */
                    <div className="flex flex-col gap-3">
                      <label className={labelCls}>{t("admin.th.class")}</label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl min-h-[42px] items-center">
                        {classIds.length === 0 ? (
                          <span className="text-xs text-slate-400 font-medium px-2">
                            {t("admin.modal.noClassesAssigned")}
                          </span>
                        ) : (
                          classIds.map((id) => {
                            const c = classes.find((x) => String(x.id) === id);
                            if (!c) return null;
                            const gradeLabel =
                              t(`admin.grade.${c.grade}`) !== `admin.grade.${c.grade}`
                                ? t(`admin.grade.${c.grade}`)
                                : c.grade;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                <span>
                                  {c.classname} ({gradeLabel})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setClassIds((prev) => prev.filter((x) => x !== id))}
                                  className="text-indigo-400 hover:text-indigo-700 transition-colors"
                                >
                                  <FaTimes size={10} />
                                </button>
                              </span>
                            );
                          })
                        )}
                      </div>

                      <div className="flex gap-2">
                        <select
                          value={addTeacherClassGradeFilter}
                          onChange={(e) => {
                            setAddTeacherClassGradeFilter(e.target.value);
                            setTeacherClassToAdd("");
                          }}
                          disabled={!orgId}
                          className={`${selectCls} text-xs py-2 px-2.5`}
                        >
                          <option value="">{t("admin.modal.allGrades")}</option>
                          {Array.from(new Set(classes.map((c) => c.grade))).map((g) => (
                            <option key={g} value={g}>
                              {t(`admin.grade.${g}`) !== `admin.grade.${g}` ? t(`admin.grade.${g}`) : g}
                            </option>
                          ))}
                        </select>

                        <select
                          value={teacherClassToAdd}
                          onChange={(e) => setTeacherClassToAdd(e.target.value)}
                          disabled={!orgId}
                          className={`${selectCls} text-xs py-2 px-2.5`}
                        >
                          <option value="">{t("admin.modal.selectClass")}</option>
                          {classes
                            .filter((c) => !addTeacherClassGradeFilter || c.grade === addTeacherClassGradeFilter)
                            .filter((c) => !classIds.includes(String(c.id)))
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
                          if (teacherClassToAdd && !classIds.includes(teacherClassToAdd)) {
                            setClassIds((prev) => [...prev, teacherClassToAdd]);
                            setTeacherClassToAdd("");
                          }
                        }}
                        disabled={!teacherClassToAdd}
                        className="py-2 text-xs font-bold text-white rounded-lg disabled:opacity-40 bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <span>{t("admin.modal.addClass")}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                >
                  {t("السابق")}
                </button>
              )}
              {step < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={(step === 2 && (!firstName || !email)) || (step === 3 && !orgId)}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-blueprimary hover:opacity-95 rounded-xl transition-colors shadow-md disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {t("التالي")}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isCreating}
                  className="flex-1 py-3 text-sm font-bold text-white bg-blueprimary hover:opacity-95 rounded-xl transition-colors shadow-md disabled:opacity-50"
                  style={{ backgroundColor: accentColor }}
                >
                  {isCreating ? t("admin.modal.creating") : t("admin.modal.createBtn")}
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
