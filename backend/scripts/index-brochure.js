/**
 * One-shot script — index brochure_cancer.pdf into the RAG knowledge base.
 * Run from /backend:  node scripts/index-brochure.js
 */

const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1"]);

require("dotenv").config();
const mongoose    = require("mongoose");
const RAGService  = require("../services/RAGService");
const MedicalChunk = require("../models/MedicalChunk");

// Full text extracted from brochure_cancer.pdf (Fondation ARC, Oct 2023)
const BROCHURE_TEXT = `
Qu'est-ce qu'un cancer?

Première cause de mortalité en France, les cancers se développent à partir de cellules anormales qui se multiplient de manière incontrôlée au détriment de l'organisme. La mutation de certains gènes est à l'origine de leur apparition.

Chaque individu est constitué d'environ 50000 milliards de cellules organisées en sous-ensembles structurés pour assurer une fonction, appelés tissus (tissus conjonctif, épithélial, nerveux, musculaire, adipeux, etc.) qui forment eux-mêmes des organes (coeur, cerveau, poumon, peau, etc.). Au sein de chaque organe, des milliards de cellules assument donc des fonctions très diverses. D'autres se multiplient (par division cellulaire), et certaines meurent, de façon programmée. Cette répartition des tâches et ce renouvellement constant permettent d'assurer le bon fonctionnement de l'organisme.

Une orchestration précise qui se dèregle

Pour que la régulation très fine du processus de division cellulaire soit assurée, les cellules comptent sur la bonne fonctionnalité des protéines qu'elles produisent et qui sont les opératrices de ces processus. En amont, c'est donc l'intégrité des gènes, qui sont les plans de fabrication des protéines, qui est cruciale. Or, sous l'effet du temps, d'agressions extérieures (alcool, tabac, soleil, virus, radiations, etc.), ou encore du fait de prédispositions génétiques, des altérations peuvent survenir sur l'ADN, molécule qui porte l'ensemble du patrimoine génétique. Heureusement, les cellules possèdent des systèmes de réparation qui permettent de repérer et de corriger ces anomalies.

La prédisposition génétique au cancer: Parfois, une mutation affectant un gène impliqué dans le développement des tumeurs est présente dans toutes les cellules d'une personne, dès sa naissance. Dans cette situation, le risque de cancer de cette personne est plus élevé que celui de la population générale. On parle alors de "prédisposition génétique" au cancer. Dans le cancer du sein, elle représente par exemple environ 5% des cas.

En temps normal, lorsque les mutations sont trop importantes ou nombreuses pour être réparées, la cellule s'autodétruit, par apoptose (un mécanisme de mort cellulaire programmée). Mais parfois, ces systèmes de sécurité fonctionnent mal ou ne fonctionnent plus : la cellule continue alors à se multiplier malgré la présence de mutations non réparées.

Quelle est la différence entre une tumeur bénigne et une tumeur maligne? Les tumeurs bénignes n'ont pas la capacité d'envahir d'autres organes. À l'inverse, les cellules cancéreuses ont la capacité d'influencer les cellules de leur environnement, par exemple en stimulant la production de vaisseaux sanguins (néo-angiogenèse). Les cellules cancéreuses peuvent donc donner des métastases. Certaines tumeurs bénignes sont dites précancéreuses et doivent être retirées avant que les cellules ne deviennent malignes.

Les caractéristiques d'une cellule cancéreuse: elles se multiplient activement, sont insensibles aux signaux qui devraient entraîner leur mort ou leur quiescence; elles n'assurent pas les fonctions des cellules normales dont elles dérivent; elles s'accumulent pour former une tumeur; elles sont capables de détourner les ressources locales via la néo-angiogenèse; elles sont capables d'empêcher les défenses immunitaires de l'organisme de les attaquer.

L'évolution d'un cancer au sein de l'organisme: Au fur et à mesure du temps, les cellules cancéreuses continuent à accumuler des anomalies. Elles acquièrent ainsi de nouvelles propriétés, dont certaines leur permettent de faire s'étendre la tumeur, localement puis plus largement. Certaines cellules cancéreuses peuvent devenir mobiles, se détacher de la tumeur et migrer, notamment à travers les systèmes sanguin ou lymphatique, pour former une tumeur secondaire ailleurs dans l'organisme. On parle de métastase. Les décès par cancer sont surtout dus aux dommages causés par les métastases.

Le cancer en chiffres: Le cancer constitue la deuxième cause de décès avec près de 10 millions de morts par an dans le monde. En France, le cancer est la première cause de mortalité prématurée. En 2023, on estime que plus de 433 136 nouveaux cas de cancer seront diagnostiqués dont 245 610 chez les hommes et 187 526 chez les femmes. Chez la femme, le cancer du sein est le plus fréquent (61 214 cas estimés en 2023). La survie nette à cinq ans varie de 4 à 98% selon le type de cancer.

Les facteurs de risque

La transformation d'une cellule normale en une cellule cancéreuse peut être induite par de nombreux facteurs liés aux modes de vie, à l'environnement ou encore à notre patrimoine génétique. On dissocie généralement les facteurs de risque en deux groupes : les facteurs évitables et les facteurs non évitables.

Le tabac: Le tabac est le principal facteur de risque de cancer connu. Il est responsable de plus de 80% des cancers du poumon, de près de 70% des cancers des voies aérodigestives supérieures (bouche, larynx, pharynx, oesophage) et de 35% des cancers de la vessie. Le tabagisme passif en France est lié à près de 1 100 décès par an, dont 150 par cancer du poumon.

La consommation d'alcool: L'excès d'alcool a été responsable de 28 000 nouveaux cas de cancer en France en 2015. Le cancer du sein est le cancer qui paye le plus lourd tribut à l'alcool.

L'alimentation: L'excès de viande rouge (> 500 g par semaine) ou de charcuterie augmente le risque de cancer colorectal. L'excès de sel expose à un sur-risque de cancer de l'estomac. Un apport conséquent en fruits et légumes (au moins cinq par jour) est un facteur protecteur. Des apports en fibres (au moins 25 g par jour) réduisent le risque de cancer du côlon et du rectum.

L'exposition excessive aux ultra-violets (UV): L'exposition aux UV du soleil ou des cabines de bronzage est un facteur de risque bien connu de cancer de la peau. Plus de 80% de ces cancers sont liés à des expositions excessives aux UV.

La sédentarité, l'absence d'activité physique, le surpoids et l'obésité: Tous ces facteurs sont associés à une augmentation du risque de développer certains cancers. La sédentarité aurait été responsable de près de 3 000 nouveaux cas de cancers chez l'adulte pour l'année 2015 en France. Une activité physique suffisante et régulière (30 minutes d'activité physique dynamique par jour) est associée à une diminution du risque de cancer du côlon, du sein et de l'endomètre.

Les agents infectieux: Les papillomavirus humains (HPV) sont associés au développement de cancers de la zone ano-génitale. Environ 70% des cancers du col de l'utérus sont attribuables à deux papillomavirus humains (HPV 16, HPV 18). Les virus des hépatites B et C sont responsables de 70 à 80% des cancers du foie. La bactérie Helicobacter pylori est responsable d'au moins 80% des cancers de l'estomac.

Risques héréditaires: Il existe des mutations génétiques transmissibles au sein des familles qui augmentent le risque de développer certains cancers. Chez une femme porteuse d'une mutation sur le gène BRCA1 ou du BRCA2, le risque de cancer du sein est élevé, variant de 40% à 80% au cours de la vie selon le type de mutation, contre environ 10% en population générale. Environ 5% des cancers auraient une origine héréditaire.

La prévention des cancers

Modifier certaines habitudes et éviter certaines expositions permet de réduire le risque de développer un cancer. Aujourd'hui on estime que 40% des cancers pourraient être évités par une prévention optimale des expositions à risque.

Tabac: Il peut être bénéfique de se faire accompagner par un professionnel de santé pour arrêter de fumer. Les substituts nicotiniques et le nombre de tentatives augmentent les chances de réussite.

Alcool: Les autorités sanitaires recommandent de ne pas boire plus de deux verres d'alcool par jour et pas plus de 10 verres par semaine, et d'avoir des jours dans la semaine sans consommation.

Activité physique: Il est conseillé de pratiquer au moins 30 minutes d'activité physique chaque jour d'intensité modérée telle que la marche rapide.

Alimentation: Les recommandations du Plan National Nutrition Santé (PNNS) promeuvent une alimentation saine: consommer au moins cinq fruits et légumes variés par jour, des aliments riches en fibres, limiter la consommation de viande rouge à moins de 500 g par semaine, limiter la consommation de charcuterie et de sel.

Soleil et UV: Il est recommandé de se protéger du soleil et des UV en utilisant une protection solaire, en se couvrant le corps et en cherchant l'ombre pendant les heures les plus chaudes.

La vaccination: La vaccination contre le virus de l'hépatite B (VHB) protège contre le cancer du foie. La vaccination contre le papillomavirus humain (HPV) réduit les risques de cancer de la sphère génitale ou orale. Le vaccin HPV est recommandé chez les filles et les garçons âgés de 11 à 14 ans.

Le dépistage des cancers

Le dépistage permet de détecter les cancers au plus tôt, afin de les prendre en charge le plus efficacement possible.

Dépistage du cancer du sein: Un examen clinique des seins (palpation) par un professionnel de santé est recommandé tous les ans dès l'âge de 25 ans. Un programme national de dépistage organisé invite les femmes âgées de 50 à 74 ans à une mammographie tous les deux ans.

Dépistage des cancers colorectaux: S'il est détecté tôt, le cancer colorectal se guérit dans neuf cas sur dix. Chez les personnes sans antécédents familiaux âgées de 50 à 74 ans, un test immunologique rapide est à faire chez soi tous les deux ans.

Dépistage des cancers du col de l'utérus: Un programme national de dépistage organisé existe depuis 2018 pour les femmes de 25 à 65 ans. Entre 25 et 29 ans, un frottis est recommandé tous les 3 ans. À partir de 30 ans et jusqu'à 65 ans, le test HPV est recommandé tous les cinq ans.

Signes à ne pas négliger: fatigue ou douleur persistante, amaigrissement prolongé sans raison; sang dans les selles, constipation ou alternance constipation-diarrhée; saignements vaginaux; sang dans l'urine; enrouement persistant, toux persistante; apparition d'une grosseur, rougeur, modification de la forme d'un sein, écoulement coloré par le mamelon; apparition d'un ganglion; nævus qui évolue, plaie ou tache sur la peau qui ne guérit pas.

Le diagnostic

Le diagnostic d'un cancer nécessite la réalisation de plusieurs examens cliniques, biologiques et d'imagerie. Les examens de diagnostic ont pour objectif de confirmer la présence de la maladie chez un patient présentant des symptômes évocateurs ou un résultat positif à un test de dépistage.

L'examen clinique: Le médecin examine le patient, mesure son pouls, sa tension, écoute sa respiration. Un examen spécifique de la région potentiellement atteinte est aussi conduit.

Les examens biologiques: Un bilan sanguin et/ou urinaire permet de mesurer des paramètres relatifs à l'état de santé général du patient, et de doser d'éventuels marqueurs tumoraux. Le PSA est utile dans le suivi du patient avec cancer de prostate. Le CA125 peut être utile dans le suivi du cancer de l'ovaire.

L'imagerie médicale: La radiographie, l'échographie, le scanner, l'IRM (Imagerie par Résonance Magnétique), la scintigraphie et le PET-scan permettent aux médecins de vérifier la présence d'une tumeur, sa taille, sa forme, son activité métabolique et sa localisation exacte.

Les stades de la maladie: Les tumeurs malignes sont classées en fonction de leur stade d'évolution grâce au système TNM. Ce système prend en compte l'évolution locale et la taille (T) de la tumeur, son extension aux ganglions lymphatiques voisins (N) et son éventuelle dissémination sous forme de métastases (M).

Les biopsies: La biopsie est un examen incontournable lors d'un diagnostic de cancer. Elle seule permet de confirmer le diagnostic et de préciser la nature de la lésion cancéreuse. La biopsie consiste à prélever un échantillon de tissu suspect pour l'examiner par microscopie.

Les tests moléculaires: Ils visent à identifier d'éventuelles anomalies génétiques dans les tumeurs des patients pour orienter la stratégie de traitement. On recherche systématiquement pour le cancer du sein une amplification de HER2/neu (traitement par trastuzumab).

Les traitements et soins de support

La chirurgie: Le traitement des cancers par chirurgie consiste à retirer la tumeur. Elle est utilisée dans environ 80% des cas et reste donc le principal traitement du cancer. La détection précoce de nombreux cancers permet des interventions moins invasives sur de plus petites tumeurs.

La radiothérapie: La radiothérapie repose sur l'utilisation de rayons ionisants dont la forte énergie permet de détruire les cellules cancéreuses. La radiothérapie, seule ou en association avec la chimiothérapie, est généralement à visée curative.

La chimiothérapie: La chimiothérapie passe par l'administration de médicaments dits "cytotoxiques" qui vont détruire les cellules tumorales. Les chimiothérapies sont souvent redoutées en raison de leurs effets secondaires (chute des cheveux, nausées, vomissements, baisse du nombre de cellules sanguines). En effet, les médicaments de chimiothérapie s'attaquent non seulement aux cellules tumorales mais aussi aux cellules saines.

Les thérapies ciblées: Les thérapies ciblées constituent une autre famille de traitements du cancer. En ciblant spécifiquement certaines molécules de l'organisme, elles bloquent des mécanismes qui sont indispensables à la prolifération des cellules cancéreuses. Dans les cancers du sein surexprimant le récepteur HER2, le pronostic de la maladie a été significativement amélioré par la découverte du trastuzumab. Il existe une cinquantaine de molécules de thérapies ciblées, indiquées dans le traitement de près de 20 cancers.

L'hormonothérapie: La croissance de certains cancers est favorisée par les hormones sexuelles produites par l'organisme. Certaines tumeurs du sein ou de l'utérus croissent sous l'action des oestrogènes ou de la progestérone. Les médicaments d'hormonothérapie bloquent la synthèse de ces hormones ou empêchent leur fixation aux récepteurs.

L'immunothérapie: L'immunothérapie regroupe un ensemble de stratégies visant à mobiliser ou à renforcer les défenses immunitaires des patients de manière à ce qu'elles s'attaquent aux cellules tumorales. Les résultats obtenus dans plusieurs types de cancers, en particulier dans les mélanomes ou les cancers du poumon, sont majeurs. Les cellules CAR-T consistent à modifier génétiquement des cellules immunitaires du malade pour les armer contre la tumeur.

La greffe: La greffe de moelle osseuse est utilisée pour le traitement de leucémies et de lymphomes. En cas d'autogreffe, le patient reçoit ses propres cellules souches hématopoïétiques préalablement prélevées. En cas d'allogreffe, il reçoit des cellules souches issues d'un donneur compatible.

Les soins de support: En complément des traitements destinés à combattre le cancer, les soins de support ont pour but de limiter les effets secondaires des traitements et la douleur associée à la maladie. Ils comprennent: la kinésithérapie, l'ergothérapie, la prise en charge nutritionnelle, le soutien psychologique, l'assistance sociale.

Les soins palliatifs: Les soins palliatifs sont destinés à assurer aux patients la meilleure qualité de vie possible lorsque les options thérapeutiques disponibles ne sont plus efficaces ou raisonnables à utiliser.

Le suivi après la guérison: À l'issue du traitement, une phase de surveillance se met alors en place pour plusieurs années. Elle permet de faire le point, à intervalles réguliers, et de surveiller notamment le risque de rechute. Pour de nombreuses maladies cancéreuses, les médecins parlent de guérison lorsqu'aucun signe de rechute n'a été observé pendant la période de suivi.

La recherche en cancérologie

La recherche fondamentale en cancérologie vise à comprendre l'ensemble des mécanismes impliqués dans la naissance et la croissance des tumeurs. La recherche a permis d'importants progrès en matière de prévention et de traitement des cancers, ainsi qu'une diminution de la mortalité associée au cancer.

La recherche clinique cherche à évaluer la sécurité et l'efficacité de nouveaux traitements ou de nouvelles méthodes diagnostiques. Quatre phases d'essais cliniques: phase 1 (tolérance et effets secondaires), phase 2 (dosage et protocole), phase 3 (comparaison à traitement de référence), phase 4 (pharmacovigilance après mise sur marché).

La recherche translationnelle permet d'accélérer les progrès thérapeutiques en rapprochant les acteurs de la recherche fondamentale et ceux de la recherche clinique.

Enjeux de la recherche: comprendre le microenvironnement tumoral, étudier les cellules souches cancéreuses (impliquées dans les résistances aux traitements, dans les récidives et dans la survenue de métastases), améliorer le dépistage, développer de nouvelles solutions thérapeutiques, perfectionner les techniques de chirurgie et de radiothérapie, prédire la réponse aux traitements, améliorer la qualité de vie et le suivi à long terme.

Les ADconjugués (Antibody Drug Conjugates): Des anticorps spécifiques d'antigènes tumoraux peuvent être utilisés comme vecteurs afin de diriger une chimiothérapie au sein de la tumeur. Plusieurs médicaments de ce type sont déjà commercialisés dans le traitement de lymphomes hodgkiniens ou encore dans des cancers du sein HER2.

Contacts utiles: Institut national du cancer (INCa) - www.e-cancer.fr - 0 805 123 124. La Ligue contre le cancer - www.ligue-cancer.net. Les centres de lutte contre le cancer - www.unicancer.fr.
`;

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  const SOURCE_FILE = "brochure_cancer.pdf";
  const SOURCE_ID   = "brochure-cancer-fondation-arc-2023";

  // Remove any previous version of this document
  const deleted = await MedicalChunk.deleteMany({ sourceId: SOURCE_ID });
  if (deleted.deletedCount > 0) console.log(`Removed ${deleted.deletedCount} old chunks`);

  // Chunk the text
  const chunks = RAGService.chunkText(BROCHURE_TEXT.trim());
  console.log(`Text split into ${chunks.length} chunks`);

  // Embed and store (batched 5 at a time)
  const count = await RAGService.storeChunks(chunks, SOURCE_FILE, SOURCE_ID, null);
  console.log(`✅  Indexed ${count} chunks from "${SOURCE_FILE}"`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Indexing failed:", err.message);
  process.exit(1);
});
