import { API_BASE_URL } from "../../../config/api";
import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { describeApiError } from "../../../utils/apiError";
import GoBackButton from "../../../components/GoBackButton";
import GenericInput from "../../../components/GenericInput";
import PrimaryButton from "../../../components/PrimaryButton";

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

const OrganizationForm: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { organizationId } = useParams<{ organizationId: string }>();
  const isNew = !organizationId || organizationId === "new";

  const [name, setName] = useState("");
  const [img, setImg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isNew) return;

    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE_URL}/admin/organizations/${organizationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const org = response.data.data;
        setName(org.name);
        setImg(org.img || "");
      })
      .catch((error) => {
        console.error("Error fetching organization:", error);
        toast.error(t("تعذر تحميل بيانات المدرسة"));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("اسم المدرسة مطلوب"));
      return;
    }

    const token = localStorage.getItem("token");
    setIsLoading(true);

    try {
      if (isNew) {
        await axios.post(
          `${API_BASE_URL}/admin/organizations`,
          { name, img: img || undefined },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success(t("تم إنشاء المدرسة بنجاح"));
      } else {
        await axios.patch(
          `${API_BASE_URL}/admin/organizations/${organizationId}`,
          { name, img: img || undefined },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        toast.success(t("تم تحديث المدرسة بنجاح"));
      }
      history.push("/admin/organizations");
    } catch (error: any) {
      toast.error(describeApiError(error, (key, options) => t(key, options)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full gap-5 p-4 overflow-y-auto">
      <Toaster />
      <div className="flex flex-row-reverse items-center justify-between w-full">
        <h1 className="self-center text-xl font-bold text-black" dir="ltr">
          {isNew ? t("إضافة مدرسة") : t("تعديل المدرسة")}
        </h1>
        <GoBackButton />
      </div>

      <GenericInput
        type="text"
        title={t("اسم المدرسة")}
        placeholder={t("اسم المدرسة")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <GenericInput
        type="text"
        title={t("رابط الصورة (اختياري)")}
        placeholder="https://..."
        value={img}
        onChange={(e) => setImg(e.target.value)}
      />

      <div className="w-full mt-auto">
        <PrimaryButton
          style="fill"
          arrow="none"
          text={isLoading ? "جاري الحفظ..." : "حفظ"}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
};

export default OrganizationForm;
