/**
 * Comprehensive stop words list (French + English + common words)
 */
export const STOP_WORDS = new Set([
    // Articles
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
    
    // Prepositions
    'dans', 'avec', 'pour', 'plus', 'tout', 'tous', 'cette', 'ces',
    'son', 'ses', 'leur', 'leurs', 'notre', 'nos', 'que', 'qui',
    'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi', 'parce',
    'car', 'donc', 'mais', 'très', 'bien', 'avoir', 'être', 'faire',
    'dit', 'elle', 'vous', 'ils', 'nous', 'comme', 'sur', 'peut',
    'sans', 'sous', 'après', 'avant', 'depuis', 'pendant', 'entre',
    'contre', 'vers', 'chez', 'par', 'selon', 'malgré', 'sauf',
    'puis', 'alors', 'ainsi', 'aussi', 'encore', 'déjà', 'toujours',
    'jamais', 'souvent', 'parfois', 'quelque', 'plusieurs', 'chaque',
    'autre', 'même', 'tel', 'tant', 'autant', 'moins', 'beaucoup',
    'quelques', 'certains', 'certaines', 'celui', 'celle', 'ceux',
    'celles', 'ceci', 'cela', 'ici', 'là-bas', 'maintenant', 'hier',
    'demain', 'aujourd', 'hui', 'trop', 'assez', 'peu', 'tant',
    'autant', 'davantage', 'plutôt', 'surtout', 'notamment', 'enfin',
    'bref', 'sinon', 'néanmoins', 'cependant', 'toutefois', 'pourtant',
    'néanmoins', 'malgré', 'grâce', 'concernant', 'lors',
    'durant', 'tandis', 'pendant', 'jusqu', 'depuis', 'dès', 'via',
    'près', 'loin', 'dedans', 'dehors', 'dessus', 'dessous', 'devant',
    'derrière', 'autour', 'parmi', 'entre', 'outre', 'hormis', 'excepté',
    'sauf', 'moyennant', 'suivant', 'selon', 'conformément', 'contrairement',
  
    // Articles manquants
    'l', 'd', 'j', 'n', 'm', 't', 's', 'c', 'qu',
    
    // Pronoms personnels
    'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
    'me', 'te', 'se', 'le', 'la', 'les', 'lui', 'leur', 'y', 'en',
    'moi', 'toi', 'soi', 'eux',
    
    // Pronoms possessifs
    'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
    'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
    'mien', 'tien', 'sien', 'mienne', 'tienne', 'sienne',
    'miens', 'tiens', 'siens', 'miennes', 'tiennes', 'siennes',
    'nôtre', 'vôtre', 'nôtres', 'vôtres',
    
    // Pronoms démonstratifs
    'ce', 'cette', 'ces', 'cet', 'celui', 'celle', 'ceux', 'celles',
    'ceci', 'cela', 'ça', 'celui-ci', 'celle-ci', 'ceux-ci', 'celles-ci',
    'celui-là', 'celle-là', 'ceux-là', 'celles-là',
    
    // Conjonctions
    'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'soit', 'sinon',
    'ainsi', 'alors', 'cependant', 'pourtant', 'néanmoins', 'toutefois',
    'tandis', 'pendant', 'lorsque', 'quand', 'comme', 'puisque',
    'parce', 'afin', 'pour', 'sans', 'avec', 'malgré', 'selon',
    
    // Adverbes fréquents
    'pas', 'ne', 'non', 'oui', 'si', 'bien', 'mal', 'mieux', 'pire',
    'plus', 'moins', 'autant', 'tant', 'très', 'trop', 'assez',
    'peu', 'beaucoup', 'tellement', 'si', 'aussi', 'autant',
    'hier', 'aujourd', 'demain', 'maintenant', 'bientôt', 'tard',
    'tôt', 'déjà', 'encore', 'toujours', 'jamais', 'souvent',
    'parfois', 'quelquefois', 'longtemps', 'peu', 'beaucoup',
    'ici', 'là', 'où', 'partout', 'ailleurs', 'dehors', 'dedans',
    'dessus', 'dessous', 'devant', 'derrière', 'près', 'loin',
    
    // Verbes auxiliaires et très courants avec conjugaisons
    // Verbes de mouvement basiques
    'marcher', 'courir', 'monter', 'descendre', 'tomber', 'lever',
    'baisser', 'tourner', 'retourner', 'revenir', 'arriver', 'repartir',
    'avancer', 'reculer', 'bouger', 'remuer', 'pencher', 'incliner',
    
    // Verbes de communication basiques
    'parler', 'écouter', 'entendre', 'regarder', 'montrer', 'indiquer',
    'expliquer', 'raconter', 'répéter', 'répondre', 'demander', 'questionner',
    'appeler', 'nommer', 'crier', 'chuchoter', 'silence', 'taire',
    
    // Verbes d'état et perception
    'sembler', 'paraître', 'devenir', 'rester', 'demeurer', 'exister',
    'manquer', 'suffire', 'contenir', 'comprendre', 'inclure', 'comporter',
    'représenter', 'signifier', 'vouloir', 'désirer', 'souhaiter', 'espérer',
    'préférer', 'choisir', 'décider', 'accepter', 'refuser', 'rejeter',
    
    // Verbes temporels et d'action générale
    'commencer', 'finir', 'terminer', 'continuer', 'arrêter', 'cesser',
    'reprendre', 'recommencer', 'durer', 'passer', 'rester', 'attendre',
    'préparer', 'organiser', 'ranger', 'nettoyer', 'laver', 'essuyer',
    'chercher', 'trouver', 'perdre', 'garder', 'garder', 'conserver',
    'jeter', 'lancer', 'attraper', 'saisir', 'tenir', 'lâcher',
    
    // Verbes de relation et possession
    'appartenir', 'posséder', 'contenir', 'manquer', 'obtenir', 'recevoir',
    'acheter', 'vendre', 'payer', 'coûter', 'valoir', 'peser', 'mesurer',
    'compter', 'calculer', 'ajouter', 'enlever', 'augmenter', 'diminuer',
    
    // Verbes modaux et d'aide
    'aider', 'servir', 'utiliser', 'employer', 'permettre', 'interdire',
    'empêcher', 'éviter', 'essayer', 'tenter', 'réussir', 'échouer',
    'gagner', 'perdre', 'battre', 'vaincre', 'défendre', 'attaquer',
    
    // Verbes cognitifs basiques
    'penser', 'réfléchir', 'imaginer', 'rêver', 'oublier', 'rappeler',
    'reconnaître', 'identifier', 'comparer', 'différencier', 'ressembler',
    'changer', 'modifier', 'transformer', 'améliorer', 'empirer', 'corriger',
    
    // Adjectifs très courants
    'grand', 'grande', 'grands', 'grandes', 'petit', 'petite', 'petits', 'petites',
    'bon', 'bonne', 'bons', 'bonnes', 'mauvais', 'mauvaise', 'mauvaises',
    'nouveau', 'nouvelle', 'nouveaux', 'nouvelles', 'ancien', 'ancienne',
    'jeune', 'jeunes', 'vieux', 'vieille', 'vieilles', 'gros', 'grosse',
    'beau', 'belle', 'beaux', 'belles', 'joli', 'jolie', 'long', 'longue',
    'court', 'courte', 'haut', 'haute', 'bas', 'basse', 'fort', 'forte',
    'faible', 'faibles', 'léger', 'légère', 'lourd', 'lourde', 'dur', 'dure',
    'facile', 'faciles', 'difficile', 'difficiles', 'simple', 'simples',
    'compliqué', 'compliquée', 'rapide', 'rapides', 'lent', 'lente', 'lents',
    'important', 'importante', 'importants', 'importantes', 'principal',
    'principale', 'principaux', 'principales', 'général', 'générale',
    'particulier', 'particulière', 'spécial', 'spéciale', 'normal', 'normale',
    'possible', 'possibles', 'impossible', 'impossibles', 'nécessaire',
    'utile', 'utiles', 'inutile', 'inutiles', 'libre', 'libres', 'seul',
    'seule', 'seuls', 'seules', 'premier', 'première', 'premiers', 'premières',
    'dernier', 'dernière', 'derniers', 'dernières', 'prochain', 'prochaine',
    
    // Participes passés très courants
    'fait', 'faite', 'faits', 'faites', 'dit', 'dite', 'dits', 'dites',
    'mis', 'mise', 'mises', 'pris', 'prise', 'prises', 'vu', 'vue', 'vus', 'vues',
    'su', 'sue', 'sus', 'sues', 'eu', 'eue', 'eus', 'eues', 'été', 'étée',
    'allé', 'allée', 'allés', 'allées', 'venu', 'venue', 'venus', 'venues',
    'parti', 'partie', 'partis', 'parties', 'sorti', 'sortie', 'sortis', 'sorties',
    'entré', 'entrée', 'entrés', 'entrées', 'resté', 'restée', 'restés', 'restées',
    'devenu', 'devenue', 'devenus', 'devenues', 'mort', 'morte', 'morts', 'mortes',
    'né', 'née', 'nés', 'nées', 'arrivé', 'arrivée', 'arrivés', 'arrivées',
    'tombé', 'tombée', 'tombés', 'tombées', 'monté', 'montée', 'montés', 'montées',
    
    // Expressions et locutions courantes
    'il', 'y', 'a', 'c\'est', 'ce', 'sont', 'voici', 'voilà', 'peut-être',
    'bien', 'sûr', 'tout', 'à', 'fait', 'en', 'train', 'de', 'en', 'cours',
    'au', 'lieu', 'de', 'à', 'cause', 'de', 'grâce', 'à', 'par', 'rapport',
    'à', 'côté', 'de', 'au', 'milieu', 'de', 'au', 'bout', 'de', 'à', 'travers',
    'en', 'face', 'de', 'à', 'partir', 'de', 'jusqu\'à', 'autour', 'de',
    
    // Verbes d'opinion et sentiment basiques
    'aimer', 'adorer', 'détester', 'haïr', 'préférer', 'apprécier',
    'plaire', 'déplaire', 'intéresser', 'ennuyer', 'amuser', 'inquiéter',
    'rassurer', 'surprendre', 'étonner', 'choquer', 'déranger', 'gêner',
    'embêter', 'énerver', 'agacer', 'calmer', 'exciter', 'passionner',
    'être', 'avoir', 'aller', 'faire', 'dire', 'voir', 'savoir',
    'pouvoir', 'vouloir', 'devoir', 'falloir', 'valoir', 'venir',
    'partir', 'sortir', 'entrer', 'prendre', 'donner', 'mettre',
    'porter', 'passer', 'rester', 'devenir', 'tenir', 'paraître',
    'connaître', 'croire', 'vivre', 'mourir', 'naître', 'suivre',
    'sentir', 'servir', 'dormir', 'ouvrir', 'couvrir', 'offrir',
    'souffrir', 'découvrir', 'battre', 'rendre', 'vendre', 'perdre',
    'entendre', 'attendre', 'répondre', 'descendre', 'pendre',
    'tendre', 'fendre', 'mordre', 'rompre', 'vaincre', 'peindre',
    'craindre', 'plaindre', 'joindre', 'atteindre', 'éteindre',
    'conduire', 'construire', 'détruire', 'instruire', 'produire',
    'traduire', 'introduire', 'réduire', 'séduire', 'luire',
    'nuire', 'fuir', 'lire', 'écrire', 'rire', 'plaire', 'taire',
    'boire', 'croire', 'croître', 'accroître', 'conclure', 'exclure',
    'inclure', 'résoudre', 'absoudre', 'coudre', 'moudre',
    'recevoir', 'apercevoir', 'concevoir', 'décevoir', 'percevoir',
    
    // Être - conjugaisons principales
    'est', 'sont', 'était', 'étaient', 'sera', 'seront', 'suis', 'es',
    'sommes', 'êtes', 'été', 'étant', 'serai', 'seras', 'serons',
    'serez', 'serais', 'serait', 'serions', 'seriez', 'seraient',
    'sois', 'soit', 'soyons', 'soyez', 'soient', 'fusse', 'fusses',
    'fût', 'fussions', 'fussiez', 'fussent',
    
    // Avoir - conjugaisons principales
    'ai', 'as', 'a', 'avons', 'avez', 'ont', 'avait', 'avaient',
    'aura', 'auront', 'aurai', 'auras', 'aurons', 'aurez',
    'aurais', 'aurait', 'aurions', 'auriez', 'auraient', 'aie',
    'aies', 'ait', 'ayons', 'ayez', 'aient', 'eu', 'eue', 'eus',
    'eues', 'ayant', 'eut', 'eûmes', 'eûtes', 'eurent',
    
    // Aller - conjugaisons principales
    'va', 'vas', 'allons', 'allez', 'vont', 'allait', 'allaient',
    'ira', 'iront', 'irai', 'iras', 'irons', 'irez', 'irais',
    'irait', 'irions', 'iriez', 'iraient', 'aille', 'ailles',
    'allé', 'allée', 'allés', 'allées', 'allant',
    
    // Faire - conjugaisons principales
    'fait', 'fais', 'faisons', 'faites', 'font', 'faisait', 'faisaient',
    'fera', 'feront', 'ferai', 'feras', 'ferons', 'ferez', 'ferais',
    'ferait', 'ferions', 'feriez', 'feraient', 'fasse', 'fasses',
    'fassions', 'fassiez', 'fassent', 'faisant', 'fît', 'fîmes',
    'fîtes', 'firent',
    
    // Dire - conjugaisons principales
    'dit', 'dis', 'disons', 'dites', 'disent', 'disait', 'disaient',
    'dira', 'diront', 'dirai', 'diras', 'dirons', 'direz', 'dirais',
    'dirait', 'dirions', 'diriez', 'diraient', 'dise', 'dises',
    'disions', 'disiez', 'disent', 'disant',
    
    // Voir - conjugaisons principales
    'voit', 'vois', 'voyons', 'voyez', 'voient', 'voyait', 'voyaient',
    'verra', 'verront', 'verrai', 'verras', 'verrons', 'verrez',
    'verrais', 'verrait', 'verrions', 'verriez', 'verraient',
    'voie', 'voies', 'voyions', 'voyiez', 'voient', 'voyant', 'vu',
    
    // Savoir - conjugaisons principales
    'sait', 'sais', 'savons', 'savez', 'savent', 'savait', 'savaient',
    'saura', 'sauront', 'saurai', 'sauras', 'saurons', 'saurez',
    'saurais', 'saurait', 'saurions', 'sauriez', 'sauraient',
    'sache', 'saches', 'sachions', 'sachiez', 'sachent', 'sachant', 'su',
    
    // Pouvoir - conjugaisons principales
    'peut', 'peux', 'pouvons', 'pouvez', 'peuvent', 'pouvait', 'pouvaient',
    'pourra', 'pourront', 'pourrai', 'pourras', 'pourrons', 'pourrez',
    'pourrais', 'pourrait', 'pourrions', 'pourriez', 'pourraient',
    'puisse', 'puisses', 'puissions', 'puissiez', 'puissent', 'pouvant', 'pu',
    
    // Vouloir - conjugaisons principales
    'veut', 'veux', 'voulons', 'voulez', 'veulent', 'voulait', 'voulaient',
    'voudra', 'voudront', 'voudrai', 'voudras', 'voudrons', 'voudrez',
    'voudrais', 'voudrait', 'voudrions', 'voudriez', 'voudraient',
    'veuille', 'veuilles', 'voulions', 'vouliez', 'veuillent', 'voulant', 'voulu',
    
    // Devoir - conjugaisons principales
    'doit', 'dois', 'devons', 'devez', 'doivent', 'devait', 'devaient',
    'devra', 'devront', 'devrai', 'devras', 'devrons', 'devrez',
    'devrais', 'devrait', 'devrions', 'devriez', 'devraient',
    'doive', 'doives', 'devions', 'deviez', 'doivent', 'devant', 'dû',
    
    // Prendre - conjugaisons principales
    'prend', 'prends', 'prenons', 'prenez', 'prennent', 'prenait', 'prenaient',
    'prendra', 'prendront', 'prendrai', 'prendras', 'prendrons', 'prendrez',
    'prendrais', 'prendrait', 'prendrions', 'prendriez', 'prendraient',
    'prenne', 'prennes', 'prenions', 'preniez', 'prennent', 'prenant', 'pris',
    
    // Venir - conjugaisons principales
    'vient', 'viens', 'venons', 'venez', 'viennent', 'venait', 'venaient',
    'viendra', 'viendront', 'viendrai', 'viendras', 'viendrons', 'viendrez',
    'viendrais', 'viendrait', 'viendrions', 'viendriez', 'viendraient',
    'vienne', 'viennes', 'venions', 'veniez', 'viennent', 'venant', 'venu',
    
    // Donner - conjugaisons principales
    'donne', 'donnes', 'donnons', 'donnez', 'donnent', 'donnait', 'donnaient',
    'donnera', 'donneront', 'donnerai', 'donneras', 'donnerons', 'donnerez',
    'donnerais', 'donnerait', 'donnerions', 'donneriez', 'donneraient',
    'donnant', 'donné',
    
    // Mettre - conjugaisons principales
    'met', 'mets', 'mettons', 'mettez', 'mettent', 'mettait', 'mettaient',
    'mettra', 'mettront', 'mettrai', 'mettras', 'mettrons', 'mettrez',
    'mettrais', 'mettrait', 'mettrions', 'mettriez', 'mettraient',
    'mette', 'mettes', 'mettions', 'mettiez', 'mettent', 'mettant', 'mis',
    
    // Interrogatifs
    'qui', 'que', 'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi',
    'combien', 'quel', 'quelle', 'quels', 'quelles', 'lequel',
    'laquelle', 'lesquels', 'lesquelles', 'duquel', 'de', 'laquelle',
    'desquels', 'desquelles', 'auquel', 'à', 'auxquels', 'auxquelles',
    
    // Indéfinis
    'on', 'tout', 'tous', 'toute', 'toutes', 'chaque', 'chacun',
    'chacune', 'quelque', 'quelques', 'quelqu', 'quelqu\'un',
    'quelqu\'une', 'quelque', 'chose', 'quelque', 'part',
    'n\'importe', 'certain', 'certains', 'certaine', 'certaines',
    'plusieurs', 'autre', 'autres', 'autrui', 'même', 'mêmes',
    'tel', 'telle', 'tels', 'telles', 'aucun', 'aucune', 'nul',
    'nulle', 'personne', 'rien', 'quiconque',
    
    // Mots de liaison et transitions
    'alors', 'ainsi', 'aussi', 'donc', 'enfin', 'ensuite', 'puis',
    'd\'abord', 'premièrement', 'deuxièmement', 'finalement',
    'bref', 'en', 'effet', 'par', 'exemple', 'notamment', 'surtout',
    'plutôt', 'davantage', 'cependant', 'néanmoins', 'toutefois',
    'pourtant', 'en', 'revanche', 'au', 'contraire', 'par', 'ailleurs',
    'en', 'outre', 'de', 'plus', 'en', 'effet', 'en', 'fait',
    
    // Mots génériques et vagues
    'chose', 'choses', 'façon', 'manière', 'moment', 'temps', 'fois',
    'exemple', 'cas', 'part', 'place', 'point', 'problème', 'question',
    'raison', 'résultat', 'situation', 'solution', 'travail', 'vie',
    'monde', 'gens', 'personne', 'personnes', 'homme', 'femme',
    'enfant', 'enfants', 'famille', 'groupe', 'société', 'pays',
    'ville', 'région', 'état', 'gouvernement', 'politique', 'économie',
    
    // Unités de temps et mesure
    'année', 'années', 'mois', 'semaine', 'semaines', 'jour', 'jours',
    'heure', 'heures', 'minute', 'minutes', 'seconde', 'secondes',
    'siècle', 'décennie', 'an', 'ans', 'fois', 'euro', 'euros',
    'centimètre', 'mètre', 'kilomètre', 'gramme', 'kilogramme',
    
    // Nombres en lettres
    'zéro', 'un', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six',
    'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize',
    'quatorze', 'quinze', 'seize', 'vingt', 'trente', 'quarante',
    'cinquante', 'soixante', 'cent', 'mille', 'million', 'milliard',
    'premier', 'première', 'second', 'seconde', 'deuxième', 'troisième',
    
    // Mots courts peu significatifs
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    
    // Contractions et élisions courantes
    'l\'', 'd\'', 'j\'', 'n\'', 'm\'', 't\'', 's\'', 'c\'', 'qu\'',
    
    // Expressions courantes
    'c\'est', 'il', 'y', 's\'il', 'vous', 'plaît', 'merci', 'bonjour',
    'bonsoir', 'au', 'revoir', 'excusez', 'pardon', 'voilà', 'voici',
    'oui', 'non', 'peut-être', 'bien', 'sûr', 'certainement',
    
    // Mots de politesse et interjections
    'monsieur', 'madame', 'mademoiselle', 'bonjour', 'bonsoir',
    'bonne', 'nuit', 'au', 'revoir', 'salut', 'merci', 'pardon',
    'excusez', 'svp', 's\'il', 'vous', 'plaît', 'de', 'rien',
    'je', 'vous', 'en', 'prie', 'volontiers', 'avec', 'plaisir',
    
    // Verbes très courants (formes conjugées principales)
    'suis', 'es', 'sommes', 'êtes', 'été', 'étant', 'serai', 'seras',
    'serons', 'serez', 'serais', 'serait', 'serions', 'seriez', 'seraient',
    'sois', 'soit', 'soyons', 'soyez', 'soient', 'fusse', 'fusses',
    'fût', 'fussions', 'fussiez', 'fussent',
  
  
  
    // English stop words if needed but would need to be completed.
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
  'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
  'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
  'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so',
  'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just',
  'him', 'know', 'take', 'people', 'into', 'year', 'your',
  'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how',
  'our', 'work', 'first', 'well', 'way', 'even', 'new',
  'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'been', 'being', 'had', 'has', 'did',
  'does', 'doing', 'will', 'would', 'should', 'could', 'may',
  'might', 'must', 'shall', 'can', 'cannot', 'here', 'there',
  'where', 'why', 'how', 'what', 'when', 'who', 'whom', 'whose',
  'which', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'will', 'would',
  'should', 'could', 'ought', 'i', 'you', 'he', 'she', 'it',
  'we', 'they', 'them', 'their', 'what', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself',
  'you', 'your', 'yourself', 'yourselves', 'he', 'him', 'his',
  'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
  'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
  'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now',
  
  // Common technical/web words
  'html', 'css', 'javascript', 'php', 'sql', 'http', 'https', 'www',
  'com', 'org', 'net', 'fr', 'en', 'de', 'es', 'it', 'pt', 'ru',
  'page', 'site', 'web', 'website', 'link', 'url', 'email', 'mail',
  'contact', 'home', 'about', 'services', 'products', 'blog', 'news',
  'search', 'menu', 'navigation', 'footer', 'header', 'sidebar',
  'content', 'article', 'post', 'comment', 'reply', 'share', 'like',
  'follow', 'subscribe', 'login', 'register', 'account', 'profile',
  'settings', 'privacy', 'terms', 'conditions', 'policy', 'legal',
  'copyright', 'reserved', 'rights', 'all', 'inc', 'ltd', 'llc',
  'corp', 'company', 'business', 'service', 'solution', 'system',
  'technology', 'digital', 'online', 'internet', 'network', 'data',
  'information', 'details', 'description', 'title', 'name', 'text',
  'image', 'photo', 'picture', 'video', 'audio', 'file', 'download',
  'upload', 'save', 'edit', 'delete', 'add', 'remove', 'create',
  'update', 'modify', 'change', 'view', 'show', 'hide', 'display'
]);

/**
 * Filter out stop words from an array of words
 */
export function filterStopWords(words: string[]): string[] {
  return words.filter(word => !STOP_WORDS.has(word.toLowerCase()));
} 