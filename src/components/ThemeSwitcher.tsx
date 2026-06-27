import { useTheme } from "../context/ThemeContext";

const ThemeSwitcher: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  return (
    <div className="flex flex-col ">
      <button
        className="text-xl bg-blue-400 rounded-full p-2 "
        onClick={toggleDarkMode}
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
