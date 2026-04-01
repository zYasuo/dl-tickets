-- Drop optional link from client_contracts to users (User stays unrelated to clients/contracts for now).

ALTER TABLE "client_contracts" DROP CONSTRAINT IF EXISTS "client_contracts_user_id_fkey";

DROP INDEX IF EXISTS "client_contracts_user_id_idx";

ALTER TABLE "client_contracts" DROP COLUMN IF EXISTS "user_id";
