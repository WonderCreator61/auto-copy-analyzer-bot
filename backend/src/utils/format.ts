import { TFilters, TSimulationResponse } from "../types/dataType";

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
  
  export function setCustomSettingAsString(setting: TSimulationResponse): string {
    let result = "";
    if (setting.min_mc) {
      result += `\nMin MC: ${setting.min_mc}k`;
    }
    if (setting.max_mc) {
      result += `\nMax MC: ${setting.max_mc}k`;
    }
    if (setting.min_token_age) {
      result += `\nMin Token Age: ${setting.min_token_age} seconds`;
    }
    if (setting.max_token_age) {
      result += `\nMax Token Age: ${setting.max_token_age} seconds`;
    }
    result += "\n";
    for (let i = 0; i < setting.max_limit_multiples.length; i++) {
      if (setting.max_limit_percents[i] > 0) {
        result += `\n ${setting.max_limit_multiples[i]}X: ${setting.max_limit_percents[i] * 100}%`;
      }
      if (setting.max_limit_percents[i] == 1) {
        break;
      }
    }
    return result;
  }
  