import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";

// Components
import GoBackButton from "../../../components/GoBackButton";
import PrayerTimes from "./PrayerTimes";

// Icons
import { FaLocationArrow } from "react-icons/fa";

// Assets
import { sanabelImgs } from "../../../data/SanabelImgs";
import blueSanabel from "../../../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../../../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../../../assets/resources/سنبلة صفراء.png";
import xpIcon from "../../../assets/resources/اكس بي.png";

const role = localStorage.getItem("role");

// API service functions
const fetchCategoryName = async (index: number) => {
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    console.error("Auth token not found");
    return null;
  }

  try {
    console.log("Fetching category name...");
    const response = await axios.get(
      role === "Teacher"
        ? "https://sanabel.wonderlearn.net/teachers/tasks-category"
        : "https://sanabel.wonderlearn.net/parents/tasks-category",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    console.log("Category data received:", response.data);
    if (response.status === 200 && response.data.data[index]) {
      return response.data.data[index].category;
    } else {
      console.error(
        "Invalid category response or index out of bounds",
        index,
        response.data,
      );
      return null;
    }
  } catch (error) {
    console.error("Error fetching category name:", error);
    return null;
  }
};

const fetchSanabelTypes = async (categoryId: number) => {
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    console.error("Auth token not found");
    return [];
  }

  try {
    console.log(`Fetching sanabel types for category ID ${categoryId}...`);
    const response = await axios.get(
      role === "Teacher"
        ? `https://sanabel.wonderlearn.net/teachers/appear-Taskes-Type/${categoryId}`
        : `https://sanabel.wonderlearn.net/parents/appear-Taskes-Type/${categoryId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    console.log("Sanabel types received:", response.data);
    if (response.status === 200) {
      const uniqueTypes: string[] = [];
      response.data.data.forEach((task: { type: string }) => {
        if (!uniqueTypes.includes(task.type)) {
          uniqueTypes.push(task.type);
        }
      });
      console.log("Unique sanabel types:", uniqueTypes);
      return uniqueTypes;
    } else {
      console.error("Invalid sanabel types response", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching sanabel types:", error);
    return [];
  }
};

const fetchMissions = async (categoryId: number, sanabelType: string) => {
  const authToken = localStorage.getItem("token");
  if (!authToken) {
    console.error("Auth token not found");
    return [];
  }

  try {
    console.log(
      `Fetching missions for category ${categoryId} and type ${sanabelType}...`,
    );
    const response = await axios.get(
      role === "Teacher"
        ? `https://sanabel.wonderlearn.net/teachers/appear-Taskes-Type-Category/${categoryId}/${sanabelType}`
        : `https://sanabel.wonderlearn.net/parents/appear-Taskes-Type-Category/${categoryId}/${sanabelType}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    console.log("Missions received:", response.data);
    if (response.status === 200) {
      // From the console logs, it appears the data is directly in response.data.data
      const missionData = response.data.data;

      console.log("Extracted mission data:", missionData);

      if (Array.isArray(missionData)) {
        return missionData;
      } else {
        console.error("Mission data is not an array:", missionData);
        return [];
      }
    } else {
      console.error("Invalid missions response", response);
      return [];
    }
  } catch (error) {
    console.error("Error fetching missions:", error);
    return [];
  }
};

const SanabelMissionsPage: React.FC = () => {
  const { index, subIndex } = useParams<{ index: string; subIndex: string }>();
  const indexAsNumber = parseInt(index || "0", 10);
  const subIndexAsNumber = parseInt(subIndex || "0", 10);
  const APIIndex = indexAsNumber + 1; // API uses 1-based indexing

  const { t } = useTranslation();

  const [location, setLocation] = useState<string>(
    localStorage.getItem("selectedLocation") || "الإسكندرية",
  );
  const [categoryName, setCategoryName] = useState("");
  const [sanabel, setSanabel] = useState<string[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Add a list of available cities
  const availableCities = ["القاهرة", "الإسكندرية"];

  // Save location to localStorage when it changes
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
    localStorage.setItem("selectedLocation", newLocation);
  };

  // Colors for styling based on index
  const colors = ["bg-blueprimary", "bg-redprimary", "bg-yellowprimary"];
  const colorBG = colors[indexAsNumber % colors.length];

  const colorBorder = [
    "border-t-blueprimary",
    "border-t-redprimary",
    "border-t-yellowprimary",
  ];
  const colorBorderTop = colorBorder[indexAsNumber % colors.length];

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Step 1: Fetch category name
        const fetchedCategoryName = await fetchCategoryName(indexAsNumber);
        if (fetchedCategoryName) {
          setCategoryName(fetchedCategoryName);
          console.log("Category name set:", fetchedCategoryName);
        }

        // Step 2: Fetch sanabel types
        const fetchedSanabelTypes = await fetchSanabelTypes(APIIndex);
        if (fetchedSanabelTypes.length > 0) {
          setSanabel(fetchedSanabelTypes);
          console.log("Sanabel types set:", fetchedSanabelTypes);

          // Step 3: Fetch missions if we have sanabel types and valid subIndex
          if (fetchedSanabelTypes[subIndexAsNumber]) {
            // Restore the dynamic API calls but ensure we're using the correct parameters
            console.log(
              `Using category ID ${APIIndex} and type ${fetchedSanabelTypes[subIndexAsNumber]}`,
            );
            const fetchedMissions = await fetchMissions(
              APIIndex,
              fetchedSanabelTypes[subIndexAsNumber],
            );
            setMissions(fetchedMissions);
            console.log("Missions set:", fetchedMissions);
          } else {
            console.error(
              "Invalid subIndex or no sanabel type found:",
              subIndexAsNumber,
            );
            setMissions([]);
          }
        }
      } catch (err) {
        console.error("Error in data loading process:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [indexAsNumber, subIndexAsNumber, APIIndex]);

  const renderResources = (items: any) =>
    [
      { icon: blueSanabel, value: items.snabelBlue },
      { icon: redSanabel, value: items.snabelRed },
      { icon: yellowSanabel, value: items.snabelYellow },
      { icon: xpIcon, value: items.xp },
    ].map((resource, idx) => (
      <div key={idx} className="flex flex-col items-center">
        <img
          src={resource.icon}
          alt="icon"
          className="w-auto h-6"
          loading="lazy"
        />
        <h1 className="text-sm text-black">{resource.value}</h1>
      </div>
    ));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  const currentSanabelType = sanabel[subIndexAsNumber];

  return (
    <div className="flex flex-col items-center w-full h-full p-4 overflow-y-auto ">
      <div className="flex flex-row-reverse items-center justify-between w-full overflow-y-auto">
        <div className="opacity-0 w-[25px] h-25" />
        <h1 className="self-center text-xl font-bold text-black" dir="ltr">
          {currentSanabelType ? t(currentSanabelType) : ""}
        </h1>
        <GoBackButton />
      </div>

      <div
        className={`w-full ${colorBG} flex justify-between items-center p-5 rounded-lg mt-8`}
      >
        {sanabelImgs && sanabelImgs[indexAsNumber] && (
          <img
            src={sanabelImgs[indexAsNumber][subIndexAsNumber]}
            alt={currentSanabelType}
            className="object-contain w-1/3 rounded-lg drop-shadow-[0_0_1px_rgba(75,75,75,1)]"
          />
        )}

        <div className="flex flex-col justify-between gap-3">
          <h1 className="text-lg font-bold text-center text-white ">
            <span>{t("تحديات")}</span>
            <br />
            {currentSanabelType ? t(currentSanabelType) : ""}
          </h1>

          {indexAsNumber === 0 && subIndexAsNumber === 0 && (
            <div className="flex flex-col items-center w-full scale-90">
              <div className="flex items-center gap-1 p-1 border-2 border-gray-300 rounded-lg">
                <FaLocationArrow className="text-white" />
                <select
                  className="px-2 py-1 text-white bg-transparent border-none rounded-lg outline-none cursor-pointer"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                >
                  {availableCities.map((city) => (
                    <option
                      key={city}
                      value={city}
                      className="text-black bg-white"
                    >
                      {t(city)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {indexAsNumber === 0 && subIndexAsNumber === 0 && (
        <PrayerTimes location={location} />
      )}

      <div className="flex flex-col items-center   overflow-y-auto justify-start w-full gap-5 mt-5 overflow-y-auto h-2/3">
        {missions.length > 0 ? (
          missions.map((mission: any, idx: number) => (
            <div
              key={idx}
              className={`flex w-full flex-col items-end justify-between sanabel-shadow-bottom h-max rounded-xl p-4 gap-2 border-t-2 ${colorBorderTop}`}
            >
              <div className="flex flex-row-reverse items-center justify-between w-full">
                <div className="flex gap-2">{renderResources(mission)}</div>
                <h1 className="w-2/3 text-sm text-black ">
                  {t(mission.title)}
                </h1>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            No missions found
          </div>
        )}
      </div>
    </div>
  );
};

export default SanabelMissionsPage;
