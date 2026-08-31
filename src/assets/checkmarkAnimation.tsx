import { useLottie } from "lottie-react";
import checkmarkAnimation from "./checkmark.json";

const CheckmarkAnimation: React.FC = () => {
  const { View } = useLottie({
    animationData: checkmarkAnimation,
    loop: false,
  });

  // useLottie owns playback and cleanup. Do not replay after unmount or let
  // a scaled SVG overlap the purchase result and its close button.
  return <div className="w-24 h-24 mx-auto flex-center pointer-events-none" aria-hidden="true">{View}</div>;
};

export default CheckmarkAnimation;
