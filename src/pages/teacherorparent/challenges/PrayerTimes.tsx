import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import GoBackButton from "../../../components/GoBackButton";

import Fajr from "../../../icons/prayertimes/Fajr";
import Shrouk from "../../../icons/prayertimes/Shrouk";
import Duhr from "../../../icons/prayertimes/Dhur";
import Asr from "../../../icons/prayertimes/Asr";
import Maghrib from "../../../icons/prayertimes/Maghrib";
import Asha from "../../../icons/prayertimes/Isha";

import Tickcircle from "../../../icons/Sanabel/Tickcircle";

import Loading from "../../../components/Loading";

// Fetch prayer times using a sample API
const fetchPrayerTimes = async (city: string) => {
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Egypt`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch prayer times: ${response.status}`);
    }
    const data = await response.json();
    return data.data.timings;
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    // Return empty object or default times in case of error
    return {};
  }
};

// Format time to AM/PM format
const formatTimeToAMPM = (time: string) => {
  const [hour, minute] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hour, 10));
  date.setMinutes(parseInt(minute, 10));
  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

const isCurrentPrayer = (
  currentTime: Date,
  startTime: string,
  endTime: string
) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = new Date(currentTime);
  const end = new Date(currentTime);

  start.setHours(startHour, startMinute, 0);
  end.setHours(endHour, endMinute, 0);

  return currentTime >= start && currentTime < end;
};

interface PrayerTimesProps {
  location: string;
}

// Update city names to be compatible with the API
const cityMapping: Record<string, string> = {
  القاهرة: "Cairo",
  الإسكندرية: "Alexandria",
  طنطا: "Tanta",
  أسيوط: "Asyut",
  المنصورة: "Mansoura",
};

const SanabelPrayer: React.FC<PrayerTimesProps> = ({ location }) => {
  const { index } = useParams<{ index: string }>();
  const { t } = useTranslation();

  const [prayerTimes, setPrayerTimes] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPrayerTimes = async () => {
      setLoading(true);
      // Map the Arabic city name to English for the API
      const cityForApi = cityMapping[location] || "Cairo"; // Default to Cairo if not found
      const timings = await fetchPrayerTimes(cityForApi);
      setPrayerTimes(timings);
      setLoading(false);
    };
    getPrayerTimes();
  }, [location]);

  const currentTime = new Date();

  const SanabelPrayerData = [
    {
      title: "الفجر",
      icon: <Fajr size={30} />,
      time: prayerTimes.Fajr ? formatTimeToAMPM(prayerTimes.Fajr) : "",
      startTime: prayerTimes.Fajr,
      endTime: prayerTimes.Sunrise,

      comment: "لقد قام باداء الفجر في مسجد المدرسة",
    },
    {
      title: "الشروق",
      icon: <Shrouk size={30} />,
      time: prayerTimes.Sunrise ? formatTimeToAMPM(prayerTimes.Sunrise) : "",
      startTime: prayerTimes.Sunrise,
      endTime: prayerTimes.Dhuhr,
    },
    {
      title: "الظهر",
      icon: <Duhr size={30} />,
      time: prayerTimes.Dhuhr ? formatTimeToAMPM(prayerTimes.Dhuhr) : "",
      startTime: prayerTimes.Dhuhr,
      endTime: prayerTimes.Asr,
    },
    {
      title: "العصر",
      icon: <Asr size={30} />,
      time: prayerTimes.Asr ? formatTimeToAMPM(prayerTimes.Asr) : "",
      startTime: prayerTimes.Asr,
      endTime: prayerTimes.Maghrib,
    },
    {
      title: "المغرب",
      icon: <Maghrib size={30} />,
      time: prayerTimes.Maghrib ? formatTimeToAMPM(prayerTimes.Maghrib) : "",
      startTime: prayerTimes.Maghrib,
      endTime: prayerTimes.Isha,
    },
    {
      title: "العشاء",
      icon: <Asha size={30} />,
      time: prayerTimes.Isha ? formatTimeToAMPM(prayerTimes.Isha) : "",
      startTime: prayerTimes.Isha,
      endTime: "23:59",
    },
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex items-center justify-between w-full gap-1 p-2 ">
      {SanabelPrayerData.map((prayer, index) => (
        <div
          key={index}
          className={`flex-center w-2/12 flex-col 
         rounded-xl p-2 gap-1 ${
           isCurrentPrayer(currentTime, prayer.startTime, prayer.endTime)
             ? "bg-yellowprimary"
             : ""
         }`}
        >
          <h1
            className={` text-sm ${
              isCurrentPrayer(currentTime, prayer.startTime, prayer.endTime)
                ? "text-black"
                : "text-blueprimary"
            }`}
          >
            {t(prayer.title)}
          </h1>

          <div
            className={` text-sm ${
              isCurrentPrayer(currentTime, prayer.startTime, prayer.endTime)
                ? "text-black"
                : "text-blueprimary"
            }`}
          >
            {prayer.icon}
          </div>
          <h1
            className={` text-sm text-center ${
              isCurrentPrayer(currentTime, prayer.startTime, prayer.endTime)
                ? "text-black"
                : "text-blueprimary"
            }`}
          >
            {prayer.time}
          </h1>
        </div>
      ))}
    </div>
  );
};

export default SanabelPrayer;
