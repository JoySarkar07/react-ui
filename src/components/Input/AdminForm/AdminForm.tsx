import React, { useEffect, useRef, useState } from "react";
import { getApiLink, sendApiResponse } from "../../../service/apiService";
import { useModules } from "../../../context/ModuleContext";
import { useSetting } from "../../../context/SettingContext";
import { BasicInput } from "../BasicInput";
import { TextArea } from "../TextArea";
import { FileInput } from "../FileInput";
import { CalendarInput } from "../CalendarInput";
import { MultiNumInput } from "../MultiNumInput";
import { RadioInput } from "../RadioInput";
import SelectInput from "../SelectInput/SelectInput";
import { SingleValue } from "react-select";
import { MultiCheckBox } from "../MultiCheckbox";
import ToggleSetting from "../ToggleSetting/ToggleSetting";
import WpEditor from "../../WpEditor/WpEditor";
import Label from "../Label/Label";
import Section from "../Section/Section";
import BlockText from "../BlockText/BlockText";
import ButtonCustomizer from "../ButtonCustomiser/ButtonCustomiser";
import FormCustomizer from "../FormCustomizer/FormCustomizer";
import FreeProFormCustomizer from "../FreeProFormCustomizer/FreeProFormCustomizer";
import CatalogCustomizer from "../CatalogCustomizer/CatalogCustomizer";
import MultiCheckboxTable from "../MultiCheckboxTable/MultiCheckboxTable";
import MergeComponent from "../MergeComponent/MergeComponent";
import ShortCodeTable from "../ShortCodeTable/ShortCodeTable";
import SyncNow from "../SyncNow/SyncNow";

declare const wp: any;

const PENALTY = 10;
const COOLDOWN = 1;

interface ApiResponse {
    error: string;
    redirect_link?: string;
}

interface AdminFormProps {
    submitUrl: string;
    id: string | number;
    vendorId?: string;
    announcementId?: string;
    knowladgebaseId?: string;
}
interface ModulePopupDataProps {
    name: String;
    settings: string;
    plugin: string;
}
interface CountryState {
    label: string;
    value: string;
}


interface DependentCondition {
    key: string;
    set?: boolean;
    value?: string | number | boolean;
}
interface MultiNumOption {
    key: string;
    value: string | number;
    label: string;
    name?: string;
    type: string;
    desc: string;
}
interface Field {
    name: string;
    type: "select" | "number" | "text"; // Include "text" in the type property
    options?: { value: string; label: string }[]; // For select fields
    placeholder?: string;
}
interface Option {
    label: string;
    desc: string;
}

interface InputField {
    key: string;
    id: string;
    class: string;
    name: string;
    type?: "text" | "select" | "multi-select" |
    "checkbox" | "country" | "state" | "radio-color" |
    "radio-select" | "stock-alert-checkbox"
    | "radio" | "multi-number" | "button" |
    "password" | "calender" | "color" |
    "email" | "number" | "range" | "file" |
    "url" | "textarea" | "normalfile" |
    "settingToggle" | "wpeditor" | "label"
    | "section" | "blocktext" | "button-customizer" |
    "stock-alert-form-customizer" | "form-customizer"
    | "catalog-customizer" | "multi-checkbox-table" |
    "mergeComponent" | "shortCode-table"|"syncbutton";
    desc?: string;
    placeholder?: string;
    inputLabel?: string;
    rangeUnit?: string;
    min?: number;
    max?: number;
    proSetting?: boolean;
    moduleEnabled?: boolean;
    parameter?: string;
    dependent?: DependentCondition | DependentCondition[];
    rowNumber?: number;
    colNumber?: number;
    value?: string;
    width?: number;
    height?: number;
    multiple?: boolean;
    range?: boolean;
    select_deselect?: boolean;
    look?: string;
    tour?: string;
    right_content?: boolean;
    dependentPlugin?: boolean;
    dependentSetting?: string;
    defaultValue?: string;
    valuename?: string;
    hint?: string;
    blocktext?: string;
    rows: { key: string; label: string; options?: { value: string | number; label: string }[] }[];
    columns: { key: string; label: string; moduleEnabled?: string }[];
    fields: Field[];
    options?: MultiNumOption;
    optionLabel?: string[];
    apilink?:string;
    interval?:number;
    statusApiLink?:string;
}

export interface SelectOption {
    value: string;
    label: string;
}
const AdminForm: React.FC<AdminFormProps> = ({ submitUrl, id, vendorId, announcementId, knowladgebaseId }) => {
    const settingChanged = useRef<boolean>(false);
    const counter = useRef<number>(0);
    const counterId = useRef<NodeJS.Timeout | number>(0);
    const [successMsg, setSuccessMsg] = useState<string>("");
    const [modelOpen, setModelOpen] = useState<boolean>(false);
    const { setting, updateSetting } = useSetting();
    const [modelModuleOpen, setModelModuleOpen] = useState<boolean>(false);
    const [countryState, setCountryState] = useState<CountryState[]>([]);


    const [modulePopupData, setModulePopupData] = useState<ModulePopupDataProps>({
        name: '',
        settings: '',
        plugin: '',
    });
    const { modules } = useModules();

    useEffect(() => {
        if (settingChanged.current) {
            settingChanged.current = false;

            // Set counter by penalty
            counter.current = PENALTY;

            // Clear previous counter
            if (counterId.current) {
                clearInterval(counterId.current);
            }

            // Create new interval
            const intervalId = setInterval(() => {
                counter.current -= COOLDOWN;

                // Cooldown complete time for DB request
                if (counter.current < 0) {
                    sendApiResponse(getApiLink(submitUrl), {
                        settingName: id,
                        vendor_id: vendorId || "",
                        announcement_id: announcementId || "",
                        knowladgebase_id: knowladgebaseId || "",
                    })
                        .then((response) => response as ApiResponse)
                        .then((response: ApiResponse) => {
                            // Set success message for 2 seconds
                            setSuccessMsg(response.error);
                            setTimeout(() => setSuccessMsg(""), 2000);

                            // If response has redirect link then redirect
                            if (response.redirect_link) {
                                window.location.href = response.redirect_link;
                            }
                        })
                        .catch((error) => {
                            console.error("API Error:", error);
                        });

                    clearInterval(intervalId);
                    counterId.current = 0;
                }
            }, 50);

            // Store the interval ID
            counterId.current = intervalId;
        }
    }, [submitUrl, id, vendorId, announcementId, knowladgebaseId]);

    const isProSetting = (proDependent: boolean): boolean => {
        return proDependent && !window.appLocalizer?.khali_dabba;
    };
    const proSettingChanged = (isProSetting: boolean): boolean => {
        if (isProSetting && !window.appLocalizer?.khali_dabba) {
            setModelOpen(true);
            return true;
        }
        return false;
    };

    const moduleEnabledChanged = (
        moduleEnabled: string,
        dependentSetting: string = "",
        dependentPlugin: boolean = false
    ): boolean => {
        let popupData: { name: string; settings: string; plugin: string } = {
            name: "",
            settings: "",
            plugin: "",
        };

        if (moduleEnabled && !modules.includes(moduleEnabled)) {
            popupData.name = moduleEnabled;
        }

        if (
            dependentSetting &&
            Array.isArray(setting[dependentSetting]) &&
            setting[dependentSetting].length === 0
        ) {
            popupData.settings = dependentSetting;
        }

        if (dependentPlugin) {
            popupData.plugin = "notifima";
        }

        if (popupData.name || popupData.settings || popupData.plugin) {
            setModulePopupData(popupData);
            setModelModuleOpen(true);
            return true;
        }

        return false;
    };

    const handleChange = (
        event: any,
        key: string,
        type: "single" | "multiple" = "single",
        fromType: "simple" | "calender" | "select" | "multi-select" | "wpeditor" | "country" = "simple",
        arrayValue: any[] = []
    ): void => {
        settingChanged.current = true;

        if (type === "single") {
            if (fromType === "simple") {
                updateSetting(key, event.target.value);
            } else if (fromType === "calender") {
                let formattedDate: string;

                if (Array.isArray(event)) {
                    // Check if all elements are ranges
                    if (event.every((item) => Array.isArray(item) && item.length === 2)) {
                        // Handle one or multiple ranges
                        formattedDate = event
                            .map((range) => {
                                const startDate = range[0]?.toString();
                                const endDate = range[1]?.toString();
                                return `${startDate} - ${endDate}`;
                            })
                            .join(", ");
                    } else {
                        formattedDate = event.map((item) => item.toString()).join(",");
                    }
                } else {
                    formattedDate = event.toString();
                }

                updateSetting(key, formattedDate);
            } else if (fromType === "select") {
                updateSetting(key, arrayValue.find((item) => item.value === event.target.value) || "");
            } else if (fromType === "multi-select") {
                updateSetting(key, event);
            } else if (fromType === "wpeditor") {
                updateSetting(key, event);
            } else if (fromType === "country") {
                updateSetting(key, arrayValue.find((item) => item.value === event.target.value) || "");

                const countryData = window.appLocalizer?.countries
                    ? JSON.parse(window.appLocalizer.countries.replace(/&quot;/g, '"'))
                    : {};

                const stateList = countryData[event.target.value] || {};
                const countryListArray = Object.keys(stateList).map((key_country) => ({
                    label: key_country,
                    value: stateList[key_country],
                }));

                setCountryState(countryListArray);
            }
        } else {
            let prevData: any[] = Array.isArray(setting[key]) ? setting[key] : [];

            if (!prevData.length || typeof prevData === "string" || prevData === null || typeof prevData === "boolean") {
                prevData = [key];
            }

            prevData = prevData.filter((data) => data !== event.target.value);

            if (event.target.checked) {
                prevData.push(event.target.value);
            }

            updateSetting(key, prevData);
        }
    };

    const handleMultiNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        key?: string,
        optionKey?: string,
        index?: number
    ) => {
        if (!key || !optionKey || index === undefined) return; // Ensure values are valid

        settingChanged.current = true;

        const multipleOptions: Record<number, { key: string; value: string }> =
            (setting[key] as Record<number, { key: string; value: string }>) || {};

        multipleOptions[index] = {
            key: optionKey,
            value: e.target.value,
        };

        updateSetting(key, multipleOptions);
    };


    const handlMultiSelectDeselectChange = (
        key: string,
        options: { value: string; proSetting?: boolean }[],
        type: string = ""
    ) => {
        settingChanged.current = true;

        if (Array.isArray(setting[key]) && setting[key].length > 0) {
            updateSetting(key, []);
        } else {
            const newValue = options
                .filter((option) => type === "multi-select" || !isProSetting(option.proSetting ?? false))
                .map(({ value }) => value);

            updateSetting(key, newValue);
        }
    };


    const runUploader = (key: string) => {
        settingChanged.current = true;

        // Create a new media frame
        const frame = wp.media({
            title: "Select or Upload Media Of Your Chosen Persuasion",
            button: {
                text: "Use this media",
            },
            multiple: false, // Set to true to allow multiple files to be selected
        });

        frame.on("select", () => {
            // Get media attachment details from the frame state
            const attachment = frame.state().get("selection").first().toJSON() as { url: string };
            updateSetting(key, attachment.url);
        });

        // Finally, open the modal on click
        frame.open();
    };

    const isContain = (key: string, value: string | number | boolean | null = null): boolean => {
        const settingValue = setting[key];

        // If settingValue is an array
        if (Array.isArray(settingValue)) {
            // If value is null and settingValue has elements, return true
            if (value === null && settingValue.length > 0) {
                return true;
            }

            return settingValue.includes(value);
        }

        // If settingValue is not an array
        if (value === null && Boolean(settingValue)) {
            return true;
        }

        return settingValue === value;
    };


    const shouldRender = (dependent: DependentCondition): boolean => {
        if (dependent.set === true && !isContain(dependent.key)) {
            return false;
        }
        if (dependent.set === false && isContain(dependent.key)) {
            return false;
        }
        if (dependent.value !== undefined && !isContain(dependent.key, dependent.value)) {
            return false;
        }
        return true;
    };

    const renderForm = (modal: InputField[], setting: Record<string, any>) => {
        return modal.map((inputField: InputField, index: number) => {
            let value: string | number = setting[inputField.key] ?? "";
            let input: JSX.Element | null = null;

            // Filter dependent conditions
            if (Array.isArray(inputField.dependent)) {
                for (let dependent of inputField.dependent) {
                    if (!shouldRender(dependent)) {
                        return null;
                    }
                }
            } else if (inputField.dependent) {
                if (!shouldRender(inputField.dependent)) {
                    return null;
                }
            }

            // Set input field based on type
            switch (inputField.type) {
                case "text":
                case "url":
                case "password":
                case "email":
                case "number":
                case "range":
                    input = (
                        <BasicInput
                            wrapperClass="setting-form-input"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            key={inputField.key}
                            id={inputField.id}
                            name={inputField.name}
                            type={inputField.type}
                            placeholder={inputField.placeholder}
                            inputLabel={inputField.inputLabel} // for range input label
                            rangeUnit={inputField.rangeUnit} // for range parameter
                            min={inputField.min ?? 0} // for range min value
                            max={inputField.max ?? 50} // for range max value
                            value={value}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled ?? ""))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                            parameter={inputField.parameter} // for showing text beside the text box
                        />
                    );
                    break;
                case "textarea":
                    input = (
                        <TextArea
                            wrapperClass="setting-from-textarea"
                            inputClass={inputField.class || "form-input"}
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            key={inputField.key}
                            id={inputField.id}
                            name={inputField.name}
                            placeholder={inputField.placeholder}
                            rowNumber={inputField.rowNumber} // for row number value
                            colNumber={inputField.colNumber} // for column number value
                            value={value}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled ?? ""))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                        />
                    );
                    break;
                case "normalfile":
                    input = (
                        <BasicInput
                            inputClass="setting-form-input"
                            type="file"
                            key={inputField.key}
                            name={inputField.name}
                            value={value}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled ?? ""))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                        />
                    );
                    break;
                case "file":
                    input = (
                        <FileInput
                            wrapperClass="setting-file-uploader-class"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            inputClass={`${inputField.key} form-input`}
                            imageSrc={value !== undefined ? String(value) : window.appLocalizer?.default_logo}
                            imageWidth={inputField.width} // for width
                            imageHeight={inputField.height} // for height
                            buttonClass="btn btn-purple"
                            openUploader={window.appLocalizer?.open_uploader} // for upload button text
                            type="hidden"
                            key={inputField.key}
                            name={inputField.name}
                            value={value !== undefined ? String(value) : ""}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                            onButtonClick={(e) => {
                                runUploader(inputField.key);
                            }}
                        />
                    );
                    break;
                case "color":
                    input = (
                        <BasicInput
                            wrapperClass="settings-color-picker-parent-class"
                            inputClass="setting-color-picker"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            key={inputField.key}
                            id={inputField.id}
                            name={inputField.name}
                            type={inputField.type}
                            value={value || "#000000"}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                        />
                    );
                    break;
                case "calender":
                    input = (
                        <CalendarInput
                            wrapperClass="settings-calender"
                            inputClass="teal"
                            multiple={inputField.multiple || false} //for single or mutiple input (true/false)
                            range={inputField.range || false} // for range select (true/false)
                            value={setting[inputField.key] || ""}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(
                                        e,
                                        inputField.key,
                                        "single",
                                        ["calender", "select", "multi-select", "wpeditor", "country"].includes(inputField.type ?? "")
                                            ? (inputField.type as "calender" | "select" | "multi-select" | "wpeditor" | "country")
                                            : "simple" // Default for unsupported types
                                    );
                                }
                            }}
                        />
                    );
                    break;
                case "button":
                    input = (
                        <div className="form-button-group">
                            <div className="setting-section-divider">&nbsp;</div>
                            <label className="settings-form-label"></label>
                            <div className="settings-input-content">
                                <BasicInput
                                    wrapperClass="settings-basic-input-class"
                                    inputClass="btn default-btn"
                                    descClass="settings-metabox-description"
                                    description={inputField.desc}
                                    type={inputField.type}
                                    placeholder={inputField.placeholder}
                                    proSetting={isProSetting(inputField.proSetting ?? false)}
                                // onChange={handleChange}
                                />
                            </div>
                        </div>
                    );
                    break;

                case "multi-number":
                    input = (
                        <MultiNumInput
                            parentWrapperClass="settings-basic-input-class"
                            childWrapperClass="settings-basic-child-wrap"
                            inputWrapperClass="settings-basic-input-child-class"
                            innerInputWrapperClass="setting-form-input"
                            inputLabelClass="setting-form-input-label"
                            idPrefix="setting-integer-input"
                            keyName={inputField.key}
                            inputClass={inputField.class}
                            value={setting[inputField.key]}
                            options={Array.isArray(inputField.options) ? inputField.options : inputField.options ? [] : []}
                            onChange={handleMultiNumberChange}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                        />
                    );
                    break;

                case "radio":
                    input = (
                        <RadioInput
                            wrapperClass="settings-form-group-radio"
                            inputWrapperClass="radio-input-label-wrap"
                            inputClass="setting-form-input"
                            descClass="settings-metabox-description"
                            activeClass="radio-select-active"
                            description={inputField.desc}
                            value={typeof value === "number" ? value.toString() : value}
                            name={inputField.name}
                            keyName={inputField.key}
                            options={Array.isArray(value) ? value : []}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                        />
                    );
                    break;
                // for radio select button with image hover
                case "radio-select":
                    input = (
                        <RadioInput
                            wrapperClass="form-group-radio-select"
                            inputWrapperClass="radioselect-class"
                            inputClass="setting-form-input"
                            radiSelectLabelClass="radio-select-under-label-class"
                            labelImgClass="section-img-fluid"
                            labelOverlayClass="radioselect-overlay-text"
                            labelOverlayText="Select your Store"
                            idPrefix="radio-select-under"
                            descClass="settings-metabox-description"
                            activeClass="radio-select-active"
                            description={inputField.desc}
                            type="radio-select"
                            value={typeof value === "number" ? value.toString() : value}
                            name={inputField.name}
                            keyName={inputField.key}
                            options={Array.isArray(value) ? value : []}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                        />
                    );
                    break;

                // for radio color input 
                case "radio-color":
                    input = (
                        <RadioInput
                            wrapperClass="form-group-radio-color"
                            inputWrapperClass="settings-radio-color "
                            inputClass="setting-form-input"
                            idPrefix="radio-color-under"
                            activeClass="radio-color-active"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            type="radio-color"
                            value={typeof value === "number" ? value.toString() : value}
                            name={inputField.name}
                            keyName={inputField.key}
                            options={Array.isArray(value) ? value : []}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(e, inputField.key);
                                }
                            }}
                        />
                    );
                    break;

                // Normal select box
                case "select":
                    input = (
                        <SelectInput
                            wrapperClass="form-select-field-wrapper"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            inputClass={inputField.key}
                            options={Array.isArray(value) ? value : []}
                            value={typeof value === "number" ? value.toString() : value}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(data) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    settingChanged.current = true;
                                    updateSetting(inputField.key, (data as SingleValue<SelectOption>)?.value);
                                }
                            }}
                        />
                    );
                    break;


                // for multiple select box with select/deselect button
                case "multi-select":
                    input = (
                        <SelectInput
                            wrapperClass="settings-from-multi-select"
                            descClass="settings-metabox-description"
                            selectDeselectClass="btn-purple select-deselect-trigger"
                            selectDeselect={inputField.select_deselect}
                            selectDeselectValue="Select / Deselect All"
                            description={inputField.desc}
                            inputClass={inputField.key}
                            options={Array.isArray(value) ? value : []}
                            type="multi-select"
                            value={typeof value === "number" ? value.toString() : value}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(selectedOption, actionMeta) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(selectedOption, inputField.key, "single", "multi-select", Array.isArray(selectedOption) ? selectedOption : []);
                                }
                            }}

                            onMultiSelectDeselectChange={(e) =>
                                handlMultiSelectDeselectChange(
                                    inputField.key,
                                    Array.isArray(inputField.options) ? inputField.options : [], // Ensure options is always an array
                                    "multi-select"
                                )
                            }

                        />
                    );
                    break;
                case "country":
                    input = (
                        <SelectInput
                            wrapperClass="country-choice-class"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            inputClass={inputField.key}
                            options={Array.isArray(value) ? value : []}
                            value={typeof value === "number" ? value.toString() : value}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(selectedOption) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(
                                        selectedOption,
                                        inputField.key,
                                        "single",
                                        "country",
                                        Array.isArray(selectedOption) ? selectedOption : [selectedOption]
                                    );
                                }
                            }}
                        />
                    );
                    break;
                case "state":
                    input = (
                        <SelectInput
                            wrapperClass="state-choice-class"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            inputClass={inputField.key}
                            options={countryState}
                            value={typeof value === "number" ? value.toString() : value}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(selectedOption) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(
                                        selectedOption,
                                        inputField.key,
                                        "single",
                                        "select",
                                        Array.isArray(selectedOption) ? selectedOption : [selectedOption]
                                    );
                                }
                            }}

                        />
                    );
                    break;
                // For single or multiple checkbox (free / pro or some free some pro)
                case "checkbox":
                    input = (
                        <MultiCheckBox
                            wrapperClass="checkbox-list-side-by-side"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            selectDeselectClass="btn-purple select-deselect-trigger"
                            inputWrapperClass="toggle-checkbox-header"
                            inputInnerWrapperClass={inputField.look == 'toggle' ? "toggle-checkbox" : "default-checkbox"}// this props for change classes default/ Toggle
                            inputClass={inputField.class}
                            tour={inputField.tour}
                            hintOuterClass="checkbox-description"
                            hintInnerClass="hover-tooltip"
                            idPrefix="toggle-switch"
                            selectDeselect={inputField.select_deselect}
                            selectDeselectValue="Select / Deselect All"
                            rightContentClass="settings-checkbox-description"
                            rightContent={inputField.right_content} // for place checkbox right
                            options={Array.isArray(inputField.options) ? inputField.options : []}
                            value={Array.isArray(value) ? value : typeof value === "string" ? [value] : []}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(e, inputField.key, "multiple");
                                }
                            }}
                            onMultiSelectDeselectChange={(e) =>
                                handlMultiSelectDeselectChange(inputField.key, Array.isArray(inputField.options) ? inputField.options : [])
                            }
                            proChanged={() => setModelOpen(true)}
                        />
                    );
                    break;
                // For particular plugin required checkbox ( like if stock-alert plugin not active the checkbox not open)
                case "stock-alert-checkbox":
                    input = (
                        <MultiCheckBox
                            wrapperClass="checkbox-list-side-by-side"
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            selectDeselectClass="btn-purple select-deselect-trigger"
                            inputWrapperClass="toggle-checkbox-header"
                            inputInnerWrapperClass="toggle-checkbox"
                            inputClass={inputField.class}
                            hintOuterClass="dashicons dashicons-info"
                            hintInnerClass="hover-tooltip"
                            idPrefix="toggle-switch"
                            selectDeselect={inputField.select_deselect}
                            selectDeselectValue="Select / Deselect All"
                            rightContentClass="settings-metabox-description"
                            rightContent={inputField.right_content}
                            options={Array.isArray(inputField.options) ? inputField.options : []}
                            value={Array.isArray(value) ? value : typeof value === "string" ? [value] : []}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e) => {
                                const dependentPlugin = inputField.dependentPlugin ? false : true;
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled), inputField.dependentSetting, dependentPlugin)) {
                                    if (inputField.dependentPlugin) {
                                        handleChange(e, inputField.key, "multiple");
                                    }
                                }
                            }}
                            onMultiSelectDeselectChange={(e) =>
                                handlMultiSelectDeselectChange(
                                    inputField.key,
                                    Array.isArray(inputField.options)
                                        ? inputField.options.map(({ value, proSetting }) => ({
                                            value: String(value),  // Convert to string
                                            proSetting
                                        }))
                                        : [] // Default to an empty array if it's not an array
                                )
                            }

                        />
                    );
                    break;
                // Rectangle radio toggle button
                case "settingToggle":
                    input = (
                        <ToggleSetting
                            wrapperClass={`setting-form-input`}
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            key={inputField.key}
                            options={Array.isArray(inputField.options) ? inputField.options : []}
                            value={String(value ?? inputField.defaultValue ?? "")}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(data) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    settingChanged.current = true;
                                    updateSetting(inputField.key, data)
                                }
                            }}
                        />
                    );
                    break;
                case "wpeditor":
                    input = (
                        <WpEditor
                            apiKey={String(window.appLocalizer?.mvx_tinymce_key || "")}
                            value={String(value)}
                            onEditorChange={(e) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    handleChange(e, inputField.key, "single", "wpeditor");
                                }
                            }}
                        />
                    );
                    break;
                case "label":
                    input = (
                        <Label
                            wrapperClass="form-group-only-label"
                            descClass="settings-metabox-description"
                            value={String(inputField.valuename)}
                            description={inputField.desc}
                        />
                    );
                    break;
                // For separation (if you want heading in line then put desc or add some description then add hint)
                case "section":
                    input = (
                        <Section
                            wrapperClass="setting-section-divider"
                            value={inputField.desc}
                            hint={inputField.hint} />
                    );
                    break;

                case "blocktext":
                    input = (
                        <BlockText
                            wrapperClass="blocktext-class"
                            blockTextClass="settings-metabox-description-code"
                            value={String(inputField.blocktext)}
                        />
                    );
                    break;
                // Special input type project specific
                // customize button
                case "button-customizer":
                    input = (
                        <ButtonCustomizer
                            text={(setting[inputField.key]?.button_text) || 'Button Text'}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            setting={setting[inputField.key]}
                            onChange={(key, value, isRestoreDefaults = false) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    settingChanged.current = true;
                                    if (isRestoreDefaults) {
                                        updateSetting(inputField.key, value);
                                    } else {
                                        updateSetting(inputField.key, { ...setting[inputField.key], [key]: value });
                                    }
                                }
                            }}
                        />
                    );
                    break;
                case "stock-alert-form-customizer":
                    input = (
                        <FormCustomizer
                            value={String(value)}
                            buttonText={setting.customize_btn && setting.customize_btn.button_text || 'Submit'}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(e, key) => {
                                if (!proSettingChanged(inputField.proSetting ?? false)) {
                                    settingChanged.current = true;
                                    updateSetting(e, key);
                                }
                            }}
                        />
                    );
                    break;
                // custom from with free-pro tab
                case "form-customizer":
                    input = (
                        <FreeProFormCustomizer
                            key={inputField.key}
                            setting={setting}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            proSettingChange={() => proSettingChanged(inputField.proSetting ?? false)}
                            moduleEnabledChange={() => moduleEnabledChanged(String(inputField.moduleEnabled))}
                            onChange={(key, value) => {
                                settingChanged.current = true;
                                updateSetting(key, value);
                            }}
                        />
                    );
                    break;
                // shop page builder( use in catalogx )
                case "catalog-customizer":
                    input = (
                        <CatalogCustomizer
                            setting={setting}
                            proSetting={window.appLocalizer?.khali_dabba ?? false}
                            onChange={(key, value) => {
                                settingChanged.current = true;
                                updateSetting(key, value);
                            }}
                        />
                    );
                    break;
                // for Grid-table input with multiple checkbox
                case "multi-checkbox-table":
                    input = (
                        <MultiCheckboxTable
                            rows={inputField.rows} // row array
                            columns={inputField.columns} // columns array
                            description={String(inputField.desc)}
                            setting={setting}
                            proSetting={isProSetting(inputField.proSetting ?? false)}
                            modules={modules}
                            onChange={(key, value) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    settingChanged.current = true;
                                    updateSetting(key, value);
                                }
                            }}
                            moduleChange={(moduleEnabled) => {
                                setModelModuleOpen(true);
                                setModulePopupData({
                                    name: moduleEnabled,
                                    settings: '',
                                    plugin: '',
                                });

                            }}
                        />
                    );
                    break;
                case "mergeComponent":
                    input = (
                        <MergeComponent
                            wrapperClass={`setting-form-input`}
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            value={typeof value === "object" && value !== null ? value : {}}
                            fields={Array.isArray(inputField.fields) ? inputField.fields : []} proSetting={isProSetting(inputField.proSetting ?? false)}
                            onChange={(data) => {
                                if (!proSettingChanged(inputField.proSetting ?? false) && !moduleEnabledChanged(String(inputField.moduleEnabled))) {
                                    settingChanged.current = true;
                                    updateSetting(inputField.key, data)
                                }
                            }}
                        />
                    );
                    break;
                // for shortcode name and description
                case "shortCode-table":
                    input = (
                        <ShortCodeTable
                            wrapperClass={`setting-form-input`}
                            descClass="settings-metabox-description"
                            description={inputField.desc}
                            key={inputField.key}
                            options={Array.isArray(inputField.options) ? inputField.options : []} // array includes label and description
                            optionLabel={inputField.optionLabel}
                        />
                    );
                    break;
                // Synchronize button (Changes later)
                case "syncbutton":
                    input = <SyncNow
                        buttonKey={inputField.key}
                        apilink={String(inputField.apilink)} // apilink 
                        value={String(inputField.value)}
                        description={String(inputField.desc)}
                        proSetting={isProSetting(inputField.proSetting??false)}
                        proSettingChanged={() => proSettingChanged(inputField.proSetting??false)}
                        interval={Number(inputField.interval)}
                        statusApiLink={String(inputField.statusApiLink)} // api for each status of synchronization
                    />
                    break;
            }

            return input;
        });
    };



    return <div>{successMsg && <p>{successMsg}</p>}</div>;
};

export default AdminForm;
