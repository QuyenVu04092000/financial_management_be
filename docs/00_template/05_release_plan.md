# Production Release Plan: [Tên Feature]

## 1. Pre-Deployment Checklist

- [ ] Merge code vào branch `main`
- [ ] `npm run build` thành công trên CI
- [ ] Review các ENV variable mới
- [ ] Backup DB nếu migration có thay đổi lớn

## 2. Database Migration

> Chạy theo thứ tự sau trên production:

```bash
# 1. Generate Prisma client (không cần nếu đã build)
npx prisma generate

# 2. Chạy migration
npx prisma migrate deploy
```

**Migration files cần deploy:**

| Migration Name | Mô tả thay đổi |
|---|---|
| `[timestamp]_[tên-migration]` | [Mô tả: thêm bảng X, thêm cột Y...] |

**SQL raw nếu có data migration:**

```sql
-- Ví dụ: backfill data cho cột mới
UPDATE "Transaction" SET "newColumn" = 'default_value' WHERE "newColumn" IS NULL;
```

## 3. Environment Variables

> Chỉ ghi key, không ghi value nhạy cảm ở đây.

| Key | Required | Default | Mô tả |
|---|---|---|---|
| `NEW_KEY` | Yes | — | Mô tả mục đích |
| `FEATURE_FLAG_X` | No | `false` | Bật/tắt feature |

## 4. Rollback Plan

Nếu cần rollback:

```bash
# Revert migration cuối cùng
npx prisma migrate resolve --rolled-back [migration-name]
```

> **Lưu ý:** Nếu migration có `DROP COLUMN` hoặc `DROP TABLE` thì không rollback được tự động — cần restore từ backup.
