import { useEffect, useRef } from "react";
import { useNotifications } from "./NotificationContext";
import { OtherTrophies } from "../../data/OtherTrophies";
import { SanabelTrophies } from "../../data/SanabelTrophies";

// Import your trophy rewards assets
import blueSanabel from "../assets/resources/سنبلة زرقاء.png";
import redSanabel from "../assets/resources/سنبلة حمراء.png";
import yellowSanabel from "../assets/resources/سنبلة صفراء.png";
import xpIcon from "../assets/resources/اكس بي.png";
import water from "../assets/resources/ماء.png";
import fertilizer from "../assets/resources/سماد.png";

export const useTrophyNotifications = (trophies: any[], trophyType: number) => {
  const { addTrophyNotification } = useNotifications();
  const previousTrophiesRef = useRef<any[]>([]);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    console.log("Trophy notification hook triggered:", {
      trophiesCount: trophies.length,
      trophyType,
      isFirstLoad: isFirstLoadRef.current,
    });

    // Skip on first load to avoid showing notifications for already completed trophies
    if (isFirstLoadRef.current && trophies.length > 0) {
      console.log(
        "First load - storing initial trophies without notifications"
      );
      previousTrophiesRef.current = [...trophies];
      isFirstLoadRef.current = false;
      return;
    }

    if (trophies.length === 0) return;

    const previousTrophies = previousTrophiesRef.current;
    console.log("Previous trophies:", previousTrophies.length);

    // Check for newly completed trophies
    const newlyCompleted = trophies.filter((trophy) => {
      const wasCompleted = previousTrophies.find(
        (prev) => prev.id === trophy.id && prev.completionStatus === "Completed"
      );
      const isNewlyCompleted =
        trophy.completionStatus === "Completed" && !wasCompleted;

      if (isNewlyCompleted) {
        console.log("Found newly completed trophy:", trophy.challenge.title);
      }

      return isNewlyCompleted;
    });

    console.log("Newly completed trophies:", newlyCompleted.length);

    // Create notifications for newly completed trophies
    newlyCompleted.forEach((trophy) => {
      console.log("Creating notification for trophy:", trophy.challenge.title);

      const trophyImage =
        trophyType === 1
          ? OtherTrophies[trophy.challenge.title]
          : SanabelTrophies[
              trophy.challenge.title as keyof typeof SanabelTrophies
            ];

      const rewards = [
        {
          value: trophy.challenge.snabelBlue || 0,
          icon: blueSanabel,
          type: "blue_sanabel",
        },
        {
          value: trophy.challenge.snabelRed || 0,
          icon: redSanabel,
          type: "red_sanabel",
        },
        {
          value: trophy.challenge.snabelYellow || 0,
          icon: yellowSanabel,
          type: "yellow_sanabel",
        },
        { value: trophy.challenge.xp || 0, icon: xpIcon, type: "xp" },
        { value: trophy.challenge.water || 0, icon: water, type: "water" },
        {
          value: trophy.challenge.seeder || 0,
          icon: fertilizer,
          type: "fertilizer",
        },
      ].filter((reward) => reward.value > 0);

      // Extract milestone from description
      const description = trophy.challenge.description;
      const milestoneMatch = description.match(/Complete (\d+) tasks/i);
      const milestone = milestoneMatch
        ? parseInt(milestoneMatch[1])
        : trophy.challenge.targetPoint || trophy.pointOfStudent || 0;

      addTrophyNotification({
        trophyTitle: trophy.challenge.title,
        trophyImage: trophyImage || "/default-trophy.png",
        milestone: milestone,
        rewards: rewards,
        description: trophy.challenge.description,
      });
    });

    // Update the reference
    previousTrophiesRef.current = [...trophies];
  }, [trophies, trophyType, addTrophyNotification]);
};

// 3b. Alternative: Manual trigger for testing
export const useManualTrophyTrigger = () => {
  const { addTrophyNotification } = useNotifications();

  const triggerTestNotification = () => {
    console.log("Manually triggering test notification");
    addTrophyNotification({
      trophyTitle: "Test Trophy",
      trophyImage: "/default-trophy.png",
      milestone: 100,
      rewards: [
        { value: 10, icon: "/path/to/xp-icon.png", type: "xp" },
        { value: 5, icon: "/path/to/sanabel-icon.png", type: "sanabel" },
      ],
      description: "This is a test trophy achievement notification",
    });
  };

  return { triggerTestNotification };
};
