import { TFilters } from "../types/dataType";

export function setSettingAsString(setting: TFilters): string {
    let result = "";
    if (setting.min_mc) {
      result += `\nMin MC: ${setting.min_mc}k`;
    }
    if (setting.max_mc) {
      result += `\nMax MC: ${setting.max_mc}k`;
    }
    if (setting.min_buy) {
      result += `\nMin Trigger Buy: ${setting.min_buy}`;
    }
    if (setting.max_buy) {
      result += `\nMax Trigger Buy: ${setting.max_buy}`;
    }
    return result;
  }
  