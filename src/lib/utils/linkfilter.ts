/**
 * Site-specific patterns to exclude from indexing
 * Specific to Rustica/SystemD content
 */
export const SITE_SPECIFIC_EXCLUDED_PATTERNS = [
  // Forum and legacy content
  'tags',   // Exclude tags (category in systemd)
  'forum',  // Exclude forum links
  
  // Pagination
  '/2',
  '/3',
  '/4',
  '/5',
  '/6',
  '/7',
  '/8',
  '/9',
  '/10',
  '/11',
  '/12',
  '/13',
  '/14',
  '/15',
  '/16',
  '/17',
  '/18',
  '/19',
  '/20',
  '/21',
  '/22',
  '/23',
  '/24',
  '/25',
  '/26',
  '/27',
  '/28',
  '/29',
  '/30',
  '/31',
  '/32',
  '/33',
  '/34',
  '/35',
  '/36',
  '/37',
  '/38',
  '/39',
  '/40',
  '/41',
  '/42',
  '/43',
];

/**
 * Forum-specific patterns to detect in meta descriptions
 * Only obvious indicators that wouldn't appear in editorial content
 */
export const FORUM_INDICATORS = [
  // First person pronouns (obvious forum indicators)
  'je', 'j\'ai', 'j\'aimerais', 'j\'aurais', 'j\'espère', 'j\'aurai',
  'mon', 'ma', 'mes', 
  'moi je', 'nous avons', 'nous voulons', 'nous venons', 'pensez-vous', 
  
  // Personal appeals (obvious forum language)
  'quelqu\'un peut', 'personne sait', 'qui peut m\'aider',
  'besoin d\'aide', 'aidez-moi',

  // Forum-specific questions
  'pouvez-vous', 'peux-tu', 'peux-tu m\'aider',
  
  // Forum-specific phrases
  'merci d\'avance', 'svp', 's\'il vous plaît',
  
  // Informal greetings/closings
  'salut', 'coucou', 'bonsoir les amis', 'bonjour', 'bonsoir', 'hello', 'coucou',
  
  // SMS/internet slang (dead giveaway) - EXACT MATCHES ONLY
  '\\bbcp\\b', '\\bqq1\\b', '\\bqqun\\b', '\\bpr\\b', '\\bds\\b', '\\bvs\\b', '\\bmdr\\b', '\\blol\\b',
  'c\'', 'sé', '\\bpa\\b', '\\bke\\b', '\\bki\\b',
  
  // Informal punctuation patterns
  '!!!', '???', '!!', '....',
  
  // Direct personal context
  'chez moi', 'dans ma', 'dans mon',
  'j\'habite', 'on a', 'on habite'
];

/**
 * Check if meta description contains forum indicators
 */
export function isForumContent(metaDescription: string): boolean {
  if (!metaDescription) return false;
  
  const text = metaDescription.toLowerCase();
  
  return FORUM_INDICATORS.some(indicator => {
    // If indicator starts with \b, it's a regex pattern for exact word matching
    if (indicator.startsWith('\\b')) {
      const regex = new RegExp(indicator, 'i');
      return regex.test(text);
    }
    // Otherwise, use simple includes for phrases and longer patterns
    return text.includes(indicator.toLowerCase());
  });
}

/**
 * Enhanced link filtering with forum detection
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
 * URL patterns to exclude from indexing (SEO irrelevant pages)
 */
export const EXCLUDED_URL_PATTERNS = [
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
  
  // Admin/Technical pages
  '/admin',
  '/dashboard',
  '/login',
  '/register',
  '/signup',
  '/signin',
  '/logout',
  '/account',
  '/profile',
  '/settings',
  '/preferences',
  '/config',
  '/setup',
  '/test',
  '/debug',
  '/dev',
  '/development',
  '/staging',
  '/beta',
  '/alpha',
  '/sandbox',
  '/playground',
  '/console',
  '/panel',
  '/cp',
  '/controlpanel',
  '/backend',
  '/backoffice',
  '/wp-admin',
  '/wp-login',
  '/administrator',
  '/user',
  '/users',
  '/member',
  '/members',
  '/my-account',
  
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
 * Check if a URL should be excluded from indexing
 */
export function shouldExcludeUrl(url: string, metaDescription?: string): boolean {
  if (!url) return true;
  
  // Check for forum content in meta description
  if (metaDescription && isForumContent(metaDescription)) return true;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    
    if (SITE_SPECIFIC_EXCLUDED_PATTERNS.some(pattern => pathname.includes(pattern))) return true;
    if (EXCLUDED_URL_PATTERNS.some(pattern => pathSegments.includes(pattern.split('/').filter(Boolean)[0]))) return true;
    if (EXCLUDED_FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) return true;
    if (EXCLUDED_QUERY_PARAMS.some(param => search.includes(param + '='))) return true;
    
    if (pathSegments.length > 6) return true;
    if (pathSegments.some(segment => /^\d+$/.test(segment) && segment.length > 6)) return true;
    
    return false;
  } catch (error) {
    return true;
  }
}

/**
 * Filter an array of URLs to remove excluded ones
 */
export function filterIndexableUrls(urls: string[]): string[] {
  return urls.filter(url => !shouldExcludeUrl(url));
}

/**
 * Get exclusion reason for debugging
 */
export function getExclusionReason(url: string, metaDescription?: string): string | null {
  if (!url) return 'Empty URL';
  
  // Check forum content first
  if (metaDescription && isForumContent(metaDescription)) {
    const foundIndicator = FORUM_INDICATORS.find(indicator => 
      metaDescription.toLowerCase().includes(indicator.toLowerCase())
    );
    return `Forum '${foundIndicator}' detected`;
  }
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    const pathSegments = pathname.split('/').filter(Boolean);
    
    const sitePattern = SITE_SPECIFIC_EXCLUDED_PATTERNS.find(pattern => pathname.includes(pattern));
    if (sitePattern) return `Site-specific exclusion: ${sitePattern}`;
    
    const urlPattern = EXCLUDED_URL_PATTERNS.find(pattern => 
      pathSegments.includes(pattern.split('/').filter(Boolean)[0])
    );
    if (urlPattern) return `Excluded pattern: ${urlPattern}`;
    
    const fileExt = EXCLUDED_FILE_EXTENSIONS.find(ext => pathname.endsWith(ext));
    if (fileExt) return `Excluded extension: ${fileExt}`;
    
    const queryParam = EXCLUDED_QUERY_PARAMS.find(param => search.includes(param + '='));
    if (queryParam) return `Excluded query param: ${queryParam}`;
    
    if (pathSegments.length > 6) return `Too many path segments: ${pathSegments.length}`;
    
    const numericSegment = pathSegments.find(segment => /^\d+$/.test(segment) && segment.length > 6);
    if (numericSegment) return `Long numeric ID: ${numericSegment}`;
    
    return null;
  } catch (error) {
    return 'Invalid URL format';
  }
} 