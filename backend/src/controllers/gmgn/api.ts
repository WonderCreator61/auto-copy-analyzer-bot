import { v4 as uuidv4 } from "uuid";
import { TTokenCandlePoint, TTokenInformation, TTrader, TWalletInfo } from "../../types/dataType";
import { sleep } from "../../utils/helper";
import { FP_DIDS, GMGN_APP_VER, GMGN_CLIENT_ID, GMGN_COOKIE, GMGN_DEVICE_ID, REFERERS, TZ_NAME } from "../../utils/constants";

export async function getTokenInformation(
    tokens: string[],
    index: number
  ): Promise<TTokenInformation[] | null> {
    const requestOptions: any = {
      method: "POST",
      headers: {
        "User-Agent": "PostmanRuntime/7.43.3",
        Referer: `https://gmgn.ai/sol/token/${tokens[0]}`,
        Host: "gmgn.ai",
        "Postman-Token": uuidv4(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chain: "sol",
        addresses: tokens,
      }),
    };
  
    requestOptions.headers["Cookie"] = GMGN_COOKIE;
  
    const url = new URL("https://gmgn.ai/api/v1/mutil_window_token_info");
    const getTokensParams = new URLSearchParams({
      device_id: GMGN_DEVICE_ID,
      client_id: GMGN_CLIENT_ID,
      from_app: "gmgn",
      app_ver: GMGN_APP_VER,
      tz_name: TZ_NAME,
      tz_offset: "32400",
      app_lang: "en-US",
      fp_did: FP_DIDS[index],
      os: "web",
    });
    url.search = getTokensParams.toString();
    try {
      const response = await fetch(url.toString(), requestOptions).then(
        async (response) => await response.json()
      );
      return response.data;
    } catch (err) {
    //   console.error("Get Token Information Error: ", tokens, " - ", err);
    //   await sleep(10);
    //   cookieStatus = !cookieStatus;
    //   try {
    //     const response = await fetch(url.toString(), requestOptions).then(
    //       async (response) => await response.json()
    //     );
    //     return response.data;
    //   } catch (err) {
    //     consola.error("Second Get Token Information Error: ", tokens, " - ", err);
    //     return [];
    //   }
        return [];
    }
  }
  
  
  export async function getWalletInfo(
    wallet: string,
    index: number = 0
  ): Promise<TWalletInfo | null> {
    const requestOptions: any = {
      method: "GET",
      headers: {
        "User-Agent": "PostmanRuntime/7.43.3",
        Host: "gmgn.ai",
        Referer: REFERERS[index] + wallet,
        "Postman-Token": uuidv4(),
      },
    };
    requestOptions.headers["Cookie"] = GMGN_COOKIE;
  
    const url = new URL(
      "https://gmgn.ai/api/v1/wallet_stat/sol/" + wallet + "/7d"
    );
  
    const getTokensParams = new URLSearchParams({
      device_id: GMGN_DEVICE_ID,
      client_id: GMGN_CLIENT_ID,
      from_app: "gmgn",
      app_ver: GMGN_APP_VER,
      tz_name: TZ_NAME,
      tz_offset: "32400",
      app_lang: "en-US",
      fp_did: FP_DIDS[index],
      os: "web",
      period: "7d",
    });
    url.search = getTokensParams.toString();
    try {
      const response = await fetch(url.toString(), requestOptions).then(
        async (response) => await response.json()
      );
  
      return response.data;
    } catch (err) {
      console.error("Get Wallet Info Error: ", wallet, " - ", err);
      return null;
    }
  }
  
  export async function getTokenCandlePoint(
    token: string,
    from: number,
    to: number,
    index: number
  ): Promise<TTokenCandlePoint[] | null> {
    const requestOptions: any = {
      method: "GET",
      headers: {
        "User-Agent": "PostmanRuntime/7.43.3",
        Referer: `https://gmgn.ai/sol/token/${token}`,
        Host: "gmgn.ai",
        "Postman-Token": uuidv4(),
      },
    };
    requestOptions.headers["Cookie"] = GMGN_COOKIE;
  
    const url = new URL(
      "https://gmgn.ai/defi/quotation/v1/tokens/kline/sol/" + token
    );
  
    const getTokensParams = new URLSearchParams({
      device_id: GMGN_DEVICE_ID,
      client_id: GMGN_CLIENT_ID,
      from_app: "gmgn",
      app_ver: GMGN_APP_VER,
      tz_name: TZ_NAME,
      tz_offset: "32400",
      app_lang: "en-US",
      fp_did: FP_DIDS[index],
      os: "web",
      resolution: "5m",
      from: from.toString(),
      to: to.toString(),
    });
    url.search = getTokensParams.toString();
    try {
      const response = await fetch(url.toString(), requestOptions).then(
        async (response) => await response.json()
      );
  
      return response.data;
    } catch (err) {
      try {
        console.error("Get Token Candle Point Error: ", token, " - ", err);
        await sleep(10);
        const response = await fetch(url.toString(), requestOptions).then(
          async (response) => await response.json()
        );
        return response.data;
      } catch (err) {
        console.error("Second get Token Candle Point Error: ", token, " - ", err);
        return null;
      }
    }
  }

  export async function getDevs(
    tokenAddress: string,
    orderby: string,
    index: number
  ): Promise<{ list: TTrader[]; next: string }> {
    const requestOptions: any = {
      method: "GET",
      headers: {
        "User-Agent": "PostmanRuntime/7.43.3",
        Referer: `https://gmgn.ai/sol/token/${tokenAddress}`,
        Host: "gmgn.ai",
        "Postman-Token": uuidv4(),
      },
    };
    requestOptions.headers["Cookie"] = GMGN_COOKIE;
  
    const url = new URL(
      "https://gmgn.ai/vas/api/v1/token_traders/sol/" + tokenAddress
    );
    const getTokensParams = new URLSearchParams({
      device_id: GMGN_DEVICE_ID,
      client_id: GMGN_CLIENT_ID,
      from_app: "gmgn",
      app_ver: GMGN_APP_VER,
      tz_name: TZ_NAME,
      tz_offset: "32400",
      app_lang: "en-US",
      fp_did: FP_DIDS[index],
      os: "web",
      limit: "100",
      orderby: orderby,
      direction: "desc",
      tag: "dev",
    });
    url.search = getTokensParams.toString();
    try {
      const response = await fetch(url.toString(), requestOptions).then(
        async (response) => await response.json()
      );
      return response.data;
    } catch (err) {
      console.error("Get Traders Error: ", tokenAddress, " - ", err);
      await sleep(10);
      try {
        await sleep(10);
        const response = await fetch(url.toString(), requestOptions).then(
          async (response) => await response.json()
        );
        return response.data;
      } catch (err) {
        console.error("Second Get Traders Error: ", tokenAddress, " - ", err);
        return { list: [], next: "" };
      }
    }
  }
  

  export async function getDevCreationTokens(address: string, index: number) {
    const requestOptions: any = {
      method: "GET",
      headers: {
        "User-Agent": "PostmanRuntime/7.43.3",
        Referer: `https://gmgn.ai/sol/address/HBlBl7CI_81PZurU9EXd1SEx6b6unaL1TnCJTXk7unvg1MZobMsBj`,
        Host: "gmgn.ai",
        "Postman-Token": uuidv4(),
      },
    };
    requestOptions.headers["Cookie"] = GMGN_COOKIE;
  
    const url = new URL(
      "https://gmgn.ai/api/v1/dev_created_tokens/sol/" + address
    );
    const getTokensParams = new URLSearchParams({
      device_id: GMGN_DEVICE_ID,
      client_id: GMGN_CLIENT_ID,
      from_app: "gmgn",
      app_ver: GMGN_APP_VER,
      tz_name: TZ_NAME,
      tz_offset: "32400",
      app_lang: "en-US",
      fp_did: FP_DIDS[index],
      os: "web",
      chain: "sol",
      address: address,
    });
    url.search = getTokensParams.toString();
    try {
      const response = await fetch(url.toString(), requestOptions).then(
        async (response) => await response.json()
      );
      return response.data;
    } catch (err) {
      console.error("Get Dev Creation Tokens Error: ", err);
      await sleep(10);
      try {
        const response = await fetch(url.toString(), requestOptions).then(
          async (response) => await response.json()
        );
        return response.data;
      } catch (err) {
        console.error("Second Get Dev Creation Tokens Error: ", err);
        return null;
      }
    }
  }
  