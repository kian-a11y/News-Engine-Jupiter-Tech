import { getServiceClient } from "./supabase";

// ─── Instrument Definitions ────────────────────────────────────

const FX_PAIRS = [
  // Majors
  "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X",
  "USDCHF=X", "NZDUSD=X",
  // Crosses
  "EURGBP=X", "EURJPY=X", "GBPJPY=X", "EURCHF=X", "AUDNZD=X",
  "AUDJPY=X", "CADJPY=X", "CHFJPY=X", "EURAUD=X", "EURCAD=X",
  "EURNZD=X", "GBPAUD=X", "GBPCAD=X", "GBPCHF=X", "GBPNZD=X",
  "NZDJPY=X", "NZDCAD=X", "NZDCHF=X", "AUDCAD=X", "AUDCHF=X",
  // Emerging
  "USDMXN=X", "USDZAR=X", "USDTRY=X", "USDCNH=X", "USDINR=X",
  "USDSGD=X", "USDHKD=X", "USDTHB=X", "USDPLN=X", "USDSEK=X",
  "USDNOK=X", "USDDKK=X", "USDCZK=X", "USDHUF=X", "USDBRL=X",
  "USDKRW=X", "USDTWD=X", "USDPHP=X", "USDIDR=X", "USDMYR=X",
  "USDARS=X", "USDCLP=X", "USDCOP=X", "USDPEN=X", "USDEGP=X",
  "USDAED=X", "USDSAR=X", "USDILS=X",
  // Exotic crosses
  "EURTRY=X", "EURPLN=X", "EURSEK=X", "EURNOK=X", "EURHUF=X",
  "EURCZK=X", "GBPTRY=X", "GBPPLN=X", "GBPSEK=X", "GBPNOK=X",
];

const CRYPTO = [
  "BTC-USD", "ETH-USD", "BNB-USD", "XRP-USD", "SOL-USD",
  "ADA-USD", "DOGE-USD", "DOT-USD", "AVAX-USD", "MATIC-USD",
  "LINK-USD", "UNI-USD", "SHIB-USD", "LTC-USD", "BCH-USD",
  "ATOM-USD", "XLM-USD", "NEAR-USD", "APT-USD", "FIL-USD",
  "ARB-USD", "OP-USD", "IMX-USD", "ALGO-USD", "VET-USD",
  "HBAR-USD", "ICP-USD", "TRX-USD", "EOS-USD", "AAVE-USD",
  "MKR-USD", "GRT-USD", "FTM-USD", "SAND-USD", "MANA-USD",
  "CRO-USD", "RUNE-USD", "INJ-USD", "SUI-USD", "SEI-USD",
  "TIA-USD", "JUP-USD", "PEPE-USD", "WIF-USD", "BONK-USD",
  "ETH-BTC",
];

const INDICES = [
  "^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX",
  "^FTSE", "^GDAXI", "^FCHI", "^STOXX50E", "^IBEX",
  "^AEX", "^SSMI", "FTSEMIB.MI",
  "^N225", "^HSI", "000001.SS", "^KS11", "^TWII",
  "^STI", "^AXJO", "^NZ50", "^BSESN", "^NSEI",
  "^BVSP", "^MXX", "^GSPTSE", "^JKSE",
  "DX-Y.NYB",
];

const COMMODITIES = [
  "GC=F", "SI=F", "PL=F", "PA=F",
  "CL=F", "BZ=F", "NG=F", "HO=F", "RB=F",
  "ZW=F", "ZC=F", "ZS=F", "KC=F", "CC=F",
  "SB=F", "CT=F", "OJ=F",
  "HG=F", "ALI=F",
];

const BONDS_RATES = ["^TNX", "^TYX", "^FVX", "^IRX"];

const POPULAR_STOCKS = [
  "AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "TSLA",
  "BRK-B", "JPM", "V", "MA", "UNH", "JNJ", "PG", "HD",
  "XOM", "CVX", "BAC", "WFC", "GS", "MS", "C",
  "BA", "CAT", "DE", "MMM",
  "BABA", "PDD", "JD", "BIDU", "NIO", "LI",
  "SHEL", "BP", "TTE", "HSBC", "UBS", "DB",
  "TSM", "ASML", "INTC", "AMD", "QCOM", "MU", "LRCX",
  "RIVN", "LCID", "ENPH", "FSLR",
  "LMT", "RTX", "NOC", "GD",
  "LLY", "NVO", "PFE", "MRNA", "ABBV",
];

const ALL_SYMBOLS = [
  ...FX_PAIRS, ...CRYPTO, ...INDICES,
  ...COMMODITIES, ...BONDS_RATES, ...POPULAR_STOCKS,
];

// Instruments that get full 1-year data for MA calculation
const MA_SYMBOLS = new Set([
  // FX Majors + key crosses
  "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X",
  "USDCHF=X", "NZDUSD=X", "EURGBP=X", "EURJPY=X", "GBPJPY=X",
  "USDMXN=X", "USDZAR=X", "USDTRY=X", "USDCNH=X", "USDINR=X",
  // Key crypto
  "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "BNB-USD",
  // Key indices
  "^GSPC", "^DJI", "^IXIC", "^VIX", "^FTSE", "^GDAXI",
  "^N225", "^HSI", "DX-Y.NYB",
  // Key commodities
  "GC=F", "SI=F", "CL=F", "BZ=F", "NG=F",
  // Bonds
  "^TNX", "^TYX",
  // Top stocks
  "AAPL", "MSFT", "NVDA", "TSLA", "JPM", "XOM",
]);

// Human-readable names
const SYMBOL_NAMES: Record<string, string> = {
  "EURUSD=X": "EUR/USD", "GBPUSD=X": "GBP/USD", "USDJPY=X": "USD/JPY",
  "AUDUSD=X": "AUD/USD", "USDCAD=X": "USD/CAD", "USDCHF=X": "USD/CHF",
  "NZDUSD=X": "NZD/USD", "EURGBP=X": "EUR/GBP", "EURJPY=X": "EUR/JPY",
  "GBPJPY=X": "GBP/JPY", "EURCHF=X": "EUR/CHF", "AUDNZD=X": "AUD/NZD",
  "AUDJPY=X": "AUD/JPY", "CADJPY=X": "CAD/JPY", "CHFJPY=X": "CHF/JPY",
  "EURAUD=X": "EUR/AUD", "EURCAD=X": "EUR/CAD", "EURNZD=X": "EUR/NZD",
  "GBPAUD=X": "GBP/AUD", "GBPCAD=X": "GBP/CAD", "GBPCHF=X": "GBP/CHF",
  "GBPNZD=X": "GBP/NZD", "NZDJPY=X": "NZD/JPY", "NZDCAD=X": "NZD/CAD",
  "NZDCHF=X": "NZD/CHF", "AUDCAD=X": "AUD/CAD", "AUDCHF=X": "AUD/CHF",
  "USDMXN=X": "USD/MXN", "USDZAR=X": "USD/ZAR", "USDTRY=X": "USD/TRY",
  "USDCNH=X": "USD/CNH", "USDINR=X": "USD/INR", "USDSGD=X": "USD/SGD",
  "USDHKD=X": "USD/HKD", "USDTHB=X": "USD/THB", "USDPLN=X": "USD/PLN",
  "USDSEK=X": "USD/SEK", "USDNOK=X": "USD/NOK", "USDDKK=X": "USD/DKK",
  "USDCZK=X": "USD/CZK", "USDHUF=X": "USD/HUF", "USDBRL=X": "USD/BRL",
  "USDKRW=X": "USD/KRW", "USDTWD=X": "USD/TWD", "USDPHP=X": "USD/PHP",
  "USDIDR=X": "USD/IDR", "USDMYR=X": "USD/MYR", "USDARS=X": "USD/ARS",
  "USDCLP=X": "USD/CLP", "USDCOP=X": "USD/COP", "USDPEN=X": "USD/PEN",
  "USDEGP=X": "USD/EGP", "USDAED=X": "USD/AED", "USDSAR=X": "USD/SAR",
  "USDILS=X": "USD/ILS",
  "EURTRY=X": "EUR/TRY", "EURPLN=X": "EUR/PLN", "EURSEK=X": "EUR/SEK",
  "EURNOK=X": "EUR/NOK", "EURHUF=X": "EUR/HUF", "EURCZK=X": "EUR/CZK",
  "GBPTRY=X": "GBP/TRY", "GBPPLN=X": "GBP/PLN", "GBPSEK=X": "GBP/SEK",
  "GBPNOK=X": "GBP/NOK",
  "BTC-USD": "Bitcoin", "ETH-USD": "Ethereum", "BNB-USD": "BNB",
  "XRP-USD": "XRP", "SOL-USD": "Solana", "ADA-USD": "Cardano",
  "DOGE-USD": "Dogecoin", "DOT-USD": "Polkadot", "AVAX-USD": "Avalanche",
  "MATIC-USD": "Polygon", "LINK-USD": "Chainlink", "UNI-USD": "Uniswap",
  "SHIB-USD": "Shiba Inu", "LTC-USD": "Litecoin", "BCH-USD": "Bitcoin Cash",
  "ATOM-USD": "Cosmos", "XLM-USD": "Stellar", "NEAR-USD": "NEAR Protocol",
  "APT-USD": "Aptos", "FIL-USD": "Filecoin", "ARB-USD": "Arbitrum",
  "OP-USD": "Optimism", "IMX-USD": "Immutable X", "ALGO-USD": "Algorand",
  "VET-USD": "VeChain", "HBAR-USD": "Hedera", "ICP-USD": "Internet Computer",
  "TRX-USD": "TRON", "EOS-USD": "EOS", "AAVE-USD": "Aave",
  "MKR-USD": "Maker", "GRT-USD": "The Graph", "FTM-USD": "Fantom",
  "SAND-USD": "The Sandbox", "MANA-USD": "Decentraland", "CRO-USD": "Cronos",
  "RUNE-USD": "THORChain", "INJ-USD": "Injective", "SUI-USD": "Sui",
  "SEI-USD": "Sei", "TIA-USD": "Celestia", "JUP-USD": "Jupiter",
  "PEPE-USD": "Pepe", "WIF-USD": "Dogwifhat", "BONK-USD": "Bonk",
  "ETH-BTC": "ETH/BTC",
  "^GSPC": "S&P 500", "^DJI": "Dow Jones", "^IXIC": "Nasdaq Composite",
  "^RUT": "Russell 2000", "^VIX": "VIX",
  "^FTSE": "FTSE 100", "^GDAXI": "DAX 40", "^FCHI": "CAC 40",
  "^STOXX50E": "Euro Stoxx 50", "^IBEX": "IBEX 35",
  "^AEX": "AEX", "^SSMI": "SMI", "FTSEMIB.MI": "FTSE MIB",
  "^N225": "Nikkei 225", "^HSI": "Hang Seng", "000001.SS": "Shanghai Composite",
  "^KS11": "KOSPI", "^TWII": "TAIEX", "^STI": "Straits Times",
  "^AXJO": "ASX 200", "^NZ50": "NZX 50", "^BSESN": "BSE Sensex",
  "^NSEI": "Nifty 50", "^BVSP": "Bovespa", "^MXX": "IPC Mexico",
  "^GSPTSE": "TSX Composite", "^JKSE": "Jakarta Composite",
  "DX-Y.NYB": "US Dollar Index (DXY)",
  "GC=F": "Gold", "SI=F": "Silver", "PL=F": "Platinum", "PA=F": "Palladium",
  "CL=F": "WTI Crude Oil", "BZ=F": "Brent Crude Oil", "NG=F": "Natural Gas",
  "HO=F": "Heating Oil", "RB=F": "RBOB Gasoline",
  "ZW=F": "Wheat", "ZC=F": "Corn", "ZS=F": "Soybeans",
  "KC=F": "Coffee", "CC=F": "Cocoa", "SB=F": "Sugar",
  "CT=F": "Cotton", "OJ=F": "Orange Juice",
  "HG=F": "Copper", "ALI=F": "Aluminium",
  "^TNX": "US 10Y Yield", "^TYX": "US 30Y Yield",
  "^FVX": "US 5Y Yield", "^IRX": "US 3M T-Bill",
  "AAPL": "Apple", "MSFT": "Microsoft", "AMZN": "Amazon",
  "GOOGL": "Alphabet", "META": "Meta", "NVDA": "NVIDIA", "TSLA": "Tesla",
  "BRK-B": "Berkshire Hathaway", "JPM": "JPMorgan", "V": "Visa",
  "MA": "Mastercard", "UNH": "UnitedHealth", "JNJ": "Johnson & Johnson",
  "PG": "Procter & Gamble", "HD": "Home Depot",
  "XOM": "ExxonMobil", "CVX": "Chevron", "BAC": "Bank of America",
  "WFC": "Wells Fargo", "GS": "Goldman Sachs", "MS": "Morgan Stanley",
  "C": "Citigroup", "BA": "Boeing", "CAT": "Caterpillar",
  "DE": "Deere & Company", "MMM": "3M",
  "BABA": "Alibaba", "PDD": "PDD Holdings", "JD": "JD.com",
  "BIDU": "Baidu", "NIO": "NIO", "LI": "Li Auto",
  "SHEL": "Shell", "BP": "BP", "TTE": "TotalEnergies",
  "HSBC": "HSBC", "UBS": "UBS", "DB": "Deutsche Bank",
  "TSM": "TSMC", "ASML": "ASML", "INTC": "Intel", "AMD": "AMD",
  "QCOM": "Qualcomm", "MU": "Micron", "LRCX": "Lam Research",
  "RIVN": "Rivian", "LCID": "Lucid", "ENPH": "Enphase", "FSLR": "First Solar",
  "LMT": "Lockheed Martin", "RTX": "RTX Corp", "NOC": "Northrop Grumman",
  "GD": "General Dynamics",
  "LLY": "Eli Lilly", "NVO": "Novo Nordisk", "PFE": "Pfizer",
  "MRNA": "Moderna", "ABBV": "AbbVie",
};

const SYMBOL_CATEGORIES: Record<string, string> = {};
FX_PAIRS.forEach(s => SYMBOL_CATEGORIES[s] = "fx");
CRYPTO.forEach(s => SYMBOL_CATEGORIES[s] = "crypto");
INDICES.forEach(s => SYMBOL_CATEGORIES[s] = "index");
COMMODITIES.forEach(s => SYMBOL_CATEGORIES[s] = "commodity");
BONDS_RATES.forEach(s => SYMBOL_CATEGORIES[s] = "bond");
POPULAR_STOCKS.forEach(s => SYMBOL_CATEGORIES[s] = "stock");

export { SYMBOL_NAMES, SYMBOL_CATEGORIES };

// ─── Yahoo Finance v8 Chart Fetcher ────────────────────────────

interface ChartResult {
  symbol: string;
  price: number;
  dayHigh: number | null;
  dayLow: number | null;
  previousClose: number | null;
  dayOpen: number | null;
  changePct: number | null;
  ma50: number | null;
  ma200: number | null;
}

/**
 * Fetch a single instrument via Yahoo Finance v8 chart API.
 * For MA_SYMBOLS, fetches 1y of data to calculate MAs.
 * For others, fetches just 1d for current price + OHLC.
 */
async function fetchSymbol(symbol: string): Promise<ChartResult | null> {
  const needMA = MA_SYMBOLS.has(symbol);
  const range = needMA ? "1y" : "5d";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta?.regularMarketPrice;
    if (price == null) return null;

    const closes = result?.indicators?.quote?.[0]?.close?.filter((c: number | null) => c != null) || [];

    let ma50: number | null = null;
    let ma200: number | null = null;

    if (needMA && closes.length >= 50) {
      ma50 = closes.slice(-50).reduce((a: number, b: number) => a + b, 0) / 50;
    }
    if (needMA && closes.length >= 200) {
      ma200 = closes.slice(-200).reduce((a: number, b: number) => a + b, 0) / 200;
    }

    const prevClose = meta.chartPreviousClose || meta.previousClose || null;
    const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : null;

    return {
      symbol: meta.symbol || symbol,
      price,
      dayHigh: meta.regularMarketDayHigh || null,
      dayLow: meta.regularMarketDayLow || null,
      previousClose: prevClose,
      dayOpen: null, // v8 meta doesn't always have open
      changePct,
      ma50,
      ma200,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch all instruments in parallel with concurrency control.
 * Runs CONCURRENCY requests at a time to avoid overwhelming Yahoo.
 */
export async function fetchAllMarketData(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const supabase = getServiceClient();
  const CONCURRENCY = 20;
  const allResults: ChartResult[] = [];
  const failed: string[] = [];

  console.log(`[MarketData] Fetching ${ALL_SYMBOLS.length} instruments (${MA_SYMBOLS.size} with MAs)...`);

  // Process in batches of CONCURRENCY
  for (let i = 0; i < ALL_SYMBOLS.length; i += CONCURRENCY) {
    const batch = ALL_SYMBOLS.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(fetchSymbol));

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.status === "fulfilled" && result.value) {
        allResults.push(result.value);
      } else {
        failed.push(batch[j]);
      }
    }

    // Brief pause between batches to be polite
    if (i + CONCURRENCY < ALL_SYMBOLS.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`[MarketData] Received ${allResults.length} quotes, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log(`[MarketData] Failed symbols (first 10):`, failed.slice(0, 10).join(", "));
  }

  if (allResults.length === 0) {
    return { success: 0, failed: ALL_SYMBOLS.length, total: ALL_SYMBOLS.length };
  }

  // Transform to DB rows
  const rows = allResults.map(q => ({
    symbol: q.symbol,
    name: SYMBOL_NAMES[q.symbol] || q.symbol,
    category: SYMBOL_CATEGORIES[q.symbol] || "other",
    current_price: q.price,
    daily_open: q.dayOpen,
    daily_high: q.dayHigh,
    daily_low: q.dayLow,
    daily_change_pct: q.changePct,
    previous_close: q.previousClose,
    ma_50: q.ma50,
    ma_200: q.ma200,
    updated_at: new Date().toISOString(),
  }));

  // Upsert in batches
  let success = 0;
  const DB_BATCH = 100;
  for (let i = 0; i < rows.length; i += DB_BATCH) {
    const batch = rows.slice(i, i + DB_BATCH);
    const { error } = await supabase
      .from("market_data")
      .upsert(batch, { onConflict: "symbol" });

    if (error) {
      console.error(`[MarketData] DB upsert error:`, error.message);
    } else {
      success += batch.length;
    }
  }

  console.log(`[MarketData] Stored ${success}/${rows.length} quotes`);
  return { success, failed: failed.length, total: ALL_SYMBOLS.length };
}

/**
 * Smart context injection: find instruments mentioned in today's news
 * and return their market data for the system prompt.
 * Returns max 30 most relevant instruments.
 */
export async function getRelevantMarketData(newsItems: { title: string; content: string | null }[]): Promise<MarketDataRow[]> {
  const supabase = getServiceClient();

  // Weight the blob by article rank: top 10 get 3× weight, 11-25 get 2×, rest 1×
  const newsBlob = newsItems
    .map((n, idx) => {
      const text = `${n.title} ${n.content || ""}`;
      const weight = idx < 10 ? 3 : idx < 25 ? 2 : 1;
      return Array(weight).fill(text).join(" ");
    })
    .join(" ")
    .toLowerCase();

  const { data: allData } = await supabase
    .from("market_data")
    .select("*")
    .not("current_price", "is", null);

  if (!allData || allData.length === 0) return [];

  const scored = allData.map(row => {
    let score = 0;
    const name = (row.name || "").toLowerCase();
    const symbol = (row.symbol || "").toLowerCase().replace(/[=\-^.]/g, "");

    if (newsBlob.includes(name)) score += 10;
    if (symbol.length >= 3 && newsBlob.includes(symbol)) score += 8;

    const parts = name.split("/");
    for (const part of parts) {
      if (part.length >= 3 && newsBlob.includes(part.toLowerCase())) score += 3;
    }

    // Always include core instruments — the 12 that are ALWAYS relevant to CFD broker content
    const CORE = ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X",
      "USDCHF=X", "NZDUSD=X", "GC=F", "CL=F", "BZ=F", "^GSPC", "DX-Y.NYB"];
    if (CORE.includes(row.symbol)) score += 5;

    // Boost big movers
    const changePct = Math.abs(row.daily_change_pct || 0);
    if (changePct > 5) score += 6;
    else if (changePct > 2) score += 3;
    else if (changePct > 1) score += 1;

    return { row, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map(s => s.row);
}

export interface MarketDataRow {
  symbol: string;
  name: string;
  category: string;
  current_price: number;
  daily_open: number | null;
  daily_high: number | null;
  daily_low: number | null;
  daily_change_pct: number | null;
  previous_close: number | null;
  ma_50: number | null;
  ma_200: number | null;
  updated_at: string;
}
