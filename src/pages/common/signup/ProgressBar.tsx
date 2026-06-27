import React, { useEffect, useState } from "react";

const ProgressBar: React.FC<{ filledBars: number }> = ({ filledBars }) => {
  const [animatedFilledBars, setAnimatedFilledBars] = useState(0);

  useEffect(() => {
    // Set animatedFilledBars after a delay to trigger the CSS transition
    const timeout = setTimeout(() => setAnimatedFilledBars(filledBars), 100);
    return () => clearTimeout(timeout);
  }, [filledBars]);

  return (
    <div className="flex w-full gap-1 mb-5">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 transition-all duration-500 ease-out ${
            index < animatedFilledBars ? "bg-blueprimary" : "bg-gray-300"
          }`}
          style={{
            transitionDelay: `${index * 0.1}s`, // Adds delay for each bar
          }}
        />
      ))}
    </div>
  );
};

export default ProgressBar;
