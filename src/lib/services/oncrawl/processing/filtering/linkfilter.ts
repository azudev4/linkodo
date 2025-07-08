/**
 * Site-specific patterns to exclude from indexing
 * Specific to Rustica/SystemD content
 */
export const SITE_SPECIFIC_EXCLUDED_PATTERNS = [
  // Forum and legacy content
  'forum',  // Exclude forum links
  '3D'
];

/**
 * Check if text contains standalone forum indicators (not partial matches)
 */
function hasStandaloneForumIndicators(text: string): boolean {
  // Normalize text: lowercase and split into words/phrases
  const normalizedText = text.toLowerCase();
  
  return FORUM_INDICATORS.some(indicator => 
    hasStandalonePhrase(normalizedText, indicator.toLowerCase())
  );
}

/**
 * Check if a phrase exists as standalone words (not partial matches)
 */
function hasStandalonePhrase(text: string, phrase: string): boolean {
  // Split text into words (handles punctuation)
  const textWords = text.split(/\s+/);
  const phraseWords = phrase.split(/\s+/);
  
  // For single words, check exact word match
  if (phraseWords.length === 1) {
    return textWords.some(word => {
      // Remove punctuation for comparison
      const cleanWord = word.replace(/[^\w'àâäéèêëïîôùûüÿç-]/gi, '');
      return cleanWord === phrase;
    });
  }
  
  // For phrases, check consecutive word sequences
  for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
    const textSlice = textWords.slice(i, i + phraseWords.length);
    const cleanSlice = textSlice.map(word => 
      word.replace(/[^\w'àâäéèêëïîôùûüÿç-]/gi, '')
    );
    
    if (cleanSlice.join(' ') === phrase) {
      return true;
    }
  }
  
  return false;
}

/**
 * Forum-specific patterns to detect in meta descriptions
 */
export const FORUM_INDICATORS = [
  // First person pronouns (standalone matching)
  'je', 'j\'ai', 'j\'aimerais', 'j\'aurais', 'j\'espère', 'j\'aurai',
  'mon', 'ma', 'mes', 
  'moi je', 'nous avons', 'nous voulons', 'nous venons', 'pensez-vous', 
  
  // Personal appeals (standalone matching)
  'quelqu\'un peut', 'personne sait', 'qui peut m\'aider',
  'besoin d\'aide', 'aidez-moi',

  // Forum-specific questions (standalone matching)
  'pouvez-vous', 'peux-tu', 'peux-tu m\'aider',
  
  // Forum-specific phrases (standalone matching)
  'merci d\'avance', 'svp', 's\'il vous plaît',
  
  // Informal greetings/closings (standalone matching)
  'salut', 'coucou', 'bonsoir les amis', 'bonjour', 'bonsoir', 'hello',
  
  // SMS/internet slang - standalone matching only
  'bcp', 'qqun', 'mdr', 'lol', 'qlqn',
  
  // Informal punctuation patterns (standalone matching)
  '!!!', '???', '!!', '....',
  
  // Direct personal context (standalone matching)
  'chez moi', 'dans ma', 'dans mon',
  'j\'habite', 'on habite',

  // Else
  'forum', 'discussion',
];

/**
 * Check if meta description contains forum indicators
 */
export function isForumContent(metaDescription: string): boolean {
  if (!metaDescription) return false;
  return hasStandaloneForumIndicators(metaDescription);
}

/**
 * Check if title indicates a pagination page
 */
function isPaginationTitle(title?: string): boolean {
  if (!title) return false;
  
  // Simple word boundary check for 'page'
  const titleWords = title.toLowerCase().split(/\s+/);
  if (titleWords.some(word => word === 'page')) {
    return true;
  }
  
  // Check for "Page X of Y" pattern
  if (/page\s+\d+(\s+of\s+\d+)?/i.test(title)) {
    return true;
  }
  
  return false;
}

/**
 * Enhanced link filtering with forum and pagination detection
 */
export interface FilterResult {
  isFiltered: boolean;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

export function filterLink(
  url: string, 
  title?: string, 
  metaDescription?: string
): FilterResult {
  
  // Check for forum content in meta description
  if (metaDescription && isForumContent(metaDescription)) {
    return {
      isFiltered: true,
      reason: 'probable_forum',
      confidence: 'high'
    };
  }

  // Check for pagination in title
  if (title && isPaginationTitle(title)) {
    return {
      isFiltered: true,
      reason: 'pagination_page',
      confidence: 'high'
    };
  }

  // URL pattern filters
  const urlPatterns = [
    /forum/i,
    /discussion/i,
    /topic/i,
    /thread/i,
    /post/i,
    /comment/i
  ];

  for (const pattern of urlPatterns) {
    if (pattern.test(url)) {
      return {
        isFiltered: true,
        reason: 'forum_url_pattern',
        confidence: 'medium'
      };
    }
  }

  return {
    isFiltered: false,
    reason: '',
    confidence: 'low'
  };
}

/**
 * Check if a link should be included based on forum detection
 */
export function shouldIncludeLink(
  url: string,
  title?: string,
  metaDescription?: string
): boolean {
  const result = filterLink(url, title, metaDescription);
  return !result.isFiltered;
}

/**
 * =========================================
 * GENERAL EXCLUSION PATTERNS
 * Standard patterns for excluding non-content pages
 * =========================================
 */

/**
 * Phrases that indicate non-content pages when found anywhere in the URL
 */
export const EXCLUDED_URL_PHRASES = [
  // Auth/Account related
  'mot-de-passe',
  'motdepasse',
  'password',
  'login',
  'logout',
  'signin',
  'signout',
  'signup',
  'register',
  'inscription',
  'connexion',
  'deconnexion',
  'auth',
  'authentication',
  'compte',
  'account',
  'profile',
  'profil',
  
  // Admin/Settings
  'admin',
  'dashboard',
  'tableau-de-bord',
  'settings',
  'parametres',
  'preferences',
  'configuration',
  'wp-admin',
  
  // Legal/Policy
  'privacy',
  'confidentialite',
  'mentions-legales',
  'conditions',
  'terms',
  'legal',
  'disclaimer',
  'cookies',
  'gdpr',
  'rgpd',
  
  // Contact/Support
  'contact',
  'support',
  'aide',
  'help',
  
  // Technical/Dev
  'debug',
  'dev',
  'test',
  'staging',
  'beta',
  'sandbox',
  'console',
  'panel',
  'backend',
  'api'
];

/**
 * URL patterns to exclude from indexing (SEO irrelevant pages)
 */
export const EXCLUDED_URL_PATTERNS = [
  // Auth/Account pages
  '/login',
  '/logout',
  '/signin',
  '/signout',
  '/signup',
  '/register',
  '/account',
  '/profile',
  '/password',
  '/mot-de-passe',
  '/mot-de-passe-oublie',
  '/reset-password',
  '/change-password',
  '/forgot-password',
  '/auth',
  '/authentication',
  '/connexion',
  '/deconnexion',
  '/inscription',
  '/wp-login',
  '/wp-admin',
  '/admin',
  '/dashboard',
  '/tableau-de-bord',
  '/preferences',
  '/settings',
  '/parametres',
  '/configuration',
  
  // Legal/Policy pages
  '/privacy',
  '/policy',
  '/terms',
  '/legal',
  '/conditions',
  '/disclaimer',
  '/cookies',
  '/gdpr',
  '/copyright',
  '/dmca',
  '/refund',
  '/return',
  '/warranty',
  '/license',
  '/eula',
  '/infos-legales',  
  // Contact/Support pages
  '/contact',
  '/support',
  '/help',
  '/faq',
  '/ticket',
  '/feedback',
  '/complaint',
  '/report',
  '/abuse',
  '/contact-us',
  '/signaler-contenu-illicite',
  
  // Search/Filter pages
  '/search',
  '/filter',
  '/sort',
  '/results',
  '/find',
  '/lookup',
  '/query',
  '/browse',
  '/explore',
  '/advanced-search',
  
  // Cart/Checkout pages
  '/cart',
  '/checkout',
  '/payment',
  '/order',
  '/basket',
  '/bag',
  '/purchase',
  '/buy',
  '/billing',
  '/invoice',
  '/receipt',
  '/confirmation',
  '/thank-you',
  '/thanks',
  '/success',
  '/complete',
  '/completed',
  '/processing',
  '/pending',
  '/failed',
  '/cancelled',
  '/refunded',
  '/shipped',
  '/delivered',
  '/tracking',
  
  // File/Download pages
  '/download',
  '/file',
  '/pdf',
  '/doc',
  '/zip',
  '/attachment',
  '/attachments',
  '/uploads',
  '/upload',
  '/media',
  '/assets',
  '/resources',
  '/documents',
  '/files',
  '/dl',
  '/get',
  '/fetch',
  '/export',
  '/backup',
  '/dump',
  
  // Archive/Date pages
  '/archive',
  '/date',
  '/year',
  '/month',
  '/tag',
  '/category',
  '/author',
  '/page/',
  '/p/',
  '/archives',
  '/topics',
  '/subjects',
  '/themes',
  '/labels',
  '/taxonomy',
  '/classification',
  '/folder',
  '/folders',
  '/directory',
  '/directories',
  '/listing',
  '/index',
  '/sitemap',
  '/map',
  '/breadcrumb',
  '/navigation',
  '/nav',
  '/menu',
  '/sidebar',
  '/widget',
  '/widgets',
  
  // API/Technical endpoints
  '/api',
  '/ajax',
  '/json',
  '/xml',
  '/rss',
  '/feed',
  '/sitemap',
  '/robots',
  '/manifest',
  '/sw.js',
  '/service-worker',
  '/webmanifest',
  '/opensearch',
  '/favicon',
  '/apple-touch-icon',
  '/browserconfig',
  '/crossdomain',
  '/humans',
  '/security',
  '/ads',
  '/adsense',
  '/analytics',
  '/tracking',
  '/pixel',
  '/beacon',
  '/webhook',
  '/callback',
  '/ping',
  '/health',
  '/status',
  '/metrics',
  '/stats',
  '/statistics',
  '/logs',
  '/log',
  '/monitor',
  '/monitoring',
  '/uptime',
  '/performance',
  '/speed',
  '/benchmark',
  '/test-page',
  '/ping-test',
  '/load-test',
  '/stress-test',
  
  // Social/Share pages
  '/share',
  '/print',
  '/email',
  '/social',
  '/facebook',
  '/twitter',
  '/linkedin',
  '/instagram',
  '/youtube',
  '/pinterest',
  '/reddit',
  '/tumblr',
  '/whatsapp',
  '/telegram',
  '/messenger',
  '/like',
  '/follow',
  '/subscribe',
  '/unsubscribe',
  '/newsletter',
  '/mailing',
  '/notification',
  '/notifications',
  '/alert',
  '/alerts',
  '/reminder',
  '/reminders',
  '/bookmark',
  '/bookmarks',
  '/favorite',
  '/favorites',
  '/wishlist',
  '/save',
  '/saved',
  
  // Temporary/Redirect pages
  '/redirect',
  '/goto',
  '/link',
  '/out',
  '/external',
  '/temp',
  '/tmp',
  '/temporary',
  '/exit',
  '/leave',
  '/away',
  '/outbound',
  '/outgoing',
  '/forward',
  '/forwarding',
  '/proxy',
  '/mirror',
  '/cache',
  '/cached',
  '/snapshot',
  '/version',
  '/versions',
  '/revision',
  '/revisions',
  '/backup',
  '/backups',
  '/old',
  '/legacy',
  '/deprecated',
  '/obsolete',
  '/retired',
  '/discontinued',
  '/removed',
  '/deleted',
  '/redirection',
  
  // Error pages
  '/404',
  '/500',
  '/error',
  '/not-found',
  '/unavailable',
  '/403',
  '/401',
  '/400',
  '/502',
  '/503',
  '/504',
  '/forbidden',
  '/unauthorized',
  '/bad-request',
  '/timeout',
  '/gateway-error',
  '/service-unavailable',
  '/server-error',
  '/client-error',
  '/page-not-found',
  '/file-not-found',
  '/access-denied',
  '/permission-denied',
  '/blocked',
  '/banned',
  '/suspended',
  '/disabled',
  '/offline',
  '/down',
  '/outage',
  '/issue',
  '/trouble',
  
  // Preview/Draft pages
  '/preview',
  '/draft',
  '/staging',
  '/test',
  '/demo',
  '/sample',
  '/example',
  '/prototype',
  '/mockup',
  '/wireframe',
  '/sketch',
  '/concept',
  '/idea',
  '/proposal',
  '/suggestion',
  '/rough',
  '/work-in-progress',
  '/wip',
  '/coming-soon',
  '/under-construction',
  '/placeholder',
  '/dummy',
  '/fake',
  '/lorem',
  '/ipsum',
  '/filler',
  '/template',
  '/boilerplate',
  '/skeleton',
  '/framework',
  '/structure',
  '/layout',
  '/design',
  '/theme',
  '/style',
  '/css-test',
  '/js-test',
  '/html-test',
  '/php-test',
  '/sql-test',
  
  // Pagination/Navigation
  '/page-',
  '/p-',
  '/pg-',
  '/offset-',
  '/start-',
  '/begin-',
  '/next',
  '/prev',
  '/previous',
  '/first',
  '/last',
  '/more',
  '/load-more',
  '/show-more',
  '/view-all',
  '/see-all',
  '/all',
  
  // Not sure
  '/CP880_026',
];

/**
 * File extensions to exclude from indexing
 */
export const EXCLUDED_FILE_EXTENSIONS = [
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp',
  '.rtf', '.pages', '.numbers', '.key', '.epub', '.mobi', '.azw', '.azw3',
  
  // Archives
  '.zip', '.rar', '.tar', '.gz', '.bz2', '.xz', '.7z', '.cab', '.ace', '.arj',
  '.lzh', '.sit', '.sitx', '.sea', '.hqx', '.bin', '.uu', '.uue', '.xxe',
  
  // Executables
  '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.app', '.run', '.bin',
  '.com', '.bat', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar', '.class',
  
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff',
  '.tif', '.psd', '.ai', '.eps', '.indd', '.raw', '.cr2', '.nef', '.dng',
  '.heic', '.heif', '.avif', '.jxl',
  
  // Audio
  '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.aiff', '.au',
  '.ra', '.rm', '.mid', '.midi', '.kar', '.amr', '.3gp', '.3g2',
  
  // Video
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp',
  '.3g2', '.asf', '.rm', '.rmvb', '.vob', '.ts', '.mts', '.m2ts', '.divx',
  '.xvid', '.ogv', '.f4v', '.swf',
  
  // Fonts
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.pfb', '.pfm', '.afm', '.bdf',
  '.pcf', '.snf', '.fon', '.fnt',
  
  // Data/Config
  '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.config',
  '.properties', '.env', '.dotenv', '.htaccess', '.htpasswd', '.gitignore',
  '.gitattributes', '.editorconfig', '.eslintrc', '.prettierrc', '.babelrc',
  
  // Logs/Temp
  '.log', '.tmp', '.temp', '.bak', '.backup', '.old', '.orig', '.swp', '.swo',
  '.cache', '.pid', '.lock', '.part', '.crdownload', '.download',
  
  // Database
  '.db', '.sqlite', '.sqlite3', '.mdb', '.accdb', '.dbf', '.frm', '.myd',
  '.myi', '.ibd', '.sql', '.dump',
  
  // Development
  '.map', '.min.js', '.min.css', '.ts', '.tsx', '.jsx', '.vue', '.svelte',
  '.scss', '.sass', '.less', '.styl', '.coffee', '.dart', '.go', '.rs',
  '.py', '.rb', '.php', '.asp', '.aspx', '.jsp', '.pl', '.cgi', '.sh',
  '.bash', '.zsh', '.fish', '.ps1', '.psm1', '.psd1',
  
  // Feeds/Syndication
  '.rss', '.atom', '.rdf', '.opml', '.sitemap', '.kml', '.kmz',
  
  // Certificates/Security
  '.crt', '.cer', '.pem', '.key', '.p12', '.pfx', '.jks', '.keystore',
  '.csr', '.crl', '.der', '.p7b', '.p7c', '.spc',
  
  // Misc
  '.iso', '.img', '.dmg', '.vhd', '.vmdk', '.qcow2', '.vdi', '.ova', '.ovf',
  '.torrent', '.magnet', '.nzb', '.par2', '.sfv', '.md5', '.sha1', '.sha256',
];

/**
 * Query parameters that indicate non-indexable pages
 */
export const EXCLUDED_QUERY_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'msclkid',
  'ref',
  'source',
  'medium',
  'campaign',
  'print',
  'preview',
  'draft',
  'test',
  'debug',
  'dev',
  'admin',
  'login',
  'logout',
  'search',
  'filter',
  'sort',
  'page',
  'offset',
  'limit',
  'ajax',
  'json',
  'xml',
  'format',
  'export',
  'download',
];

/**
 * Check if a URL is well-formed
 */
function isValidUrl(url: string): boolean {
  // Must start with http:// or https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  
  // Basic URL structure validation
  try {
    const urlObj = new URL(url);
    // Must have a hostname
    if (!urlObj.hostname) return false;
    // Must not contain obvious non-URL characters
    if (url.includes(';') || url.includes('?') || url.includes('"') || url.includes('\'')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a URL should be excluded from indexing
 */
export function shouldExcludeUrl(
  url: string, 
  title?: string, 
  metaDescription?: string,
  h1?: string,
  statusCode?: number
): boolean {
  if (!url) return true;
  
  // Status code check
  if (statusCode && statusCode !== 200) {
    return true;
  }
  
  // SEO content check (2+ missing fields)
  const seoFieldCount = [!!title?.trim(), !!metaDescription?.trim(), !!h1?.trim()].filter(Boolean).length;
  if (seoFieldCount <= 1) {
    return true;
  }
  
  // Check for malformed URLs first
  if (!isValidUrl(url)) {
    console.log(`Excluding malformed URL: ${url}`);
    return true;
  }
  
  // Check for forum content in meta description
  if (metaDescription && isForumContent(metaDescription)) return true;

  // Check for pagination in title
  if (title && isPaginationTitle(title)) return true;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    const fullUrl = url.toLowerCase();
    
    // Check for excluded phrases anywhere in the URL
    if (EXCLUDED_URL_PHRASES.some(phrase => fullUrl.includes(phrase))) {
      return true;
    }
    
    // Check for site-specific patterns
    if (SITE_SPECIFIC_EXCLUDED_PATTERNS.some(pattern => pathname.includes(pattern))) {
      return true;
    }
    
    // Check file extensions
    if (EXCLUDED_FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) return true;
    
    // Check query parameters
    if (EXCLUDED_QUERY_PARAMS.some(param => search.includes(param + '='))) return true;
    
    // Check path depth
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 6) return true;
    
    // Check for long numeric IDs
    if (pathSegments.some(segment => /^\d+$/.test(segment) && segment.length > 6)) return true;
    
    return false;
  } catch (error) {
    console.log(`Error parsing URL: ${url}`, error);
    return true;
  }
}

/**
 * Filter an array of URLs to remove excluded ones
 */
export function filterIndexableUrls(urls: string[], titles?: string[], metaDescriptions?: string[]): string[] {
  return urls.filter((url, index) => {
    const title = titles?.[index];
    const metaDescription = metaDescriptions?.[index];
    return !shouldExcludeUrl(url, title, metaDescription);
  });
}

/**
 * Get exclusion reason for debugging
 */
export function getExclusionReason(
  url: string, 
  title?: string, 
  metaDescription?: string, 
  h1?: string,
  statusCode?: number
): string | null {
  if (!url) return 'Empty URL';
  
  // Status code check
  if (statusCode && statusCode !== 200) {
    return `Status code: ${statusCode}`;
  }
  
  // NEW: Check SEO field count
  const hasTitle = !!title?.trim();
  const hasMetaDescription = !!metaDescription?.trim();
  const hasH1 = !!h1?.trim();
  
  const seoFieldCount = [hasTitle, hasMetaDescription, hasH1].filter(Boolean).length;
  const missingFields = [];
  
  if (!hasTitle) missingFields.push('title');
  if (!hasMetaDescription) missingFields.push('meta_description');
  if (!hasH1) missingFields.push('h1');
  
  if (seoFieldCount <= 1) {
    return `Missing ${missingFields.length}/3 SEO fields: ${missingFields.join(', ')}`;
  }
  
  // Check for malformed URLs first
  if (!isValidUrl(url)) {
    return 'Malformed URL: Must be a valid http(s) URL';
  }
  
  // Check forum content first
  if (metaDescription && isForumContent(metaDescription)) {
    const text = metaDescription.toLowerCase();
    const foundIndicator = FORUM_INDICATORS.find(indicator => {
      return hasStandalonePhrase(text, indicator.toLowerCase());
    });
    
    return `Forum '${foundIndicator || 'unknown phrase'}' detected`;
  }

  // Check pagination in title
  if (title && isPaginationTitle(title)) {
    return 'Pagination page detected in title';
  }
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    const fullUrl = url.toLowerCase();
    
    // Check for excluded phrases first
    const excludedPhrase = EXCLUDED_URL_PHRASES.find(phrase => fullUrl.includes(phrase));
    if (excludedPhrase) {
      return `Contains excluded phrase: ${excludedPhrase}`;
    }
    
    // Check site-specific patterns
    const sitePattern = SITE_SPECIFIC_EXCLUDED_PATTERNS.find(pattern => pathname.includes(pattern));
    if (sitePattern) return `Site-specific exclusion: ${sitePattern}`;
    
    // Check file extensions
    const fileExt = EXCLUDED_FILE_EXTENSIONS.find(ext => pathname.endsWith(ext));
    if (fileExt) return `Excluded extension: ${fileExt}`;
    
    // Check query parameters
    const queryParam = EXCLUDED_QUERY_PARAMS.find(param => search.includes(param + '='));
    if (queryParam) return `Excluded query param: ${queryParam}`;
    
    // Check path depth
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 6) return `Too many path segments: ${pathSegments.length}`;
    
    // Check for long numeric IDs
    const numericSegment = pathSegments.find(segment => /^\d+$/.test(segment) && segment.length > 6);
    if (numericSegment) return `Long numeric ID: ${numericSegment}`;
    
    return null;
  } catch (error) {
    return 'Invalid URL format';
  }
} 