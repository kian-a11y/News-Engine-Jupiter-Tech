import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bddjqldhbqeetawtipak.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

const seedNews = [
  // HIGH IMPACT (5)
  {
    title: "Fed Chair Powell Signals Potential Rate Pause at Upcoming FOMC Meeting",
    content:
      "Federal Reserve Chairman Jerome Powell indicated the central bank may hold rates steady at the next FOMC meeting, citing progress on inflation but cautioning that the labour market remains tight. Markets reacted swiftly, with the US dollar index dropping 0.4% and Treasury yields falling across the curve. Traders are now pricing in a 78% probability of a rate pause in March.",
    url: "https://example.com/fed-rate-pause-signal",
    source_name: "Reuters Markets",
    published_at: hoursAgo(1),
  },
  {
    title: "EURUSD Breaks Below 1.0800 Support After Eurozone PMI Misses Expectations",
    content:
      "The euro fell sharply against the dollar after Eurozone composite PMI came in at 47.2, well below the expected 48.8 and firmly in contraction territory. EURUSD broke below the key 1.0800 level, touching 1.0765 before finding tentative support. The services sector showed particular weakness in Germany and France, raising recession fears across the bloc.",
    url: "https://example.com/eurusd-pmi-break",
    source_name: "ForexLive",
    published_at: hoursAgo(2),
  },
  {
    title: "Oil Surges 4% on Middle East Supply Disruption Fears",
    content:
      "Brent crude surged over 4% to $86.50 per barrel after reports of attacks on shipping routes in the Red Sea intensified concerns over global oil supply chains. WTI crude also rallied strongly, breaking above $82. The move sent ripple effects across FX markets, with commodity currencies AUD and CAD strengthening against the greenback.",
    url: "https://example.com/oil-surge-middle-east",
    source_name: "Investing.com",
    published_at: hoursAgo(3),
  },
  {
    title: "Bank of Japan Surprises Markets with Hawkish Policy Shift, Yen Strengthens 2%",
    content:
      "The Bank of Japan shocked markets by signalling a potential end to its yield curve control policy earlier than anticipated. Governor Ueda's comments sent USDJPY tumbling from 154.80 to 151.50 in volatile trading. Japanese government bond yields spiked, and carry trade positions came under significant pressure across Asia-Pacific markets.",
    url: "https://example.com/boj-hawkish-shift",
    source_name: "FXStreet",
    published_at: hoursAgo(4),
  },
  {
    title: "US Non-Farm Payrolls Beat Expectations: 312K Jobs Added vs 205K Expected",
    content:
      "The US economy added 312,000 jobs in the latest reporting period, significantly exceeding the consensus forecast of 205,000. The unemployment rate held steady at 3.7% while average hourly earnings rose 0.4% month-over-month. The strong data pushed the dollar higher against most major currencies and prompted traders to reassess rate cut expectations.",
    url: "https://example.com/nfp-beat-expectations",
    source_name: "DailyFX",
    published_at: hoursAgo(5),
  },

  // MEDIUM IMPACT (10)
  {
    title: "GBPUSD Finds Support at 1.2650 Ahead of Bank of England Rate Decision",
    content:
      "Sterling steadied above 1.2650 as traders positioned ahead of Thursday's Bank of England rate announcement. Markets are split on whether the MPC will hold or cut by 25bps, with swaps pricing roughly a 55% chance of a hold. Key resistance remains at 1.2750 with support at 1.2600.",
    url: "https://example.com/gbpusd-boe-decision",
    source_name: "ForexLive",
    published_at: hoursAgo(3),
  },
  {
    title: "Gold Holds Above $2,300 as Safe-Haven Demand Persists",
    content:
      "Gold prices remained firm above $2,300/oz, supported by ongoing geopolitical tensions and expectations of a more dovish Fed. The precious metal has gained 3% over the past week, with ETF inflows turning positive for the first time in three months. Resistance is seen at $2,340, with support at $2,280.",
    url: "https://example.com/gold-safe-haven",
    source_name: "Investing.com",
    published_at: hoursAgo(4),
  },
  {
    title: "Australian Dollar Weakens on Disappointing China Growth Data",
    content:
      "The Australian dollar fell 0.6% to 0.6520 against the USD after Chinese GDP growth came in at 4.7%, below the 5.0% target. Iron ore futures also declined 2%, adding pressure on the Aussie. RBA rate expectations remain on hold, with markets pricing no change at the next meeting.",
    url: "https://example.com/aud-china-growth",
    source_name: "FXStreet",
    published_at: hoursAgo(5),
  },
  {
    title: "NAS100 Rally Stalls Near 18,500 as Tech Earnings Disappoint",
    content:
      "The Nasdaq 100 index pulled back from recent highs after several major tech companies reported mixed earnings. The index fell 1.2% from its session high of 18,520, with semiconductor stocks leading the decline. Traders cited stretched valuations and cautious forward guidance as reasons for the pullback.",
    url: "https://example.com/nas100-tech-earnings",
    source_name: "DailyFX",
    published_at: hoursAgo(6),
  },
  {
    title: "ECB's Lagarde Reiterates Data-Dependent Approach to Rate Decisions",
    content:
      "European Central Bank President Christine Lagarde emphasised that future rate decisions will remain strictly data-dependent, pushing back against market expectations of aggressive easing. She acknowledged progress on inflation but stressed that services inflation remains sticky and wage growth needs to moderate further.",
    url: "https://example.com/ecb-lagarde-data-dependent",
    source_name: "Reuters Markets",
    published_at: hoursAgo(6),
  },
  {
    title: "Canadian Dollar Under Pressure as Oil-CAD Correlation Shows Signs of Breaking Down",
    content:
      "Despite a strong rally in oil prices, the Canadian dollar failed to keep pace, with USDCAD remaining above 1.3600. Analysts noted the traditional oil-CAD correlation has weakened, with domestic economic concerns and a dovish Bank of Canada outlook weighing more heavily on the loonie.",
    url: "https://example.com/cad-oil-correlation",
    source_name: "ForexLive",
    published_at: hoursAgo(7),
  },
  {
    title: "Swiss Franc Strengthens Broadly on Global Risk-Off Sentiment",
    content:
      "The Swiss franc was among the day's best performers, gaining 0.5% against the euro and 0.7% against the pound. Risk-off flows driven by geopolitical concerns and equity market volatility supported traditional safe-haven currencies. EURCHF approached the 0.9400 level, with the SNB monitoring closely.",
    url: "https://example.com/chf-risk-off",
    source_name: "FXStreet",
    published_at: hoursAgo(7),
  },
  {
    title: "Bitcoin Recovers to $68,000 Amid Institutional Buying Reports",
    content:
      "Bitcoin bounced back above $68,000 after reports of significant institutional accumulation through spot ETFs. Daily inflows exceeded $400 million across major Bitcoin ETF products. The recovery came after a brief dip to $64,500 earlier in the week, with on-chain data showing strong holder conviction.",
    url: "https://example.com/btc-institutional-buying",
    source_name: "Investing.com",
    published_at: hoursAgo(8),
  },
  {
    title: "USDJPY Retreats from 155 Level on Intervention Speculation",
    content:
      "USDJPY pulled back sharply from the 155.00 handle amid renewed speculation that Japanese authorities may intervene to support the yen. Japan's top currency diplomat Masato Kanda warned that authorities are watching FX moves 'with a high sense of urgency', echoing language used before previous interventions.",
    url: "https://example.com/usdjpy-intervention",
    source_name: "ForexLive",
    published_at: hoursAgo(8),
  },
  {
    title: "European Natural Gas Prices Spike 8% on Supply Concerns",
    content:
      "European natural gas futures surged 8% after maintenance issues at a key Norwegian processing facility raised supply concerns. The TTF benchmark jumped to €32/MWh, the highest in six weeks. The move added to inflationary pressures in Europe and weighed on European equity indices.",
    url: "https://example.com/eu-nat-gas-spike",
    source_name: "Reuters Markets",
    published_at: hoursAgo(9),
  },

  // LOWER IMPACT (12)
  {
    title: "UK Housing Market Shows Signs of Stabilisation with 1.2% Monthly Gain",
    content:
      "UK house prices rose 1.2% month-over-month according to the latest Nationwide survey, marking the third consecutive monthly increase. The annual rate of decline narrowed to -0.8%, suggesting the market may be finding a floor after the rate-driven correction.",
    url: "https://example.com/uk-housing-data",
    source_name: "ForexLive",
    published_at: hoursAgo(9),
  },
  {
    title: "China Manufacturing PMI Edges Higher to 50.8 but Services Sector Lags",
    content:
      "China's official manufacturing PMI rose to 50.8 from 50.3, beating expectations and remaining in expansion territory. However, the non-manufacturing PMI fell to 51.0 from 53.2, indicating that the recovery remains uneven across sectors.",
    url: "https://example.com/china-pmi-mixed",
    source_name: "FXStreet",
    published_at: hoursAgo(9),
  },
  {
    title: "Goldman Sachs Upgrades EUR Forecast, Sees EURUSD at 1.12 by Year-End",
    content:
      "Goldman Sachs revised its EURUSD forecast higher, now targeting 1.1200 by year-end, citing expectations of a more aggressive Fed easing cycle relative to the ECB. The bank noted that real yield differentials should narrow in favour of the euro over the coming quarters.",
    url: "https://example.com/gs-eur-upgrade",
    source_name: "Investing.com",
    published_at: hoursAgo(10),
  },
  {
    title: "New Zealand Dollar Dips After RBNZ Signals Patience on Rate Cuts",
    content:
      "The NZD fell 0.3% after the Reserve Bank of New Zealand signalled it was in no hurry to cut rates despite softening economic data. The central bank cited persistent domestic inflation pressures and a tight labour market as reasons to maintain the current restrictive stance.",
    url: "https://example.com/nzd-rbnz-patience",
    source_name: "DailyFX",
    published_at: hoursAgo(10),
  },
  {
    title: "US Trade Deficit Narrows More Than Expected in Latest Report",
    content:
      "The US trade deficit narrowed to $62.2 billion from $68.3 billion, beating expectations of $65.0 billion. Exports rose 1.5% while imports fell 0.8%, reflecting both stronger global demand for US goods and moderating domestic consumption.",
    url: "https://example.com/us-trade-deficit",
    source_name: "Reuters Markets",
    published_at: hoursAgo(10),
  },
  {
    title: "Tesla Shares Drop 5% on EV Demand Concerns, Weighing on NAS100",
    content:
      "Tesla shares fell over 5% in pre-market trading after the company reported lower-than-expected delivery numbers. The decline weighed on broader tech sentiment, with the Nasdaq 100 futures pointing to a lower open. Analysts flagged increasing competition in China as a key concern.",
    url: "https://example.com/tesla-ev-demand",
    source_name: "Investing.com",
    published_at: hoursAgo(10),
  },
  {
    title: "South African Rand Stabilises After Election Results Boost Confidence",
    content:
      "The South African rand stabilised near 18.20 against the dollar after coalition government formation boosted investor confidence. Foreign portfolio inflows into SA bonds turned positive, and credit default swap spreads narrowed by 15 basis points.",
    url: "https://example.com/zar-election-boost",
    source_name: "ForexLive",
    published_at: hoursAgo(11),
  },
  {
    title: "Copper Hits 3-Month High on Supply Deficit Expectations",
    content:
      "Copper futures touched $4.50/lb, the highest level in three months, driven by supply disruption concerns in Chile and Peru combined with strong demand from the green energy transition. The metal's rally supported commodity currencies including AUD and CLP.",
    url: "https://example.com/copper-3m-high",
    source_name: "FXStreet",
    published_at: hoursAgo(11),
  },
  {
    title: "German IFO Business Climate Index Falls to 85.7, Below Expectations",
    content:
      "The German IFO Business Climate Index dropped to 85.7 from 86.5, worse than the expected 86.0. Both the current assessment and expectations components declined, reinforcing concerns about the German economy's prolonged weakness.",
    url: "https://example.com/german-ifo-decline",
    source_name: "DailyFX",
    published_at: hoursAgo(11),
  },
  {
    title: "Mexico's Central Bank Holds Rates at 11.25% Amid Inflation Concerns",
    content:
      "Banxico held its benchmark rate unchanged at 11.25% as expected, with the board citing persistent core inflation pressures. The decision was unanimous, and the accompanying statement gave little indication of when easing might begin. USDMXN remained stable near 17.10.",
    url: "https://example.com/banxico-rate-hold",
    source_name: "Reuters Markets",
    published_at: hoursAgo(11),
  },
  {
    title: "Japan's Core CPI Remains Elevated at 2.8%, Above BoJ Target",
    content:
      "Japan's core consumer price index held at 2.8% year-over-year, above the Bank of Japan's 2% target for the 22nd consecutive month. The sticky inflation data added to speculation that the BoJ may further normalise its ultra-loose monetary policy in coming months.",
    url: "https://example.com/japan-cpi-elevated",
    source_name: "ForexLive",
    published_at: hoursAgo(12),
  },
  {
    title: "Singapore GDP Growth Surprises to the Upside at 3.2% YoY",
    content:
      "Singapore's economy grew 3.2% year-over-year in Q4, beating expectations of 2.8%. The outperformance was driven by the financial services and manufacturing sectors. The Monetary Authority of Singapore maintained its current policy stance, with USDSGD trading near 1.3350.",
    url: "https://example.com/singapore-gdp-beat",
    source_name: "FXStreet",
    published_at: hoursAgo(12),
  },
];

async function seed() {
  console.log("Seeding news items...");

  const { data, error } = await supabase
    .from("news_items")
    .upsert(seedNews, { onConflict: "url", ignoreDuplicates: true })
    .select();

  if (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }

  console.log(`Seeded ${data?.length || 0} news items successfully.`);
  process.exit(0);
}

seed();
