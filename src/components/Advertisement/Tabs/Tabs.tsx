import { Link } from "react-router-dom";
import React,{ useState, FC, ReactNode } from "react";
// import Brand from "../../../assets/images/Brand.png";
// import BrandSmall from "../../../assets/images/Brand-small.png";
import "./tabs.scss";
import AdminFooter from "../AdminFooter/AdminFooter";

interface TabContent {
  id: string;
  name: string;
  desc?: string;
  icon?: string;
  link?: string;
  proDependent?: boolean;
}

interface TabData {
  type: "file" | "folder";
  content: TabContent | TabData[];
}

export interface TabsProps {
  tabData: TabData[];
  currentTab: string;
  getForm: (tabId: string) => ReactNode;
  prepareUrl: (tabId: string) => string;
  HeaderSection?: FC;
  BannerSection?: FC;
  horizontally?: boolean;
}

const Tabs: React.FC<TabsProps> = ({
  tabData,
  currentTab,
  getForm,
  prepareUrl,
  HeaderSection,
  BannerSection,
  horizontally = false,
}) => {
  const [menuCol, setMenuCol] = useState<boolean>(false);
  const [openedSubtab, setOpenedSubtab] = useState<string>("");

  const showTabSection = (tab: TabContent) => {
    return tab.link ? (
      <a href={tab.link}>
        <div>{tab.icon && <i className={`admin-font ${tab.icon}`}></i>}</div>
        <div>
          <p className="menu-name">{menuCol ? null : tab.name}</p>
          <p className="menu-desc">{menuCol ? null : tab.desc}</p>
        </div>
      </a>
    ) : (
      <Link
        className={currentTab === tab.id ? "active-current-tab" : ""}
        to={prepareUrl(tab.id)}
      >
        <div>
          {tab.icon && <i className={`admin-font ${tab.icon}`}></i>}
        </div>
        <div>
          <p className="menu-name">{menuCol ? null : tab.name}</p>
          <p className="menu-desc">{menuCol ? null : tab.desc}</p>
        </div>
      </Link>
    );
  };

  const showHideMenu = (tab: TabContent) => {
    return (
      <Link
        className={currentTab === tab.id ? "active-current-tab" : ""}
        to={""}
        onClick={(e) => {
          e.preventDefault();
          setOpenedSubtab(openedSubtab === tab.id ? "" : tab.id);
        }}
      >
        <div>{tab.icon && <i className={`admin-font ${tab.icon}`}></i>}</div>
        <div className="drop-down-section">
          <div>
            <p className="menu-name">{menuCol ? null : tab.name}</p>
            <p className="menu-desc">{menuCol ? null : tab.desc}</p>
          </div>
          {menuCol ? null : (
            <p
              className={`tab-menu-dropdown-icon ${
                openedSubtab === tab.id ? "active" : ""
              }`}
            >
              <i className="admin-font adminLib-keyboard-arrow-down"></i>
            </p>
          )}
        </div>
      </Link>
    );
  };

  const getTabDescription = (data: TabData[]): ReactNode => {
    return data.map(({ content, type }) => {
      if (type === "file" && (content as TabContent).id === currentTab) {
        const fileContent = content as TabContent;
        return (
          <div className="tab-description-start" key={fileContent.id}>
            <div className="child">
              <p>
                <i className={`admin-font ${fileContent.icon}`}></i>
              </p>
              <div>
                <div className="tab-name">{fileContent.name}</div>
                <div className="tab-desc">{fileContent.desc}</div>
              </div>
            </div>
          </div>
        );
      } else if (type === "folder") {
        return getTabDescription(content as TabData[]);
      }
      return null;
    });
  };

  return (
    <div className="general-wrapper">
      {HeaderSection && <HeaderSection />}
      {BannerSection && <BannerSection />}

      <div
        className={`middle-container-wrapper ${
          horizontally ? "horizontal-tabs" : "vertical-tabs"
        }`}
      >
        <div className={`${menuCol ? "showMenu" : ""} middle-child-container`}>
          <div id="current-tab-lists" className="current-tab-lists">
            <div className="brand">
              <img
                className="logo"
                // src={menuCol ? BrandSmall : Brand}
                src={menuCol ? "" : ""}
                alt="Logo"
              />
              {/* <img className="logo-small" src={BrandSmall} alt="Logo" /> */}
              <img className="logo-small" src={""} alt="Logo" />
            </div>
            <div className="current-tab-lists-container">
              {tabData.map(({ type, content }, index) => {
                if (type !== "folder") {
                  return showTabSection(content as TabContent);
                }

                return (
                  <div className="tab-wrapper" key={index}>
                    {showHideMenu((content as TabData[])[0].content as TabContent)}
                    <div
                      className={`subtab-wrapper ${menuCol ? "show" : ""} ${
                        openedSubtab ===
                        ((content as TabData[])[0].content as TabContent).id
                          ? "active"
                          : ""
                      }`}
                    >
                      {(content as TabData[]).slice(1).map(({ content }) =>
                        showTabSection(content as TabContent)
                      )}
                    </div>
                  </div>
                );
              })}
              <div
                className="main-btn menu-coll-btn"
                onClick={() => setMenuCol(!menuCol)}
              >
                <span>
                  <i className="admin-font adminLib-arrow-left"></i>
                </span>
                {!menuCol && "Collapse"}
              </div>
            </div>
          </div>
          <div className="tab-content">
            {getTabDescription(tabData)}
            {getForm(currentTab)}
          </div>
        </div>
      </div>

      <AdminFooter />
    </div>
  );
};

export default Tabs;
