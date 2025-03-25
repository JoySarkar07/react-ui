import React, { useState, useEffect } from "react";
import "./InputMailchimpList.scss";
import { useSetting } from "../../../context/SettingContext";
import { getApiLink, getApiResponse } from "../../../service/apiService";
import { BasicInput } from "../../Input";
import SelectInput from "../../Input/SelectInput/SelectInput";

// Define types for API response and component props
interface SelectOption {
  value: string;
  label: string;
}

interface InputMailchimpListProps {
  mailchimpKey: string;
  optionKey: string;
  settingChanged: React.MutableRefObject<boolean>;
  apiLink: string;
  proSettingChanged: () => boolean;
  onChange: (event: { target: { value: string } }, key: string) => void;
  selectKey: string;
  value?: string;
}

const InputMailchimpList: React.FC<InputMailchimpListProps> = (props) => {
  const { mailchimpKey, optionKey, settingChanged } = props;

  // State variables
  const { setting, updateSetting } = useSetting();
  const [selectOption, setSelectOption] = useState<SelectOption[]>(setting[optionKey] || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [showOption, setShowOption] = useState<boolean>(false);
  const [mailchimpErrorMessage, setMailchimpErrorMessage] = useState<string>("");

  const updateSelectOption = async () => {
    if (!setting[mailchimpKey]) {
      setMailchimpErrorMessage("Kindly use a proper MailChimp key.");
    } else {
      setLoading(true);
      setMailchimpErrorMessage("");

      try {
        const options: SelectOption[] = (await getApiResponse(getApiLink(props.apiLink))) ?? []; // ✅ Ensure it's always an array
        settingChanged.current = true;
        updateSetting(optionKey, options);
        setSelectOption(options);
        setShowOption(true);
      } catch (error) {
        console.error("Error fetching Mailchimp list:", error);
        setMailchimpErrorMessage("Failed to fetch MailChimp list.");
      } finally {
        setLoading(false);
      }
    }
  };


  return (
    <div className="connect-main-wrapper">
      <BasicInput
        wrapperClass="setting-form-input"
        descClass="settings-metabox-description"
        type="text"
        value={setting[mailchimpKey]}
        proSetting={false}
        onChange={(e) => {
          if (!props.proSettingChanged()) {
            props.onChange(e, mailchimpKey);
          }
        }}
      />

      <div className="loader-wrapper">
        <button
          className="btn-purple btn-effect"
          onClick={(e) => {
            e.preventDefault();
            if (!props.proSettingChanged()) {
              updateSelectOption();
            }
          }}
        >
          Fetch List
        </button>

        {loading && (
          <div className="loader">
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
            <div className="three-body__dot"></div>
          </div>
        )}
      </div>

      {(selectOption.length > 0 || showOption) && (
        <SelectInput
          onChange={(e) => {
            if (!props.proSettingChanged() && e && "value" in e) {
              props.onChange({ target: { value: e.value } }, props.selectKey);
            }
          }}
          options={selectOption}
          value={props.value}
        />

      )}
    </div>
  );
};

export default InputMailchimpList;
