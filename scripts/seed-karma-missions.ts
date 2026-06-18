import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function run() {
  const missions = [
    {
      slug: "premier-journal",
      title: "Premier Journal",
      description: "Écris ta première entrée dans le journal du cycle",
      tokens_reward: 50,
      graines_reward: 0,
      type: "solo",
      max_completions: 1,
    },
    {
      slug: "7-jours-streak",
      title: "7 Jours de Suite",
      description: "Enregistre ton cycle 7 jours consécutifs",
      tokens_reward: 100,
      graines_reward: 0,
      type: "solo",
      max_completions: 1,
    },
    {
      slug: "30-jours-streak",
      title: "30 Jours de Constance",
      description: "Enregistre ton cycle 30 jours consécutifs",
      tokens_reward: 300,
      graines_reward: 2,
      type: "solo",
      max_completions: 1,
    },
    {
      slug: "premier-luna",
      title: "Premier Dialogue LUNA",
      description: "Lance ta première conversation avec LUNA",
      tokens_reward: 30,
      graines_reward: 0,
      type: "solo",
      max_completions: 1,
    },
    {
      slug: "premier-aurora",
      title: "Première Session AURORA",
      description: "Complète ta première session AURORA OMEGA",
      tokens_reward: 75,
      graines_reward: 0,
      type: "solo",
      max_completions: 1,
    },
    {
      slug: "premier-cercle",
      title: "Premier Cercle",
      description: "Rejoins ton premier Cercle d'Intention",
      tokens_reward: 50,
      graines_reward: 0,
      type: "solo",
      max_completions: 1,
    },
    {
      slug: "parrainage-1",
      title: "Première Filleule",
      description: "Invite une amie et convertis-la en membre VITAE",
      tokens_reward: 200,
      graines_reward: 1,
      type: "solo",
      max_completions: 5,
    },
    {
      slug: "don-solidaire",
      title: "Don Solidaire",
      description: "Effectue un don à l'association PURAMA",
      tokens_reward: 150,
      graines_reward: 1,
      type: "civique",
      max_completions: 3,
    },
    {
      slug: "partage-communaute",
      title: "Partage Communautaire",
      description: "Partage un témoignage dans la Communauté Sacrée",
      tokens_reward: 25,
      graines_reward: 0,
      type: "communautaire",
      max_completions: 10,
    },
    {
      slug: "vote-rituel",
      title: "Vote Rituel",
      description: "Vote pour le rituel hebdomadaire de la communauté",
      tokens_reward: 15,
      graines_reward: 0,
      type: "communautaire",
      max_completions: 52,
    },
    {
      slug: "profil-complet",
      title: "Profil Complet",
      description: "Complète ton profil KAÏA (prénom + photo)",
      tokens_reward: 40,
      graines_reward: 0,
      type: "solo",
      max_completions: 1,
    },
    {
      slug: "abonnement-vitae",
      title: "Membre VITAE",
      description: "Active ton abonnement VITAE ÉTOILE ou supérieur",
      tokens_reward: 100,
      graines_reward: 0,
      type: "solo",
      max_completions: 1,
    },
  ];

  const result = await sql`
    INSERT INTO kaia.missions ${sql(
      missions,
      "slug",
      "title",
      "description",
      "tokens_reward",
      "graines_reward",
      "type",
      "max_completions"
    )}
    ON CONFLICT (slug) DO NOTHING
    RETURNING slug
  `;

  console.log(`✅ Seeded ${result.length} missions into kaia.missions`);

  await sql.end();
}

run().catch(console.error);
