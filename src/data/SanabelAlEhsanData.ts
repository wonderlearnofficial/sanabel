import image1 from "./SanabelAlEhsanImgs/1.png";
import image2 from "./SanabelAlEhsanImgs/2.png";
import image3 from "./SanabelAlEhsanImgs/3.png";

interface SanabelCard {
  title: string;
  points: number;
  img: string;
  borderColor: string; // Add borderColor property
}

export const SanabelAlEhsanData: SanabelCard[] = [
  { title: "سنبلة الصدقة", points: 200, img: image3, borderColor: "#FAB700" },
  { title: "سنبلة الصيام", points: 200, img: image2, borderColor: "#4AAAD6" },
  { title: "سنبلة الصلاة", points: 200, img: image1, borderColor:"#E14E54" },
];

