// Recommendations — Centered animated wellness chatbot
import { useEffect, useRef, useState } from "react";
import api from "../../api/axios";
import Spinner from "../../components/Spinner";

/* ─── Animation styles ───────────────────────────────────────────────────── */
const ANIM_STYLES = `
  @keyframes recFadeUp {
    from { opacity:0; transform:translateY(14px) scale(0.96); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes recBounce {
    0%,80%,100% { transform:translateY(0);   }
    40%         { transform:translateY(-6px); }
  }
  @keyframes recFloat {
    0%,100% { transform:translateY(0px);  }
    50%     { transform:translateY(-6px); }
  }
  @keyframes recGlow {
    0%   { box-shadow:0 0 0 0    rgba(255,143,171,0.55); }
    70%  { box-shadow:0 0 0 10px rgba(255,143,171,0);    }
    100% { box-shadow:0 0 0 0    rgba(255,143,171,0);    }
  }
  @keyframes recOptIn {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0);    }
  }
  .rec-fade-up { animation:recFadeUp  0.42s cubic-bezier(0.34,1.56,0.64,1) both; }
  .rec-dot-1   { animation:recBounce  1.2s ease-in-out infinite 0s;    }
  .rec-dot-2   { animation:recBounce  1.2s ease-in-out infinite 0.15s; }
  .rec-dot-3   { animation:recBounce  1.2s ease-in-out infinite 0.3s;  }
  .rec-float   { animation:recFloat   5s   ease-in-out infinite;        }
  .rec-av-glow { animation:recGlow    2.5s ease-in-out infinite;        }
  .rec-opt-in  { animation:recOptIn   0.3s ease both;                   }
`;

/* ─── Priority config ────────────────────────────────────────────────────── */
const PRIORITY = {
  faible: { label: "Faible", cls: "bg-green-100 text-green-700",   bar: "#22c55e" },
  modere: { label: "Modere", cls: "bg-blue-100 text-blue-700",     bar: "#3b82f6" },
  eleve:  { label: "Eleve",  cls: "bg-yellow-100 text-yellow-700", bar: "#f59e0b" },
  urgent: { label: "Urgent", cls: "bg-red-100 text-red-700",       bar: "#ef4444" },
};

/* ─── Shared continue options ────────────────────────────────────────────── */
const CONTINUE_OPTIONS = [
  { label: "Alimentation saine",  next: "diet"     },
  { label: "Exercice a domicile", next: "exercise" },
  { label: "Sante mentale",       next: "mental"   },
];
const continueNode = (msg) => ({ message: msg, options: CONTINUE_OPTIONS });

/* ─── Conversation tree ──────────────────────────────────────────────────── */
const TREE = {
  root: {
    message: "Comment puis-je vous aider aujourd'hui ?",
    options: [
      { label: "Alimentation saine",  next: "diet"     },
      { label: "Exercice a domicile", next: "exercise" },
      { label: "Sante mentale",       next: "mental"   },
    ],
  },

  // ── ALIMENTATION ──────────────────────────────────────────────────────────
  diet: {
    message: "Que souhaitez-vous savoir ?",
    options: [
      { label: "Aliments energisants",    next: "diet_energy" },
      { label: "Aliments a eviter",       next: "diet_avoid"  },
      { label: "Planification des repas", next: "diet_meal"   },
    ],
  },
  diet_energy: {
    message: "Quel aspect vous interesse le plus ?",
    options: [
      { label: "Fruits et legumes",     next: "diet_energy_fruits"   },
      { label: "Proteines et cereales", next: "diet_energy_proteins" },
      { label: "Collations saines",     next: "diet_energy_snacks"   },
    ],
  },
  diet_energy_fruits: continueNode(
    "PLAN ENERGIE — Fruits et Legumes\n\nPetit-dejeuner : Smoothie banane-epinards au lait d'amande\nCollation matin : Une poignee de baies\nDejeuner : Salade de chou frise, patate douce, pois chiches, huile d'olive\nCollation apres-midi : Une pomme avec du beurre de cacahuete\nDiner : Brocolis et carottes a la vapeur avec du riz complet\n\nConseil : Visez 5 portions de fruits et legumes par jour. La variete des couleurs apporte plus de nutriments.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_energy_proteins: continueNode(
    "PLAN ENERGIE — Proteines et Cereales\n\nPetit-dejeuner : Flocons d'avoine avec un oeuf dur et une tisane\nCollation matin : Yaourt grec avec du miel\nDejeuner : Poulet grille ou lentilles avec quinoa et legumes\nCollation apres-midi : Une poignee de noix melangees\nDiner : Saumon ou tofu au four avec pain complet et salade\n\nConseil : Incluez une source de proteines a chaque repas. Cela soutient les muscles et l'energie pendant le traitement.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_energy_snacks: continueNode(
    "PLAN DE COLLATIONS SAINES\n\nCollation matin : Yaourt grec avec une poignee de baies\nCollation apres-midi : Tranches de pomme avec du beurre d'amande\nCollation soir : Un petit bol de noix et graines melangees\n\nIdees supplementaires :\n- Houmous avec concombre ou batonnets de carotte\n- Crackers complets avec de l'avocat\n- Banane avec du beurre de cacahuete\n\nConseil : Mangez toutes les 2 a 3 heures pour stabiliser l'energie. Evitez les snacks emballes riches en sucre.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_avoid: {
    message: "Qu'est-ce qui vous preoccupe le plus ?",
    options: [
      { label: "Pendant le traitement",  next: "diet_avoid_treatment" },
      { label: "Habitudes quotidiennes", next: "diet_avoid_habits"    },
      { label: "Aliments transformes",   next: "diet_avoid_processed" },
    ],
  },
  diet_avoid_treatment: continueNode(
    "ALIMENTS A EVITER PENDANT LE TRAITEMENT\n\nA eviter completement :\n- Viandes, oeufs et poissons crus ou mal cuits\n- Produits laitiers et jus non pasteurises\n- Alcool sous toute forme\n- Pamplemousse (interfere avec certains medicaments)\n- Repas tres epices ou tres gras\n\nA limiter :\n- Cafeine (cafe, boissons energisantes)\n- Exces de sel et de sucre\n- Aliments ultra-transformes\n\nSuivez toujours les conseils alimentaires specifiques de votre oncologue.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_avoid_habits: continueNode(
    "HABITUDES QUOTIDIENNES A AMELIORER\n\nRemplacez ces habitudes :\n- Sauter des repas → mangez de petits repas toutes les 3 heures\n- Boissons sucrees → buvez de l'eau, des tisanes ou du jus dilue\n- Aliments frits → cuisez au four, a la vapeur ou au gril\n- Manger tard le soir → terminez le diner 2 heures avant de dormir\n- Aliments tres sales → assaisonnez avec des herbes et du citron\n\nUn changement par semaine suffit. Les petits pas menent a de grands resultats.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_avoid_processed: continueNode(
    "ALIMENTS TRANSFORMES A REMPLACER\n\nAu lieu de chips → mangez des noix ou du popcorn\nAu lieu de sodas sucres → buvez de l'eau petillante au citron\nAu lieu de charcuterie → mangez des proteines grillees ou cuites au four\nAu lieu de nouilles instantanees → cuisinez du riz ou des pates simples avec des legumes\nAu lieu de sucreries → mangez des fruits ou du chocolat noir\n\nConseil : Si un aliment contient plus de 5 ingredients sur son etiquette, il est probablement transforme.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_meal: {
    message: "Choisissez votre preference :",
    options: [
      { label: "Plan journalier",   next: "diet_meal_daily"  },
      { label: "Plan hebdomadaire", next: "diet_meal_weekly" },
      { label: "Repas faciles",     next: "diet_meal_easy"   },
    ],
  },
  diet_meal_daily: continueNode(
    "PLAN REPAS JOURNALIER COMPLET\n\nPetit-dejeuner (8h) : Flocons d'avoine avec banane et tisane\nCollation matin (10h) : Yaourt grec avec du miel\nDejeuner (12h) : Poulet grille ou lentilles + legumes a la vapeur + riz complet\nCollation apres-midi (15h) : Une poignee de noix et une pomme\nDiner (18h) : Soupe de legumes + pain complet + petite salade\nSoir (si faim) : Tisane de camomille + 2 crackers complets\n\nConseil : Buvez au moins 8 verres d'eau tout au long de la journee.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_meal_weekly: continueNode(
    "PLAN REPAS HEBDOMADAIRE EQUILIBRE\n\nLundi : Petit-dej avoine / Poisson grille + quinoa / Soupe de lentilles\nMardi : Omelette aux oeufs / Poulet + legumes / Poele de legumes\nMercredi : Smoothie + noix / Salade de thon / Saumon vapeur + riz\nJeudi : Yaourt + fruit / Bowl de pois chiches / Pates sauce tomate\nVendredi : Flocons d'avoine / Tofu grille + salade / Soupe maison\nSamedi : Pancakes aux fruits / Sandwich leger / Poulet au four\nDimanche : Repos et petite douceur en famille\n\nConseil : Preparez les ingredients de base le dimanche pour economiser de l'energie en semaine.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  diet_meal_easy: continueNode(
    "REPAS FACILES POUR LES JOURS DE FATIGUE\n\nPetit-dejeuner : Oeufs brouilles avec toast (10 min)\nDejeuner : Thon en boite avec crackers et concombre (5 min)\nDiner : Soupe d'avoine instantanee aux legumes (10 min)\nCollation : Banane avec beurre de cacahuete (1 min)\n\nOptions sans cuisson :\n- Yaourt avec granola et fruits\n- Avocat sur pain complet grille\n- Fromage blanc avec tranches de pomme\n\nConseil : Cuisinez en grande quantite quand vous avez de l'energie et conservez au refrigerateur.\n\nQue souhaitez-vous explorer ensuite ?"
  ),

  // ── EXERCICE ──────────────────────────────────────────────────────────────
  exercise: {
    message: "Quel est votre niveau ?",
    options: [
      { label: "Debutant",      next: "exercise_beginner"     },
      { label: "Intermediaire", next: "exercise_intermediate" },
      { label: "Avance",        next: "exercise_advanced"     },
    ],
  },
  exercise_beginner: {
    message: "Quel type d'exercice ?",
    options: [
      { label: "Etirements",      next: "ex_beg_stretch"   },
      { label: "Respiration",     next: "ex_beg_breathing" },
      { label: "Mouvement leger", next: "ex_beg_movement"  },
    ],
  },
  ex_beg_stretch: continueNode(
    "ROUTINE D'ETIREMENTS DEBUTANT (10 min)\n\n1. Rotations du cou — 5 rotations lentes de chaque cote (1 min)\n2. Haussements d'epaules — lever et relacher, 10 repetitions (1 min)\n3. Flexion avant assise — tendre vers les pieds, tenir 20 sec x 3 (2 min)\n4. Cercles de chevilles — 10 cercles par pied (1 min)\n5. Torsion douce du dos — assis, tourner gauche puis droite, tenir 15 sec (2 min)\n6. Respiration profonde pour finir — 5 respirations lentes (1 min)\n\nFaites cela chaque matin avant de vous lever.\nRecherchez sur YouTube : etirements doux patients cancer debutants\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  ex_beg_breathing: continueNode(
    "ROUTINE DE RESPIRATION DEBUTANT (10 min)\n\nExercice 1 — Respiration en carre (4 min)\n1. Asseyez-vous le dos droit\n2. Inspirez par le nez — 4 temps\n3. Retenez — 4 temps\n4. Expirez par la bouche — 4 temps\n5. Retenez — 4 temps\nRepetez 5 fois\n\nExercice 2 — Respiration abdominale (3 min)\n1. Posez une main sur le ventre\n2. Inspirez lentement — sentez le ventre se soulever\n3. Expirez lentement — sentez le ventre descendre\nRepetez 8 fois\n\nExercice 3 — Respiration relaxante (3 min)\nInspirez 4 temps, expirez 6 temps. Repetez 6 fois.\n\nFaites cela 3 fois par jour.\nRecherchez sur YouTube : exercices de respiration patients cancer\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  ex_beg_movement: continueNode(
    "ROUTINE DE MOUVEMENT DEBUTANT (15 min)\n\n1. Echauffement : marcher sur place — 3 minutes\n2. Balancements des bras vers l'avant et l'arriere — 2 minutes\n3. Levees de jambes douces en position assise — 10 rep par jambe (2 min)\n4. Se lever et s'asseoir lentement d'une chaise — 5 repetitions (2 min)\n5. Courte marche a l'interieur ou a l'exterieur — 5 minutes\n6. Recuperation : 3 respirations profondes lentes (1 min)\n\nFaites cela une fois par jour. Reposez-vous si vous vous sentez fatigue.\nRecherchez sur YouTube : exercice doux a domicile patients cancer debutants\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  exercise_intermediate: {
    message: "Quel type d'exercice ?",
    options: [
      { label: "Etirements",      next: "ex_int_stretch"   },
      { label: "Respiration",     next: "ex_int_breathing" },
      { label: "Mouvement leger", next: "ex_int_movement"  },
    ],
  },
  ex_int_stretch: continueNode(
    "ROUTINE D'ETIREMENTS INTERMEDIAIRE (20 min)\n\n1. Echauffement corps entier : cercles de bras et balancements de jambes — 3 min\n2. Etirement du flechisseur de hanche — agenouillez-vous, poussez les hanches, tenir 30 sec de chaque cote\n3. Etirement des ischio-jambiers — assis, etendez une jambe, penchez-vous, 30 sec de chaque cote\n4. Etirement cat-cow — a quatre pattes, 10 repetitions lentes\n5. Posture de l'enfant — tenir 45 secondes, repeter 2 fois\n6. Torsion assise — des deux cotes, tenir 20 sec de chaque cote\n7. Recuperation : 5 respirations abdominales profondes\n\nFaites cela 4 fois par semaine, idealement le matin.\nRecherchez sur YouTube : yoga intermediaire etirements patients cancer\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  ex_int_breathing: continueNode(
    "ROUTINE DE RESPIRATION INTERMEDIAIRE (15 min)\n\nExercice 1 — Respiration alternee par les narines (5 min)\n1. Fermez la narine droite avec le pouce, inspirez par la gauche sur 4 temps\n2. Fermez les deux, retenez 4 temps\n3. Liberez la narine droite, expirez sur 4 temps\n4. Inspirez par la droite sur 4, retenez, expirez par la gauche\nRepetez 5 cycles\n\nExercice 2 — Expiration prolongee (5 min)\nInspirez sur 4 temps, expirez sur 8 temps. Repetez 8 fois.\n\nExercice 3 — Respiration de relaxation guidee (5 min)\nFermez les yeux. A chaque expiration, relâchez une partie de votre corps.\n\nPratiquez quotidiennement.\nRecherchez sur YouTube : pranayama exercices respiration stress guerison\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  ex_int_movement: continueNode(
    "ROUTINE DE MOUVEMENT INTERMEDIAIRE (30 min)\n\n1. Marche d'echauffement — 5 minutes de marche rapide\n2. Flux de yoga doux — 10 minutes (salutation au soleil adaptee)\n3. Exercices avec elastique leger :\n   - Curl des biceps — 10 rep x 2 series\n   - Presse epaules — 10 rep x 2 series\n   - Rowing assis — 10 rep x 2 series\n4. Velo stationnaire ou marche sur place — 8 minutes\n5. Etirements de recuperation — 5 minutes\n\nFaites cela 3 a 4 fois par semaine. Reposez-vous le lendemain.\nRecherchez sur YouTube : musculation legere patients cancer a domicile\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  exercise_advanced: {
    message: "Quel type d'exercice ?",
    options: [
      { label: "Etirements",      next: "ex_adv_stretch"   },
      { label: "Respiration",     next: "ex_adv_breathing" },
      { label: "Mouvement leger", next: "ex_adv_movement"  },
    ],
  },
  ex_adv_stretch: continueNode(
    "ROUTINE DE FLEXIBILITE AVANCEE (35 min)\n\n1. Echauffement dynamique : genoux hauts, cercles de bras, rotations des hanches — 8 min\n2. Fente profonde — 45 sec de chaque cote x 2\n3. Posture du pigeon — 60 sec de chaque cote\n4. Flexion avant assise — 60 sec, 2 cycles\n5. Rotation de la colonne thoracique — 10 rep de chaque cote\n6. Rouleau de mousse : dos, jambes, epaules — 10 min\n7. Etirements statiques de recuperation — 5 min\n\nFaites cela 4 a 5 fois par semaine. Consultez votre medecin avant d'augmenter l'intensite.\nRecherchez sur YouTube : yoga avance flexibilite guerison cancer\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  ex_adv_breathing: continueNode(
    "PRATIQUE DE RESPIRATION AVANCEE (20 min)\n\nExercice 1 — Respiration rythmique pendant le mouvement (8 min)\nEn marchant : inspirez sur 3 pas, expirez sur 3 pas. Maintenez 8 minutes.\n\nExercice 2 — Kapalabhati (5 min)\nExpirations courtes et vives par le nez, inspiration passive. 30 rep par cycle, 3 cycles.\n\nExercice 3 — Meditation avec balayage corporel (7 min)\nAllongez-vous. A chaque respiration, focalisez l'attention sur chaque partie du corps des pieds a la tete.\n\nArretez si vous vous sentez etourdi. Pratiquez dans un espace calme.\nRecherchez sur YouTube : pranayama avance meditation guerison\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  ex_adv_movement: continueNode(
    "ENTRAINEMENT A DOMICILE AVANCE (45 min)\n\n1. Echauffement : 5 min de marche rapide + etirements dynamiques\n2. Cardio : 15 min de marche rapide, jogging leger ou velo stationnaire\n3. Musculation :\n   - Squats au poids du corps — 15 rep x 3 series\n   - Pompes contre le mur — 15 rep x 3 series\n   - Rowing avec elastique — 12 rep x 3 series\n   - Extensions des mollets debout — 15 rep x 2 series\n4. Gainage : Respiration abdominale assise — 5 min\n5. Recuperation : Etirement corps entier — 10 min\n\nReposez-vous 1 a 2 jours entre les seances. Consultez votre equipe soignante.\nRecherchez sur YouTube : entrainement a domicile patients cancer avance\n\nQue souhaitez-vous explorer ensuite ?"
  ),

  // ── SANTE MENTALE ─────────────────────────────────────────────────────────
  mental: {
    message: "Comment vous sentez-vous ?",
    options: [
      { label: "Stresse",  next: "mental_stressed" },
      { label: "Anxieux",  next: "mental_anxious"  },
      { label: "Triste",   next: "mental_sad"      },
    ],
  },
  mental_stressed: {
    message: "De quoi avez-vous besoin ?",
    options: [
      { label: "Relaxation",             next: "men_str_relax"    },
      { label: "Motivation",             next: "men_str_motivate" },
      { label: "Quelqu'un a qui parler", next: "men_str_support"  },
    ],
  },
  men_str_relax: continueNode(
    "PLAN ANTI-STRESS (15 min par jour)\n\nEtape 1 — Respiration en carre (5 min)\nInspirez 4, retenez 4, expirez 4, retenez 4. Repetez 5 fois.\n\nEtape 2 — Relaxation musculaire progressive (5 min)\nCommencez par les orteils. Contractez chaque groupe musculaire 5 secondes, puis relâchez completement. Remontez jusqu'a la tete.\n\nEtape 3 — Marche de recentrage (5 min)\nMarchez lentement. Remarquez 3 choses que vous voyez, 2 que vous entendez, 1 que vous ressentez.\n\nFaites cette routine chaque jour, idealement a la meme heure.\nRecherchez sur YouTube : relaxation guidee stress patients cancer\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  men_str_motivate: continueNode(
    "PLAN DE MOTIVATION QUOTIDIEN\n\nMatin (5 min) :\nNotez 1 chose pour laquelle vous etes reconnaissant et 1 petit objectif pour la journee.\n\nPause de midi (2 min) :\nDites a voix haute : \"Je fais de mon mieux. C'est suffisant.\"\n\nReflexion du soir (5 min) :\nNotez 1 chose que vous avez accomplie aujourd'hui, aussi petite soit-elle.\n\nRecompense hebdomadaire :\nChoisissez quelque chose qui vous apporte de la joie — un repas favori, un film, un appel avec un ami.\n\nRappelez-vous : La force n'est pas l'absence de difficulte. C'est de continuer malgre elle.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  men_str_support: continueNode(
    "COMMENT TROUVER DU SOUTIEN\n\nCette semaine, choisissez 1 de ces actions :\n\n1. Appelez ou ecrivez a quelqu'un en qui vous avez confiance et dites : \"Je traverse une periode difficile. J'aurais besoin de soutien.\"\n\n2. Demandez a votre equipe soignante s'il existe un groupe de soutien en oncologie dans votre region.\n\n3. Prenez un rendez-vous avec un psychologue. De nombreux hopitaux proposent un soutien gratuit.\n\nVous n'avez pas a tout expliquer. Tendre la main est deja un acte de courage.\n\nRecherchez sur YouTube : soutien emotionnel patients cancer seance guidee\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  mental_anxious: {
    message: "De quoi avez-vous besoin ?",
    options: [
      { label: "Relaxation",             next: "men_anx_relax"    },
      { label: "Motivation",             next: "men_anx_motivate" },
      { label: "Quelqu'un a qui parler", next: "men_anx_support"  },
    ],
  },
  men_anx_relax: continueNode(
    "PLAN ANTI-ANXIETE (15 min)\n\nEtape 1 — Ancrage 5-4-3-2-1 (3 min)\nNommez : 5 choses que vous voyez, 4 que vous pouvez toucher, 3 que vous entendez, 2 que vous sentez, 1 que vous goutez.\n\nEtape 2 — Respiration lente (5 min)\nInspirez sur 4 temps, expirez sur 6 temps. Repetez 8 fois. Concentrez-vous uniquement sur la respiration.\n\nEtape 3 — Balayage corporel (7 min)\nAllongez-vous. Fermez les yeux. Respirez. Relâchez la tension a chaque expiration.\n\nUtilisez ceci des que l'anxiete apparait.\nRecherchez sur YouTube : meditation guidee anxiete patients cancer\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  men_anx_motivate: continueNode(
    "PLAN DE GESTION DE L'ANXIETE\n\nMatin :\nNotez votre inquietude, puis ecrivez une reponse realiste et bienveillante.\nExemple — Inquietude : \"Et si mon etat empire ?\" Reponse : \"Je recois des soins et je fais tout ce qui est en mon pouvoir.\"\n\nPendant la journee :\nQuand l'anxiete monte, respirez lentement et dites : \"Ce sentiment va passer. Je suis en securite maintenant.\"\n\nSoir :\nNotez 3 choses qui se sont bien passees aujourd'hui.\n\nHebdomadaire :\nFaites une petite activite agreable : une courte promenade, un film, cuisiner un repas simple.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  men_anx_support: continueNode(
    "TROUVER DU SOUTIEN POUR L'ANXIETE\n\nEtapes pratiques :\n\n1. Parlez de votre anxiete a votre oncologue ou infirmier. Ils peuvent vous orienter vers un professionnel de sante mentale.\n\n2. Essayez une application de pleine conscience gratuite (recherchez : Insight Timer, Calm ou Headspace).\n\n3. Trouvez une communaute en ligne de patients atteints de cancer pour vous connecter avec des personnes qui comprennent.\n\n4. Demandez a un proche de vous accompagner aux rendez-vous — les moments partages reduisent l'anxiete.\n\nL'anxiete pendant le cancer est tres courante. Vous n'etes pas seul. Le soutien existe.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  mental_sad: {
    message: "De quoi avez-vous besoin ?",
    options: [
      { label: "Relaxation",             next: "men_sad_relax"    },
      { label: "Motivation",             next: "men_sad_motivate" },
      { label: "Quelqu'un a qui parler", next: "men_sad_support"  },
    ],
  },
  men_sad_relax: continueNode(
    "PLAN DE RECONFORT POUR LES JOURS DIFFICILES\n\nEtape 1 — Accueillez la sensation (5 min)\nAsseyez-vous tranquillement. Laissez le sentiment exister sans le combattre. Respirez lentement.\n\nEtape 2 — Reconfort chaleureux (10 min)\nPreparez une boisson chaude. Installez-vous dans votre endroit prefere. Mettez de la musique ou du silence.\n\nEtape 3 — Un petit geste d'attention envers vous-meme (5 min)\nFaites une petite chose pour vous : lavez-vous le visage, sortez un instant, appelez quelqu'un.\n\nLa tristesse est une reponse naturelle. Le repos est une forme de guerison.\nRecherchez sur YouTube : meditation bienveillance envers soi cancer\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  men_sad_motivate: continueNode(
    "PLAN D'AFFIRMATIONS ET DE MOTIVATION\n\nLisez l'une de ces affirmations chaque matin :\n\n\"Je suis plus fort que mes epreuves.\"\n\"Je merite attention, repos et bienveillance.\"\n\"Chaque petit pas que je fais est un progres.\"\n\"Je ne suis pas seul dans ce chemin.\"\n\"Aujourd'hui je ferai ce que je peux et me reposerai quand j'en ai besoin.\"\n\nPratique du soir :\nNotez une chose que vous avez faite aujourd'hui avec courage ou effort.\n\nHebdomadaire :\nDites a quelqu'un ce que vous appreciez chez lui. Donner et recevoir de la chaleur fait du bien aux deux.\n\nQue souhaitez-vous explorer ensuite ?"
  ),
  men_sad_support: continueNode(
    "COMMENT DEMANDER DE L'AIDE QUAND ON EST TRISTE\n\nCette semaine, faites l'une de ces demarches :\n\n1. Dites a quelqu'un de proche : \"Je ne me sens pas bien emotionnellement. Ta compagnie ou un simple appel me ferait du bien.\"\n\n2. Contactez le service de psycho-oncologie ou de travail social de votre hopital.\n\n3. Si la tristesse persiste ou est tres intense, parlez-en a votre medecin. Le soutien emotionnel fait partie de votre traitement.\n\n4. Ecrivez une courte lettre a vous-meme sur ce que vous aimeriez qu'on vous dise en ce moment.\n\nVotre bien-etre emotionnel compte. Vous meritez du soutien.\nRecherchez sur YouTube : soutien emotionnel patients cancer seance guidee\n\nQue souhaitez-vous explorer ensuite ?"
  ),
};

/* ─── Bot avatar ──────────────────────────────────────────────────────────── */
function BotAvatar() {
  return (
    <div
      className="rec-av-glow"
      style={{
        width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg,#FFB6C1,#FF8FAB)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 10px rgba(255,143,171,0.4)",
      }}
    >
      <img
        src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
        alt=""
        style={{ width: "18px", height: "18px", objectFit: "contain" }}
      />
    </div>
  );
}

/* ─── Typing indicator ────────────────────────────────────────────────────── */
function TypingBubble() {
  return (
    <div className="rec-fade-up" style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
      <BotAvatar />
      <div style={{
        background: "white",
        borderRadius: "20px 20px 20px 5px",
        padding: "12px 18px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
        border: "1px solid rgba(255,182,193,0.25)",
      }}>
        <div style={{ display: "flex", gap: "5px", alignItems: "center", height: "16px" }}>
          <span className="rec-dot-1" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FFB6C1", display: "inline-block" }} />
          <span className="rec-dot-2" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF8FAB", display: "inline-block" }} />
          <span className="rec-dot-3" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF6B8A", display: "inline-block" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Bot bubble ──────────────────────────────────────────────────────────── */
function BotBubble({ text, options, onOption, isNew }) {
  return (
    <div className={isNew ? "rec-fade-up" : ""} style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
      <BotAvatar />
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Text bubble */}
        <div style={{
          background: "white",
          borderRadius: "20px 20px 20px 5px",
          padding: "13px 17px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
          border: "1px solid rgba(255,182,193,0.2)",
        }}>
          <p style={{ margin: 0, fontSize: "13.5px", color: "#4a5568", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
            {text}
          </p>
        </div>

        {/* Option buttons */}
        {options && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onOption(opt)}
                className="rec-opt-in"
                style={{
                  animationDelay: `${i * 80}ms`,
                  background: "rgba(255,182,193,0.08)",
                  border: "1.5px solid rgba(255,143,171,0.35)",
                  borderRadius: "14px",
                  padding: "9px 15px",
                  textAlign: "left",
                  fontSize: "13px",
                  color: "#c0396b",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,143,171,0.18)";
                  e.currentTarget.style.borderColor = "rgba(255,100,150,0.55)";
                  e.currentTarget.style.transform = "translateX(5px)";
                  e.currentTarget.style.boxShadow = "0 3px 10px rgba(255,143,171,0.2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,182,193,0.08)";
                  e.currentTarget.style.borderColor = "rgba(255,143,171,0.35)";
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{
                  width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#FFB6C1,#FF8FAB)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: "700", color: "white",
                }}>
                  {i + 1}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── User bubble ─────────────────────────────────────────────────────────── */
function UserBubble({ text, isNew }) {
  return (
    <div className={isNew ? "rec-fade-up" : ""} style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{
        background: "linear-gradient(135deg,#FFB6C1,#FF6B8A)",
        borderRadius: "20px 20px 5px 20px",
        padding: "11px 17px",
        maxWidth: "68%",
        boxShadow: "0 4px 16px rgba(255,107,138,0.35)",
      }}>
        <p style={{ margin: 0, fontSize: "13.5px", color: "white", fontWeight: "500", lineHeight: "1.5" }}>
          {text}
        </p>
      </div>
    </div>
  );
}

/* ─── Guided chatbot ──────────────────────────────────────────────────────── */
function GuidedChatbot({ onTopicSelect }) {
  const [messages, setMessages] = useState([
    { id: "init", from: "bot", text: TREE.root.message, options: TREE.root.options, isNew: false },
  ]);
  const [typing, setTyping] = useState(false);
  const idRef = useRef(1);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleOption = (option) => {
    const next = TREE[option.next];
    if (!next || typing) return;

    onTopicSelect(option.label);
    const uid = `u-${idRef.current++}`;
    const bid = `b-${idRef.current++}`;

    setMessages(prev => [...prev, { id: uid, from: "user", text: option.label, isNew: true }]);
    setTyping(true);

    const delay = 1000 + Math.random() * 500;
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [
        ...prev,
        { id: bid, from: "bot", text: next.message, options: next.options, isNew: true },
      ]);
    }, delay);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px 12px", display: "flex", flexDirection: "column", gap: "18px" }}>
      {messages.map((m, i) => {
        const isLastBot = m.from === "bot" && i === messages.length - 1 && !typing;
        return m.from === "user" ? (
          <UserBubble key={m.id} text={m.text} isNew={m.isNew} />
        ) : (
          <BotBubble
            key={m.id}
            text={m.text}
            options={isLastBot ? m.options : null}
            onOption={handleOption}
            isNew={m.isNew}
          />
        );
      })}
      {typing && <TypingBubble />}
      <div ref={bottomRef} />
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function Recommendations() {
  const [recs, setRecs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics]   = useState([]);
  const [chatKey, setChatKey] = useState(0);
  const [showRecs, setShowRecs] = useState(false);

  useEffect(() => {
    api.get("/recommendations").then(({ data }) => setRecs(data)).finally(() => setLoading(false));
  }, []);

  const handleTopicSelect = (topic) => {
    setTopics(prev => prev.includes(topic) ? prev : [...prev, topic]);
  };

  const handleRestart = () => {
    setChatKey(k => k + 1);
    setTopics([]);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <style>{ANIM_STYLES}</style>

      {/* Page wrapper — inherits Rose.png background from App.js */}
      <div style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        gap: "20px",
      }}>

        {/* Title */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{
            margin: 0, fontSize: "24px", fontWeight: "700",
            color: "#be185d",
            letterSpacing: "-0.4px",
          }}>
            Assistant Bien-etre
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#be185d", opacity: 0.75 }}>
            Guide personnalise pour votre sante
          </p>
        </div>

        {/* Chatbot card */}
        <div
          className="rec-float"
          style={{
            width: "100%", maxWidth: "540px", position: "relative", zIndex: 1,
            background: "rgba(255,255,255,0.78)",
            backdropFilter: "blur(32px) saturate(1.5)",
            WebkitBackdropFilter: "blur(32px) saturate(1.5)",
            borderRadius: "28px",
            border: "1px solid rgba(255,255,255,0.55)",
            boxShadow: "0 30px 70px rgba(107,33,168,0.12), 0 10px 30px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Card header */}
          <div style={{
            background: "linear-gradient(135deg,#FFB6C1 0%,#FF8FAB 100%)",
            padding: "16px 20px",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <div className="rec-av-glow" style={{
              width: "42px", height: "42px", borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <img
                src={`${process.env.PUBLIC_URL}/images/ribonTN.png`}
                alt=""
                style={{ width: "24px", height: "24px", objectFit: "contain" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "white" }}>
                Assistant Bien-etre
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                <span style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: "#86efac", display: "inline-block",
                  boxShadow: "0 0 6px rgba(134,239,172,0.8)",
                }} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)" }}>En ligne</span>
              </div>
            </div>

            {/* Session topics badge */}
            {topics.length > 0 && (
              <span style={{
                fontSize: "11px", background: "rgba(255,255,255,0.25)",
                color: "white", borderRadius: "100px", padding: "3px 10px",
                fontWeight: "500", border: "1px solid rgba(255,255,255,0.35)",
              }}>
                {topics.length} sujet{topics.length > 1 ? "s" : ""}
              </span>
            )}

            {/* Restart button */}
            <button
              onClick={handleRestart}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: "11px", padding: "7px 13px",
                fontSize: "12px", color: "white", fontWeight: "500",
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: "5px",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
              title="Recommencer la conversation"
            >
              {/* Refresh icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.7" />
              </svg>
              Recommencer
            </button>
          </div>

          {/* Chat messages area */}
          <div style={{ height: "440px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <GuidedChatbot key={chatKey} onTopicSelect={handleTopicSelect} />
          </div>
        </div>

        {/* Topics explored strip */}
        {topics.length > 0 && (
          <div
            className="rec-fade-up"
            style={{
              width: "100%", maxWidth: "540px", position: "relative", zIndex: 1,
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(28px) saturate(1.4)",
              WebkitBackdropFilter: "blur(28px) saturate(1.4)",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.5)",
              padding: "14px 18px",
              boxShadow: "0 6px 24px rgba(107,33,168,0.08)",
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: "600", color: "#9d4edd", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Sujets explores
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {topics.map((t, i) => (
                <span key={i} style={{
                  fontSize: "12px",
                  background: "rgba(255,182,193,0.12)",
                  color: "#c0396b",
                  border: "1px solid rgba(255,143,171,0.3)",
                  borderRadius: "100px",
                  padding: "4px 13px",
                  fontWeight: "500",
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations toggle */}
        {recs.length > 0 && (
          <div style={{ width: "100%", maxWidth: "540px", position: "relative", zIndex: 1 }}>
            <button
              onClick={() => setShowRecs(v => !v)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.68)",
                backdropFilter: "blur(28px) saturate(1.4)",
                WebkitBackdropFilter: "blur(28px) saturate(1.4)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: "16px",
                padding: "12px 18px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#6b2d5e",
                boxShadow: "0 4px 16px rgba(107,33,168,0.08)",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.88)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.68)"; }}
            >
              <span>Recommandations IA ({recs.length})</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#c0396b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "transform 0.25s", transform: showRecs ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showRecs && (
              <div className="rec-fade-up" style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {recs.map(r => {
                  const p = PRIORITY[r.niveauPriorite] || PRIORITY.modere;
                  return (
                    <div key={r._id} style={{
                      background: "rgba(255,255,255,0.8)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,182,193,0.2)",
                      padding: "14px 16px 14px 20px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", top: 0, left: 0, width: "4px", height: "100%",
                        background: p.bar, borderRadius: "4px 0 0 4px",
                      }} />
                      <span style={{
                        fontSize: "11px", fontWeight: "600",
                        background: p.bar + "22",
                        color: p.bar,
                        borderRadius: "100px", padding: "2px 10px",
                        display: "inline-block", marginBottom: "7px",
                      }}>
                        {p.label}
                      </span>
                      <p style={{ margin: 0, fontSize: "13px", color: "#4a5568", lineHeight: "1.6" }}>
                        {r.contenu}
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                        {new Date(r.dateGeneration).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
