-- CreateEnum
CREATE TYPE "ClientContractStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(11),
    "cnpj" VARCHAR(14),
    "street" VARCHAR(255) NOT NULL,
    "address_number" VARCHAR(20) NOT NULL,
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "zip_code" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_contracts" (
    "id" SERIAL NOT NULL,
    "uuid" VARCHAR(36) NOT NULL,
    "contract_number" VARCHAR(100) NOT NULL,
    "client_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "use_client_address" BOOLEAN NOT NULL DEFAULT true,
    "street" VARCHAR(255),
    "address_number" VARCHAR(20),
    "complement" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(8),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "ClientContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_uuid_key" ON "clients"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "clients_cpf_key" ON "clients"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "clients_cnpj_key" ON "clients"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "client_contracts_uuid_key" ON "client_contracts"("uuid");

-- CreateIndex
CREATE INDEX "client_contracts_client_id_idx" ON "client_contracts"("client_id");

-- CreateIndex
CREATE INDEX "client_contracts_user_id_idx" ON "client_contracts"("user_id");

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_contracts" ADD CONSTRAINT "client_contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
