import sanabelAnimation from "../assets/splashscreen/Snabl-El-Ehsan Animation-Vertical.mp4";

function Loading() {
  let circleCommonClasses = "h-8 w-8 rounded-full";
  return (
    <div className="w-full h-full flex-center flex-col gap-10">
      <video
        src={sanabelAnimation}
        className="object-fill h-2/3"
        autoPlay
        loop
        muted
        preload="auto"
      />
      <div className="flex">
        <div
          className={`${circleCommonClasses} bg-blueprimary mr-1 animate-bounce`}
        ></div>
        <div
          className={`${circleCommonClasses} bg-redprimary mr-1 animate-bounce200`}
        ></div>
        <div
          className={`${circleCommonClasses} bg-yellowprimary animate-bounce400`}
        ></div>
      </div>
      <h1 className="text-blueprimary text-2xl ">Loading</h1>
    </div>
  );
}

export default Loading;
