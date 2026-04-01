-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(10),
    "country_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "state_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_uuid_key" ON "countries"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "states_uuid_key" ON "states"("uuid");

-- CreateIndex
CREATE INDEX "states_country_id_idx" ON "states"("country_id");

-- CreateIndex
CREATE UNIQUE INDEX "states_country_id_name_key" ON "states"("country_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "states_country_id_code_key" ON "states"("country_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "cities_uuid_key" ON "cities"("uuid");

-- CreateIndex
CREATE INDEX "cities_state_id_idx" ON "cities"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "cities_state_id_name_key" ON "cities"("state_id", "name");

-- AddForeignKey
ALTER TABLE "states" ADD CONSTRAINT "states_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clients" ALTER COLUMN "city" DROP NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "state" DROP NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "state" TYPE VARCHAR(10);

ALTER TABLE "clients" ADD COLUMN "state_id" INTEGER;
ALTER TABLE "clients" ADD COLUMN "city_id" INTEGER;

CREATE INDEX "clients_state_id_idx" ON "clients"("state_id");
CREATE INDEX "clients_city_id_idx" ON "clients"("city_id");

ALTER TABLE "clients" ADD CONSTRAINT "clients_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable client_contracts
ALTER TABLE "client_contracts" ALTER COLUMN "state" TYPE VARCHAR(10);

ALTER TABLE "client_contracts" ADD COLUMN "state_id" INTEGER;
ALTER TABLE "client_contracts" ADD COLUMN "city_id" INTEGER;

CREATE INDEX "client_contracts_state_id_idx" ON "client_contracts"("state_id");
CREATE INDEX "client_contracts_city_id_idx" ON "client_contracts"("city_id");

ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
