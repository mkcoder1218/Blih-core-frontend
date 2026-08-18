import type { AppLanguage } from './config';

/**
 * Translation coverage for legacy/hard-coded ERP UI text.
 *
 * The app is large and historically rendered labels directly from English
 * strings. This catalog deliberately targets system/UI vocabulary only. It
 * does not contain department names, people names, emails, task titles, or
 * other user-created values, so those values remain exactly as authored.
 */
type LanguageMap = Record<Exclude<AppLanguage, 'en'>, string>;

const phrase = (am: string, ti: string, om: string): LanguageMap => ({ am, ti, om });

const PHRASES: Record<string, LanguageMap> = {
  'business admin': phrase('የድርጅት አስተዳዳሪ', 'ኣመሓዳሪ ትካል', 'Bulchaa Dhaabbataa'),
  'business settings': phrase('የድርጅት ቅንብሮች', 'ቅንብራት ትካል', 'Qindaa’ina Dhaabbataa'),
  'attendance settings': phrase('የመገኘት ቅንብሮች', 'ቅንብራት ምክትታል', 'Qindaa’ina Argamuu'),
  'probation settings': phrase('የሙከራ ጊዜ ቅንብሮች', 'ቅንብራት ግዜ ፈተነ', 'Qindaa’ina Yeroo Yaalii'),
  'smtp settings': phrase('የSMTP ቅንብሮች', 'ቅንብራት SMTP', 'Qindaa’ina SMTP'),
  'telegram task sync': phrase('የቴሌግራም ተግባር ማመሳሰል', 'ምውህሃድ ዕማም ቴሌግራም', 'Walsimsiisa Hojii Telegram'),
  'punctuality messages': phrase('የሰዓት አክባሪነት መልዕክቶች', 'መልእኽቲ ሰዓት ምኽባር', 'Ergaalee Yeroo Kabajuu'),
  'business profile': phrase('የድርጅት መገለጫ', 'መግለጺ ትካል', 'Ibsa Dhaabbataa'),
  'company name': phrase('የድርጅት ስም', 'ስም ኩባንያ', 'Maqaa Dhaabbataa'),
  'your business name': phrase('የድርጅትዎ ስም', 'ስም ትካልካ', 'Maqaa Dhaabbata Kee'),
  'default timezone': phrase('ነባሪ የሰዓት ክልል', 'ነባሪ ዞባ ሰዓት', 'Naannoo Sa’aatii Durtii'),
  'route project tasks': phrase('የፕሮጀክት ተግባራትን መራ', 'ዕማማት ፕሮጀክት ስደድ', 'Hojiiwwan Pirojektii Qajeelchi'),

  'people & profiles': phrase('ሰዎች እና መገለጫዎች', 'ሰባትን መግለጺታትን', 'Namootaa fi Ibsa Dhuunfaa'),
  'talent management': phrase('የችሎታ አስተዳደር', 'ምሕደራ ተውህቦ', 'Bulchiinsa Dandeettii'),
  'career management': phrase('የሙያ አስተዳደር', 'ምሕደራ ሞያ', 'Bulchiinsa Ogummaa'),
  'exit & offboarding': phrase('መልቀቅ እና ከስራ መሰናበት', 'ምውጻእን ምስንባትን', 'Hojii Gadhiisuu fi Geggeessuu'),
  'requests & leave': phrase('ጥያቄዎች እና ፈቃድ', 'ሕቶታትን ፍቓድን', 'Gaaffiiwwanii fi Hayyama'),
  'time & records': phrase('ሰዓት እና መዝገቦች', 'ሰዓትን መዛግብትን', 'Sa’aatii fi Galmeewwan'),
  'clients & influencers': phrase('ደንበኞች እና ተፅዕኖ ፈጣሪዎች', 'ዓማዊልን ጽልዋ ፈጠርትን', 'Maamiltootaa fi Dhiibbaa Uumtoota'),
  'policy library': phrase('የፖሊሲ ቤተ-መጻሕፍት', 'ቤተ መጻሕፍቲ ፖሊሲ', 'Mana Kitaabaa Imaammataa'),
  'task board': phrase('የተግባር ሰሌዳ', 'ሰሌዳ ዕማም', 'Gabatee Hojii'),
  'performance review': phrase('የአፈጻጸም ግምገማ', 'ገምጋም ኣፈጻጽማ', 'Madaallii Raawwii'),
  'evaluation form': phrase('የግምገማ ቅጽ', 'ቅጥዒ ገምጋም', 'Unka Madaallii'),
  'employee salary': phrase('የሰራተኛ ደመወዝ', 'ደሞዝ ሰራሕተኛ', 'Mindaa Hojjetaa'),
  'pay templates': phrase('የክፍያ አብነቶች', 'ኣብነታት ክፍሊት', 'Qajojii Kaffaltii'),

  'ready to post': phrase('ለመለጠፍ ዝግጁ', 'ንምልጣፍ ድሉው', 'Maxxansuuf Qophaa’e'),
  'active posting': phrase('ንቁ ማስታወቂያ', 'ንጡፍ ምልጣፍ', 'Maxxansa Hojii Irra Jiru'),
  'active posts': phrase('ንቁ ማስታወቂያዎች', 'ንጡፋት ምልጣፋት', 'Maxxansa Hojii Irra Jiran'),
  'ongoing recruitment': phrase('በሂደት ላይ ያለ ምልመላ', 'ዝቕጽል ምልመላ', 'Filannoo Adeemaa Jiru'),
  'my interviews': phrase('የእኔ ቃለ-መጠይቆች', 'ቃለ መሕትታተይ', 'Gaaffii fi Deebii Koo'),
  'offer templates': phrase('የቅጥር አቅርቦት አብነቶች', 'ኣብነታት ቅድመ ሓሳብ ቅጥሪ', 'Qajojii Dhiyeessa Hojii'),
  'closed posts': phrase('የተዘጉ ማስታወቂያዎች', 'ዝተዓጽዉ ምልጣፋት', 'Maxxansa Cufaman'),
  'applicant forms': phrase('የአመልካች ቅጾች', 'ቅጥዕታት ኣመልከትቲ', 'Unka Iyyattootaa'),
  'my exit': phrase('የእኔ መልቀቂያ', 'ምውጻአይ', 'Hojii Gadhiisuu Koo'),
  'exit requests': phrase('የመልቀቂያ ጥያቄዎች', 'ሕቶታት ምውጻእ', 'Gaaffii Hojii Gadhiisuu'),
  'exit reasons': phrase('የመልቀቂያ ምክንያቶች', 'ምኽንያታት ምውጻእ', 'Sababoota Hojii Gadhiisuu'),
  'my lateness': phrase('የእኔ መዘግየት', 'ምድንጓየይ', 'Turtii Koo'),
  'my lateness reason': phrase('የመዘግየቴ ምክንያት', 'ምኽንያት ምድንጓየይ', 'Sababa Turtii Koo'),
  'manual lateness': phrase('በእጅ የሚገባ መዘግየት', 'ብኢድ ዝኣቱ ምድንጓይ', 'Turtii Harkaan Galchamu'),
  'late reasons': phrase('የመዘግየት ምክንያቶች', 'ምኽንያታት ምድንጓይ', 'Sababoota Turtii'),
  'memo log': phrase('የማስታወሻ መዝገብ', 'መዝገብ ማስታወሻ', 'Galmee Yaadannoo'),
  'special request': phrase('ልዩ ጥያቄ', 'ፍሉይ ሕቶ', 'Gaaffii Addaa'),
  'work-from-home': phrase('ከቤት-መስራት', 'ካብ-ገዛ-ምስራሕ', 'Mana-Irraa-Hojii'),
  'work from home': phrase('ከቤት መስራት', 'ካብ ገዛ ምስራሕ', 'Mana Irraa Hojii'),

  'active recruitments': phrase('ንቁ ምልመላዎች', 'ንጡፋት ምልመላታት', 'Filannoo Hojii Irra Jiran'),
  'total applications': phrase('ጠቅላላ ማመልከቻዎች', 'ጠቕላላ ማመልከቻታት', 'Iyyannoowwan Waliigalaa'),
  'pending reviews': phrase('በመጠባበቅ ላይ ያሉ ግምገማዎች', 'ዝጽበዩ ገምጋማት', 'Madaallii Eegamaa Jiran'),
  'interviews scheduled': phrase('የተያዙ ቃለ-መጠይቆች', 'ዝተመደቡ ቃለ መሕትታት', 'Gaaffii fi Deebii Saganteeffaman'),
  'offers pending': phrase('በመጠባበቅ ላይ ያሉ አቅርቦቶች', 'ዝጽበዩ ቅድመ ሓሳባት', 'Dhiyeessawwan Eegamaa Jiran'),
  'hires this month': phrase('በዚህ ወር የተቀጠሩ', 'ኣብዚ ወርሒ ዝተቖጽሩ', 'Ji’a Kana Kan Qacaramanii'),
  'no change': phrase('ለውጥ የለም', 'ለውጢ የለን', 'Jijjiiramni Hin Jiru'),
  'awaiting response': phrase('ምላሽ በመጠባበቅ ላይ', 'መልሲ ይጽበ', 'Deebii Eegaa Jira'),
  'recruitment activity trend': phrase('የምልመላ እንቅስቃሴ አዝማሚያ', 'ኣንፈት ንጥፈታት ምልመላ', 'Adeemsa Sochii Filannoo'),
  'recruitment status mix': phrase('የምልመላ ሁኔታ ስብጥር', 'ውህደት ኩነታት ምልመላ', 'Makaa Haala Filannoo'),
  'candidate pipeline': phrase('የእጩዎች ሂደት', 'መስመር ሕጹያት', 'Adeemsa Kaadhimamtootaa'),
  'applications by position': phrase('ማመልከቻዎች በስራ መደብ', 'ማመልከቻታት ብመደብ ስራሕ', 'Iyyannoowwan Gahee Hojii Tiin'),

  'check-ins monitoring': phrase('የመግቢያ ምዝገባ ክትትል', 'ምክትታል ምእታው', 'Hordoffii Galmee Seensaa'),
  'review manual entries': phrase('በእጅ የገቡ መዝገቦችን ገምግም', 'ብኢድ ዝኣተዉ መዛግብቲ ገምግም', 'Galmeewwan Harkaan Galan Madaali'),
  'more filters': phrase('ተጨማሪ ማጣሪያዎች', 'ተወሰኽቲ መጻረዪታት', 'Calaltuu Dabalataa'),
  'all employees': phrase('ሁሉም ሰራተኞች', 'ኩሎም ሰራሕተኛታት', 'Hojjettoota Hunda'),
  'employee attendance': phrase('የሰራተኛ መገኘት', 'ምክትታል ሰራሕተኛ', 'Argamuu Hojjetaa'),
  'select visible': phrase('የሚታዩትን ምረጥ', 'ዝረኣዩ ምረጽ', 'Kan Mul’atan Fili'),
  'not recorded': phrase('አልተመዘገበም', 'ኣይተመዝገበን', 'Hin Galmoofne'),
  'review absence': phrase('መቅረትን ገምግም', 'ዘይምርካብ ገምግም', 'Hafuu Madaali'),
  'still working': phrase('አሁንም በስራ ላይ', 'ገና ይሰርሕ', 'Ammas Hojjechaa Jira'),
  'needs review': phrase('ግምገማ ያስፈልገዋል', 'ገምጋም የድልዮ', 'Madaallii Barbaada'),
  'search employees': phrase('ሰራተኞችን ፈልግ', 'ሰራሕተኛታት ድለ', 'Hojjettoota Barbaadi'),

  'mark all as read': phrase('ሁሉንም እንደተነበበ ምልክት አድርግ', 'ኩሉ ከም ዝተነበ ምልክት ግበር', 'Hunda Akka Dubbifametti Mallatteessi'),
  'no notifications yet': phrase('እስካሁን ማሳወቂያ የለም', 'ክሳብ ሕጂ ምልክታ የለን', 'Ammaaf Beeksisni Hin Jiru'),
};

const WORDS: Record<string, LanguageMap> = {
  overview: phrase('አጠቃላይ እይታ', 'ሓፈሻዊ ርእይቶ', 'Ilaalcha Waliigalaa'),
  requests: phrase('ጥያቄዎች', 'ሕቶታት', 'Gaaffiiwwan'),
  request: phrase('ጥያቄ', 'ሕቶ', 'Gaaffii'),
  ready: phrase('ዝግጁ', 'ድሉው', 'Qophaa’e'),
  to: phrase('ለ', 'ን', 'Gara'),
  post: phrase('ለጥፍ', 'ለጥፍ', 'Maxxansi'),
  posts: phrase('ማስታወቂያዎች', 'ምልጣፋት', 'Maxxansa'),
  active: phrase('ንቁ', 'ንጡፍ', 'Hojii Irra'),
  applicants: phrase('አመልካቾች', 'ኣመልከትቲ', 'Iyyattoota'),
  applicant: phrase('አመልካች', 'ኣመልካቲ', 'Iyyataa'),
  applications: phrase('ማመልከቻዎች', 'ማመልከቻታት', 'Iyyannoowwan'),
  application: phrase('ማመልከቻ', 'ማመልከቻ', 'Iyyannoo'),
  offers: phrase('የቅጥር አቅርቦቶች', 'ቅድመ ሓሳባት ቅጥሪ', 'Dhiyeessawwan Hojii'),
  offer: phrase('የቅጥር አቅርቦት', 'ቅድመ ሓሳብ ቅጥሪ', 'Dhiyeessa Hojii'),
  templates: phrase('አብነቶች', 'ኣብነታት', 'Qajojiiwwan'),
  template: phrase('አብነት', 'ኣብነት', 'Qajojii'),
  closed: phrase('የተዘጋ', 'ዝተዓጽወ', 'Cufame'),
  forms: phrase('ቅጾች', 'ቅጥዕታት', 'Unkaalee'),
  form: phrase('ቅጽ', 'ቅጥዒ', 'Unka'),
  people: phrase('ሰዎች', 'ሰባት', 'Namoota'),
  profiles: phrase('መገለጫዎች', 'መግለጺታት', 'Ibsa Dhuunfaa'),
  profile: phrase('መገለጫ', 'መግለጺ', 'Ibsa Dhuunfaa'),
  career: phrase('ሙያ', 'ሞያ', 'Ogummaa'),
  management: phrase('አስተዳደር', 'ምሕደራ', 'Bulchiinsa'),
  exit: phrase('መልቀቅ', 'ምውጻእ', 'Hojii Gadhiisuu'),
  offboarding: phrase('ከስራ መሰናበት', 'ምስንባት', 'Geggeessuu'),
  clearance: phrase('ማጣራት', 'ምጽራይ', 'Qulqulleessa'),
  reasons: phrase('ምክንያቶች', 'ምኽንያታት', 'Sababoota'),
  reason: phrase('ምክንያት', 'ምኽንያት', 'Sababa'),
  clients: phrase('ደንበኞች', 'ዓማዊል', 'Maamiltoota'),
  influencers: phrase('ተፅዕኖ ፈጣሪዎች', 'ጽልዋ ፈጠርቲ', 'Dhiibbaa Uumtoota'),
  categories: phrase('ምድቦች', 'ምድባት', 'Ramaddiiwwan'),
  category: phrase('ምድብ', 'ምድብ', 'Ramaddii'),
  knowledge: phrase('እውቀት', 'ፍልጠት', 'Beekumsa'),
  policy: phrase('ፖሊሲ', 'ፖሊሲ', 'Imaammata'),
  policies: phrase('ፖሊሲዎች', 'ፖሊሲታት', 'Imaammatoota'),
  library: phrase('ቤተ-መጻሕፍት', 'ቤተ መጻሕፍቲ', 'Mana Kitaabaa'),
  procedures: phrase('ሂደቶች', 'ኣገባባት', 'Adeemsaalee'),
  procedure: phrase('ሂደት', 'ኣገባብ', 'Adeemsa'),
  brain: phrase('እውቀት', 'ፍልጠት', 'Beekumsa'),
  time: phrase('ሰዓት', 'ሰዓት', 'Sa’aatii'),
  records: phrase('መዝገቦች', 'መዛግብቲ', 'Galmeewwan'),
  check: phrase('መዝግብ', 'መዝግብ', 'Galmeessi'),
  'check-ins': phrase('መግቢያ ምዝገባዎች', 'ምዝገባ ምእታው', 'Galmee Seensaa'),
  checkin: phrase('መግቢያ ምዝገባ', 'ምዝገባ ምእታው', 'Galmee Seensaa'),
  me: phrase('እኔን', 'ኣነ', 'Ana'),
  my: phrase('የእኔ', 'ናተይ', 'Koo'),
  lateness: phrase('መዘግየት', 'ምድንጓይ', 'Turtii'),
  manual: phrase('በእጅ', 'ብኢድ', 'Harkaan'),
  late: phrase('ዘግይቶ', 'ደንጉዩ', 'Ture'),
  memo: phrase('ማስታወሻ', 'ማስታወሻ', 'Yaadannoo'),
  log: phrase('መዝገብ', 'መዝገብ', 'Galmee'),
  leave: phrase('ፈቃድ', 'ፍቓድ', 'Hayyama'),
  leaves: phrase('ፈቃዶች', 'ፍቓዳት', 'Hayyamoota'),
  punctuality: phrase('ሰዓት አክባሪነት', 'ሰዓት ምኽባር', 'Yeroo Kabajuu'),
  special: phrase('ልዩ', 'ፍሉይ', 'Addaa'),
  work: phrase('ስራ', 'ስራሕ', 'Hojii'),
  from: phrase('ከ', 'ካብ', 'Irraa'),
  home: phrase('ቤት', 'ገዛ', 'Mana'),
  performance: phrase('አፈጻጸም', 'ኣፈጻጽማ', 'Raawwii'),
  review: phrase('ግምገማ', 'ገምጋም', 'Madaallii'),
  okrs: phrase('ዓላማዎች እና ቁልፍ ውጤቶች', 'ዕላማታትን ቁልፊ ውጽኢታትን', 'Kaayyoo fi Bu’aawwan Ijoo'),
  kpis: phrase('ቁልፍ የአፈጻጸም መለኪያዎች', 'ቁልፊ መለክዒታት ኣፈጻጽማ', 'Agarsiistota Raawwii Ijoo'),
  discipline: phrase('ዲሲፕሊን', 'ዲሲፕሊን', 'Naamusa'),
  evaluation: phrase('ግምገማ', 'ገምጋም', 'Madaallii'),
  employee: phrase('ሰራተኛ', 'ሰራሕተኛ', 'Hojjetaa'),
  employees: phrase('ሰራተኞች', 'ሰራሕተኛታት', 'Hojjettoota'),
  salary: phrase('ደመወዝ', 'ደሞዝ', 'Mindaa'),
  pay: phrase('ክፍያ', 'ክፍሊት', 'Kaffaltii'),
  exports: phrase('ወደ ውጭ ማውጣት', 'ምውጻእ ዳታ', 'Ergama Daataa'),
  projects: phrase('ፕሮጀክቶች', 'ፕሮጀክታት', 'Pirojektoota'),
  project: phrase('ፕሮጀክት', 'ፕሮጀክት', 'Pirojektii'),
  tasks: phrase('ተግባራት', 'ዕማማት', 'Hojiiwwan'),
  task: phrase('ተግባር', 'ዕማም', 'Hojii'),
  board: phrase('ሰሌዳ', 'ሰሌዳ', 'Gabatee'),
  settings: phrase('ቅንብሮች', 'ቅንብራት', 'Qindaa’ina'),
  attendance: phrase('መገኘት', 'ምክትታል', 'Argamuu'),
  probation: phrase('የሙከራ ጊዜ', 'ግዜ ፈተነ', 'Yeroo Yaalii'),
  telegram: phrase('ቴሌግራም', 'ቴሌግራም', 'Telegram'),
  sync: phrase('ማመሳሰል', 'ምውህሃድ', 'Walsimsiisa'),
  messages: phrase('መልዕክቶች', 'መልእኽታት', 'Ergaalee'),
  subscription: phrase('ምዝገባ', 'ምዝገባ', 'Miseensummaa'),
  business: phrase('ድርጅት', 'ትካል', 'Dhaabbata'),
  company: phrase('ድርጅት', 'ኩባንያ', 'Dhaabbata'),
  name: phrase('ስም', 'ስም', 'Maqaa'),
  default: phrase('ነባሪ', 'ነባሪ', 'Durtii'),
  timezone: phrase('የሰዓት ክልል', 'ዞባ ሰዓት', 'Naannoo Sa’aatii'),
  recruitment: phrase('ምልመላ', 'ምልመላ', 'Filannoo'),
  total: phrase('ጠቅላላ', 'ጠቕላላ', 'Waliigalaa'),
  pending: phrase('በመጠባበቅ ላይ', 'ይጽበ', 'Eegamaa'),
  reviews: phrase('ግምገማዎች', 'ገምጋማት', 'Madaalliiwwan'),
  interviews: phrase('ቃለ-መጠይቆች', 'ቃለ መሕትታት', 'Gaaffii fi Deebii'),
  scheduled: phrase('የተያዘ', 'ዝተመደበ', 'Saganteeffame'),
  hires: phrase('ቅጥሮች', 'ቁጽሪታት', 'Qacarrii'),
  this: phrase('ይህ', 'እዚ', 'Kana'),
  month: phrase('ወር', 'ወርሒ', 'Ji’a'),
  approved: phrase('የጸደቀ', 'ዝጸደቐ', 'Mirkanaa’e'),
  no: phrase('የለም', 'የለን', 'Hin Jiru'),
  change: phrase('ለውጥ', 'ለውጢ', 'Jijjiirama'),
  clear: phrase('ግልጽ', 'ጽሩይ', 'Qulqulluu'),
  awaiting: phrase('በመጠባበቅ ላይ', 'ይጽበ', 'Eegaa'),
  response: phrase('ምላሽ', 'መልሲ', 'Deebii'),
  activity: phrase('እንቅስቃሴ', 'ንጥፈት', 'Sochii'),
  trend: phrase('አዝማሚያ', 'ኣንፈት', 'Adeemsa'),
  status: phrase('ሁኔታ', 'ኩነታት', 'Haala'),
  mix: phrase('ስብጥር', 'ውህደት', 'Makaa'),
  candidate: phrase('እጩ', 'ሕጹይ', 'Kaadhimamaa'),
  pipeline: phrase('ሂደት', 'መስመር', 'Adeemsa'),
  by: phrase('በ', 'ብ', 'Tiin'),
  position: phrase('የስራ መደብ', 'መደብ ስራሕ', 'Gahee Hojii'),
  present: phrase('ተገኝቷል', 'ተረኺቡ', 'Argame'),
  still: phrase('አሁንም', 'ገና', 'Ammas'),
  working: phrase('በስራ ላይ', 'ይሰርሕ', 'Hojjechaa'),
  needs: phrase('ያስፈልገዋል', 'የድልዮ', 'Barbaada'),
  absent: phrase('ቀሪ', 'ዘይተረኽበ', 'Hafe'),
  export: phrase('ወደ ውጭ አውጣ', 'ኣውጽእ', 'Ergi'),
  today: phrase('ዛሬ', 'ሎሚ', 'Har’a'),
  "today's": phrase('የዛሬ', 'ናይ ሎሚ', 'Har’aa'),
  exceptions: phrase('ልዩ ሁኔታዎች', 'ፍሉያት ኩነታት', 'Haala Addaa'),
  and: phrase('እና', 'እና', 'fi'),
  selected: phrase('የተመረጠ', 'ዝተመርጸ', 'Filatame'),
  date: phrase('ቀን', 'ዕለት', 'Guyyaa'),
  search: phrase('ፈልግ', 'ድለ', 'Barbaadi'),
  department: phrase('ክፍል', 'ክፍሊ', 'Kutaa'),
  all: phrase('ሁሉም', 'ኩሉ', 'Hunda'),
  more: phrase('ተጨማሪ', 'ተወሳኺ', 'Dabalataa'),
  filters: phrase('ማጣሪያዎች', 'መጻረዪታት', 'Calaltoota'),
  select: phrase('ምረጥ', 'ምረጽ', 'Fili'),
  visible: phrase('የሚታይ', 'ዝረአ', 'Mul’atu'),
  shown: phrase('የሚታዩ', 'ዝረኣዩ', 'Mul’atan'),
  on: phrase('ላይ', 'ኣብ', 'Irra'),
  page: phrase('ገጽ', 'ገጽ', 'Fuula'),
  record: phrase('መዝገብ', 'መዝገብ', 'Galmee'),
  checkins: phrase('መግቢያ ምዝገባዎች', 'ምዝገባ ምእታው', 'Galmee Seensaa'),
  worked: phrase('የተሰራ', 'ዝተሰርሐ', 'Hojjetame'),
  action: phrase('ድርጊት', 'ተግባር', 'Tarkaanfii'),
  in: phrase('ገብቷል', 'ኣትዩ', 'Seene'),
  lunch: phrase('ምሳ', 'ምሳሕ', 'Laaqana'),
  out: phrase('ወጥቷል', 'ወጺኡ', 'Ba’e'),
  not: phrase('አል', 'ኣይ', 'Hin'),
  recorded: phrase('ተመዝግቧል', 'ተመዝጊቡ', 'Galmaa’e'),
  absence: phrase('መቅረት', 'ዘይምርካብ', 'Hafuu'),
  notifications: phrase('ማሳወቂያዎች', 'ምልክታታት', 'Beeksisawwan'),
  loading: phrase('በመጫን ላይ', 'ይጽዕን', 'Fe’amaa Jira'),
};

function normalize(value: string): string {
  return value
    .replace(/…/g, '...')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en');
}

function directTranslation(source: string, language: Exclude<AppLanguage, 'en'>): string | null {
  const normalized = normalize(source);
  return PHRASES[normalized]?.[language] ?? WORDS[normalized]?.[language] ?? null;
}

/**
 * Safely translate short legacy system text.
 *
 * 1. Full known phrases always win.
 * 2. Case/punctuation differences are normalized.
 * 3. Otherwise every alphabetic word must be known system vocabulary before
 *    composition is allowed. One unknown word makes the function return the
 *    original source, protecting names and user-created text.
 */
export function translateSystemText(source: string, language: AppLanguage): string {
  if (language === 'en') return source;

  const full = directTranslation(source, language);
  if (full) return full;

  const pieces = source.split(/([\s,:;|·/()[\]&+]+|(?<=\w)-(?=\w))/g).filter(Boolean);
  let translatedAny = false;

  const translated = pieces.map((piece) => {
    if (/^\s+$/.test(piece)) return piece;
    if (/^[\d\s:;|·/()[\]&+.,%+\-]+$/.test(piece)) {
      if (piece.includes('&')) return piece.replace('&', language === 'om' ? 'fi' : 'እና');
      return piece;
    }

    const punctuation = piece.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    const prefix = punctuation?.[1] ?? '';
    const core = punctuation?.[2] ?? piece;
    const suffix = punctuation?.[3] ?? '';

    if (!/[A-Za-z]/.test(core)) return piece;

    const replacement = directTranslation(core, language);
    if (!replacement) return null;
    translatedAny = true;
    return `${prefix}${replacement}${suffix}`;
  });

  if (!translatedAny || translated.some((piece) => piece === null)) return source;
  return translated.join('');
}
