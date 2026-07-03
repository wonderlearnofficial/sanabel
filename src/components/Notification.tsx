import NotificationIcon from "../icons/NotificationIcon";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useNotifications } from "../pages/Notifications/NotificationContext";

function Notification() {
  const { t } = useTranslation();
  const history = useHistory();
  const { unreadCount } = useNotifications();

  return (
    <div
      className="flex-center p-2 border-2 border-[#EAECF0] rounded-xl relative cursor-pointer"
      onClick={() => history.push("/notifications")}
    >
      <NotificationIcon />
      {unreadCount > 0 && (
        <div className="w-2 h-2 rounded-full bg-red-500 absolute right-1 top-1"></div>
      )}
    </div>
  );
}
export default Notification;
