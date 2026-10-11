/**
 * Golden example: "Peak to Creek" on Arc'teryx.
 *
 * `payload` is exactly what the agent would send to POST /v1/pages for this
 * journey. Everything else is what a great merchant page derives from it.
 *
 * Product copy, prices, weights and colours come from data/arcteryx.json,
 * scraped from arcteryx.com's public category and product pages. The terrain
 * is real too: SRTM 30 m elevations (via OpenTopoData) sampled along two
 * straight lines, Creekside to Whistler Peak and Whistler Peak to Blackcomb
 * Peak, plus a farther line from Black Tusk to Blackcomb for the backdrop.
 */

import type { PagePayload, Product } from "@/lib/merchant";

export type Details = {
  tagline: string;
  weight: string;
  weight_g: number;
  fit: string | null;
  properties: string[];
  activities: string[];
  colours: { label: string; hex: string }[];
  features: Record<string, string[]>;
  materials: string[];
  highlights: { title: string; text: string }[];
};

export type Item = Product & {
  sku: string;
  url: string;
  colours: string[];
  details: Details | null;
};

export const payload: PagePayload = {
  user_name: "Kai Morales",
  user_photo: "https://i.pravatar.cc/400?img=33",
  user_profile:
    "Moved from Toronto to Vancouver in September. Has ridden a handful of days a year on " +
    "Ontario groomers; this is his first full season, and he wants to learn to ride trees and powder properly.",
  context:
    "Night laps on the North Shore after work, Whistler Blackcomb on weekends, December to April. " +
    "Coast snow is heavy and it often rains at the base, so he wants one shell and pant that stay dry " +
    "all day, a warm layer that still works damp, and a base layer. His goal for the season: Peak to Creek, " +
    "top to bottom, without stopping.",
  products: [1, 75, 24, 2],
};

export type Role = "Shell" | "Insulation" | "Base layer" | "Pant";

/** One product per turn on the run, in payload order. Every line is quoted
 *  from the product's own page (see data/arcteryx.json). */
const PITCH: Record<number, { role: Role; image: string; spec: string; why: string; colour: string }> = {
  1: {
    role: "Shell",
    image: "/examples/arcteryx/sabre-jacket.webp",
    spec: "100D 3L GORE-TEX ePE",
    why: "Tougher 100d GORE-TEX® ePE face fabric, adjustable cuffs, and integrated snow skirt seal out snow and wind.",
    colour: "Aquaculture AC / Stratus",
  },
  75: {
    role: "Insulation",
    image: "/examples/arcteryx/atom-hoody.webp",
    spec: "Coreloft™ Compact 60",
    why: "Made with Coreloft™ insulation, the Atom stays warm even when wet.",
    colour: "Stratus",
  },
  24: {
    role: "Base layer",
    image: "/examples/arcteryx/rho-lt-zip-neck.webp",
    spec: "Torrent™ stretch fleece",
    why: "Torrent™ stretch fleece with Polygiene® manages moisture, provides light warmth and performance stretch, and is brushed for softness.",
    colour: "Black",
  },
  2: {
    role: "Pant",
    image: "/examples/arcteryx/sabre-pant.webp",
    spec: "100D 3L GORE-TEX ePE",
    why: "Button connectors pair the pant with the Sabre Jacket’s powder skirt for extra pow protection.",
    colour: "Black",
  },
};

/** Resolve the payload's ids against the catalog. Server-side, so the
 *  210-row catalog never ships to the browser. */
export function resolveKit(catalog: Item[]) {
  return payload.products.map((id) => {
    const item = catalog.find((c) => c.id === id);
    if (!item?.details) throw new Error(`Arc'teryx example: product ${id} missing details in data/arcteryx.json`);
    const d = item.details;
    return {
      id: item.id,
      name: item.name.replace(/ Men's$/, ""),
      fullName: item.name,
      price: item.price,
      url: item.url,
      description: item.description ?? "",
      tagline: d.tagline,
      weight_g: d.weight_g,
      weight: d.weight,
      fit: d.fit,
      technical: d.features["Technical features"] ?? [],
      snowsport: d.features["Snowsport features"] ?? [],
      vents: d.features["Zippers & Fly configuration"] ?? [],
      hex: d.colours.find((c) => c.label === PITCH[id].colour)?.hex ?? "#000000",
      ...PITCH[id],
    };
  });
}

export type KitItem = ReturnType<typeof resolveKit>[number];

/** arcteryx.com writes prices as "$750". */
export const usd = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const grams = (g: number) => `${g.toLocaleString("en-US")} g`;

/* ─── Terrain (SRTM 30 m, metres above sea level) ────────────────────────── */

/** Creekside (left) to Whistler Peak (right): 4,413 m, 140 samples. The DEM
 *  was sampled peak-first, so it is reversed here. */
const RUN_FROM_PEAK = [2149,2149,2149,2148,2146,2141,2133,2130,2119,2099,2080,2060,2040,2017,1987,1955,1934,1921,1909,1902,1893,1891,1889,1883,1870,1871,1866,1853,1839,1827,1819,1810,1804,1799,1784,1767,1745,1727,1706,1681,1661,1648,1642,1636,1633,1628,1623,1615,1604,1593,1581,1568,1555,1540,1526,1511,1498,1486,1475,1462,1446,1429,1415,1399,1385,1370,1355,1340,1324,1307,1288,1269,1253,1241,1230,1217,1202,1187,1174,1164,1157,1148,1138,1130,1122,1112,1103,1095,1086,1076,1066,1059,1050,1042,1028,1011,996,983,970,957,950,941,934,927,920,914,908,904,898,891,886,879,871,866,863,860,858,854,847,842,837,828,818,808,799,792,786,778,769,761,750,737,725,714,705,695,686,675,664,658];
export const RUN_M = 4413;

/** Whistler Peak to Blackcomb Peak, across Fitzsimmons Creek: 8,454 m. */
const PEAK_TO_BLACKCOMB = [2149,2168,2173,2168,2140,2093,2022,1981,1963,1939,1914,1897,1875,1868,1873,1881,1891,1908,1925,1938,1930,1879,1847,1814,1798,1784,1776,1780,1778,1767,1738,1710,1683,1652,1624,1594,1585,1583,1570,1540,1521,1517,1511,1508,1506,1485,1463,1453,1444,1422,1394,1369,1340,1305,1253,1209,1160,1121,1088,1049,1030,1027,1026,1031,1066,1095,1135,1190,1244,1295,1334,1362,1396,1425,1454,1482,1507,1540,1562,1590,1616,1640,1658,1678,1703,1737,1765,1787,1804,1819,1841,1866,1888,1909,1930,1961,1984,1997,2014,2040,2060,2081,2104,2127,2149,2171,2201,2224,2253,2291,2318,2301,2268,2244,2202,2181,2141,2121,2105,2076,2052,2035,2027,2018,2011,2000,2000,2007,2031,2063,2122,2154,2168,2192,2216,2234,2275,2334,2375,2381];
export const CROSS_M = 8454;

/** Black Tusk to Blackcomb Peak: 19,354 m. Drawn faintly behind. */
export const BACKDROP = [2106,2170,2231,2174,2165,2096,1944,1904,1873,1843,1823,1806,1801,1835,1884,1886,1857,1868,1888,1894,1879,1835,1769,1680,1656,1653,1666,1681,1667,1652,1630,1601,1579,1563,1552,1548,1540,1536,1534,1532,1531,1524,1511,1520,1538,1547,1533,1529,1536,1497,1475,1432,1370,1339,1324,1338,1329,1329,1305,1290,1262,1233,1216,1195,1177,1168,1131,1086,1036,949,878,843,853,869,898,953,1021,1090,1134,1162,1197,1255,1308,1362,1425,1502,1587,1683,1767,1872,1955,1984,1972,1946,1923,1891,1868,1829,1801,1781,1743,1708,1678,1644,1629,1606,1591,1569,1545,1535,1517,1467,1424,1375,1324,1271,1221,1161,1117,1077,1055,1073,1137,1212,1305,1390,1463,1535,1609,1672,1716,1731,1738,1768,1808,1834,1862,1892,1918,1929,1960,2008,2084,2205,2315,2313,2221,2166,2133,2109,2111,2169,2209,2224,2198,2258,2255,2261,2343,2381];
export const BACKDROP_M = 19354;

/** The section as [metres from Creekside, elevation] points: Creekside →
 *  Whistler Peak → Blackcomb Peak. */
export const SECTION: [number, number][] = [
  ...[...RUN_FROM_PEAK].reverse().map((e, i, a): [number, number] => [(i / (a.length - 1)) * RUN_M, e]),
  ...PEAK_TO_BLACKCOMB.slice(1).map((e, i, a): [number, number] => [RUN_M + ((i + 1) / a.length) * CROSS_M, e]),
];

export const PEAK_ELEV = 2149;
export const CREEK_ELEV = 658;
