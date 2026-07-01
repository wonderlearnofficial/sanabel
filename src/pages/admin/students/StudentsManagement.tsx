import { API_BASE_URL } from "../../../config/api";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import GoBackButton from "../../../components/GoBackButton";
import SearchIcon from "../../../icons/SearchIcon";
import GetAvatar from "../../student/tutorial/GetAvatar";
import { FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";

interface StudentRow {
  id: number;
  grade: string;
  user: { firstName: string; lastName: string; email: string; profileImg: any };
  Class?: { id: number; classname: string; category: string } | null;
  organization?: { id: number; name: string } | null;
}

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
    autoClose={2500}
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

const StudentsManagement: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [classId, setClassId] = useState("");
  const [grade, setGrade] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 },
      })
      .then((response) => setOrganizations(response.data.data))
      .catch((error) => console.error("Error fetching organizations:", error));
  }, []);

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

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (organizationId) params.organizationId = organizationId;
      if (classId) params.classId = classId;
      if (grade) params.grade = grade;

      const response = await axios.get(`${API_BASE_URL}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setStudents(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, organizationId, classId, grade, page]);

  const handleDelete = async (studentId: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE_URL}/admin/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(t("تم حذف الطالب بنجاح"));
      setConfirmDeleteId(null);
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error(t("حدث خطأ أثناء حذف الطالب"));
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full gap-3 p-4 overflow-y-auto">
      <Toaster />
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <h1 className="self-center text-xl font-bold text-black" dir="ltr">
          {t("الطلاب")}
        </h1>
        <GoBackButton />
      </div>

      <div className="flex flex-row-reverse items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
        <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center">
          <SearchIcon className="text-white" size={20} />
        </div>
        <input
          type="text"
          placeholder={t("ابحث عن طالب") as string}
          className="w-full py-3 text-black bg-transparent outline-none drop-shadow-sm text-start"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <select
        className="w-full p-2 text-black border-2 rounded-xl border-[#EAECF0]"
        value={organizationId}
        onChange={(e) => {
          setPage(1);
          setOrganizationId(e.target.value);
          setClassId("");
        }}
      >
        <option value="">{t("كل المؤسسات")}</option>
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>

      <div className="flex w-full gap-2">
        <select
          className="flex-1 min-w-0 p-2 text-black border-2 rounded-xl border-[#EAECF0] disabled:opacity-50"
          value={classId}
          disabled={!organizationId}
          onChange={(e) => {
            setPage(1);
            setClassId(e.target.value);
          }}
        >
          <option value="">{t("كل الفصول")}</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.classname} ({cls.category})
            </option>
          ))}
        </select>

        <select
          className="flex-1 min-w-0 p-2 text-black border-2 rounded-xl border-[#EAECF0]"
          value={grade}
          onChange={(e) => {
            setPage(1);
            setGrade(e.target.value);
          }}
        >
          <option value="">{t("كل المراحل")}</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {t(g)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col w-full gap-2 overflow-y-auto">
        {students.map((student) => (
          <div
            key={student.id}
            className="flex items-center justify-between w-full p-3 bg-white shadow-sm rounded-xl"
          >
            <div
              className="flex items-center flex-1 gap-3 cursor-pointer"
              onClick={() => history.push(`/admin/students/${student.id}`)}
            >
              <div className="w-12 h-12">
                <GetAvatar userAvatarData={student.user?.profileImg} />
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-black">
                  {student.user?.firstName} {student.user?.lastName}
                </h2>
                <p className="text-xs text-gray-500">
                  {student.organization?.name} {student.Class ? `· ${student.Class.classname}` : ""}
                </p>
              </div>
            </div>
            {confirmDeleteId === student.id ? (
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 text-sm text-white bg-red-500 rounded-lg"
                  onClick={() => handleDelete(student.id)}
                >
                  {t("تأكيد")}
                </button>
                <button
                  className="px-2 py-1 text-sm bg-gray-200 rounded-lg"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  {t("إلغاء")}
                </button>
              </div>
            ) : (
              <button className="p-2 text-red-500" onClick={() => setConfirmDeleteId(student.id)}>
                <FaTrash />
              </button>
            )}
          </div>
        ))}
        {students.length === 0 && (
          <p className="mt-4 text-center text-gray-400">{t("لا توجد نتائج")}</p>
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-center w-full gap-4 mt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 disabled:opacity-30"
          >
            <FaChevronRight />
          </button>
          <span className="text-sm text-gray-500" dir="ltr">
            {page} / {Math.max(1, Math.ceil(total / limit))}
          </span>
          <button
            disabled={page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 disabled:opacity-30"
          >
            <FaChevronLeft />
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentsManagement;
