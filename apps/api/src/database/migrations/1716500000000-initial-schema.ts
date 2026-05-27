import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716500000000 implements MigrationInterface {
  name = 'InitialSchema1716500000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(`CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN')`);
    await queryRunner.query(`CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED')`);
    await queryRunner.query(`CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED')`);
    await queryRunner.query(`CREATE TABLE "User" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying, "role" "Role" NOT NULL DEFAULT 'USER', "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_User_email" UNIQUE ("email"), CONSTRAINT "PK_User" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "Address" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL, "label" character varying NOT NULL DEFAULT 'Principal', "receiver" character varying NOT NULL, "line1" character varying NOT NULL, "line2" character varying, "city" character varying NOT NULL, "region" character varying NOT NULL, "country" character varying NOT NULL DEFAULT 'CO', "phone" character varying NOT NULL, "postalCode" character varying, "isDefault" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_Address" PRIMARY KEY ("id"), CONSTRAINT "FK_Address_User" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE TABLE "Product" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "ingredients" text NOT NULL, "category" character varying NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT 0, "weightGrams" integer NOT NULL, "imageUrl" character varying NOT NULL, "featured" boolean NOT NULL DEFAULT false, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_Product_slug" UNIQUE ("slug"), CONSTRAINT "PK_Product" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "Order" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "reference" character varying NOT NULL, "trackingCode" character varying NOT NULL, "userId" uuid NOT NULL, "subtotal" integer NOT NULL, "shippingCost" integer NOT NULL, "total" integer NOT NULL, "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT', "addressSnapshot" jsonb NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_Order_reference" UNIQUE ("reference"), CONSTRAINT "UQ_Order_trackingCode" UNIQUE ("trackingCode"), CONSTRAINT "PK_Order" PRIMARY KEY ("id"), CONSTRAINT "FK_Order_User" FOREIGN KEY ("userId") REFERENCES "User"("id"))`);
    await queryRunner.query(`CREATE TABLE "OrderItem" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "orderId" uuid NOT NULL, "productId" uuid NOT NULL, "name" character varying NOT NULL, "unitPrice" integer NOT NULL, "quantity" integer NOT NULL, "subtotal" integer NOT NULL, CONSTRAINT "PK_OrderItem" PRIMARY KEY ("id"), CONSTRAINT "FK_OrderItem_Order" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE, CONSTRAINT "FK_OrderItem_Product" FOREIGN KEY ("productId") REFERENCES "Product"("id"))`);
    await queryRunner.query(`CREATE TABLE "Payment" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "orderId" uuid NOT NULL, "reference" character varying NOT NULL, "provider" character varying NOT NULL DEFAULT 'WOMPI', "providerTransactionId" character varying, "amountInCents" integer NOT NULL, "currency" character varying NOT NULL DEFAULT 'COP', "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING', "response" jsonb, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "UQ_Payment_reference" UNIQUE ("reference"), CONSTRAINT "UQ_Payment_providerTransactionId" UNIQUE ("providerTransactionId"), CONSTRAINT "PK_Payment" PRIMARY KEY ("id"), CONSTRAINT "FK_Payment_Order" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE TABLE "ShipmentEvent" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "orderId" uuid NOT NULL, "status" "OrderStatus" NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "location" character varying, "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_ShipmentEvent" PRIMARY KEY ("id"), CONSTRAINT "FK_ShipmentEvent_Order" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE TABLE "ContactMessage" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "subject" character varying NOT NULL, "message" text NOT NULL, "attended" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_ContactMessage" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "ChatSession" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid, "visitorId" character varying, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_ChatSession" PRIMARY KEY ("id"), CONSTRAINT "FK_ChatSession_User" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL)`);
    await queryRunner.query(`CREATE TABLE "ChatMessage" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sessionId" uuid NOT NULL, "role" character varying NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT "PK_ChatMessage" PRIMARY KEY ("id"), CONSTRAINT "FK_ChatMessage_Session" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE)`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "ChatMessage"');
    await queryRunner.query('DROP TABLE IF EXISTS "ChatSession"');
    await queryRunner.query('DROP TABLE IF EXISTS "ContactMessage"');
    await queryRunner.query('DROP TABLE IF EXISTS "ShipmentEvent"');
    await queryRunner.query('DROP TABLE IF EXISTS "Payment"');
    await queryRunner.query('DROP TABLE IF EXISTS "OrderItem"');
    await queryRunner.query('DROP TABLE IF EXISTS "Order"');
    await queryRunner.query('DROP TABLE IF EXISTS "Product"');
    await queryRunner.query('DROP TABLE IF EXISTS "Address"');
    await queryRunner.query('DROP TABLE IF EXISTS "User"');
    await queryRunner.query('DROP TYPE IF EXISTS "PaymentStatus"');
    await queryRunner.query('DROP TYPE IF EXISTS "OrderStatus"');
    await queryRunner.query('DROP TYPE IF EXISTS "Role"');
  }
}
