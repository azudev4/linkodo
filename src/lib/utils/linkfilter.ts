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
  '/mentions-legales',
  '/politique-confidentialite',
  '/conditions-generales',
  '/terms-of-service',
  '/terms-of-use',
  '/acceptable-use',
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
  '/aide',
  '/assistance',
  '/customer-service',
  '/customer-support',
  '/helpdesk',
  '/ticket',
  '/feedback',
  '/suggestion',
  '/complaint',
  '/report',
  '/abuse',
  '/contact-us',
  '/get-in-touch',
  '/reach-out',
  '/nous-contacter',
  '/service-client',
  '/signaler',
  '/plainte',
  
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
  '/installation',
  '/maintenance',
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
  '/mon-compte',
  '/profil',
  '/parametres',
  '/configuration',
  '/connexion',
  '/deconnexion',
  '/inscription',
  '/enregistrement',
  
  // Search/Filter pages
  '/search',
  '/filter',
  '/sort',
  '/recherche',
  '/rechercher',
  '/filtrer',
  '/trier',
  '/results',
  '/resultat',
  '/resultats',
  '/find',
  '/lookup',
  '/query',
  '/browse',
  '/explore',
  '/parcourir',
  '/explorer',
  '/advanced-search',
  '/recherche-avancee',
  
  // Cart/Checkout pages
  '/cart',
  '/checkout',
  '/payment',
  '/order',
  '/panier',
  '/commande',
  '/paiement',
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
  '/order-status',
  '/commande-statut',
  '/suivi',
  '/livraison',
  '/facturation',
  '/facture',
  '/recu',
  '/merci',
  '/confirmation',
  '/achat',
  '/acheter',
  
  // File/Download pages
  '/download',
  '/file',
  '/pdf',
  '/doc',
  '/zip',
  '/telecharger',
  '/fichier',
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
  '/archive-file',
  '/telechargement',
  '/piece-jointe',
  '/ressources',
  '/medias',
  '/exporter',
  '/sauvegarder',
  
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
  '/categorie',
  '/auteur',
  '/etiquette',
  '/tags',
  '/categories',
  '/authors',
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
  '/dossier',
  '/dossiers',
  '/repertoire',
  '/repertoires',
  '/classement',
  '/sujets',
  '/themes',
  '/rubriques',
  '/sections',
  
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
  '/flux',
  '/fil',
  '/syndication',
  '/statistiques',
  '/metriques',
  '/surveillance',
  '/performance',
  '/vitesse',
  
  // Social/Share pages
  '/share',
  '/print',
  '/email',
  '/partager',
  '/imprimer',
  '/envoyer',
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
  '/aimer',
  '/suivre',
  '/abonner',
  '/desabonner',
  '/lettre-information',
  '/alerte',
  '/alertes',
  '/rappel',
  '/rappels',
  '/marque-page',
  '/favori',
  '/favoris',
  '/liste-souhaits',
  '/sauvegarder',
  '/sauvegarde',
  
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
  '/sortie',
  '/externe',
  '/temporaire',
  '/quitter',
  '/partir',
  '/transfert',
  '/cache',
  '/sauvegarde',
  '/ancien',
  '/ancienne',
  '/obsolete',
  '/supprime',
  
  // Error pages
  '/404',
  '/500',
  '/error',
  '/erreur',
  '/not-found',
  '/unavailable',
  '/maintenance',
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
  '/incident',
  '/problem',
  '/issue',
  '/trouble',
  '/interdit',
  '/non-autorise',
  '/mauvaise-requete',
  '/delai-expire',
  '/erreur-serveur',
  '/erreur-client',
  '/page-introuvable',
  '/fichier-introuvable',
  '/acces-refuse',
  '/permission-refusee',
  '/bloque',
  '/banni',
  '/suspendu',
  '/desactive',
  '/hors-ligne',
  '/panne',
  '/incident',
  '/probleme',
  '/difficulte',
  
  // Preview/Draft pages
  '/preview',
  '/draft',
  '/staging',
  '/test',
  '/demo',
  '/sample',
  '/example',
  '/apercu',
  '/brouillon',
  '/exemple',
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
  '/prototypage',
  '/maquette',
  '/esquisse',
  '/croquis',
  '/idee',
  '/proposition',
  '/ebauche',
  '/travail-en-cours',
  '/bientot-disponible',
  '/en-construction',
  '/espace-reserve',
  '/factice',
  '/faux',
  '/remplissage',
  '/modele',
  '/squelette',
  '/cadre',
  '/mise-en-page',
  '/conception',
  '/style',
  
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
  '/suivant',
  '/precedent',
  '/premier',
  '/dernier',
  '/plus',
  '/charger-plus',
  '/afficher-plus',
  '/voir-tout',
  '/tout-voir',
  '/tous',
  
  // Language/Locale pages
  '/en/',
  '/fr/',
  '/es/',
  '/de/',
  '/it/',
  '/pt/',
  '/ru/',
  '/zh/',
  '/ja/',
  '/ko/',
  '/ar/',
  '/hi/',
  '/lang/',
  '/language/',
  '/locale/',
  '/region/',
  '/country/',
  '/langue/',
  '/region/',
  '/pays/',
  
  // Mobile/Device specific
  '/mobile',
  '/m/',
  '/amp',
  '/accelerated',
  '/instant',
  '/lite',
  '/light',
  '/fast',
  '/speed',
  '/quick',
  '/rapid',
  '/turbo',
  '/boost',
  '/optimized',
  '/compressed',
  '/minified',
  '/reduced',
  '/simplified',
  '/basic',
  '/minimal',
  '/clean',
  '/plain',
  '/text',
  '/no-js',
  '/no-css',
  '/no-images',
  '/low-bandwidth',
  '/dialup',
  '/slow',
  '/offline',
  '/cache-only',
  '/static',
  '/cdn',
  '/edge',
  '/proxy',
  '/mirror',
  '/backup-site',
  '/fallback',
  '/alternative',
  '/alt',
  '/leger',
  '/rapide',
  '/optimise',
  '/compresse',
  '/reduit',
  '/simplifie',
  '/basique',
  '/minimal',
  '/propre',
  '/texte',
  '/sans-js',
  '/sans-css',
  '/sans-images',
  '/faible-debit',
  '/lent',
  '/hors-ligne',
  '/statique',
  '/alternatif',
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
export function shouldExcludeUrl(url: string): boolean {
  if (!url) return true;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    
    // Check for excluded URL patterns
    for (const pattern of EXCLUDED_URL_PATTERNS) {
      if (pathname.includes(pattern)) {
        return true;
      }
    }
    
    // Check for excluded file extensions
    for (const ext of EXCLUDED_FILE_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return true;
      }
    }
    
    // Check for excluded query parameters
    for (const param of EXCLUDED_QUERY_PARAMS) {
      if (search.includes(param + '=')) {
        return true;
      }
    }
    
    // Exclude URLs with too many path segments (likely filters/pagination)
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 6) {
      return true;
    }
    
    // Exclude URLs with numbers that look like IDs in the path
    const hasNumericSegments = pathSegments.some(segment => 
      /^\d+$/.test(segment) && segment.length > 6
    );
    if (hasNumericSegments) {
      return true;
    }
    
    return false;
    
  } catch (error) {
    // Invalid URL, exclude it
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
export function getExclusionReason(url: string): string | null {
  if (!url) return 'Empty URL';
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    
    // Check patterns
    for (const pattern of EXCLUDED_URL_PATTERNS) {
      if (pathname.includes(pattern)) {
        return `Contains excluded pattern: ${pattern}`;
      }
    }
    
    // Check extensions
    for (const ext of EXCLUDED_FILE_EXTENSIONS) {
      if (pathname.endsWith(ext)) {
        return `Has excluded extension: ${ext}`;
      }
    }
    
    // Check query params
    for (const param of EXCLUDED_QUERY_PARAMS) {
      if (search.includes(param + '=')) {
        return `Contains excluded parameter: ${param}`;
      }
    }
    
    // Check path segments
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length > 6) {
      return `Too many path segments: ${pathSegments.length}`;
    }
    
    // Check numeric segments
    const numericSegment = pathSegments.find(segment => 
      /^\d+$/.test(segment) && segment.length > 6
    );
    if (numericSegment) {
      return `Contains long numeric ID: ${numericSegment}`;
    }
    
    return null;
    
  } catch (error) {
    return 'Invalid URL format';
  }
} 