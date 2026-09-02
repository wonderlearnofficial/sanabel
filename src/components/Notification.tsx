import NotificationIcon from "../icons/NotificationIcon";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useNotifications } from "../pages/Notifications/NotificationContext";

function Notification() {
  const { t } = useTranslation();
  const history = useHistory();
  const { unreadCount, refreshNotifications } = useNotifications();
  const role = localStorage.getItem("role");

  useEffect(() => {
    refreshNotifications();
  }, []);

  return (
    <button
      type="button"
      aria-label={`${t("الإشعارات")} (${unreadCount})`}
      data-guide-id="notifications-bell"
      className="flex-center p-2 border-2 border-[#EAECF0] rounded-xl relative cursor-pointer"
      onClick={() =>
        history.push(
          role === "Parent" || role === "Teacher"
            ? "/approvals"
            : "/notifications",
        )
      }
    >
      <NotificationIcon />
      {unreadCount > 0 && (
        <span className="absolute flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full -top-1 -right-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
export default Notification;
