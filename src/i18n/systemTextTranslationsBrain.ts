import type { AppLanguage } from './config';

type TargetLanguage = Exclude<AppLanguage, 'en'>;
type LanguageMap = Record<TargetLanguage, string>;

const phrase = (am: string, ti: string, om: string): LanguageMap => ({ am, ti, om });

const EXACT: Record<string, LanguageMap> = {
  // Brain navigation tabs
  overview: phrase('አጠቃላይ እይታ', 'ሓፈሻዊ ርእይቶ', 'Ilaalcha Waliigalaa'),
  'clients & influencers': phrase('ደንበኞች እና ተፅዕኖ ፈጣሪዎች', 'ዓማዊልን ጽልዋ ፈጠርትን', 'Maamiltootaa fi Dhiibbaa Uumtoota'),
  categories: phrase('ምድቦች', 'ምድባት', 'Ramaddiiwwan'),
  knowledge: phrase('ዕውቀት', 'ፍልጠት', 'Beekumsa'),
  procedures: phrase('የስራ ሂደቶች', 'ኣገባባት ስራሕ', 'Adeemsa Hojii'),
  'policy library': phrase('የፖሊሲ ቤተ-መጻሕፍት', 'ቤተ መጻሕፍቲ ፖሊሲ', 'Mana Kitaabaa Imaammataa'),
  policies: phrase('ፖሊሲዎች', 'ፖሊሲታት', 'Imaammatawwan'),

  // Brain workspace headings
  'loading brain workspace…': phrase('የBrain የስራ ቦታ በመጫን ላይ…', 'Brain መስርሕ ይጽዕን ኣሎ…', 'Iddoo hojii Brain fe’amaa jira…'),
  'loading brain workspace...': phrase('የBrain የስራ ቦታ በመጫን ላይ...', 'Brain መስርሕ ይጽዕን ኣሎ...', 'Iddoo hojii Brain fe’amaa jira...'),
  'access restricted': phrase('መዳረሻ ተገድቧል', 'መእተዊ ተገዲቡ', 'Seensi daangeffameera'),
  'you do not have access to brain, company clients, or e-policy resources.': phrase('ወደ Brain፣ የድርጅት ደንበኞች ወይም E-Policy ሀብቶች መዳረሻ የለዎትም።', 'ናብ Brain፣ ዓማዊል ትካል ወይ E-Policy ጸጋታት መእተዊ የብልካን።', 'Brain, maamiltoota dhaabbataa yookaan qabeenya E-Policy fayyadamuuf hayyama hin qabdu.'),
  'access depends on your enabled modules, permissions, and company role.': phrase('መዳረሻው በነቃ ሞጁሎችዎ፣ ፈቃዶችዎ እና የድርጅት ሚናዎ ላይ ይመሰረታል።', 'መእተዊ ኣብ ዝተነቓቕሑ ሞጁላት፣ ፍቓዳትን ተራ ትካልን ይምርኮስ።', 'Seensi moojuloota hojii irra jiran, hayyamootaa fi gahee dhaabbataa kee irratti hundaa’a.'),
  'e-policies gateway': phrase('የE-Policies መግቢያ', 'መእተዊ E-Policies', 'Karra E-Policies'),
  'brain knowledge system': phrase('የBrain ዕውቀት ስርዓት', 'ስርዓት ፍልጠት Brain', 'Sirna Beekumsaa Brain'),
  'e-policies workspace': phrase('የE-Policies የስራ ቦታ', 'መስርሕ E-Policies', 'Iddoo Hojii E-Policies'),
  'knowledge categories': phrase('የዕውቀት ምድቦች', 'ምድባት ፍልጠት', 'Ramaddiiwwan Beekumsaa'),
  'operating procedures': phrase('የአሠራር ሂደቶች', 'ኣገባባት ኣሰራርሓ', 'Adeemsa Hojii'),
  'brain knowledge base': phrase('የBrain ዕውቀት ማዕከል', 'መሰረት ፍልጠት Brain', 'Kuusaa Beekumsaa Brain'),
  'organize company knowledge into structured, reusable category hierarchies.': phrase('የድርጅቱን ዕውቀት በተዋቀሩ እና እንደገና ሊጠቀሙባቸው በሚችሉ የምድብ ደረጃዎች ያደራጁ።', 'ፍልጠት ትካል ናብ ዝተዋደዱን ዳግማይ ዝጥቀሙሎምን ምድባት ኣዋድዱ።', 'Beekumsa dhaabbataa ramaddiiwwan sirna qabanii fi irra deebi’anii fayyadamuu danda’amanitti qindeessi.'),
  'company policy documents, immutable versions & digital signatures.': phrase('የድርጅት ፖሊሲ ሰነዶች፣ የማይቀየሩ ስሪቶች እና ዲጂታል ፊርማዎች።', 'ሰነዳት ፖሊሲ ትካል፣ ዘይቀያየሩ ስሪታትን ዲጂታል ፊርማታትን።', 'Sanadoota imaammata dhaabbataa, gosa hin jijjiiramnee fi mallattoo dijitaalaa.'),
  'standardized checklists, steps, ownership & organizational operating procedures.': phrase('ደረጃውን የጠበቁ ዝርዝሮች፣ ደረጃዎች፣ ባለቤትነት እና የድርጅት አሠራር ሂደቶች።', 'መደበኛ ዝርዝራት፣ ስጉምትታት፣ ዋንነትን ኣገባባት ኣሰራርሓ ትካልን።', 'Tarree mirkaneessaa sadarkaa qabu, tarkaanfiiwwan, abbummaa fi adeemsa hojii dhaabbataa.'),
  'central knowledge articles, guidelines & documentation base.': phrase('ማዕከላዊ የዕውቀት ጽሁፎች፣ መመሪያዎች እና የሰነድ ማዕከል።', 'ማእከላይ ጽሑፋት ፍልጠት፣ መምርሒታትን መሰረት ሰነዳትን።', 'Barreeffamoota beekumsaa giddugaleessaa, qajeelfamootaa fi kuusaa sanadootaa.'),
  'e-policy engine access': phrase('የE-Policy ስርዓት መዳረሻ', 'መእተዊ ሞተር E-Policy', 'Seensa Sirna E-Policy'),

  // Shared Brain filters and actions
  'search articles by title, summary, content...': phrase('ጽሁፎችን በርዕስ፣ ማጠቃለያ ወይም ይዘት ይፈልጉ...', 'ጽሑፋት ብኣርእስቲ፣ ጽማቕ ወይ ትሕዝቶ ድለ...', 'Barreeffamoota mata-duree, cuunfaa yookaan qabiyyeen barbaadi...'),
  'search by name, key...': phrase('በስም ወይም ቁልፍ ይፈልጉ...', 'ብስም ወይ መፍትሕ ድለ...', 'Maqaa yookaan furtuun barbaadi...'),
  'search procedures by title, scope, purpose...': phrase('ሂደቶችን በርዕስ፣ ወሰን ወይም ዓላማ ይፈልጉ...', 'ኣገባባት ብኣርእስቲ፣ ወሰን ወይ ዕላማ ድለ...', 'Adeemsa hojii mata-duree, daangaa yookaan kaayyoon barbaadi...'),
  'category:': phrase('ምድብ፡', 'ምድብ፡', 'Ramaddii:'),
  'status:': phrase('ሁኔታ፡', 'ኩነታት፡', 'Haala:'),
  'visibility:': phrase('ታይነት፡', 'ተራእይነት፡', 'Mul’achuu:'),
  'department:': phrase('ክፍል፡', 'ክፍሊ፡', 'Kutaa:'),
  'parent:': phrase('ወላጅ፡', 'ወላዲ፡', 'Abbaa:'),
  all: phrase('ሁሉም', 'ኩሉ', 'Hunda'),
  draft: phrase('ረቂቅ', 'ረቂቕ', 'Qabiyyee Jalqabaa'),
  'in review': phrase('በግምገማ ላይ', 'ኣብ ገምጋም', 'Madaallii Irra'),
  'changes requested': phrase('ለውጥ ተጠይቋል', 'ለውጢ ተሓቲቱ', 'Jijjiiramni Gaafatameera'),
  approved: phrase('ጸድቋል', 'ጸዲቑ', 'Mirkanaa’e'),
  published: phrase('ታትሟል', 'ተሓቲሙ', 'Maxxanfame'),
  archived: phrase('በማህደር የተቀመጠ', 'ተዓቂቡ', 'Kuusame'),
  'company wide': phrase('በመላው ድርጅት', 'ኣብ ምሉእ ትካል', 'Dhaabbata Guutuu'),
  company: phrase('ድርጅት', 'ትካል', 'Dhaabbata'),
  department: phrase('ክፍል', 'ክፍሊ', 'Kutaa'),
  private: phrase('የግል', 'ናይ ውልቀ', 'Dhuunfaa'),
  public: phrase('የህዝብ', 'ህዝባዊ', 'Uummataa'),
  'department restricted': phrase('ለክፍሉ ብቻ', 'ንክፍሊ ጥራይ', 'Kutaa Qofaaf'),
  'active only': phrase('ንቁ ብቻ', 'ንጡፍ ጥራይ', 'Hojii Irra Jiru Qofa'),
  'archived only': phrase('በማህደር ያሉ ብቻ', 'ዝተዓቀቡ ጥራይ', 'Kuusaman Qofa'),
  'top-level only': phrase('ከፍተኛ ደረጃ ብቻ', 'ላዕለዋይ ደረጃ ጥራይ', 'Sadarkaa Ol’aanaa Qofa'),
  'create article': phrase('ጽሁፍ ፍጠር', 'ጽሑፍ ፍጠር', 'Barreeffama Uumi'),
  'create category': phrase('ምድብ ፍጠር', 'ምድብ ፍጠር', 'Ramaddii Uumi'),
  'create first category': phrase('የመጀመሪያውን ምድብ ፍጠር', 'ቀዳማይ ምድብ ፍጠር', 'Ramaddii Jalqabaa Uumi'),
  'create procedure': phrase('የስራ ሂደት ፍጠር', 'ኣገባብ ስራሕ ፍጠር', 'Adeemsa Hojii Uumi'),
  'create policy': phrase('ፖሊሲ ፍጠር', 'ፖሊሲ ፍጠር', 'Imaammata Uumi'),
  'manage categories': phrase('ምድቦችን አስተዳድር', 'ምድባት ኣመሓድር', 'Ramaddiiwwan Bulchi'),
  'my articles only': phrase('የእኔ ጽሁፎች ብቻ', 'ጽሑፋተይ ጥራይ', 'Barreeffamoota Koo Qofa'),
  'assigned to me / owned by me': phrase('ለእኔ የተመደበ / የእኔ የሆነ', 'ንዓይ ዝተመደበ / ናተይ', 'Naaf Ramadame / Kan Koo'),
  'show deleted/archived records': phrase('የተሰረዙ/በማህደር ያሉ መዝገቦችን አሳይ', 'ዝተደምሰሱ/ዝተዓቀቡ መዛግብቲ ኣርኢ', 'Galmeewwan haqaman/kuusaman agarsiisi'),
  'sort by:': phrase('ደርድር በ፡', 'ስርዕ ብ፡', 'Tartiibessi:'),
  updated: phrase('የተዘመነ', 'ዝተሓደሰ', 'Haaromfame'),
  title: phrase('ርዕስ', 'ኣርእስቲ', 'Mata-duree'),
  version: phrase('ስሪት', 'ስሪት', 'Gosa'),
  created: phrase('የተፈጠረ', 'ዝተፈጥረ', 'Uumame'),
  'name & key': phrase('ስም እና ቁልፍ', 'ስምን መፍትሕን', 'Maqaa fi Furtuu'),
  'parent category': phrase('ወላጅ ምድብ', 'ወላዲ ምድብ', 'Ramaddii Abbaa'),

  // Knowledge/category/procedure states
  'loading knowledge articles…': phrase('የዕውቀት ጽሁፎች በመጫን ላይ…', 'ጽሑፋት ፍልጠት ይጽዕኑ ኣለዉ…', 'Barreeffamoonni beekumsaa fe’amaa jiru…'),
  'loading knowledge categories…': phrase('የዕውቀት ምድቦች በመጫን ላይ…', 'ምድባት ፍልጠት ይጽዕኑ ኣለዉ…', 'Ramaddiiwwan beekumsaa fe’amaa jiru…'),
  'failed to load articles': phrase('ጽሁፎቹን መጫን አልተሳካም', 'ጽሑፋት ምጽዓን ኣይተሳኽዐን', 'Barreeffamoota fe’uun hin milkoofne'),
  'failed to load categories': phrase('ምድቦቹን መጫን አልተሳካም', 'ምድባት ምጽዓን ኣይተሳኽዐን', 'Ramaddiiwwan fe’uun hin milkoofne'),
  'failed to load procedures list.': phrase('የሂደቶችን ዝርዝር መጫን አልተሳካም።', 'ዝርዝር ኣገባባት ምጽዓን ኣይተሳኽዐን።', 'Tarree adeemsa hojii fe’uun hin milkoofne.'),
  'fetching company procedures...': phrase('የድርጅቱ ሂደቶች በመጫን ላይ...', 'ኣገባባት ትካል ይጽዕኑ ኣለዉ...', 'Adeemsi hojii dhaabbataa fe’amaa jira...'),
  'no knowledge categories found': phrase('ምንም የዕውቀት ምድብ አልተገኘም', 'ምንም ምድብ ፍልጠት ኣይተረኽበን', 'Ramaddiin beekumsaa hin argamne'),
  'no operating procedures found matching search filters.': phrase('ከፍለጋ ማጣሪያዎቹ ጋር የሚዛመድ የአሠራር ሂደት አልተገኘም።', 'ምስ ማጣርያ ድለያ ዝሰማማዕ ኣገባብ ኣሰራርሓ ኣይተረኽበን።', 'Adeemsi hojii ulaagaalee barbaachaatiin walsimu hin argamne.'),
  'no categories match your search criteria. create a category to start organizing knowledge.': phrase('ከፍለጋዎ ጋር የሚዛመድ ምድብ የለም። ዕውቀትን ማደራጀት ለመጀመር ምድብ ይፍጠሩ።', 'ምስ ድለያኻ ዝሰማማዕ ምድብ የለን። ፍልጠት ንምውዳድ ምድብ ፍጠር።', 'Ramaddiin barbaacha kee waliin walsimu hin jiru. Beekumsa qindeessuuf ramaddii uumi.'),

  // Policy workspace
  'more filters': phrase('ተጨማሪ ማጣሪያዎች', 'ተወሰኽቲ ማጣርያታት', 'Calaltuu Dabalataa'),
  'clear all': phrase('ሁሉንም አጽዳ', 'ኩሉ ኣጽሪ', 'Hunda Haqi'),
  'policy type': phrase('የፖሊሲ ዓይነት', 'ዓይነት ፖሊሲ', 'Gosa Imaammataa'),
  general: phrase('አጠቃላይ', 'ሓፈሻዊ', 'Waliigalaa'),
  'code of conduct': phrase('የሥነ-ምግባር ደንብ', 'ሕጊ ስነ-ምግባር', 'Seera Naamusa'),
  'it security': phrase('የIT ደህንነት', 'ድሕነት IT', 'Nageenya IT'),
  safety: phrase('ደህንነት', 'ድሕነት', 'Nageenya'),
  'hr & personnel': phrase('HR እና ሰራተኞች', 'HRን ሰራሕተኛታትን', 'HR fi Hojjettoota'),
  finance: phrase('ፋይናንስ', 'ፋይናንስ', 'Faayinaansii'),
  compliance: phrase('ተገዢነት', 'ተኣዛዝነት', 'Walsimsiisummaa'),
  confidentiality: phrase('ምስጢራዊነት', 'ምስጢራዊነት', 'Iccitii'),
  normal: phrase('መደበኛ', 'ንቡር', 'Idilee'),
  confidential: phrase('ምስጢራዊ', 'ምስጢራዊ', 'Iccitii'),
  restricted: phrase('የተገደበ', 'ዝተገደበ', 'Daangeffame'),
  'my owned policies only': phrase('የእኔ ፖሊሲዎች ብቻ', 'ፖሊሲታተይ ጥራይ', 'Imaammata Koo Qofa'),
  'recently created': phrase('በቅርብ የተፈጠሩ', 'ቀረባ ዝተፈጥሩ', 'Dhiheenya Uumaman'),
  'oldest first': phrase('አሮጌው መጀመሪያ', 'ኣረጊት ቀዳማይ', 'Moofaa Dura'),
  'recently updated': phrase('በቅርብ የተዘመኑ', 'ቀረባ ዝተሓደሱ', 'Dhiheenya Haaromfaman'),
  'title a–z': phrase('ርዕስ A–Z', 'ኣርእስቲ A–Z', 'Mata-duree A–Z'),
  'title z–a': phrase('ርዕስ Z–A', 'ኣርእስቲ Z–A', 'Mata-duree Z–A'),
  'effective date': phrase('የሚሰራበት ቀን', 'ዕለት ተፈጻምነት', 'Guyyaa Hojii Irra Oolu'),
  'review due': phrase('የግምገማ ቀነ-ገደብ', 'ግዜ ገምጋም', 'Yeroo Madaallii'),
};

function normalize(source: string) {
  return source.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function translateBrainSystemText(source: string, language: AppLanguage): string {
  if (language === 'en' || !source.trim()) return source;

  const normalized = normalize(source);
  const direct = EXACT[normalized];
  if (direct) return direct[language];

  // Preserve user-created category names while translating the UI prefix.
  const parentMatch = source.match(/^Parent:\s*(.+)$/i);
  if (parentMatch) {
    const prefix = phrase('ወላጅ፡', 'ወላዲ፡', 'Abbaa:')[language];
    return `${prefix} ${parentMatch[1]}`;
  }

  return source;
}
