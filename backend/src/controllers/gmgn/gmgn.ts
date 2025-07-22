import {
  FP_DIDS,
  GMGN_APP_VER,
  GMGN_CLIENT_ID,
  GMGN_COOKIE,
  GMGN_DEVICE_ID,
  INVEST_AMOUNT,
  JITO_TIP,
  REFERERS,
  STORE,
  TZ_NAME,
} from "../../utils/constants";
import { readFile, writeFile } from "../../utils/file";
import { v4 as uuidv4 } from "uuid";
import { sleep } from "../../utils/helper";
import { TSetting, TSimulationResponse, TToken, TTokenInformation, TTradeH, TWalletInfo } from "../../types/dataType";
import { getTokenInformation, getWalletInfo } from "./api";
import { checkWallet } from "./utility";
import { setCustomSettingAsString, setSettingAsString } from "../../utils/format";


export function isBadWallet(walletInfo: TWalletInfo) {
  const { winrate, buy_7d, pnl_7d, balance, risk, tags, pnl_1d } = walletInfo;

  if (
    winrate < 0.3 ||
    pnl_7d < 0.7 ||
    buy_7d >= 20 * 7 ||
    // Number(balance) < 0.5 ||
    (risk && risk.fast_tx_ratio > 0.4) ||
    tags.map((tag) => tag.toLowerCase()).includes("kol")
  ) {
    return true;
  }
  return false;
}

export async function getTokensFromWallet(wallet: string, index: number) {
  try {
    const threeDaysAgo = Math.floor(
      new Date().setHours(0, 0, 0, 0) / 1000 - 4 * 24 * 60 * 60
    );

    let data: Array<TToken> = [];

    const getTokens = async (cursor: string) => {
      const requestOptions: any = {
        method: "GET",
        headers: {
          "User-Agent": "PostmanRuntime/7.43.3",
          Referer: REFERERS[index] + wallet,
          Host: "gmgn.ai",
          "Postman-Token": uuidv4(),
        },
      };
      requestOptions.headers["Cookie"] = GMGN_COOKIE;

      const url = new URL(
        "https://gmgn.ai/api/v1/wallet_holdings/sol/" + wallet
      );

      const getTokensParams = new URLSearchParams({
        device_id: GMGN_DEVICE_ID,
        client_id: GMGN_CLIENT_ID,
        from_app: "gmgn",
        app_ver: GMGN_APP_VER,
        tz_name: TZ_NAME,
        tz_offset: "-25200",
        app_lang: "en-US",
        fp_did: FP_DIDS[index],
        os: "web",
        limit: "1000",
        orderby: "last_active_timestamp",
        direction: "desc",
        showsmall: "true",
        sellout: "true",
        tx30d: "true",
      });
      if (cursor && cursor !== "") {
        getTokensParams.append("cursor", cursor);
      }
      url.search = getTokensParams.toString();
      const response = await fetch(url.toString(), requestOptions).then(
        async (response) => await response.json()
      );

      return response;
    };

    let resNext = null;
    while (resNext !== "") {
      const res = await getTokens(resNext);

      resNext = res.data.next;
      if (res.data.holdings.length === 0) {
        console.error("Can't find tokens! ");
        break;
      }
      if (
        res.data.holdings[res.data.holdings.length - 1].start_holding_at <
        threeDaysAgo
      ) {
        data = [...data, ...res.data.holdings];
        break;
      }
      if (res.message !== "success") {
        console.error(
          "Get Tokens From Wallet Error: ",
          wallet,
          " unsuccessful fetch!"
        );
        break;
      }
      data = [...data, ...res.data.holdings];

      if (res.data.next !== "") await sleep(5);
    }

    const tokens = data.map((d) => d.token.address);
    const tokenRes: Array<TTokenInformation> = [];
    for (let i = 0; i < tokens.length; i += 10) {
      const tokenInfo = await getTokenInformation(
        tokens.slice(i, i + 10),
        index
      );
      if (tokenInfo) {
        tokenRes.push(...tokenInfo);
      }
      await sleep(3);
    }

    const returnData = data.map((d) => ({
      ...d,
      balance: Number(d.balance),
      usd_value: Number(d.usd_value),
      realized_profit_30d: Number(
        (Number(d.realized_profit_30d) / STORE.SOL_PRICE).toFixed(3)
      ),
      realized_profit: Number(
        (Number(d.realized_profit) / STORE.SOL_PRICE).toFixed(3)
      ),
      realized_pnl: Number(d.realized_pnl),
      realized_pnl_30d: Number(d.realized_pnl_30d),
      unrealized_profit: Number(d.unrealized_profit),
      unrealized_pnl: Number(d.unrealized_pnl),
      total_profit: Number(
        (Number(d.total_profit) / STORE.SOL_PRICE).toFixed(3)
      ),
      total_profit_pnl: Number(d.total_profit_pnl) / STORE.SOL_PRICE,
      avg_cost: Number((Number(d.avg_cost) * 1000000).toFixed(3)),
      avg_sold: Number((Number(d.avg_sold) * 1000000).toFixed(3)),
      buy_30d: Number(d.buy_30d),
      sell_30d: Number(d.sell_30d),
      sells: Number(d.sells),
      price: Number((Number(d.price) * 1000000).toFixed(3)),
      cost: Number(d.cost),
      position_percent: Number(d.position_percent),
      last_active_timestamp: Number(d.last_active_timestamp),
      history_sold_income: Number(
        (Number(d.history_sold_income) / STORE.SOL_PRICE).toFixed(3)
      ),
      history_bought_cost: Number(
        (Number(d.history_bought_cost) / STORE.SOL_PRICE).toFixed(3)
      ),
      start_holding_at: Number(d.start_holding_at),
      end_holding_at: Number(d.end_holding_at),
      liquidity: Number(d.liquidity),
      total_supply: Number(d.total_supply),
    }));

    const mergedData = returnData.map((token) => {
      const stagingToken = tokenRes.find(
        (staging) => staging.address === token.token.token_address
      );
      if (stagingToken)
        return {
          ...token,
          created_at: stagingToken.creation_timestamp,
          migrated_at:
            stagingToken.pool.exchange === "pump_amm" ||
            stagingToken.pool.exchange === "ray_v4" ||
            stagingToken.pool.exchange === "meteora_amm"
              ? stagingToken.pool.creation_timestamp
              : null,
          platform: stagingToken.pool.exchange,
          creator: stagingToken.dev.creator_address,
        };
      return {
        ...token,
        created_at: null,
        migrated_at: null,
        platform: "undefined",
      };
    });

    const filteredData = mergedData;

    const getTradeHistory = async (token: string) => {
      const requestOptions: any = {
        method: "GET",
        headers: {
          "User-Agent": "PostmanRuntime/7.43.3",
          Referer: REFERERS[index] + wallet,
          Host: "gmgn.ai",
          "Postman-Token": uuidv4(),
        },
      };
      requestOptions.headers["Cookie"] = GMGN_COOKIE;

      const url = new URL(
        "https://gmgn.ai/defi/quotation/v1/wallet_token_activity/sol"
      );

      const getTokensParams = new URLSearchParams({
        device_id: GMGN_DEVICE_ID,
        client_id: GMGN_CLIENT_ID,
        from_app: "gmgn",
        app_ver: GMGN_APP_VER,
        tz_name: TZ_NAME,
        tz_offset: "-25200",
        app_lang: "en-US",
        fp_did: FP_DIDS[index],
        os: "web",
        limit: "50",
        wallet,
        token,
      });

      url.search = getTokensParams.toString();
      const response = await fetch(url.toString(), requestOptions).then(
        async (response) => await response.json()
      );

      return response;
    };
    for (let i = 0; i < filteredData.length; i++) {
      const element = filteredData[i];
      try {
        if (element.buy_30d > 1) {
          let res: { msg: string; data: { activities: Array<TTradeH> } };
          try {
            res = await getTradeHistory(element.token.token_address);
          } catch (err) {
            console.error(
              "Get Trading History Error: ",
              wallet,
              element.token.token_address
            );
            await sleep(10);
            res = await getTradeHistory(element.token.token_address);
          }

          if (res.msg !== "success") {
            console.error(
              "Fetch Trading History Error: ",
              wallet,
              element.token.token_address
            );
            continue;
          }
          const buyActivities = res.data.activities.filter(
            (activity) => activity.event_type === "buy"
          );

          const leastTimestampBuy = buyActivities.reduce(
            (min, activity) =>
              activity.timestamp < min.timestamp ? activity : min,
            buyActivities[0]
          );

          filteredData[i].buy_at = Number(
            (leastTimestampBuy.price_usd * 1000000).toFixed(3)
          );
          filteredData[i].buy = Number(
            (leastTimestampBuy.cost_usd / STORE.SOL_PRICE).toFixed(3)
          );
          await sleep(2);
        }
      } catch (err) {
        console.error(
          "Second Getting Trading History Error: ",
          wallet,
          element.token.token_address
        );
        continue;
      }
    }
    return filteredData.filter((d) => d.start_holding_at >= threeDaysAgo);
  } catch (err) {
    console.error(wallet, "Get Tokens From Wallet Error: ", err);
    await sleep(10);
    return getTokensFromWallet(wallet, index);
  }
}

export async function addGoodTargetWallet(
  wallet: string,
  settings: {
    reason: string[];
    setting: TSetting;
    lastActiveTime: number;
    lastActiveToken: string;
    timezones: number[];
    custom_settings: TSimulationResponse;
  },
  walletInfo: TWalletInfo | null
) {
  const { reason, setting, lastActiveTime, lastActiveToken, timezones, custom_settings } =
    settings;
  console.log(custom_settings)
  const result = {
    address: wallet,
    strategy: reason.join("\n"),
    description: `profit | pnl | rate | tx \n ${setting.totalProfit} | ${setting.totalPNL} | ${setting.winRate} | ${setting.tx} \n ${setting.realTotalProfit} | ${setting.totalRealPNL} | ${setting.realWinRate} | ${setting.realTx} \n ${(custom_settings.max_limit_pnl - custom_settings.max_filtered_pnl_count).toFixed(2)} | ${(custom_settings.max_limit_pnl / custom_settings.max_filtered_pnl_count).toFixed(2)} | ${custom_settings.win_rate.toFixed(2)} | ${custom_settings.max_filtered_pnl_count} \n =========================
time: ${setting.avgHoldingTime}
lastActiveTime: ${new Date(lastActiveTime * 1000).toLocaleString("en-US", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    })}
lastActiveToken: ${lastActiveToken}
timezones: ${timezones.join(", ")}
${
  walletInfo
    ? `7d tag | winrate | tokens / profit | pnl | time
${walletInfo.tags.join(" ")} | ${walletInfo.winrate.toFixed(2)} | ${
        walletInfo.token_num
      } / ${walletInfo.profit_num} | ${walletInfo.pnl_7d.toFixed(
        2
      )} | ${walletInfo.avg_holding_peroid.toFixed(0)}s`
    : ""
}`,
    date: new Date().toLocaleString("en-US", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }),
    finder: "-",
    setting: `Invest: ${INVEST_AMOUNT} / ${JITO_TIP}
First Interaction
Follow Sell
Buy Only Once
Pump & Bonk
${setCustomSettingAsString(custom_settings)}`,
  };
  STORE.GOOD_TARGETS.push(result);

  writeFile("good_targets", STORE.GOOD_TARGETS);
}

export const simulateTargetWallets = async (wallets: string[] = []) => {
  const apiVersion = 1;
  if (wallets.length === 0) {
    const targets = (await readFile("targets")); // [{ wallet: 'ANH6zePnj2K4DdTj7x5xSimD3jafTTmTFQcNvdaDmzxH' }] //
    wallets = targets.map((target: any) => target.wallet);
  }

  STORE.GOOD_TARGETS = [];
  if (STORE.SIMULATING) return;
  STORE.SIMULATING = true;

  for (const wallet of wallets) {
    console.log('Analyzing wallet: ', wallet)
    const walletInfo = await getWalletInfo(wallet);
    let isBad = false;

    await sleep(3);
    if (walletInfo) {
      isBad = isBadWallet(walletInfo);
      console.log(wallet, "is bad: ", isBad)
      if (isBad) continue;
    }

    const tokens = await getTokensFromWallet(wallet, apiVersion);
    if (tokens.length == 0) {
      console.log(wallet, "has no tokens");
    }


    const settings = await checkWallet(wallet, tokens);
    if (!settings.setting) continue;
    const notApprovedKeyCount = Object.keys(settings.approved).length;

    const isUseful = walletInfo
      ? walletInfo.pnl_7d > 0.9 &&
        (walletInfo.winrate > 0.8 ||
          (walletInfo.token_num < 4 && walletInfo.winrate > 0.3))
      : false;

    if (notApprovedKeyCount <= 2 || isUseful) {
      await addGoodTargetWallet(wallet, settings, walletInfo);
    } else {
      // await addFailedTargetWallet(wallet.wallet, settings, walletInfo);
      // log.bad = log.bad + 1;
    }
    await sleep(10);
  }

  STORE.SIMULATING = false;
};
