import { useState } from "react";

const tabs = [
  "Thông tin cơ bản",
  "Khám & Điều trị",
  "Đơn thuốc",
  "Dịch vụ",
  "Thanh toán",
];

export default function Navbar({ activeTab, onTabChange }) {
  const [currentTab, setCurrentTab] = useState(activeTab || tabs[0]);

  const handleClick = (tab) => {
    setCurrentTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2 shadow-sm">
      <nav className="flex flex-wrap gap-4 overflow-x-auto text-sm font-medium">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleClick(tab)}
            className={`pb-2 ${
              currentTab === tab
                ? "border-b-2 border-purple-600 text-purple-600 font-semibold"
                : "text-gray-600 hover:text-purple-500"
            } whitespace-nowrap`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
