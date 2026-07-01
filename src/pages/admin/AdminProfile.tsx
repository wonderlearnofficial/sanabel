import React from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminNavbar from "../../components/navbar/AdminNavbar";
import Logout from "../../icons/Profile/Logout";
import { useUserContext } from "../../context/StudentUserProvider";

const AdminProfile: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { user } = useUserContext();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.setItem("keepLoggedIn", "false");
    history.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-full gap-1 pb-24 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex flex-col items-center w-full gap-2 p-6 text-white bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700">
        <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold rounded-full bg-white/20">
          {user?.firstName?.[0] ?? "A"}
        </div>
        <h1 className="text-xl font-bold">
          {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-blue-100">{user?.email}</p>
      </div>

      <div className="flex flex-col w-full gap-3 p-4">
        <div
          onClick={handleLogout}
          className="flex items-center justify-between w-full p-4 bg-white shadow-md cursor-pointer rounded-2xl"
        >
          <h2 className="text-lg font-medium text-red-500">
            {t("تسجيل الخروج")}
          </h2>
          <Logout size={25} />
        </div>
      </div>

      <AdminNavbar />
    </div>
  );
};

export default AdminProfile;
