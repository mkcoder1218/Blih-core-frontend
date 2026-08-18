import type { AppLanguage } from './config';

type TargetLanguage = Exclude<AppLanguage, 'en'>;
type LanguageMap = Record<TargetLanguage, string>;

const phrase = (am: string, ti: string, om: string): LanguageMap => ({ am, ti, om });

const EXACT: Record<string, LanguageMap> = {
  // Exit / offboarding dialogs
  'request exit': phrase('የስራ መልቀቂያ ጠይቅ', 'ምውጻእ ስራሕ ሕተት', 'Hojii gadi dhiisuu gaafadhu'),
  'submit a permanent employment exit request.': phrase('ቋሚ የስራ መልቀቂያ ጥያቄ አስገባ።', 'ቀዋሚ ሕቶ ምውጻእ ስራሕ ኣቕርብ።', 'Gaaffii hojii gadi dhiisuu dhaabbataa galchi.'),
  'exit type': phrase('የመልቀቂያ አይነት', 'ዓይነት ምውጻእ', 'Gosa hojii gadi dhiisuu'),
  'immediate': phrase('ወዲያውኑ', 'ብቕጽበት', 'Battalumatti'),
  'urgent': phrase('አስቸኳይ', 'ህጹጽ', 'Ariifachiisaa'),
  'standard notice': phrase('መደበኛ ማሳወቂያ', 'መደበኛ ምልክታ', 'Beeksisa idilee'),
  'no notice days': phrase('የማሳወቂያ ቀናት የሉም', 'መዓልታት ምልክታ የለን', 'Guyyaa beeksisaa hin qabu'),
  '1–29 notice days': phrase('1–29 የማሳወቂያ ቀናት', '1–29 መዓልታት ምልክታ', 'Guyyaa beeksisaa 1–29'),
  'fixed 30 days': phrase('ቋሚ 30 ቀናት', 'ቀዋሚ 30 መዓልቲ', 'Guyyaa 30 murtaa’e'),
  'notice days': phrase('የማሳወቂያ ቀናት', 'መዓልታት ምልክታ', 'Guyyaa beeksisaa'),
  'exit reason': phrase('የመልቀቂያ ምክንያት', 'ምኽንያት ምውጻእ', 'Sababa hojii gadi dhiisuu'),
  'loading reasons...': phrase('ምክንያቶች በመጫን ላይ...', 'ምኽንያታት ይጽዓኑ ኣለዉ...', 'Sababoonni fe’amaa jiru...'),
  'no reasons available': phrase('ምንም ምክንያት የለም', 'ምኽንያት የለን', 'Sababni hin jiru'),
  'final working date': phrase('የመጨረሻ የስራ ቀን', 'መወዳእታ ዕለት ስራሕ', 'Guyyaa hojii xumuraa'),
  'explanation': phrase('ማብራሪያ', 'መብርሂ', 'Ibsa'),
  'resignation letter': phrase('የስራ መልቀቂያ ደብዳቤ', 'ደብዳበ ምልቃቕ ስራሕ', 'Xalayaa hojii gadi dhiisuu'),
  'please select an exit reason.': phrase('እባክዎ የመልቀቂያ ምክንያት ይምረጡ።', 'በጃኻ ምኽንያት ምውጻእ ምረጽ።', 'Maaloo sababa hojii gadi dhiisuu filadhu.'),
  'urgent notice must be between 1 and 29 days.': phrase('አስቸኳይ ማሳወቂያው ከ1 እስከ 29 ቀናት መሆን አለበት።', 'ህጹጽ ምልክታ ካብ 1 ክሳብ 29 መዓልቲ ክኸውን ኣለዎ።', 'Beeksisni ariifachiisaa guyyaa 1 hanga 29 ta’uu qaba.'),
  'an explanation is required for the selected reason.': phrase('ለተመረጠው ምክንያት ማብራሪያ ያስፈልጋል።', 'ንዝተመርጸ ምኽንያት መብርሂ የድሊ።', 'Sababa filatameef ibsi barbaachisa.'),
  'please provide a valid resignation letter.': phrase('እባክዎ ትክክለኛ የስራ መልቀቂያ ደብዳቤ ያስገቡ።', 'በጃኻ ቅኑዕ ደብዳበ ምልቃቕ ስራሕ ኣቕርብ።', 'Maaloo xalayaa hojii gadi dhiisuu sirrii kenni.'),
  'exit request submitted successfully.': phrase('የመልቀቂያ ጥያቄው በተሳካ ሁኔታ ገብቷል።', 'ሕቶ ምውጻእ ብዓወት ቀሪቡ።', 'Gaaffiin hojii gadi dhiisuu milkaa’inaan galfameera.'),
  'failed to submit exit request.': phrase('የመልቀቂያ ጥያቄውን ማስገባት አልተሳካም።', 'ሕቶ ምውጻእ ምቕራብ ኣይተዓወተን።', 'Gaaffii hojii gadi dhiisuu galchuun hin milkoofne.'),

  // Contract viewer / signature modal
  'something went wrong': phrase('አንድ ችግር ተፈጥሯል', 'ገለ ጸገም ኣጋጢሙ', 'Rakkoon tokko uumame'),
  'unknown': phrase('ያልታወቀ', 'ዘይተፈልጠ', 'Hin beekamne'),
  'draw the authorized employer signature.': phrase('የተፈቀደለትን የአሰሪ ፊርማ ይሳሉ።', 'ፍቓድ ዘለዎ ፊርማ ኣስራሒ ስኣል።', 'Mallattoo hojii kennitootaa hayyamame kaasi.'),
  'clear': phrase('አጽዳ', 'ኣጽርይ', 'Qulqulleessi'),
  'signature captured': phrase('ፊርማው ተይዟል', 'ፊርማ ተታሒዙ', 'Mallattoon qabameera'),
  'signed by:': phrase('የፈረመው:', 'ዝፈረመ:', 'Kan mallatteesse:'),
  'signed at:': phrase('የተፈረመበት ጊዜ:', 'ዝተፈረመሉ ግዜ:', 'Yeroo mallatteeffame:'),
  'ip address:': phrase('IP አድራሻ:', 'ኣድራሻ IP:', 'Teessoo IP:'),
  'signature pending': phrase('ፊርማ በመጠባበቅ ላይ', 'ፊርማ ይጽበ ኣሎ', 'Mallattoon eegamaa jira'),
  'employee signature': phrase('የሰራተኛ ፊርማ', 'ፊርማ ሰራሕተኛ', 'Mallattoo hojjetaa'),
  'employer signature': phrase('የአሰሪ ፊርማ', 'ፊርማ ኣስራሒ', 'Mallattoo hojii kennitootaa'),
  'sign contract': phrase('ውሉን ፈርም', 'ውዕል ፈርም', 'Waliigaltee mallatteessi'),
  'print contract': phrase('ውሉን አትም', 'ውዕል ሕተም', 'Waliigaltee maxxansi'),

  // Performance modal
  'critical discipline attention': phrase('አስቸኳይ የዲሲፕሊን ትኩረት', 'ህጹጽ ትኹረት ዲሲፕሊን', 'Xiyyeeffannoo naamusaa ariifachiisaa'),
  'dismiss': phrase('ዝጋ', 'ዕጸው', 'Dhiisi'),
  'view discipline': phrase('ዲሲፕሊንን ተመልከት', 'ዲሲፕሊን ርአ', 'Naamusa ilaali'),

  // Common employee/profile workflow overlays
  'edit employee profile': phrase('የሰራተኛ መገለጫ አርትዕ', 'መግለጺ ሰራሕተኛ ኣርም', 'Ibsa hojjetaa gulaali'),
  'create employee': phrase('ሰራተኛ ፍጠር', 'ሰራሕተኛ ፍጠር', 'Hojjetaa uumi'),
  'employee details': phrase('የሰራተኛ ዝርዝሮች', 'ዝርዝር ሰራሕተኛ', 'Bal’ina hojjetaa'),
  'personal information': phrase('የግል መረጃ', 'ውልቃዊ ሓበሬታ', 'Odeeffannoo dhuunfaa'),
  'employment information': phrase('የቅጥር መረጃ', 'ሓበሬታ ቁጽሪ', 'Odeeffannoo qacarrii'),
  'emergency contact': phrase('የአደጋ ጊዜ እውቂያ', 'ናይ ህጹጽ ግዜ መራኸቢ', 'Quunnamtii yeroo balaa'),
  'bank information': phrase('የባንክ መረጃ', 'ሓበሬታ ባንኪ', 'Odeeffannoo baankii'),
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
}

function translateDynamic(source: string, language: TargetLanguage): string | null {
  const critical = source.match(/^(\d+)\s+employees?\s+currently require immediate review\.$/i);
  if (critical) {
    const count = critical[1];
    if (language === 'am') return `${count} ሰራተኛ(ዎች) አሁን አስቸኳይ ግምገማ ያስፈልጋቸዋል።`;
    if (language === 'ti') return `${count} ሰራሕተኛታት ሕጂ ህጹጽ ገምጋም የድልዮም።`;
    return `Hojjettoonni ${count} yeroo ammaa madaallii ariifachiisaa barbaadu.`;
  }

  return null;
}

export function translateWorkflowOverlayText(source: string, language: AppLanguage): string {
  if (language === 'en') return source;

  const dynamic = translateDynamic(source.trim(), language);
  if (dynamic) return dynamic;

  const translation = EXACT[normalize(source)];
  return translation?.[language] ?? source;
}
