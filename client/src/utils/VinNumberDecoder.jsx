
// -------------------- Error type --------------------
export class VinError extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message){ super(message); this.name = 'VinError'; this.code = code; }
}

// -------------------- Helpers & constants --------------------
// Allowed VIN chars (A-H, J-N, P, R-Z, 0-9) — excludes I, O, Q
const ALLOWED = /^[A-HJ-NPR-Z0-9]{17}$/;

// ISO 3779 transliteration values
const CHAR_VALUES = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8, J:1,K:2,L:3,M:4,N:5,P:7, R:9,
  S:2,T:3,U:4,V:5,W:6,X:7,Y:8,Z:9,
  '1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'0':0
};

// Weights for positions 1..17
const WEIGHTS = [8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];

// Region by first character
const REGIONS = {
  A:'Africa',B:'Africa',C:'Africa',D:'Africa',E:'Africa',F:'Africa',G:'Africa',H:'Africa',
  J:'Asia',K:'Asia',L:'Asia',M:'Asia',N:'Asia',P:'Asia',R:'Asia',
  S:'Europe',T:'Europe',U:'Europe',V:'Europe',W:'Europe',X:'Europe',Y:'Europe',Z:'Europe',
  1:'North America',2:'North America',3:'North America',4:'North America',5:'North America',
  6:'Oceania',7:'Oceania',8:'South America',9:'South America'
};

// Base model-year code sequence; repeats every 30 years from 1980
const YEAR_SEQ = 'ABCDEFGHJKLMNPRSTVWXY123456789';
const YEAR_CODE_SET = new Set(YEAR_SEQ.split(''));

function resolveModelYear(yearCode, { currentYear = new Date().getFullYear(), minYear = 1980, maxYear = currentYear + 1 } = {}){
  if (!YEAR_CODE_SET.has(yearCode)) return null;
  // Codes map to 1980 + idx + 30*k. Pick the value in [minYear, maxYear] closest to currentYear.
  const idx = YEAR_SEQ.indexOf(yearCode);
  const base = 1980 + idx;
  // Find k such that year = base + 30k within range
  let best = null;
  for (let k = -3; k <= 3; k++) {
    const y = base + 30 * k;
    if (y >= minYear && y <= maxYear) {
      if (best === null || Math.abs(y - currentYear) < Math.abs(best - currentYear)) best = y;
    }
  }
  return best;
}

function computeCheckDigit(vin){
  let sum = 0;
  for (let i=0;i<17;i++){
    const ch = vin[i];
    const val = CHAR_VALUES[ch];
    if (val === undefined) return null; // should not happen if regex validated
    sum += val * WEIGHTS[i];
  }
  const remainder = sum % 11;
  return remainder === 10 ? 'X' : String(remainder);
}

export function normalizeVin(vin){
  if (vin == null) return '';
  return String(vin).toUpperCase().replace(/\s+/g,'').trim();
}

// -------------------- WMI table --------------------
// NOTE: There is no truly exhaustive offline WMI list. This table aims for broad, practical coverage.
// Use registerWMIs() to add/override at runtime.
const WMI_MAP = Object.create(null);
function addWMIs(obj){ for (const k in obj) { WMI_MAP[k] = obj[k]; } }

// Core coverage (US, EU, JP, KR, CN, MX, CA, etc.)
addWMIs({
  // US & North America major
  '1FA':'Ford','1FB':'Ford','1FD':'Ford','1FM':'Ford','1FT':'Ford','1C3':'Chrysler','1C4':'Chrysler/Jeep','1D7':'Dodge Truck','1G1':'Chevrolet','1G2':'Pontiac','1G3':'Oldsmobile','1G4':'Buick','1G6':'Cadillac','1GC':'Chevrolet','1GN':'Chevrolet SUV/Truck','1G8':'Saturn','1N4':'Nissan USA','1HG':'Honda USA','1J4':'Jeep','1YV':'Mazda USA','19U':'Acura USA','19X':'Honda USA','1F9':'Rivian',
  '2HG':'Honda Canada','2T3':'Toyota Canada','2G1':'Chevrolet Canada','2G4':'Buick Canada','2G6':'Cadillac Canada',
  '3VW':'Volkswagen Mexico','3N1':'Nissan Mexico','3GN':'Chevrolet Mexico','3FA':'Ford Mexico',
  '4JG':'Mercedes-Benz USA','4S3':'Subaru USA','4T1':'Toyota USA','4T3':'Toyota USA','5J6':'Honda USA (SUV)','5N1':'Nissan USA (SUV/Truck)','5TD':'Toyota USA (Minivan/SUV)','5XY':'Kia USA','5YJ':'Tesla','7SA':'Tesla (EU)','7LG':'Lucid',

  // Japan
  'JAA':'Isuzu','JA3':'Mitsubishi','JAL':'Isuzu','JHM':'Honda','JHL':'Honda SUV','JH4':'Acura','JMB':'Mitsubishi','JNK':'Infiniti','JN1':'Nissan','JN8':'Nissan SUV','JSA':'Suzuki','JS2':'Suzuki','JT2':'Toyota','JTD':'Toyota','JTE':'Toyota SUV','JTH':'Lexus','JTL':'Toyota',

  // Korea
  'KMH':'Hyundai','KM8':'Hyundai SUV','KND':'Kia','KNA':'Kia','KMT':'Genesis',

  // Europe (Germany, UK, etc.)
  'WBA':'BMW','WBS':'BMW M','WBY':'BMW i','WBX':'BMW','WVW':'Volkswagen','WV2':'Volkswagen Vans','WAU':'Audi','WDA':'Mercedes-Benz','WDB':'Mercedes-Benz','WDD':'Mercedes-Benz','WDW':'Mercedes-AMG','W0L':'Opel/Vauxhall',
  'SAL':'Land Rover','SAJ':'Jaguar','SCA':'Rolls-Royce','SCB':'Bentley','SCC':'Lotus','VF1':'Renault','VF3':'Peugeot','VF7':'Citroën','VSS':'SEAT',

  // Italy
  'ZFA':'Fiat','ZFF':'Ferrari','ZAR':'Alfa Romeo','ZAM':'Maserati','ZHW':'Lamborghini',

  // Sweden / Volvo Group
  'YV1':'Volvo','YV4':'Volvo SUV','YS3':'Saab',

  // China (selection)
  'LRW':'Tesla China','LSG':'SAIC-GM','LFP':'Great Wall','LFV':'FAW-VW','LDC':'Dongfeng','LVS':'SAIC Maxus','LZW':'SAIC-GM-Wuling','L6T':'NIO','LE4':'BYD','LVV':'Chery',

  // Thailand / India / others (selection)
  'MMB':'Mitsubishi Thailand','MRH':'Honda Thailand','MA3':'Maruti Suzuki','PL1':'Proton',
});

export function registerWMIs(map){ if (map && typeof map === 'object') addWMIs(map); }
export function getKnownWmis(){ return Object.freeze({ ...WMI_MAP }); }

function decodeManufacturer(wmi){
  if (WMI_MAP[wmi]) return WMI_MAP[wmi];
  const two = wmi.slice(0,2);
  // Prefer the first exact 3-char, then approximate 2-char prefix match
  const approxKey = Object.keys(WMI_MAP).find(k => k.startsWith(two));
  return approxKey ? `${WMI_MAP[approxKey]} (approx.)` : `Unknown (WMI: ${wmi})`;
}

// -------------------- Main decode --------------------
/**
 * Decodes a VIN string and returns a structured object.
 * Throws VinError with `.code` for invalid input.
 * @param {string} vinInput
 * @param {object} [opts]
 * @param {boolean} [opts.requireValidCheckDigit=false] Throw if check digit mismatches.
 * @param {boolean} [opts.assumeNaCheckDigit=true] If true, only *enforce* check digit for North America (1..5). Else validate for all.
 * @param {number}  [opts.minYear=1980] Lower bound for plausible model year.
 * @param {number}  [opts.maxYear=new Date().getFullYear()+1] Upper bound for plausible model year.
 * @param {number}  [opts.currentYear=new Date().getFullYear()] Used to pick the right 30-year cycle.
 * @returns {{
 *   vin:string,wmi:string,vds:string,vis:string,
 *   region:string,manufacturer:string,
 *   modelYear:number|null,
 *   checkDigit:{given:string,expected:string|null,valid:boolean,reason?:string},
 *   plantCode:string,serialNumber:string
 * }}
 */
export function decodeVinData(vinInput, opts = {}){
  const {
    requireValidCheckDigit = false,
    assumeNaCheckDigit = true,
    minYear = 1980,
    maxYear = new Date().getFullYear() + 1,
    currentYear = new Date().getFullYear(),
  } = opts;

  if (vinInput == null) throw new VinError('ERR_REQUIRED', 'VIN is required');
  if (typeof vinInput !== 'string') throw new VinError('ERR_TYPE', 'VIN must be a string');
  const vin = normalizeVin(vinInput);
  if (vin.length !== 17) throw new VinError('ERR_LENGTH', 'VIN must be exactly 17 characters');
  if (!ALLOWED.test(vin)) throw new VinError('ERR_CHARS', 'VIN contains invalid characters (I, O, Q not allowed)');

  const wmi = vin.slice(0,3);
  const vds = vin.slice(3,9);
  const vis = vin.slice(9);

  const region = REGIONS[vin[0]] || 'Unknown';

  // Check digit validation rules
  let expectedCheck = computeCheckDigit(vin);
  const givenCheck = vin[8];
  let checkValid = expectedCheck === givenCheck;
  let checkReason = undefined;

  // Some regions outside North America historically did not require enforcing the check digit.
  const shouldEnforceCheck = assumeNaCheckDigit ? (vin[0] >= '1' && vin[0] <= '5') : true;
  if (!shouldEnforceCheck) {
    // We compute it but don't strictly require validity; report status and reason
    if (!checkValid) { checkReason = 'Not enforced outside North America'; }
    if (!requireValidCheckDigit) checkValid = true; // treat as informational
  }

  if (!checkValid && requireValidCheckDigit) {
    throw new VinError('ERR_CHECKDIGIT', `Invalid check digit: got ${givenCheck}, expected ${expectedCheck}`);
  }

  // Model year resolution across cycles
  const yearCode = vin[9];
  const modelYear = resolveModelYear(yearCode, { currentYear, minYear, maxYear }) ?? null;

  const manufacturer = decodeManufacturer(wmi);
  const plantCode = vin[10] || '';
  const serialNumber = vin.slice(11);

  return {
    vin,
    wmi, vds, vis,
    region,
    manufacturer,
    modelYear,
    checkDigit: { given: givenCheck, expected: expectedCheck, valid: !!checkValid, ...(checkReason?{reason:checkReason}:{}) },
    plantCode,
    serialNumber
  };
}

// Default export for convenience
export default decodeVinData;

// Convenience helper: decode a VIN and save into component state
// Usage inside a React component:
//   const [decoded, setDecoded] = useState(null);
//   const [err, setErr] = useState(null);
//   VinNumberDecoder('1HGCM82633A004352', setDecoded, setErr, { requireValidCheckDigit: false });
/**
 * Decodes a VIN and saves the result into state.
 * @param {string} vinInput - Raw VIN string from user/input
 * @param {(value:any)=>void} setState - React setState for decoded data
 * @param {(err:VinError|null)=>void} [setError] - Optional React setState for error
 * @param {object} [opts] - Same options accepted by decodeVinData
 * @returns {object|null} The decoded object, or null on error
 */

export function VinNumberDecoder(vinInput, setState, setError, opts) {
  try {
    const data = decodeVinData(vinInput, opts);
    if (typeof setState === 'function') setState(data);
    if (typeof setError === 'function') setError(null);
    return data;
  } catch (e) {
    // Normalize to VinError where possible
    const err = (e && e.name === 'VinError') ? e : new VinError('ERR_UNKNOWN', e?.message || 'Unknown VIN decode error');
    if (typeof setState === 'function') setState(null);
    if (typeof setError === 'function') setError(err);
    return null;
  }
}
