import { TFilters, TSetting, TSimulationResponse, TToken } from "../../types/dataType";
import { INVEST_AMOUNT, JITO_TIP, STORE } from "../../utils/constants";
import { readFile, writeFile } from "../../utils/file";
import { sleep } from "../../utils/helper";
import {
  getRatioLongHolding,
  getRatioSameSymbol,
  getRatioShortHolding,
  isAvgFirstBuyGood,
  isBadTokenCountLargerThan,
  isTotalProfitLargerThan,
} from "../../utils/walletFilter";
import { getDevCreationTokens, getDevs, getTokenCandlePoint } from "./api";

function getExpectedMC(mc: number, invest: number) {
  const initialTokenAmount = Math.pow(10, 9);
  const tokenPrice = mc / Math.pow(10, 6);
  const solPrice = STORE.SOL_PRICE;

  const solAmountInPool =
    Math.sqrt((initialTokenAmount * tokenPrice * 30) / solPrice) - 30;

  const expectedPrice =
    (solPrice * 30 + solPrice * solAmountInPool) /
    ((30 * initialTokenAmount) / (30 + invest + solAmountInPool));
  const expectedMC = expectedPrice * Math.pow(10, 6);

  return expectedMC;
}

function getWithdrawAmount(butAt: number, sellAt: number, invest: number) {
  return (sellAt / butAt) * invest;
}

export function calculateRealProfit(data: Array<TToken>) {
  return data.map((item) => {
    const buyAt = item?.buy_at ?? item.avg_cost;
    const sellAt = item.sell_at ?? item.avg_sold;
    const realBuyAt = getExpectedMC(buyAt, INVEST_AMOUNT);
    const withdrawAmount = getWithdrawAmount(buyAt, sellAt, INVEST_AMOUNT);
    const realSellAt = getExpectedMC(sellAt, withdrawAmount);

    const realProfit =
      getWithdrawAmount(realBuyAt, realSellAt, INVEST_AMOUNT) -
      JITO_TIP -
      0.02 -
      INVEST_AMOUNT;
    return {
      ...item,
      realProfit,
      realPNL: realProfit / INVEST_AMOUNT,
    };
  });
}

function calculateRealTotalProfit(
  data: Array<TToken & { realProfit: number; realPNL: number }>,
  min_mc: number | null,
  max_mc: number | null,
  min_buy: number | null,
  max_buy: number | null
) {
  let index = 0;
  const sum = data.reduce((sum, row) => {
    if (
      (min_mc === null || (row?.buy_at ?? row.avg_cost) >= min_mc) &&
      (max_mc === null || (row?.buy_at ?? row.avg_cost) <= max_mc) &&
      (min_buy === null || (row?.buy ?? row.history_bought_cost) >= min_buy) &&
      (max_buy === null || (row?.buy ?? row.history_bought_cost) <= max_buy)
    ) {
      index++;
      return sum + row.realProfit;
    }
    return sum;
  }, 0);
  return { sum, index };
}

function calculateNecessaryData(
  data: Array<TToken & { realProfit: number; realPNL: number }>,
  min_mc: number | null,
  max_mc: number | null,
  min_buy: number | null,
  max_buy: number | null,
  tx: number
) {
  const filteredData = data.filter((row) => {
    if (
      (min_mc === null || (row?.buy_at ?? row.avg_cost) >= min_mc) &&
      (max_mc === null || (row?.buy_at ?? row.avg_cost) <= max_mc) &&
      (min_buy === null || (row?.buy ?? row.history_bought_cost) >= min_buy) &&
      (max_buy === null || (row?.buy ?? row.history_bought_cost) <= max_buy)
    ) {
      return true;
    }
    return false;
  });
  const totalProfit = filteredData
    .reduce((sum, row) => {
      return sum + row.realized_profit;
    }, 0)
    .toFixed(2);
  const totalPNL = (
    filteredData.reduce((sum, row) => {
      return sum + row.realized_pnl;
    }, 0) / filteredData.length
  ).toFixed(2);
  const totalRealPNL = (
    filteredData.reduce((sum, row) => {
      return sum + row.realPNL;
    }, 0) / filteredData.length
  ).toFixed(2);
  const realWinRate = (
    filteredData.filter((row) => row.realProfit > 0).length /
    filteredData.length
  ).toFixed(2);
  const winRate = (
    filteredData.filter((row) => row.realized_profit > 0).length /
    filteredData.length
  ).toFixed(2);

  const avgHoldingTime =
    filteredData.reduce((sum, row) => {
      return (
        sum +
        ((row.last_active_timestamp
          ? row.last_active_timestamp
          : new Date().getTime() / 1000) -
          row.start_holding_at)
      );
    }, 0) / filteredData.length;

  const days = Math.floor(avgHoldingTime / (60 * 60 * 24));
  const hours = Math.floor((avgHoldingTime % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((avgHoldingTime % (60 * 60)) / 60);
  const seconds = Math.floor((avgHoldingTime % 60) / 1000);
  const formattedAvgHoldingTime =
    days > 0
      ? days + "d"
      : hours > 0
      ? hours + "hr"
      : minutes > 0
      ? minutes + "m"
      : seconds + "s";

  return {
    totalProfit: Number(totalProfit),
    totalPNL: Number(totalPNL),
    totalRealPNL: Number(totalRealPNL),
    tx: data.length,
    realWinRate: Number(realWinRate),
    winRate: Number(winRate),
    realTx: tx,
    avgHoldingTime: formattedAvgHoldingTime,
  };
}

export function findBestSettings(tokens: Array<TToken>): TSetting {
  let bestProfit = -Infinity;
  let bestFilters: TFilters = {
    min_mc: null,
    max_mc: null,
    min_buy: null,
    max_buy: null,
    tx: 0,
  };
  let bestProfit1 = -Infinity;
  let bestFilters1: TFilters = {
    min_mc: null,
    max_mc: null,
    min_buy: null,
    max_buy: null,
    tx: 0,
  };
  let bestProfit2 = -Infinity;
  let bestFilters2: TFilters = {
    min_mc: null,
    max_mc: null,
    min_buy: null,
    max_buy: null,
    tx: 0,
  };

  let selectedFilter = 1;

  const data = calculateRealProfit(tokens);

  if (data.filter((d) => (d?.buy_at ?? d.avg_cost) < 100).length > 1) {
    for (let min_mc = 6; min_mc <= 20; min_mc += 1) {
      for (let max_mc = 30; max_mc < 100; max_mc += 10) {
        for (let min_buy = 0.1; min_buy <= 1; min_buy += 0.1) {
          for (let max_buy = 2; max_buy < 6; max_buy += 1) {
            const totalRealProfit = calculateRealTotalProfit(
              data,
              min_mc,
              max_mc,
              min_buy,
              max_buy
            );
            if (totalRealProfit.sum > bestProfit1) {
              bestProfit1 = totalRealProfit.sum;
              bestFilters1 = {
                min_mc,
                max_mc,
                min_buy,
                max_buy,
                tx: totalRealProfit.index,
              };
            }
          }
        }
      }
    }
  }

  if (data.filter((d) => (d?.buy_at ?? d.avg_cost) >= 100).length > 1) {
    for (let min_mc = 100; min_mc <= 1000; min_mc += 50) {
      for (let max_mc = 150; max_mc < 3000; max_mc += 50) {
        for (let min_buy = 0.5; min_buy <= 5; min_buy += 0.5) {
          for (let max_buy = 4; max_buy < 20; max_buy += 0.5) {
            const totalRealProfit = calculateRealTotalProfit(
              data,
              min_mc,
              max_mc,
              min_buy,
              max_buy
            );
            if (totalRealProfit.sum > bestProfit2) {
              bestProfit2 = totalRealProfit.sum;
              bestFilters2 = {
                min_mc,
                max_mc,
                min_buy,
                max_buy,
                tx: totalRealProfit.index,
              };
            }
          }
        }
      }
    }
  }
  console.info(
    `Best Profit 1: ${bestProfit1}`,
    `Best Profit 2: ${bestProfit2}`
  );
  console.info(`Best Filters 1: ${JSON.stringify(bestFilters1)}`);
  console.info(`Best Filters 2: ${JSON.stringify(bestFilters2)}`);

  if (bestProfit1 > bestProfit2) {
    bestProfit = bestProfit1;
    bestFilters = bestFilters1;
    selectedFilter = 1;
  } else {
    bestProfit = bestProfit2;
    bestFilters = bestFilters2;
    selectedFilter = 2;
  }
  // Ensure max_mc is set
  if (bestFilters.max_mc === null && selectedFilter === 1) {
    bestFilters.max_mc = 100; // Set to the highest possible value within constraints
  } else if (bestFilters.max_mc === null && selectedFilter === 2) {
    bestFilters.max_mc = 3000; // Set to the highest possible value within constraints
  }

  // Reset other filters to null if they do not improve the result
  const checkNullFilters = (filterKey: keyof TFilters) => {
    if (filterKey !== "max_mc" && filterKey !== "tx") {
      // Ensure max_mc is not reset
      const originalValue = bestFilters[filterKey];
      bestFilters[filterKey] = null;
      const totalRealProfit = calculateRealTotalProfit(
        data,
        bestFilters.min_mc,
        bestFilters.max_mc,
        bestFilters.min_buy,
        bestFilters.max_buy
      );
      if (totalRealProfit.sum < bestProfit) {
        bestFilters[filterKey] = originalValue;
      }
    }
  };

  (["min_mc", "max_mc", "min_buy", "max_buy"] as (keyof TFilters)[]).forEach(
    checkNullFilters
  );
  const necessaryData = calculateNecessaryData(
    data,
    bestFilters.min_mc,
    bestFilters.max_mc,
    bestFilters.min_buy,
    bestFilters.max_buy,
    bestFilters.tx
  );
  return {
    ...bestFilters,
    realTotalProfit: Number(bestProfit.toFixed(2)),
    ...necessaryData,
  };
}

export async function checkWallet(wallet: string, tokens: Array<TToken>) {
  let reason: Array<string> = [];
  let approved = {};
  const timezones: Array<number> = [];

  // get active time of the wallet
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const activeTime = token.start_holding_at;
    const hour = new Date(activeTime * 1000).getHours() + 9;
    if (timezones.includes(hour > 24 ? hour - 24 : hour)) {
      continue;
    }
    timezones.push(hour > 24 ? hour - 24 : hour);
  }

  const lastActive = tokens.sort(
    (a, b) => a.start_holding_at - b.start_holding_at
  )[tokens.length - 1];

  const lastActiveToken = tokens.sort(
    (a, b) => a.last_active_timestamp - b.last_active_timestamp
  )[tokens.length - 1].token.symbol;
  const lastActiveTime = lastActive.start_holding_at;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const athTokens: Array<{
      address: string;
      ath: number;
      ath_time: number;
      atl: number;
      atl_time: number;
      devTeam: number;
      devTokens: number;
      devOpenedTokens: number;
      devSource: string;
      devOperator: string;
    }> = await readFile("tokens");

    let athToken = athTokens.find((t) => t.address === token.token.address);

    if (!athToken) {
      await sleep(3);
      const candlePoints = await getTokenCandlePoint(
        token.token.address,
        token.created_at!,
        Math.floor(new Date().getTime() / 1000),
        0
      );

      if (candlePoints) {
        // get the highest price and the time of that object:
        const highestPrice = Math.max(
          ...candlePoints.map((point) => parseFloat(point.high))
        );
        const highestPriceTime = candlePoints.find(
          (point) => parseFloat(point.high) === highestPrice
        );
        // get the lowest price
        const lowestPrice = Math.min(
          ...candlePoints.map((point) => parseFloat(point.low))
        );
        const lowestPriceTime = candlePoints.find(
          (point) => parseFloat(point.low) === lowestPrice
        );

        const devs = await getDevs(token.token.address, "profit", 0);
        const creator = devs.list.find((dev) =>
          dev.maker_token_tags.includes("creator")
        );

        const devTokens = await getDevCreationTokens(token.creator!, 0);
        const ath = {
          address: token.token.address,
          ath: Number((Number(highestPrice) * Math.pow(10, 6)).toFixed(2)),
          ath_time: Number(highestPriceTime?.time) / 1000,
          atl: Number((Number(lowestPrice) * Math.pow(10, 6)).toFixed(2)),
          atl_time: Number(lowestPriceTime?.time) / 1000,
          devTeam: devs.list.length,
          devTokens: devTokens?.inner_count as number,
          devOpenedTokens: devTokens?.open_count as number,
          devSource: creator?.native_transfer?.name ?? ("N/A" as string),
          devOperator: creator?.tags.join(",") as string,
        };

        await writeFile("tokens", [...athTokens, ath]);
        console.info("ATH Token: ", token.token.address, ath.ath);
        athToken = ath;
      }
    }

    if (athToken && athToken.ath_time > token.start_holding_at) {
      tokens[i] = { ...token, sell_at: athToken.ath };
    }
  }

  const setting = await findBestSettings(tokens);

  const symbolRatio = getRatioSameSymbol(tokens);
  if (symbolRatio > 0.5) {
    reason.push(" - Symbol Ratio is too low");

    approved = { ...approved, symbolRatio: false };
  }

  const shortHoldingRatio = getRatioShortHolding(tokens, 10);
  if (shortHoldingRatio > 0.3) {
    reason.push(" - Too short term holder");

    approved = { ...approved, shortHoldingRatio: false };
  }

  const longHoldingRatio = getRatioLongHolding(tokens, 6);
  if (longHoldingRatio > 0.3) {
    reason.push(" - Too long term holder");

    approved = { ...approved, longHoldingRatio: false };
  }

  const isTotalProfitLarger = isTotalProfitLargerThan(tokens, 5);
  if (!isTotalProfitLarger) {
    reason.push(" - Total Profit is too low");
    approved = { ...approved, isTotalProfitLarger: false };
  }

  const isAvgFBuyGood = isAvgFirstBuyGood(tokens, 0.5, 4);
  if (!isAvgFBuyGood) {
    reason.push(" - Buy amount is not suitable");
    approved = { ...approved, isAvgFBuyGood: false };
  }

  const isProfitableTokenSelector = isBadTokenCountLargerThan(tokens, 0.7);
  if (!isProfitableTokenSelector) {
    reason.push(" - Bad Token Selector");
    approved = {
      ...approved,
      isProfitableTokenSelector: false,
    };
  }

  if (setting.realTx < 4) {
    reason.push(" - The number of successful token is too low");
    approved = {
      ...approved,
      realTx: false,
    };
  }
  if (setting.realTx / setting.tx < 0.7 && tokens.length > 4) {
    reason.push(" - Win Rate is too low");
    approved = {
      ...approved,
      winRate: false,
    };
  }

  return {
    approved,
    reason,
    setting,
    timezones,
    lastActiveTime,
    lastActiveToken,
    custom_settings: await simulateTokens(wallet),
  };
}

async function simulateTokens(walletAddress: string): Promise<TSimulationResponse> {
  try {
      const response = await fetch(`http://65.109.88.220:9002/tokens/simulate/${walletAddress}`);
      
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TSimulationResponse = await response.json();
      return data;
  } catch (error) {
      console.error('Error simulating tokens:', error);
      throw error;
  }
}