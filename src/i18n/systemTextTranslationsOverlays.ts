import type { AppLanguage } from './config';

type TargetLanguage = Exclude<AppLanguage, 'en'>;
type LanguageMap = Record<TargetLanguage, string>;

const phrase = (am: string, ti: string, om: string): LanguageMap => ({ am, ti, om });

const EXACT: Record<string, LanguageMap> = {
  // Attendance action popovers and drawers
  'request attendance edit': phrase('የመገኘት መዝገብ ማስተካከያ ጠይቅ', 'ምስትኽኻል መዝገብ ምክትታል ሕተት', 'Sirreeffama galmee argamuu gaafadhu'),
  'send penalty notice': phrase('የቅጣት ማሳወቂያ ላክ', 'ምልክታ ቅጣዕ ስደድ', 'Beeksisa adabbii ergi'),
  'sending...': phrase('በመላክ ላይ...', 'ይስደድ ኣሎ...', 'Ergamaa jira...'),
  'remove auto-added attendance': phrase('በራስ-ሰር የታከለውን የመገኘት መዝገብ አስወግድ', 'ብራስ-ሰር ዝተወሰኸ መዝገብ ምክትታል ኣወግድ', 'Galmee argamuu ofumaan dabalame haqi'),
  'removing...': phrase('በማስወገድ ላይ...', 'ይወገድ ኣሎ...', 'Haqamaa jira...'),
  'view attendance details': phrase('የመገኘት ዝርዝሮችን ተመልከት', 'ዝርዝር መዝገብ ምክትታል ርአ', 'Bal’ina galmee argamuu ilaali'),
  'more attendance actions': phrase('ተጨማሪ የመገኘት ድርጊቶች', 'ተወሰኽቲ ናይ ምክትታል ተግባራት', 'Tarkaanfiiwwan argamuu dabalataa'),
  'select visible': phrase('የሚታዩትን ምረጥ', 'ዝረኣዩ ምረጽ', 'Mul’atan filadhu'),
  'no employees match this view.': phrase('ከዚህ እይታ ጋር የሚዛመድ ሰራተኛ የለም።', 'ምስዚ እይታ ዝሰማማዕ ሰራሕተኛ የለን።', 'Hojjetaan ilaalcha kanaan walsimu hin jiru.'),
  'unassigned': phrase('ያልተመደበ', 'ዘይተመደበ', 'Hin ramadamne'),
  'review absence': phrase('መቅረትን ገምግም', 'ምብኳር ገምግም', 'Hafuu madaali'),
  'review lateness': phrase('መዘግየትን ገምግም', 'ምድንጓይ ገምግም', 'Turtii madaali'),
  'fix attendance': phrase('የመገኘት መዝገብ አስተካክል', 'መዝገብ ምክትታል ኣስተኻኽል', 'Galmee argamuu sirreessi'),
  'paid day off': phrase('የሚከፈልበት ዕረፍት ቀን', 'ብክፍሊት ዕረፍቲ መዓልቲ', 'Guyyaa boqonnaa kaffaltii qabu'),
  'on approved leave': phrase('በጸደቀ ፈቃድ ላይ', 'ኣብ ዝጸደቐ ፍቓድ', 'Hayyama mirkanaa’e irra'),
  'absent without approved attendance': phrase('ያለተፈቀደ ምክንያት ቀርቷል', 'ብዘይ ዝጸደቐ ምኽንያት በዂሩ', 'Sababa mirkanaa’e malee hafe'),
  'review whether leave was approved.': phrase('ፈቃዱ መጽደቁን ያረጋግጡ።', 'ፍቓድ ተጸዲቑ እንተኾይኑ ኣረጋግጽ።', 'Hayyamni mirkanaa’uu isaa ilaali.'),
  'late arrival': phrase('ዘግይቶ መድረስ', 'ደንጉዩ ምብጻሕ', 'Turee dhufuu'),
  'missing check-out': phrase('የመውጫ ምዝገባ የለም', 'መዝገብ ምውጻእ የለን', 'Galmeen ba’iinsaa hin jiru'),
  'ask the employee to confirm the correct time.': phrase('ሰራተኛው ትክክለኛውን ሰዓት እንዲያረጋግጥ ጠይቅ።', 'ሰራሕተኛ ቅኑዕ ሰዓት ከረጋግጽ ሕተት።', 'Hojjetaan sa’aatii sirrii akka mirkaneessu gaafadhu.'),
  'penalty notice pending': phrase('የቅጣት ማሳወቂያ በመጠባበቅ ላይ', 'ምልክታ ቅጣዕ ይጽበ ኣሎ', 'Beeksisni adabbii eegamaa jira'),
  'review before sending a notification.': phrase('ማሳወቂያ ከመላክዎ በፊት ይገምግሙ።', 'ቅድሚ ምልክታ ምስዳድ ገምግም።', 'Beeksisa erguu dura madaali.'),
  'no issue': phrase('ችግር የለም', 'ጸገም የለን', 'Rakkoon hin jiru'),
  'attendance looks complete.': phrase('የመገኘት መዝገቡ የተሟላ ይመስላል።', 'መዝገብ ምክትታል ምሉእ ይመስል።', 'Galmeen argamuu guutuu fakkaata.'),

  // Shared dialog / popover / sheet actions
  'please wait…': phrase('እባክዎ ይጠብቁ…', 'በጃኻ ተጸበ…', 'Maaloo eegi…'),
  'please wait...': phrase('እባክዎ ይጠብቁ...', 'በጃኻ ተጸበ...', 'Maaloo eegi...'),
  'save changes': phrase('ለውጦችን አስቀምጥ', 'ለውጥታት ዓቅብ', 'Jijjiiramoota olkaa’i'),
  'discard changes': phrase('ለውጦችን ተው', 'ለውጥታት ግደፍ', 'Jijjiiramoota dhiisi'),
  'delete permanently': phrase('ለዘላለም ሰርዝ', 'ንሓዋሩ ደምስስ', 'Guutumaan guutuutti haqi'),
  'are you sure?': phrase('እርግጠኛ ነዎት?', 'ርግጸኛ ዲኻ?', 'Mirkanaa’aa dhaa?'),
  'confirm action': phrase('ድርጊቱን አረጋግጥ', 'ተግባር ኣረጋግጽ', 'Tarkaanfii mirkaneessi'),
  'close dialog': phrase('መስኮቱን ዝጋ', 'መስኮት ዕጸው', 'Qaaqa cufi'),
  'continue': phrase('ቀጥል', 'ቀጽል', 'Itti fufi'),
  'go back': phrase('ተመለስ', 'ተመለስ', 'Deebi’i'),
  'retry': phrase('እንደገና ሞክር', 'ደጊምካ ፈትን', 'Irra deebi’i'),
  'edit details': phrase('ዝርዝሮችን አርትዕ', 'ዝርዝራት ኣርም', 'Bal’ina gulaali'),
  'view details': phrase('ዝርዝሮችን ተመልከት', 'ዝርዝራት ርአ', 'Bal’ina ilaali'),
  'remove item': phrase('ንጥሉን አስወግድ', 'ኣቕሓ ኣወግድ', 'Wanticha haqi'),
  'copy link': phrase('አገናኙን ቅዳ', 'መላግቦ ቅዳሕ', 'Geessituu garagalchi'),
  'choose file': phrase('ፋይል ምረጥ', 'ፋይል ምረጽ', 'Faayila filadhu'),
  'no file selected': phrase('ምንም ፋይል አልተመረጠም', 'ፋይል ኣይተመርጸን', 'Faayilli hin filatamne'),
  'upload file': phrase('ፋይል ስቀል', 'ፋይል ስቐል', 'Faayila ol fe’i'),
  'remove file': phrase('ፋይልን አስወግድ', 'ፋይል ኣወግድ', 'Faayila haqi'),
  'submit request': phrase('ጥያቄ አስገባ', 'ሕቶ ኣቕርብ', 'Gaaffii galchi'),
  'approve request': phrase('ጥያቄውን አጽድቅ', 'ሕቶ ኣጽድቕ', 'Gaaffii mirkaneessi'),
  'reject request': phrase('ጥያቄውን ውድቅ አድርግ', 'ሕቶ ነጽግ', 'Gaaffii kuffisi'),
  'cancel request': phrase('ጥያቄውን ሰርዝ', 'ሕቶ ሰርዝ', 'Gaaffii dhiisi'),
  'send notice': phrase('ማሳወቂያ ላክ', 'ምልክታ ስደድ', 'Beeksisa ergi'),
  'send reminder': phrase('ማስታወሻ ላክ', 'መዘኻኸሪ ስደድ', 'Yaadachiisa ergi'),
  'rejection reason': phrase('የውድቅ ምክንያት', 'ምኽንያት ምንጻግ', 'Sababa kufsiisuu'),
  'approval reason': phrase('የማጽደቂያ ምክንያት', 'ምኽንያት ምጽዳቕ', 'Sababa mirkaneessuu'),
  'optional note': phrase('አማራጭ ማስታወሻ', 'ኣማራጺ መዘኻኸሪ', 'Yaadannoo filannoo'),
  'add note': phrase('ማስታወሻ ጨምር', 'መዘኻኸሪ ወስኽ', 'Yaadannoo dabali'),

  // Leave request dialogs
  'new leave request': phrase('አዲስ የፈቃድ ጥያቄ', 'ሓድሽ ሕቶ ፍቓድ', 'Gaaffii hayyamaa haaraa'),
  'select an active leave type and fill in the details': phrase('ንቁ የፈቃድ አይነት ምረጥ እና ዝርዝሮቹን ሙላ', 'ንጡፍ ዓይነት ፍቓድ ምረጽ እሞ ዝርዝራት ምላእ', 'Gosa hayyamaa hojii irra jiru filadhuutii bal’ina guuti'),
  'leave template': phrase('የፈቃድ አብነት', 'ኣብነት ፍቓድ', 'Qajojii hayyamaa'),
  'no active leave types available. please contact hr.': phrase('ምንም ንቁ የፈቃድ አይነት የለም። እባክዎ HRን ያነጋግሩ።', 'ንጡፍ ዓይነት ፍቓድ የለን። በጃኻ HR ተወከስ።', 'Gosti hayyamaa hojii irra jiru hin jiru. Maaloo HR qunnami.'),
  'select leave template...': phrase('የፈቃድ አብነት ምረጥ...', 'ኣብነት ፍቓድ ምረጽ...', 'Qajojii hayyamaa filadhu...'),
  'no balance': phrase('ቀሪ መጠን የለም', 'ቀሪ የለን', 'Haftee hin qabu'),
  'evidence': phrase('ማስረጃ', 'መርትዖ', 'Ragaa'),
  'exhausted': phrase('አልቋል', 'ተወዲኡ', 'Dhumeera'),
  'open': phrase('ክፍት', 'ክፉት', 'Banaa'),
  'duration': phrase('ቆይታ', 'ግዜ', 'Turtii'),
  'full day': phrase('ሙሉ ቀን', 'ምሉእ መዓልቲ', 'Guyyaa guutuu'),
  'half day': phrase('ግማሽ ቀን', 'ፍርቂ መዓልቲ', 'Walakkaa guyyaa'),
  'period': phrase('ወቅት', 'እዋን', 'Yeroo'),
  'select period...': phrase('ወቅት ምረጥ...', 'እዋን ምረጽ...', 'Yeroo filadhu...'),
  'morning': phrase('ጠዋት', 'ንግሆ', 'Ganama'),
  'afternoon': phrase('ከሰዓት', 'ድሕሪ ቀትሪ', 'Waaree booda'),
  'please select a leave type': phrase('እባክዎ የፈቃድ አይነት ይምረጡ', 'በጃኻ ዓይነት ፍቓድ ምረጽ', 'Maaloo gosa hayyamaa filadhu'),
  'please provide a reason': phrase('እባክዎ ምክንያት ያስገቡ', 'በጃኻ ምኽንያት ኣቕርብ', 'Maaloo sababaa kenni'),
  'end date cannot be before start date': phrase('የመጨረሻ ቀን ከመጀመሪያ ቀን በፊት ሊሆን አይችልም', 'ዕለት መወዳእታ ቅድሚ ዕለት መጀመርታ ክኸውን ኣይክእልን', 'Guyyaan xumuraa guyyaa jalqabaa dura ta’uu hin danda’u'),
  'please upload a medical certificate or medical evidence': phrase('እባክዎ የሕክምና ማረጋገጫ ወይም ማስረጃ ይስቀሉ', 'በጃኻ ናይ ሕክምና ምስክር ወይ መርትዖ ስቐል', 'Maaloo ragaa yookaan waraqaa yaalaa ol fe’i'),
  'leave request submitted successfully': phrase('የፈቃድ ጥያቄው በተሳካ ሁኔታ ገብቷል', 'ሕቶ ፍቓድ ብዓወት ቀሪቡ', 'Gaaffiin hayyamaa milkaa’inaan galfameera'),
  'failed to submit': phrase('ማስገባት አልተሳካም', 'ምቕራብ ኣይተዓወተን', 'Galchuun hin milkoofne'),

  // Brain contacts modal
  'edit contact': phrase('እውቂያ አርትዕ', 'መራኸቢ ኣርም', 'Quunnamtii gulaali'),
  'add contact': phrase('እውቂያ ጨምር', 'መራኸቢ ወስኽ', 'Quunnamtii dabali'),
  'contact type *': phrase('የእውቂያ አይነት *', 'ዓይነት መራኸቢ *', 'Gosa quunnamtii *'),
  'name *': phrase('ስም *', 'ስም *', 'Maqaa *'),
  'full name': phrase('ሙሉ ስም', 'ምሉእ ስም', 'Maqaa guutuu'),
  'client type': phrase('የደንበኛ አይነት', 'ዓይነት ዓሚል', 'Gosa maamilaa'),
  'anything the team should know about this contact...': phrase('ቡድኑ ስለዚህ እውቂያ ማወቅ ያለበት ነገር...', 'ጋንታ ብዛዕባዚ መራኸቢ ክፈልጦ ዘለዎ...', 'Waan gareen waa’ee quunnamtii kanaa beekuu qabu...'),
  'create platform': phrase('መድረክ ፍጠር', 'መድረኽ ፍጠር', 'Waltajjii uumi'),
  'creating...': phrase('በመፍጠር ላይ...', 'ይፍጠር ኣሎ...', 'Uumamaa jira...'),
  'could not save contact.': phrase('እውቂያውን ማስቀመጥ አልተቻለም።', 'መራኸቢ ምዕቃብ ኣይተኻእለን።', 'Quunnamtii olkaa’uun hin danda’amne.'),
  'name must contain at least 2 characters.': phrase('ስሙ ቢያንስ 2 ፊደላት ሊኖሩት ይገባል።', 'ስም እንተወሓደ 2 ፊደላት ክህልዎ ኣለዎ።', 'Maqaan yoo xiqqaate qubee 2 qabaachuu qaba.'),
  'add at least one phone number.': phrase('ቢያንስ አንድ ስልክ ቁጥር ጨምር።', 'እንተወሓደ ሓደ ቁጽሪ ተሌፎን ወስኽ።', 'Yoo xiqqaate lakkoofsa bilbilaa tokko dabali.'),
  'choose a platform for every influencer account.': phrase('ለእያንዳንዱ የተፅዕኖ ፈጣሪ መለያ መድረክ ምረጥ።', 'ንነፍሲ ወከፍ ሕሳብ ጽልዋ ፈጣሪ መድረኽ ምረጽ።', 'Herrega dhiibbaa uumuu hundaaf waltajjii filadhu.'),

  // Projects dialogs
  'edit task': phrase('ተግባር አርትዕ', 'ዕማም ኣርም', 'Hojii gulaali'),
  'task details': phrase('የተግባር ዝርዝሮች', 'ዝርዝር ዕማም', 'Bal’ina hojii'),
  'board column': phrase('የሰሌዳ አምድ', 'ዓምዲ ሰሌዳ', 'Tarree gabatee'),
  'estimated hours': phrase('የተገመቱ ሰዓቶች', 'ዝተገመቱ ሰዓታት', 'Sa’aatii tilmaamame'),
  'actual hours': phrase('ትክክለኛ ሰዓቶች', 'ትኽክለኛ ሰዓታት', 'Sa’aatii dhugaa'),
  'no description.': phrase('መግለጫ የለም።', 'መግለጺ የለን።', 'Ibsi hin jiru.'),
  'basics': phrase('መሰረታዊ መረጃ', 'መሰረታዊ ሓበሬታ', 'Odeeffannoo bu’uuraa'),
  'task title': phrase('የተግባር ርዕስ', 'ኣርእስቲ ዕማም', 'Mata-duree hojii'),
  'upload screenshot': phrase('የማያ ገጽ ምስል ስቀል', 'ስእሊ ስክሪን ስቐል', 'Suuraa iskiriinii ol fe’i'),
  'paste screenshot': phrase('የማያ ገጽ ምስል ለጥፍ', 'ስእሊ ስክሪን ለጥፍ', 'Suuraa iskiriinii maxxansi'),
  'could not update task.': phrase('ተግባሩን ማዘመን አልተቻለም።', 'ዕማም ምሕዳስ ኣይተኻእለን።', 'Hojii haaromsuun hin danda’amne.'),
  'could not delete task.': phrase('ተግባሩን መሰረዝ አልተቻለም።', 'ዕማም ምድምሳስ ኣይተኻእለን።', 'Hojii haquun hin danda’amne.'),

  // Recruitment / interview modal
  'back to application': phrase('ወደ ማመልከቻ ተመለስ', 'ናብ ማመልከቻ ተመለስ', 'Gara iyyannootti deebi’i'),
  'schedule interview': phrase('ቃለ-መጠይቅ ያዝ', 'ቃለ መሕትት መድብ', 'Gaaffii fi deebii saganteessi'),
  'interview details': phrase('የቃለ-መጠይቅ ዝርዝሮች', 'ዝርዝር ቃለ መሕትት', 'Bal’ina gaaffii fi deebii'),
  'interview date': phrase('የቃለ-መጠይቅ ቀን', 'ዕለት ቃለ መሕትት', 'Guyyaa gaaffii fi deebii'),
  'duration (minutes)': phrase('ቆይታ (ደቂቃ)', 'ግዜ (ደቓይቕ)', 'Turtii (daqiiqaa)'),
  'interview time': phrase('የቃለ-መጠይቅ ሰዓት', 'ሰዓት ቃለ መሕትት', 'Sa’aatii gaaffii fi deebii'),
  'total sessions': phrase('ጠቅላላ ክፍለ-ጊዜዎች', 'ጠቕላላ ክፍለ ግዜታት', 'Yeroo marii waliigalaa'),
  'interview type': phrase('የቃለ-መጠይቅ አይነት', 'ዓይነት ቃለ መሕትት', 'Gosa gaaffii fi deebii'),
  'face to face': phrase('ፊት ለፊት', 'ገጽ ንገጽ', 'Fuula duraa'),
  'video call': phrase('የቪዲዮ ጥሪ', 'ቪድዮ ጻውዒት', 'Bilbila viidiyoo'),
  'phone call': phrase('የስልክ ጥሪ', 'ጻውዒት ተሌፎን', 'Bilbila'),
  'meeting link': phrase('የስብሰባ አገናኝ', 'መላግቦ ኣኼባ', 'Geessituu walga’ii'),
  'venue / location': phrase('ቦታ / አድራሻ', 'ቦታ / ኣድራሻ', 'Iddoo / Bakka'),
  'select a department': phrase('ክፍል ምረጥ', 'ክፍሊ ምረጽ', 'Kutaa filadhu'),
  'lead interviewer': phrase('ዋና ቃለ-መጠይቅ አድራጊ', 'ዋና ቃለ መሕትት ገባሪ', 'Gaafataa olaanaa'),
  'this person will receive the interview assignment notification': phrase('ይህ ሰው የቃለ-መጠይቅ ምደባ ማሳወቂያ ይቀበላል', 'እዚ ሰብ ምልክታ ምደባ ቃለ መሕትት ክቕበል እዩ', 'Namni kun beeksisa ramaddii gaaffii fi deebii ni argata'),
  'select lead interviewer': phrase('ዋና ቃለ-መጠይቅ አድራጊ ምረጥ', 'ዋና ቃለ መሕትት ገባሪ ምረጽ', 'Gaafataa olaanaa filadhu'),
  'additional panel members': phrase('ተጨማሪ የፓነል አባላት', 'ተወሰኽቲ ኣባላት ፓነል', 'Miseensota paanaalii dabalataa'),
  'add member': phrase('አባል ጨምር', 'ኣባል ወስኽ', 'Miseensa dabali'),
  'skills to evaluate': phrase('የሚገመገሙ ክህሎቶች', 'ዝግምገሙ ክእለታት', 'Dandeettiiwwan madaalaman'),
  'new skill': phrase('አዲስ ክህሎት', 'ሓድሽ ክእለት', 'Dandeettii haaraa'),
};

function normalize(value: string) {
  return value
    .trim()
    .replace(/\u2026/g, '...')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en');
}

function translateDynamic(source: string, language: TargetLanguage): string | null {
  const deleteTask = source.match(/^Delete\s+"(.+)"\?\s+This removes the task from the project\.$/i);
  if (deleteTask) {
    const name = deleteTask[1];
    if (language === 'am') return `“${name}”ን ሰርዝ? ይህ ተግባሩን ከፕሮጀክቱ ያስወግዳል።`;
    if (language === 'ti') return `“${name}” ደምስስ? እዚ ነቲ ዕማም ካብ ፕሮጀክት የወግዶ።`;
    return `“${name}” haquu? Kun hojii kana pirojektii keessaa ni kaasa.`;
  }

  return null;
}

export function translateOverlayText(source: string, language: AppLanguage): string {
  if (language === 'en') return source;

  const dynamic = translateDynamic(source.trim(), language);
  if (dynamic) return dynamic;

  const translation = EXACT[normalize(source)];
  return translation?.[language] ?? source;
}
