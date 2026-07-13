-- AddIndex: tối ưu query lịch sử budget theo tháng
CREATE INDEX "bud_category_user_id_month_idx" ON "bud_category"("user_id", "month");
CREATE INDEX "sub_bud_category_user_id_month_idx" ON "sub_bud_category"("user_id", "month");
