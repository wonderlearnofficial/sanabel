import NotificationIcon from "../icons/NotificationIcon";

import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

function Notification() {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <div
      className="flex-center p-2 border-2 border-[#EAECF0] rounded-xl relative"
      onClick={() => history.push("/notifications")}
    >
      <NotificationIcon />
      <div className="w-2 h-2 rounded-full bg-red-500 absolute right-1 top-1"></div>
    </div>
  );
}
export default Notification;
