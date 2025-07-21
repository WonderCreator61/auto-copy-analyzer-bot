import { TToken } from "../types/dataType";

export function getRatioSameSymbol(tokens: Array<TToken>) {
    const same: Array<{ name: string; count: number }> = [];
    for (const token of tokens) {
      if (same.some((s) => s.name === token.token.symbol)) continue;
      same.push({
        name: token.token.symbol,
        count: tokens.filter((t) => t.token.symbol === token.token.symbol).length,
      });
    }
    const ratio = same.filter((s) => s.count > 1).length / same.length;
    return ratio;
  }
  
  export function getRatioShortHolding(tokens: Array<TToken>, second: number) {
    const shortHoldingTokens = tokens.filter((token) => {
      const holdingTime = token.end_holding_at - token.start_holding_at;
      return holdingTime < second; // Consider short holding if less than 1 hour
    });
  
    const ratio = shortHoldingTokens.length / tokens.length;
    return ratio;
  }
  
  export function getRatioLongHolding(tokens: Array<TToken>, hour: number) {
    const longHoldingTokens = tokens.filter((token) => {
      const holdingTime = token.end_holding_at - token.start_holding_at;
      return holdingTime > hour * 60 * 60; // Consider short holding if less than 1 hour
    });
  
    const ratio = longHoldingTokens.length / tokens.length;
    return ratio;
  }
  

  export function isTotalProfitLargerThan(tokens: Array<TToken>, sol: number) {
    const total = tokens.reduce(
      (prev, current) => prev + current.realized_profit,
      0
    );
    return total > sol;
  }
  
  export function isAvgFirstBuyGood(
    tokens: Array<TToken>,
    min: number,
    max: number
  ) {
    const total = tokens.reduce(
      (prev, current) => prev + (current?.buy ?? current.history_bought_cost),
      0
    );
    const avg = total / tokens.length;
    return min < avg && avg < max;
  }
  

  export function isBadTokenCountLargerThan(
    tokens: Array<TToken>,
    winRate: number
  ) {
    const badTokens = tokens.filter((token) => token.realized_pnl < 0.4);
  
    const badTokenRate = badTokens.length / tokens.length;
    const isLarge = 1 - badTokenRate > winRate;
    return isLarge || (!isLarge && tokens.length <= 4);
  }
  