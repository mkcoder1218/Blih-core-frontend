import type { AppLanguage } from './config';

type TargetLanguage = Exclude<AppLanguage, 'en'>;
type LanguageMap = Record<TargetLanguage, string>;

const phrase = (am: string, ti: string, om: string): LanguageMap => ({ am, ti, om });

/**
 * Additional shared labels that come from legacy navigation, dashboards,
 * settings, attendance and common ERP surfaces.
 */
const EXACT: Record<string, LanguageMap> = {
  'return to home dashboard': phrase('ወደ ዋና መቆጣጠሪያ ሰሌዳ ተመለስ', 'ናብ ዋና መቆጻጸሪ ሰሌዳ ተመለስ', "Gara Gabatee To'annoo Ijootti Deebi'i"),
  'my profile': phrase('የእኔ መገለጫ', 'መግለጺየይ', 'Ibsa Dhuunfaa Koo'),
  'roles & permissions': phrase('ሚናዎች እና ፈቃዶች', 'ተራታትን ፍቓዳትን', 'Gahee fi Hayyamoota'),
  'attendance & leave': phrase('መገኘት እና ፈቃድ', 'ምክትታልን ፍቓድን', 'Argamuu fi Hayyama'),
  'workforce finance': phrase('የሰው ኃይል ፋይናንስ', 'ፋይናንስ ሓይሊ ሰብ', 'Faayinaansii Humna Namaa'),
  'subscription & settings': phrase('ምዝገባ እና ቅንብሮች', 'ምዝገባን ቅንብራትን', 'Miseensummaa fi Qindaa’ina'),
  'intern portal': phrase('የልምምድ ሰራተኛ ፖርታል', 'ፖርታል ተለማማዲ', 'Poortaalii Leenjifamaa'),
  'employee portal': phrase('የሰራተኛ ፖርታል', 'ፖርታል ሰራሕተኛ', 'Poortaalii Hojjetaa'),
  'hr manager': phrase('የሰው ኃይል አስተዳዳሪ', 'ኣመሓዳሪ ሓይሊ ሰብ', 'Bulchaa Humna Namaa'),
  'super admin': phrase('ዋና አስተዳዳሪ', 'ላዕለዋይ ኣመሓዳሪ', 'Bulchaa Olaanaa'),

  'check me in': phrase('መግቢያዬን መዝግብ', 'ምእታወይ መዝግብ', 'Seensa Koo Galmeessi'),
  'lunch in': phrase('ከምሳ መመለሻ', 'ካብ ምሳሕ ምምላስ', 'Laaqana Irraa Deebi’uu'),
  'lunch out': phrase('ለምሳ መውጫ', 'ንምሳሕ ምውጻእ', 'Laaqanaaf Ba’uu'),
  'late arrivals': phrase('ዘግይተው የገቡ', 'ደንጉዮም ዝኣተዉ', 'Kan Tursanii Galan'),
  'incomplete check-outs': phrase('ያልተጠናቀቁ የመውጫ ምዝገባዎች', 'ዘይተዛዘሙ ምዝገባ ምውጻእ', 'Galmee Ba’iinsaa Hin Xumuramne'),
  'hr / attendance': phrase('የሰው ኃይል / መገኘት', 'ሓይሊ ሰብ / ምክትታል', 'Humna Namaa / Argamuu'),
  'review today’s attendance, exceptions, and employee requests.': phrase('የዛሬን መገኘት፣ ልዩ ሁኔታዎችን እና የሰራተኛ ጥያቄዎችን ገምግም።', 'ናይ ሎሚ ምክትታል፣ ፍሉያት ኩነታትን ሕቶታት ሰራሕተኛታትን ገምግም።', 'Argamuu har’aa, haala addaa fi gaaffii hojjettootaa madaali.'),
  "review today's attendance, exceptions, and employee requests.": phrase('የዛሬን መገኘት፣ ልዩ ሁኔታዎችን እና የሰራተኛ ጥያቄዎችን ገምግም።', 'ናይ ሎሚ ምክትታል፣ ፍሉያት ኩነታትን ሕቶታት ሰራሕተኛታትን ገምግም።', 'Argamuu har’aa, haala addaa fi gaaffii hojjettootaa madaali.'),

  'create profile': phrase('መገለጫ ፍጠር', 'መግለጺ ፍጠር', 'Ibsa Dhuunfaa Uumi'),
  'bulk create': phrase('በጅምላ ፍጠር', 'ብጅምላ ፍጠር', 'Baay’inaan Uumi'),
  'contract templates': phrase('የውል አብነቶች', 'ኣብነታት ውዕል', 'Qajojii Waliigaltee'),
  'left employees': phrase('የለቀቁ ሰራተኞች', 'ዝወጹ ሰራሕተኛታት', 'Hojjettoota Dhiisan'),
  'departments & positions': phrase('ክፍሎች እና የስራ መደቦች', 'ክፍልታትን መደባት ስራሕን', 'Kutaalee fi Gahee Hojii'),
  'pending registrations': phrase('በመጠባበቅ ላይ ያሉ ምዝገባዎች', 'ዝጽበዩ ምዝገባታት', 'Galmeewwan Eegamaa Jiran'),
  'exemption requests': phrase('የነጻ መሆን ጥያቄዎች', 'ሕቶታት ነጻነት', 'Gaaffiiwwan Bilisa Ta’uu'),
  'security & sso': phrase('ደህንነት እና SSO', 'ድሕነትን SSOን', 'Nageenya fi SSO'),
  'audit logs': phrase('የኦዲት መዝገቦች', 'መዛግብቲ ኦዲት', 'Galmeewwan Odiitii'),
  'smtp providers': phrase('የSMTP አቅራቢዎች', 'ኣቕረብቲ SMTP', 'Dhiyeessitoota SMTP'),
  'sector focus': phrase('የዘርፍ ትኩረት', 'ትኹረት ዘርፊ', 'Xiyyeeffannoo Damee'),

  'active recruitments': phrase('ንቁ ምልመላዎች', 'ንጡፋት ምልመላታት', 'Filannoo Hojii Irra Jiran'),
  'total applications': phrase('ጠቅላላ ማመልከቻዎች', 'ጠቕላላ ማመልከቻታት', 'Iyyannoowwan Waliigalaa'),
  'pending reviews': phrase('በመጠባበቅ ላይ ያሉ ግምገማዎች', 'ዝጽበዩ ገምጋማት', 'Madaallii Eegamaa Jiran'),
  'interviews scheduled': phrase('የተያዙ ቃለ-መጠይቆች', 'ዝተመደቡ ቃለ መሕትታት', 'Gaaffii fi Deebii Saganteeffaman'),
  'offers pending': phrase('በመጠባበቅ ላይ ያሉ አቅርቦቶች', 'ዝጽበዩ ቅድመ ሓሳባት', 'Dhiyeessawwan Eegamaa Jiran'),
  'hires this month': phrase('በዚህ ወር የተቀጠሩ', 'ኣብዚ ወርሒ ዝተቖጽሩ', 'Ji’a Kana Kan Qacaramanii'),
  'candidate pipeline': phrase('የእጩዎች ሂደት', 'መስመር ሕጹያት', 'Adeemsa Kaadhimamtootaa'),
  'applications by position': phrase('ማመልከቻዎች በስራ መደብ', 'ማመልከቻታት ብመደብ ስራሕ', 'Iyyannoowwan Gahee Hojii Tiin'),
};

const WORDS: Record<string, LanguageMap> = {
  businesses: phrase('ድርጅቶች', 'ትካላት', 'Dhaabbilee'),
  roles: phrase('ሚናዎች', 'ተራታት', 'Gaheewwan'),
  permissions: phrase('ፈቃዶች', 'ፍቓዳት', 'Hayyamoota'),
  dashboard: phrase('መቆጣጠሪያ ሰሌዳ', 'መቆጻጸሪ ሰሌዳ', "Gabatee To'annoo"),
  calendar: phrase('የቀን መቁጠሪያ', 'ዓውደ ኣዋርሕ', 'Kaalaandarii'),
  history: phrase('ታሪክ', 'ታሪኽ', 'Seenaa'),
  timesheet: phrase('የስራ ሰዓት መዝገብ', 'መዝገብ ሰዓት ስራሕ', 'Galmee Sa’aatii Hojii'),
  overtime: phrase('ተጨማሪ ሰዓት', 'ተወሳኺ ሰዓት', 'Sa’aatii Dabalataa'),
  unavailable: phrase('የማይገኝ', 'ዘይርከብ', 'Hin Argamne'),
  onboarding: phrase('ወደ ስራ ማስገባት', 'ናብ ስራሕ ምእታው', 'Hojii Jalqabsiisuu'),
  contracts: phrase('ውሎች', 'ውዕላት', 'Waliigalteewwan'),
  contract: phrase('ውል', 'ውዕል', 'Waliigaltee'),
  progress: phrase('እድገት', 'ምዕባለ', 'Fooyya’iinsa'),
  checklists: phrase('የማረጋገጫ ዝርዝሮች', 'ዝርዝር መረጋገጺ', 'Tarree Mirkaneessaa'),
  organogram: phrase('የድርጅት መዋቅር', 'ስእሊ መዋቕር ትካል', 'Caasaa Dhaabbataa'),
  directory: phrase('ማውጫ', 'መዝገብ ኣድራሻ', 'Galmee Teessoo'),
  interns: phrase('የልምምድ ሰራተኞች', 'ተለማመድቲ', 'Leenjifamtoota'),
  devices: phrase('መሳሪያዎች', 'መሳርሒታት', 'Meeshaalee'),
  events: phrase('ክስተቶች', 'ፍጻመታት', 'Taateewwan'),
  archive: phrase('ማህደር', 'መዝገብ ታሪኽ', 'Kuusaa Seenaa'),
  integrations: phrase('ውህደቶች', 'ውህደታት', 'Walitti Makamoota'),
  security: phrase('ደህንነት', 'ድሕነት', 'Nageenya'),
  notifications: phrase('ማሳወቂያዎች', 'ምልክታታት', 'Beeksisawwan'),
  plans: phrase('ዕቅዶች', 'ውጥናት', 'Karoora'),
  staff: phrase('ሰራተኛ', 'ሰራሕተኛ', 'Hojjetaa'),
  portal: phrase('ፖርታል', 'ፖርታል', 'Poortaalii'),
  interviews: phrase('ቃለ-መጠይቆች', 'ቃለ መሕትታት', 'Gaaffii fi Deebii'),
  applicants: phrase('አመልካቾች', 'ኣመልከትቲ', 'Iyyattoota'),
  hires: phrase('ቅጥሮች', 'ቁጽሪታት', 'Qacarrii'),
  clear: phrase('ግልጽ', 'ጽሩይ', 'Qulqulluu'),
  export: phrase('ወደ ውጭ አውጣ', 'ኣውጽእ', 'Ergi'),
  select: phrase('ምረጥ', 'ምረጽ', 'Fili'),
  absent: phrase('ቀሪ', 'ዘይተረኽበ', 'Hafe'),
  present: phrase('ተገኝቷል', 'ተረኺቡ', 'Argame'),
};

function normalize(value: string) {
  return value
    .replace(/…/g, '...')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en');
}

export function translateExtraSystemText(source: string, language: AppLanguage): string {
  if (language === 'en') return source;
  const target = language as TargetLanguage;
  const normalized = normalize(source);

  const exact = EXACT[normalized]?.[target] ?? WORDS[normalized]?.[target];
  if (exact) return exact;

  // Translate "Selected date: <value>" without touching the date itself.
  const selectedDate = source.match(/^\s*Selected date:\s*(.+?)\.?\s*$/i);
  if (selectedDate) {
    const label = target === 'am' ? 'የተመረጠ ቀን' : target === 'ti' ? 'ዝተመርጸ ዕለት' : 'Guyyaa Filatame';
    return `${label}: ${selectedDate[1]}.`;
  }

  // Translate common count summaries while preserving the numbers.
  const lateSummary = source.match(/^\s*(\d+)\s+late arrivals\s*[·|]\s*(\d+)\s+incomplete check-outs\s*$/i);
  if (lateSummary) {
    if (target === 'am') return `${lateSummary[1]} ዘግይተው የገቡ · ${lateSummary[2]} ያልተጠናቀቁ የመውጫ ምዝገባዎች`;
    if (target === 'ti') return `${lateSummary[1]} ደንጉዮም ዝኣተዉ · ${lateSummary[2]} ዘይተዛዘሙ ምዝገባ ምውጻእ`;
    return `${lateSummary[1]} kan tursanii galan · ${lateSummary[2]} galmee ba’iinsaa hin xumuramne`;
  }

  const pageSummary = source.match(/^\s*(\d+)\s+shown on this page\s*[·|]\s*(\d+)\s+total records\s*$/i);
  if (pageSummary) {
    if (target === 'am') return `በዚህ ገጽ ${pageSummary[1]} ታይተዋል · ጠቅላላ ${pageSummary[2]} መዝገቦች`;
    if (target === 'ti') return `ኣብዚ ገጽ ${pageSummary[1]} ተራእዮም · ጠቕላላ ${pageSummary[2]} መዛግብቲ`;
    return `Fuula kana irratti ${pageSummary[1]} mul’atan · galmeewwan waliigalaa ${pageSummary[2]}`;
  }

  return source;
}
