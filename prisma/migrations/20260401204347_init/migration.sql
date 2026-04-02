-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ETUDIANT', 'ENSEIGNANT', 'AGENT', 'ADMIN', 'CHEF_DEPARTEMENT');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('ADMINISTRATIF', 'TECHNICIEN', 'RESPONSABLE_LABO', 'BIBLIOTHECAIRE', 'AUTRE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FORUM_MENTION', 'FORUM_MESSAGE', 'COURS_NOUVEAU', 'ACTUALITE', 'EMPLOI_MODIFIE', 'SURVEILLANCE');

-- CreateEnum
CREATE TYPE "ForumTopicStatus" AS ENUM ('ACTIF', 'FERME', 'ARCHIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "agentType" "AgentType",
    "photo" TEXT,
    "telephone" TEXT,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "specialite" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groupes_etudiants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupes_etudiants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cours" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "matiere" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "anneeUniversitaire" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cours_enseignants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "heuresParSemaine" DOUBLE PRECISION,

    CONSTRAINT "cours_enseignants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplois_du_temps" (
    "id" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "jour" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "semaine" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emplois_du_temps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supports_cours" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "fichierUrl" TEXT NOT NULL,
    "typeFichier" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supports_cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actualites" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publiePar" TEXT NOT NULL,
    "cible" TEXT,
    "datePublication" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateExpiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actualites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_topics" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "ForumTopicStatus" NOT NULL DEFAULT 'ACTIF',
    "estPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_participations" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastRead" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "data" JSONB,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveillances" (
    "id" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT NOT NULL,
    "matiere" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveillances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presentations_pfe" (
    "id" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "etudiantId" TEXT NOT NULL,
    "encadreurId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presentations_pfe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presentations_jury" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "presentations_jury_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "groupes_nom_key" ON "groupes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "groupes_etudiants_userId_groupeId_key" ON "groupes_etudiants"("userId", "groupeId");

-- CreateIndex
CREATE UNIQUE INDEX "cours_enseignants_userId_coursId_key" ON "cours_enseignants"("userId", "coursId");

-- CreateIndex
CREATE UNIQUE INDEX "topic_participations_topicId_userId_key" ON "topic_participations"("topicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "presentations_jury_presentationId_enseignantId_key" ON "presentations_jury"("presentationId", "enseignantId");

-- AddForeignKey
ALTER TABLE "groupes_etudiants" ADD CONSTRAINT "groupes_etudiants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groupes_etudiants" ADD CONSTRAINT "groupes_etudiants_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours_enseignants" ADD CONSTRAINT "cours_enseignants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours_enseignants" ADD CONSTRAINT "cours_enseignants_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "groupes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supports_cours" ADD CONSTRAINT "supports_cours_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_participations" ADD CONSTRAINT "topic_participations_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forum_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_participations" ADD CONSTRAINT "topic_participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forum_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveillances" ADD CONSTRAINT "surveillances_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations_pfe" ADD CONSTRAINT "presentations_pfe_etudiantId_fkey" FOREIGN KEY ("etudiantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations_pfe" ADD CONSTRAINT "presentations_pfe_encadreurId_fkey" FOREIGN KEY ("encadreurId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations_jury" ADD CONSTRAINT "presentations_jury_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "presentations_pfe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presentations_jury" ADD CONSTRAINT "presentations_jury_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
