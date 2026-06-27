import { useLottie } from "lottie-react";
import { useEffect } from "react";
import checkmarkAnimation from "./checkmark.json";

const CheckmarkAnimation: React.FC = () => {
  const { View, play, stop, animationContainerRef } = useLottie({
    animationData: checkmarkAnimation,
    loop: false,
  });

  useEffect(() => {
    const playWithDelay = async () => {
      while (true) {
        play();
        await new Promise((resolve) => setTimeout(resolve, 4000)); // Delay between loops
        stop();
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay before restarting
      }
    };

    playWithDelay();

    return () => {
      stop();
    };
  }, [play, stop]);

  return <div className="scale-150 flex-center">{View}</div>;
};

export default CheckmarkAnimation;
