import React, { useEffect, useState } from "react";
import axios from "axios";

interface Mission {
  id: number;
  title: string;
  type: string;
  snabelBlue: number;
  snabelRed: number;
  snabelYellow: number;
  xp: number;
}

interface SanabelType {
  name: string;
  missions: Mission[];
}

interface Category {
  id: number;
  title: string;
  category: string;
  sanabelTypes: SanabelType[];
}

interface ExtractedData {
  categories: Category[];
}

const SanabelDataExtractor: React.FC = () => {
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");

  const role = localStorage.getItem("role");

  const fetchCategories = async () => {
    const authToken = localStorage.getItem("token");
    if (!authToken) throw new Error("Auth token not found");

    const response = await axios.get(
      role === "Teacher"
        ? "https://sanabel.wonderlearn.net/teachers/tasks-category"
        : "https://sanabel.wonderlearn.net/parents/tasks-category",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data.data;
    }
    throw new Error("Failed to fetch categories");
  };

  const fetchSanabelTypes = async (categoryId: number) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) throw new Error("Auth token not found");

    const response = await axios.get(
      role === "Teacher"
        ? `https://sanabel.wonderlearn.net/teachers/appear-Taskes-Type/${categoryId}`
        : `https://sanabel.wonderlearn.net/parents/appear-Taskes-Type/${categoryId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200) {
      const uniqueTypes: string[] = [];
      response.data.data.forEach((task: { type: string }) => {
        if (!uniqueTypes.includes(task.type)) {
          uniqueTypes.push(task.type);
        }
      });
      return uniqueTypes;
    }
    throw new Error("Failed to fetch sanabel types");
  };

  const fetchMissions = async (categoryId: number, sanabelType: string) => {
    const authToken = localStorage.getItem("token");
    if (!authToken) throw new Error("Auth token not found");

    const response = await axios.get(
      role === "Teacher"
        ? `https://sanabel.wonderlearn.net/teachers/appear-Taskes-Type-Category/${categoryId}/${sanabelType}`
        : `https://sanabel.wonderlearn.net/parents/appear-Taskes-Type-Category/${categoryId}/${sanabelType}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200) {
      return response.data.data || [];
    }
    throw new Error("Failed to fetch missions");
  };

  const extractAllData = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("Starting data extraction...");

      // Step 1: Fetch all categories
      const categories = await fetchCategories();
      console.log("Categories fetched:", categories);

      const extractedCategories: Category[] = [];

      // Step 2: For each category, fetch sanabel types and missions
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const categoryId = i + 1; // API uses 1-based indexing

        console.log(`Processing category ${i}: ${category.title}`);

        const sanabelTypes = await fetchSanabelTypes(categoryId);
        console.log(`Sanabel types for category ${i}:`, sanabelTypes);

        const categoryData: Category = {
          id: categoryId,
          title: category.title,
          category: category.category,
          sanabelTypes: [],
        };

        // Step 3: For each sanabel type, fetch its missions
        for (const sanabelType of sanabelTypes) {
          console.log(
            `Fetching missions for ${sanabelType} in category ${categoryId}`
          );

          const missions = await fetchMissions(categoryId, sanabelType);
          console.log(`Missions for ${sanabelType}:`, missions);

          categoryData.sanabelTypes.push({
            name: sanabelType,
            missions: missions,
          });
        }

        extractedCategories.push(categoryData);
      }

      const finalData: ExtractedData = {
        categories: extractedCategories,
      };

      setExtractedData(finalData);
      setJsonOutput(JSON.stringify(finalData, null, 2));

      console.log("Final extracted data:", finalData);
    } catch (err) {
      console.error("Error extracting data:", err);
      setError(
        `Failed to extract data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    const blob = new Blob([jsonOutput], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sanabel-data-for-translation.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonOutput);
    alert("Data copied to clipboard!");
  };

  // Create a flattened array of all text that needs translation
  const createTranslationArray = () => {
    const translationItems: string[] = [];

    extractedData.categories.forEach((category) => {
      // Add category title
      translationItems.push(category.title);

      category.sanabelTypes.forEach((sanabelType) => {
        // Add sanabel type name
        translationItems.push(sanabelType.name);

        sanabelType.missions.forEach((mission) => {
          // Add mission title
          translationItems.push(mission.title);
        });
      });
    });

    return translationItems;
  };

  const translationArray = createTranslationArray();

  return (
    <div className="max-w-4xl p-6 mx-auto">
      <div className="mb-6">
        <h1 className="mb-4 text-2xl font-bold">Sanabel Data Extractor</h1>
        <p className="mb-4 text-gray-600">
          This component extracts all categories, sanabel types, and missions
          for translation.
        </p>

        <button
          onClick={extractAllData}
          disabled={isLoading}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? "Extracting..." : "Extract All Data"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
          {error}
        </div>
      )}

      {extractedData.categories.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="mb-2 text-lg font-semibold">Summary:</h2>
            <p>Total Categories: {extractedData.categories.length}</p>
            <p>
              Total Sanabel Types:{" "}
              {extractedData.categories.reduce(
                (sum, cat) => sum + cat.sanabelTypes.length,
                0
              )}
            </p>
            <p>
              Total Missions:{" "}
              {extractedData.categories.reduce(
                (sum, cat) =>
                  sum +
                  cat.sanabelTypes.reduce(
                    (typeSum, type) => typeSum + type.missions.length,
                    0
                  ),
                0
              )}
            </p>
            <p>Total Translation Items: {translationArray.length}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={downloadJson}
              className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600"
            >
              Download Full JSON
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 text-white bg-purple-500 rounded hover:bg-purple-600"
            >
              Copy JSON to Clipboard
            </button>
          </div>

          {/* Translation Array */}
          <div className="p-4 rounded bg-yellow-50">
            <h2 className="mb-2 text-lg font-semibold">Translation Array:</h2>
            <p className="mb-2 text-sm text-gray-600">
              Here's a simple array of all text that needs translation:
            </p>
            <pre className="p-3 overflow-x-auto text-sm bg-black border rounded">
              {JSON.stringify(translationArray, null, 2)}
            </pre>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  JSON.stringify(translationArray, null, 2)
                )
              }
              className="px-3 py-1 mt-2 text-sm text-white bg-orange-500 rounded hover:bg-orange-600"
            >
              Copy Translation Array
            </button>
          </div>

          {/* Hierarchical Display */}
          <div className="bg-white border rounded">
            <h2 className="p-4 text-lg font-semibold border-b">
              Extracted Data Structure:
            </h2>
            <div className="p-4 overflow-y-auto max-h-96">
              {extractedData.categories.map((category, categoryIndex) => (
                <div
                  key={categoryIndex}
                  className="pl-4 mb-4 border-l-4 border-blue-500"
                >
                  <h3 className="font-bold text-blue-700">
                    Category {categoryIndex + 1}: {category.title}
                  </h3>
                  <p className="mb-2 text-sm text-gray-600">
                    ID: {category.id}
                  </p>

                  {category.sanabelTypes.map((sanabelType, typeIndex) => (
                    <div
                      key={typeIndex}
                      className="pl-3 mb-3 ml-4 border-l-2 border-green-500"
                    >
                      <h4 className="font-semibold text-green-700">
                        Sanabel Type: {sanabelType.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Missions: {sanabelType.missions.length}
                      </p>

                      <div className="mt-2 ml-4">
                        {sanabelType.missions.map((mission, missionIndex) => (
                          <div key={missionIndex} className="mb-1 text-sm">
                            <span className="text-gray-500">
                              Mission {missionIndex + 1}:
                            </span>{" "}
                            <span className="text-gray-800">
                              {mission.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Raw JSON Output */}
          <details className="p-4 rounded bg-gray-50">
            <summary className="font-semibold cursor-pointer">
              View Raw JSON Data
            </summary>
            <pre className="p-3 mt-4 overflow-x-auto text-xs bg-white border rounded">
              {jsonOutput}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default SanabelDataExtractor;
