-- AlterTable
ALTER TABLE "User" ADD COLUMN     "delete_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Battle" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videos" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleItem" (
    "id" UUID NOT NULL,
    "battle_id" UUID NOT NULL,
    "video" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BattleItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleItem" ADD CONSTRAINT "BattleItem_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
