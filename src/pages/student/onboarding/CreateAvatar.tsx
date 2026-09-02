import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { API_BASE_URL } from "../../../config/api";
import PrimaryButton from "../../../components/PrimaryButton";
import i18n from "../../../i18n";
import Step1 from "../tutorial/ProfilePicture";
import { localStore } from "../../../utils/safeStorage";

const CreateAvatar: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const isRTL = i18n.language === "ar";
  const [isSaving, setIsSaving] = useState(false);

  const handleContinue = async () => {
    const authToken = localStore.getItem("token");
    const avatarData = localStore.getJson<Record<string, unknown> | null>(
      "avatarData",
      null,
      (value): value is Record<string, unknown> =>
        typeof value === "object" && value !== null && !Array.isArray(value),
    );
    if (!authToken || !avatarData) {
      history.push("/student/avatar-ready");
      return;
    }

    setIsSaving(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/students/update-profile-image`,
        {
          profileImg: {
            avatarId: avatarData.avatarId,
            bgColor: avatarData.bgColor,
            bgPattern: avatarData.bgPattern,
            gender: avatarData.gender,
            hairColor: avatarData.hairColor,
            skinColor: avatarData.skinColor,
            tshirtColor: avatarData.tshirtColor,
          },
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      history.push("/student/avatar-ready");
    } catch (error) {
      console.error("Error saving avatar:", error);
      toast.error(t("تعذر حفظ الصورة الشخصية، حاول مرة أخرى"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full gap-3 p-4 overflow-y-auto">
      <ToastContainer position="top-center" autoClose={2500} rtl />
      <Step1 />
      <div className="w-full">
        <PrimaryButton
          style="fill"
          text={isSaving ? t("جاري الحفظ...") : t("متابعة")}
          arrow={isRTL ? "left" : "right"}
          onClick={handleContinue}
          disabled={isSaving}
        />
      </div>
    </div>
  );
};

export default CreateAvatar;
