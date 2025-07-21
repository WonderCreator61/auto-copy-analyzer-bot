import dotenv from "dotenv";
dotenv.config();

export const DUNE_API_KEY = process.env.DUNE_API_KEY;
export const DUNE_QUERY_ID = process.env.DUNE_QUERY_ID;

export const GMGN_COOKIE = process.env.GMGN_COOKIE || "";
export const GMGN_DEVICE_ID = process.env.GMGN_DEVICE_ID || "";
export const GMGN_CLIENT_ID = process.env.GMGN_CLIENT_ID || "";
export const REFERERS = process.env.REFERERS?.split(",") || [];
export const FP_DIDS = process.env.FP_DIDS?.split(",") || [];
export const TZ_NAME = process.env.TZ_NAME || "";
export const GMGN_APP_VER = process.env.GMGN_APP_VER || "";

export const INVEST_AMOUNT = Number(process.env.INVEST_AMOUNT) || 1;
export const JITO_TIP = Number(process.env.JITO_TIP) || 0.05;

export const TG_API_ID = process.env.TG_API_ID || "";
export const TG_API_HASH = process.env.TG_API_HASH || "";
export const TG_SESSION = process.env.TG_SESSION || "";
export const TG_CHANNEL = process.env.TG_CHANNEL || "";

export const PORT = process.env.PORT || 3000;

export const STORE = {
    QUERY_RUNNING: false,
    SIMULATING: false,
    TARGETS: [],
    SOL_PRICE: 180,
    GOOD_TARGETS: [] as any[]
}