import { API_BASE_URL } from "../../../config/api";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import GoBackButton from "../../../components/GoBackButton";
import SearchIcon from "../../../icons/SearchIcon";
import { FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface Organization {
  id: number;
  name: string;
  type: string;
}

const ORG_TYPES = ["School", "Company", "Charity"];

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

const OrganizationsList: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchOrganizations = async () => {
    const token = localStorage.getItem("token");
    try {
      const params: Record<string, string | number> = { page, limit };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;

      const response = await axios.get(`${API_BASE_URL}/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setOrganizations(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchOrganizations, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, page]);

  const handleDelete = async (organizationId: number) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${API_BASE_URL}/admin/organizations/${organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(t("تم حذف المؤسسة بنجاح"));
      setConfirmDeleteId(null);
      fetchOrganizations();
    } catch (error: any) {
      const data = error?.response?.data;
      if (data?.studentCount !== undefined) {
        toast.error(
          `${t("لا يمكن حذف المؤسسة، تحتوي على")} ${data.studentCount} ${t("طالب")}, ${data.teacherCount} ${t("معلم")}, ${data.classCount} ${t("فصل")}`
        );
      } else {
        toast.error(t("حدث خطأ أثناء حذف المؤسسة"));
      }
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full gap-3 p-4 overflow-y-auto">
      <Toaster />
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <h1 className="self-center text-xl font-bold text-black" dir="ltr">
          {t("المدارس والمؤسسات")}
        </h1>
        <GoBackButton />
      </div>

      <div className="flex flex-row-reverse items-center justify-between w-full px-2 py-1 border-2 rounded-xl">
        <div className="w-10 h-10 bg-blueprimary rounded-xl flex-center">
          <SearchIcon className="text-white" size={20} />
        </div>
        <input
          type="text"
          placeholder={t("ابحث باسم المؤسسة") as string}
          className="w-full py-3 text-black bg-transparent outline-none drop-shadow-sm text-start"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <div className="flex w-full gap-2 overflow-x-auto">
        <button
          onClick={() => {
            setPage(1);
            setTypeFilter("");
          }}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
            typeFilter === "" ? "bg-blueprimary text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {t("الكل")}
        </button>
        {ORG_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => {
              setPage(1);
              setTypeFilter(type);
            }}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              typeFilter === type ? "bg-blueprimary text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t(type)}
          </button>
        ))}
      </div>

      <div className="flex flex-col w-full gap-2 overflow-y-auto">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="flex items-center justify-between w-full p-4 bg-white shadow-sm rounded-xl"
          >
            <div
              className="flex flex-col flex-1 cursor-pointer"
              onClick={() => history.push(`/admin/organizations/${org.id}`)}
            >
              <h2 className="font-bold text-black capitalize">{org.name}</h2>
              <p className="text-sm text-gray-500">{t(org.type)}</p>
            </div>
            {confirmDeleteId === org.id ? (
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 text-sm text-white bg-red-500 rounded-lg"
                  onClick={() => handleDelete(org.id)}
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
              <button
                className="p-2 text-red-500"
                onClick={() => setConfirmDeleteId(org.id)}
              >
                <FaTrash />
              </button>
            )}
          </div>
        ))}
        {organizations.length === 0 && (
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

      <button
        onClick={() => history.push("/admin/organizations/new")}
        className="fixed z-40 flex items-center justify-center w-14 h-14 text-white rounded-full shadow-lg bottom-24 bg-blueprimary"
      >
        <FaPlus size={20} />
      </button>
    </div>
  );
};

export default OrganizationsList;
