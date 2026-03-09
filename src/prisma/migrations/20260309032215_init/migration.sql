-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "start_day_month" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_setting" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "user_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" TEXT,
    "formula_hint" TEXT,
    "note" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "icon" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_category" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sample_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_sub_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "sample_sub_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "categoryId" TEXT,
    "sub_categoryId" TEXT,
    "user_id" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bud_category" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,
    "month" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "bud_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_bud_category" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sub_category_id" TEXT NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,
    "month" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "sub_bud_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_setting_user_id_key" ON "user_setting"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bud_category_user_id_category_id_month_key" ON "bud_category"("user_id", "category_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "sub_bud_category_user_id_sub_category_id_month_key" ON "sub_bud_category"("user_id", "sub_category_id", "month");

-- AddForeignKey
ALTER TABLE "user_setting" ADD CONSTRAINT "user_setting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_category" ADD CONSTRAINT "sub_category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_category" ADD CONSTRAINT "sub_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_category" ADD CONSTRAINT "sample_category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sub_categoryId_fkey" FOREIGN KEY ("sub_categoryId") REFERENCES "sub_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bud_category" ADD CONSTRAINT "bud_category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bud_category" ADD CONSTRAINT "bud_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_bud_category" ADD CONSTRAINT "sub_bud_category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_bud_category" ADD CONSTRAINT "sub_bud_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_bud_category" ADD CONSTRAINT "sub_bud_category_sub_category_id_fkey" FOREIGN KEY ("sub_category_id") REFERENCES "sub_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
