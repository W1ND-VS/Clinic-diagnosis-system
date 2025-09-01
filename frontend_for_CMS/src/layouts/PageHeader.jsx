import React from "react";

const PageHeader = ({ title, breadcrumbs = [], children }) => {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      <nav className="text-sm mb-2">
        <ol className="flex items-center space-x-1 text-dark-textSecondary">
          <li>
            <span className="hover:text-primary-300 cursor-pointer">Trang chủ</span>
          </li>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <li>
                <span className="mx-1">›</span>
              </li>
              <li>
                <span className={index === breadcrumbs.length - 1 ? "text-primary-300" : "hover:text-primary-300 cursor-pointer"}>
                  {crumb}
                </span>
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {/* Title and Actions Row */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-dark-text">{title}</h2>
        {/* Render children (actions) in the right side */}
        <div className="flex items-center space-x-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;