import type { AppLanguage } from './config';

type Localized = Record<Exclude<AppLanguage, 'en'>, string>;

const translations: Record<string, Localized> = {
  'create contact category': { am: 'የእውቂያ ምድብ ፍጠር', ti: 'ምድብ ኣድራሻ ፍጠር', om: 'Ramaddii quunnamtii uumi' },
  'category name': { am: 'የምድብ ስም', ti: 'ስም ምድብ', om: 'Maqaa ramaddii' },
  'description': { am: 'መግለጫ', ti: 'መግለጺ', om: 'Ibsa' },
  'optional description': { am: 'አማራጭ መግለጫ', ti: 'ኣማራጺ መግለጺ', om: 'Ibsa filannoo' },
  'lucide icon': { am: 'የLucide አዶ', ti: 'ኣዶ Lucide', om: 'Mallattoo Lucide' },
  'search lucide icons...': { am: 'የLucide አዶዎችን ፈልግ...', ti: 'ኣዶታት Lucide ድለ...', om: 'Mallattoolee Lucide barbaadi...' },
  'fields': { am: 'መስኮች', ti: 'ዓውድታት', om: 'Dirreewwan' },
  'drag fields to reorder them. the same order is used in forms and tables.': { am: 'መስኮቹን በመጎተት ቅደም ተከተላቸውን ይቀይሩ። ይህ ቅደም ተከተል በቅጾችና ሰንጠረዦች ላይ ይጠቀማል።', ti: 'ዓውድታት ብምስሓብ ቅደም ተኸተሎም ቀይር። እዚ ቅደም ተኸተል ኣብ ቅጥዕታትን ሰደቓታትን ይጥቀም።', om: 'Dirreewwan harkisuun tartiiba isaanii jijjiiri. Tartiibni kun unkaalee fi gabateewwan keessatti ni fayyada.' },
  'add field': { am: 'መስክ ጨምር', ti: 'ዓውዲ ወስኽ', om: 'Dirree dabali' },
  'field name': { am: 'የመስክ ስም', ti: 'ስም ዓውዲ', om: 'Maqaa dirree' },
  'type': { am: 'ዓይነት', ti: 'ዓይነት', om: 'Gosa' },
  'required': { am: 'አስፈላጊ', ti: 'ግዴታ', om: 'Dirqama' },
  'show in table': { am: 'በሰንጠረዥ አሳይ', ti: 'ኣብ ሰደቓ ኣርኢ', om: 'Gabatee keessatti agarsiisi' },
  'add option': { am: 'አማራጭ ጨምር', ti: 'ኣማራጺ ወስኽ', om: 'Filannoo dabali' },
  'no options yet.': { am: 'እስካሁን አማራጭ የለም።', ti: 'ክሳብ ሕጂ ኣማራጺ የለን።', om: 'Hanga ammaatti filannoon hin jiru.' },
  'archived fields': { am: 'በማህደር የተቀመጡ መስኮች', ti: 'ዝተዓቀቡ ዓውድታት', om: 'Dirreewwan kuufaman' },
  'historical contact values are preserved.': { am: 'የቀድሞ የእውቂያ ውሂብ ተጠብቆ ይቆያል።', ti: 'ናይ ቀደም ዋጋታት ኣድራሻ ይዕቀቡ።', om: 'Gatiin quunnamtii durii ni eegama.' },
  'restore': { am: 'መልስ', ti: 'መልስ', om: 'Deebisi' },
  'archive category': { am: 'ምድብን ወደ ማህደር አስገባ', ti: 'ምድብ ኣዕቅብ', om: 'Ramaddii kuusi' },
  'cancel': { am: 'ሰርዝ', ti: 'ሰርዝ', om: 'Dhiisi' },
  'saving...': { am: 'በማስቀመጥ ላይ...', ti: 'ይዕቀብ ኣሎ...', om: 'Olkaa\'aa jira...' },
  'save changes': { am: 'ለውጦችን አስቀምጥ', ti: 'ለውጢታት ዓቅብ', om: 'Jijjiirama olkaa\'i' },
  'create category': { am: 'ምድብ ፍጠር', ti: 'ምድብ ፍጠር', om: 'Ramaddii uumi' },
  'text': { am: 'ጽሑፍ', ti: 'ጽሑፍ', om: 'Barruu' },
  'long text / notes': { am: 'ረጅም ጽሑፍ / ማስታወሻ', ti: 'ነዊሕ ጽሑፍ / መዘኻኸሪ', om: 'Barruu dheeraa / Yaadannoo' },
  'number': { am: 'ቁጥር', ti: 'ቁጽሪ', om: 'Lakkoofsa' },
  'phone': { am: 'ስልክ', ti: 'ስልኪ', om: 'Bilbila' },
  'email': { am: 'ኢሜይል', ti: 'ኢመይል', om: 'Imeelii' },
  'date': { am: 'ቀን', ti: 'ዕለት', om: 'Guyyaa' },
  'url': { am: 'ድር አድራሻ', ti: 'ኣድራሻ ድር', om: 'Teessoo marsariitii' },
  'dropdown': { am: 'ተቆልቋይ ምርጫ', ti: 'ተንጠልጣሊ ምርጫ', om: 'Filannoo gadi-bu\'aa' },
  'multi-select': { am: 'ብዙ ምርጫ', ti: 'ብዙሕ ምርጫ', om: 'Filannoo hedduu' },
  'checkbox': { am: 'ምልክት ሳጥን', ti: 'ሳጹን ምልክት', om: 'Sanduuqa filannoo' },
  'contacts': { am: 'እውቂያዎች', ti: 'ኣድራሻታት', om: 'Quunnamtiiwwan' },
  'columns': { am: 'ዓምዶች', ti: 'ዓምድታት', om: 'Tarjaalee' },
  'visible columns': { am: 'የሚታዩ ዓምዶች', ti: 'ዝረኣዩ ዓምድታት', om: 'Tarjaalee mul\'atan' },
  'manage category': { am: 'ምድብ አስተዳድር', ti: 'ምድብ ኣመሓድር', om: 'Ramaddii bulchi' },
  'add contact': { am: 'እውቂያ ጨምር', ti: 'ኣድራሻ ወስኽ', om: 'Quunnamtii dabali' },
  'custom brain contact category.': { am: 'ብጁ የBrain እውቂያ ምድብ።', ti: 'ብጁ ምድብ ኣድራሻ Brain።', om: 'Ramaddii quunnamtii Brain dhuunfaa.' },
  'actions': { am: 'ድርጊቶች', ti: 'ተግባራት', om: 'Tarkaanfiiwwan' },
  'loading contacts...': { am: 'እውቂያዎች በመጫን ላይ...', ti: 'ኣድራሻታት ይጽዓኑ ኣለዉ...', om: 'Quunnamtiiwwan fe\'amaa jiru...' },
  'no contacts in this category yet.': { am: 'በዚህ ምድብ ውስጥ እስካሁን እውቂያ የለም።', ti: 'ኣብዚ ምድብ ክሳብ ሕጂ ኣድራሻ የለን።', om: 'Ramaddii kana keessatti hanga ammaatti quunnamtiin hin jiru.' },
  'yes': { am: 'አዎ', ti: 'እወ', om: 'Eeyyee' },
  'no': { am: 'አይ', ti: 'ኣይ', om: 'Lakki' },
  'select option': { am: 'አማራጭ ይምረጡ', ti: 'ኣማራጺ ምረጽ', om: 'Filannoo filadhu' },
  'none': { am: 'ምንም', ti: 'የለን', om: 'Homaa' },
  'no options configured.': { am: 'ምንም አማራጭ አልተዋቀረም።', ti: 'ዝተዋቐረ ኣማራጺ የለን።', om: 'Filannoon qindaa\'e hin jiru.' },
  'contact name': { am: 'የእውቂያ ስም', ti: 'ስም ኣድራሻ', om: 'Maqaa quunnamtii' },
};

function normalize(source: string) {
  return source.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function translateContactCategoryText(source: string, language: AppLanguage): string {
  if (language === 'en') return source;
  const normalized = normalize(source);
  const exact = translations[normalized]?.[language];
  if (exact) return exact;

  let match = source.match(/^Add (.+) contact$/i);
  if (match) {
    const prefix = language === 'am' ? 'ጨምር' : language === 'ti' ? 'ወስኽ' : 'dabali';
    const noun = language === 'am' ? 'እውቂያ' : language === 'ti' ? 'ኣድራሻ' : 'quunnamtii';
    return language === 'om' ? `${match[1]} ${noun} ${prefix}` : `${match[1]} ${noun} ${prefix}`;
  }

  match = source.match(/^Edit (.+) contact$/i);
  if (match) {
    const action = language === 'am' ? 'አርትዕ' : language === 'ti' ? 'ኣስተኻኽል' : 'gulaali';
    const noun = language === 'am' ? 'እውቂያ' : language === 'ti' ? 'ኣድራሻ' : 'quunnamtii';
    return `${match[1]} ${noun} ${action}`;
  }

  match = source.match(/^Manage (.+)$/i);
  if (match) {
    const action = language === 'am' ? 'አስተዳድር' : language === 'ti' ? 'ኣመሓድር' : 'bulchi';
    return `${match[1]} ${action}`;
  }

  match = source.match(/^Search (.+)\.\.\.$/i);
  if (match) {
    const action = language === 'am' ? 'ፈልግ' : language === 'ti' ? 'ድለ' : 'barbaadi';
    return `${match[1]} ${action}...`;
  }

  return source;
}
