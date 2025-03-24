import React,{ useState } from "react";
import Dialog from "@mui/material/Dialog";
import Popoup from "../PopupContent/Propopup";

import { getApiLink, sendApiResponse } from "../../../service/apiService";
import { useModules } from "../../../context/ModuleContext";
import { getModuleData } from "../../../service/templateService";
import "./modules.scss";

interface Module {
  id: string;
  name: string;
  desc: string;
  icon: string;
  doc_link: string;
  settings_link: string;
  pro_module?: boolean;
}

interface AppLocalizer {
  khali_dabba?: boolean;
}

declare const appLocalizer: AppLocalizer;

const Modules = async () => {
  const { modules, insertModule, removeModule } = useModules();
  const modulesArray: Module[] = await getModuleData();
  const [modelOpen, setModelOpen] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");

  const isModuleAvailable = (moduleId: string): boolean => {
    const module = modulesArray.find((module) => module.id === moduleId);
    if (!module?.pro_module) return true;
    return module.pro_module && appLocalizer.khali_dabba ? true : false;
  };

  const handleOnChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    moduleId: string
  ) => {
    if (!isModuleAvailable(moduleId)) {
      setModelOpen(true);
      return;
    }

    const action = event.target.checked ? "activate" : "deactivate";
    action === "activate" ? insertModule(moduleId) : removeModule(moduleId);

    await sendApiResponse(getApiLink("modules"), { id: moduleId, action });
    setSuccessMsg("Module activated");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  return (
    <div className="module-container">
      <Dialog
        className="admin-module-popup"
        open={modelOpen}
        onClose={() => setModelOpen(false)}
        aria-labelledby="form-dialog-title"
      >
        <span
          className="admin-font adminLib-cross"
          onClick={() => setModelOpen(false)}
        ></span>
        <Popoup />
      </Dialog>

      {successMsg && (
        <div className="admin-notice-display-title">
          <i className="admin-font adminLib-icon-yes"></i>
          {successMsg}
        </div>
      )}

      <div className="tab-name">
        <h1>Modules</h1>
      </div>
      <div className="module-option-row">
        {modulesArray.map((module) => (
          <div className="module-list-item" key={module.id}>
            {module.pro_module && !appLocalizer.khali_dabba && (
              <span className="admin-pro-tag">Pro</span>
            )}
            <div className="module-icon">
              <i className={`font ${module.icon}`}></i>
            </div>

            <div className="card-meta">
              <div className="meta-name">{module.name}</div>
              <p className="meta-description" dangerouslySetInnerHTML={{ __html: module.desc }}></p>
            </div>
            <div className="card-footer">
              <div className="card-support">
                <a href={module.doc_link} className="main-btn btn-purple card-support-btn">Docs</a>
                <a href={module.settings_link} className="main-btn btn-purple card-support-btn">Setting</a>
              </div>
              <div className="toggle-checkbox-content" data-showcase-tour={`${module.id}-showcase-tour`}>
                <input
                  type="checkbox"
                  className="woo-toggle-checkbox"
                  id={`toggle-switch-${module.id}`}
                  onChange={(e) => handleOnChange(e, module.id)}
                />
                <label htmlFor={`toggle-switch-${module.id}`} className="toggle-switch-is_hide_cart_checkout"></label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Modules;
