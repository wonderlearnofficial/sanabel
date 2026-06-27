import { useState, useEffect } from "react";
import axios from "axios";

interface CategoryCounts {
  [key: string]: number;
}

const useFetchTasksCompleted = () => {
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({
    "سنابل الإحسان في العلاقة مع الله": 0,
    "سنابل الإحسان في العلاقة مع النفس": 0,
    "سنابل الإحسان في العلاقة مع الأسرة والمجتمع": 0,
    "سنابل الإحسان في العلاقة مع الأرض والكون": 0,
  });

  const fetchTasksCompleted = async (token?: string) => {
    const authToken = token || localStorage.getItem("token");
    if (!authToken) return;

    try {
      const response = await axios.get(
        "https://sanabel.wonderlearn.net/students/calculate-completed-tasks-by-category",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.status === 200) {
        setCompletedTasks(response.data.totalCompletedTasks);
        setCategoryCounts(response.data.categoryCounts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchTasksCompleted();
  }, []);

  return { completedTasks, categoryCounts };
};

export default useFetchTasksCompleted;
