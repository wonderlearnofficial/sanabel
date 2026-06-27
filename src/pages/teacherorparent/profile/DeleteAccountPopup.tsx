import React from "react";
import ClosePopup from "../../../icons/Profile/ClosePopup";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

interface OTPProps {
  setDeleteAccountPopup: (value: boolean) => void;
  deleteAccountPopup: boolean;
}

const DeleteAccountPopup: React.FC<OTPProps> = ({
  deleteAccountPopup,
  setDeleteAccountPopup,
}) => {
  const { t } = useTranslation();
  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-lg w-[95%] pb-4 max-w-md text-center relative flex-center flex-col gap-1">
        {/* Close Icon and Header */}
        <div className="flex w-full items-center justify-between bg-[#E6E9FF] rounded-t-xl p-3">
          <div onClick={() => setDeleteAccountPopup(false)}>
            <ClosePopup size={32} className="text-gray-600" />
          </div>
          <h2
            className="text-lg text-black font-bold "
            dir={`${i18n.language === "ar" ? "rtl" : "ltr"}`}
          >
            {t("هل تريد حذف الحساب؟")}
          </h2>
        </div>

        {/* Popup Message */}
        <p className="text-sm text-[#999999] bg-[#E6E9FF] w-full py-2">
          {t("تأكد من عدم إمكانية التراجع عن هذا الإجراء")}
        </p>

        {/* Action Buttons */}
        <div className="flex w-full justify-between px-3 gap-3 mt-5">
          <div
            className="bg-[#E6E9FF] border-[#B3B3B3] border-[1px]   text-[#B3B3B3] px-4 py-2 rounded-lg w-2/3 "
            onClick={() => setDeleteAccountPopup(false)}
          >
            {t("إلغاء")}
          </div>
          <div
            className="bg-redprimary text-white px-4 py-2 rounded-lg  w-1/3"
            onClick={() => {
              // Implement delete action here
              setDeleteAccountPopup(false);
            }}
          >
            {t("حذف")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountPopup;
