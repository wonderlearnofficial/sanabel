import { API_BASE_URL } from "../../../config/api";
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import GoBackButton from "../../../components/GoBackButton";
import GenericInput from "../../../components/GenericInput";
import PrimaryButton from "../../../components/PrimaryButton";

interface Organization {
  id: number;
  name: string;
}

interface ClassOption {
  id: number;
  classname: string;
  category: string;
}

const GRADES = ["primary", "preparatory", "secondary"];

const Toaster = () => (
  <ToastContainer
    position="top-center"
    autoClose={2000}
    hideProgressBar={false}
    newestOnTop={false}
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    theme="light"
  />
);

const StudentDetailEdit: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { studentId } = useParams<{ studentId: string }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [classId, setClassId] = useState("");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [totalCompletedTasks, setTotalCompletedTasks] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get(`${API_BASE_URL}/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 },
      })
      .then((response) => setOrganizations(response.data.data))
      .catch((error) => console.error("Error fetching organizations:", error));

    axios
      .get(`${API_BASE_URL}/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const { student, totalCompletedTasks, categoryCounts } = response.data.data;
        setFirstName(student.user?.firstName || "");
        setLastName(student.user?.lastName || "");
        setEmail(student.user?.email || "");
        setGrade(student.grade || "");
        setOrganizationId(String(student.organizationId || ""));
        setClassId(String(student.classId || ""));
        setTotalCompletedTasks(totalCompletedTasks);
        setCategoryCounts(categoryCounts);
      })
      .catch((error) => {
        console.error("Error fetching student detail:", error);
        toast.error(t("تعذر تحميل بيانات الطالب"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    if (!organizationId) {
      setClasses([]);
      return;
    }
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/admin/organizations/${organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setClasses(response.data.data.Classes || []))
      .catch((error) => console.error("Error fetching classes:", error));
  }, [organizationId]);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/students/${studentId}`,
        {
          firstName,
          lastName,
          email,
          grade,
          organizationId: Number(organizationId),
          classId: Number(classId),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(t("تم تحديث بيانات الطالب بنجاح"));
      history.push("/admin/students");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("حدث خطأ أثناء الحفظ"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE_URL}/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(t("تم حذف الطالب بنجاح"));
      history.push("/admin/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error(t("حدث خطأ أثناء حذف الطالب"));
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full gap-4 p-4 overflow-y-auto">
      <Toaster />
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <h1 className="self-center text-xl font-bold text-black" dir="ltr">
          {t("تعديل بيانات الطالب")}
        </h1>
        <GoBackButton />
      </div>

      <div className="grid w-full grid-cols-4 gap-2 p-3 bg-[#FFF8E5] rounded-xl">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-black">{totalCompletedTasks}</span>
          <span className="text-xs text-gray-500">{t("مهام مكتملة")}</span>
        </div>
        {Object.entries(categoryCounts).map(([title, count]) => (
          <div key={title} className="flex flex-col items-center">
            <span className="text-lg font-bold text-black">{count}</span>
            <span className="text-xs text-center text-gray-500">{t(title)}</span>
          </div>
        ))}
      </div>

      <GenericInput
        type="text"
        title={t("الاسم الأول")}
        placeholder={t("الاسم الأول")}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <GenericInput
        type="text"
        title={t("اسم العائلة")}
        placeholder={t("اسم العائلة")}
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <GenericInput
        type="text"
        title={t("البريد الإلكتروني")}
        placeholder={t("البريد الإلكتروني")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div className="flex flex-col justify-end w-full gap-2">
        <h1 className="text-[#121212]">{t("المرحلة الدراسية")}</h1>
        <select
          className="w-full p-3 text-black border-2 rounded-xl border-[#EAECF0]"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        >
          <option value="">{t("اختر المرحلة")}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {t(g)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col justify-end w-full gap-2">
        <h1 className="text-[#121212]">{t("المؤسسة")}</h1>
        <select
          className="w-full p-3 text-black border-2 rounded-xl border-[#EAECF0]"
          value={organizationId}
          onChange={(e) => {
            setOrganizationId(e.target.value);
            setClassId("");
          }}
        >
          <option value="">{t("اختر المؤسسة")}</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col justify-end w-full gap-2">
        <h1 className="text-[#121212]">{t("الفصل")}</h1>
        <select
          className="w-full p-3 text-black border-2 rounded-xl border-[#EAECF0] disabled:opacity-50"
          value={classId}
          disabled={!organizationId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">{t("اختر الفصل")}</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.classname} ({cls.category})
            </option>
          ))}
        </select>
      </div>

      <div className="w-full mt-2">
        <PrimaryButton
          style="fill"
          arrow="none"
          text={isLoading ? "جاري الحفظ..." : "حفظ التعديلات"}
          onClick={handleSubmit}
        />
      </div>

      {confirmDelete ? (
        <div className="flex items-center gap-2 mb-4">
          <button
            className="px-4 py-2 text-white bg-red-500 rounded-xl"
            onClick={handleDelete}
          >
            {t("تأكيد حذف الطالب")}
          </button>
          <button
            className="px-4 py-2 bg-gray-200 rounded-xl"
            onClick={() => setConfirmDelete(false)}
          >
            {t("إلغاء")}
          </button>
        </div>
      ) : (
        <button
          className="mb-4 font-medium text-red-500"
          onClick={() => setConfirmDelete(true)}
        >
          {t("حذف الطالب")}
        </button>
      )}
    </div>
  );
};

export default StudentDetailEdit;
