import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSiteVisits1717000000000 implements MigrationInterface {
  name = 'AddSiteVisits1717000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "SiteVisit" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "visitorSessionId" character varying, "path" character varying NOT NULL, "referrer" character varying, "ipAddress" character varying, "city" character varying, "region" character varying, "country" character varying, "userAgent" text, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_SiteVisit" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_SiteVisit_createdAt" ON "SiteVisit" ("createdAt")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_SiteVisit_createdAt"');
    await queryRunner.query('DROP TABLE IF EXISTS "SiteVisit"');
  }
}