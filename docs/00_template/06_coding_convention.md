# Coding Convention — Dino Financial BE (NestJS)

## 1. Request Lifecycle

```
Client
  → JwtAuthGuard (global, APP_GUARD)
  → ThrottlerGuard
  → Controller (parse request, lấy userId từ req.user.id)
  → Service (business logic, validation nghiệp vụ)
  → Repository (Prisma queries — không bao giờ gọi PrismaService trực tiếp trong Service)
  → Prisma → PostgreSQL
```

## 2. Module Structure Bắt buộc

```
src/modules/<feature>/
  controllers/<feature>.controller.ts   ← HTTP layer
  controllers/index.ts
  services/<feature>.service.ts         ← Business logic
  services/index.ts
  repositories/<feature>.repository.ts  ← Prisma queries
  repositories/index.ts
  <feature>.module.ts
```

DTOs đặt tại `src/common/dto/<feature>/<feature>.dto.ts`, export qua `src/common/dto/index.ts`.

## 3. Coding Patterns Bắt Buộc

---

### 3.1 Lấy userId — luôn từ JWT payload

```typescript
// ✅ ĐÚNG
@Get()
async getItems(@Req() req: any) {
  const userId = req.user.id;
  return new NormalResponseDto(await this.service.getItems(userId));
}

// ❌ SAI — không tin userId từ request body/query
async getItems(@Query('userId') userId: string) { ... }
```

---

### 3.2 Response — luôn wrap trong NormalResponseDto

```typescript
// ✅ ĐÚNG
return new NormalResponseDto(await this.service.create(data, userId));

// ❌ SAI
return await this.service.create(data, userId);
```

---

### 3.3 Repository — filter userId bắt buộc trên mọi query

```typescript
// ✅ ĐÚNG — user chỉ thấy data của mình
async getById(id: string, userId: string) {
  const item = await this.prisma.item.findFirst({
    where: { id, userId },
  });
  if (!item) throw new NotFoundException('Item not found');
  return item;
}

// ❌ SAI — bỏ sót userId filter, user A có thể đọc data user B
async getById(id: string) {
  return this.prisma.item.findUnique({ where: { id } });
}
```

---

### 3.4 Transaction (multi-write) — dùng PrismaUnitOfWorkService

```typescript
// ✅ ĐÚNG — khi có nhiều write cần atomic
return await this.prismaUnitOfWorkService.executeInTransaction(async (prisma) => {
  const transaction = await this.transactionRepository.create(prisma, data);
  await prisma.user.update({
    where: { id: userId },
    data: { balance: { increment: delta } },
  });
  return new TransactionResponseDto(transaction);
});

// ❌ SAI — gọi 2 write riêng lẻ, nếu write 2 fail thì data bị inconsistent
await this.transactionRepository.create(data);
await this.userRepository.updateBalance(userId, delta);
```

---

### 3.5 Response DTO — mapping trong constructor

```typescript
// ✅ ĐÚNG — Service trả về DTO, không trả raw Prisma object
export class TransactionResponseDto {
  id: string;
  amount: number;

  constructor(transaction: Transaction) {
    this.id = transaction.id;
    this.amount = Number(transaction.amount); // Decimal → number
  }
}

// ❌ SAI — trả thẳng Prisma object, lộ internal fields
return await this.repository.create(data);
```

---

### 3.6 Decimal Amount — luôn convert sang number khi output

```typescript
// ✅ ĐÚNG
this.amount = Number(transaction.amount);

// ❌ SAI — Prisma Decimal không serialize đúng thành JSON number
this.amount = transaction.amount;
```

---

### 3.7 Validation DTO — dùng class-validator

```typescript
// ✅ ĐÚNG
export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
```

---

### 3.8 Public routes — dùng decorator @Public()

```typescript
// ✅ ĐÚNG — import từ đúng path
import { Public } from '../../../modules/auth/decorators/auth.decorator';

@Public()
@Get('health')
async healthCheck() { ... }
```

---

### 3.9 Cross-module Service — export và import qua module

```typescript
// ✅ ĐÚNG — SubCategoryModule export SubCategoryRepository
@Module({
  providers: [SubCategoryRepository],
  exports: [SubCategoryRepository],
})
export class SubCategoryModule {}

// TransactionModule import SubCategoryModule để dùng SubCategoryRepository
@Module({
  imports: [PrismaModule, SubCategoryModule],
  providers: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
```

---

### 3.10 Error Handling — throw đúng HTTP exception

```typescript
// NotFoundException — khi record không tồn tại
throw new NotFoundException('Transaction not found');

// BadRequestException — khi input hợp lệ về cú pháp nhưng sai nghiệp vụ
throw new BadRequestException('Cannot delete transaction from a closed period');

// Không throw Error thuần — HttpExceptionFilter chỉ format HttpException
```

---

## 4. Prisma Schema Rules

```prisma
model ExampleModel {
  id        String   @id @default(uuid())    // UUID, không dùng autoincrement
  userId    String                            // Bắt buộc với user-owned data
  amount    Decimal  @db.Decimal(18, 2)      // Tài chính dùng Decimal, không Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])                           // Index userId cho performance
}
```

Sau khi sửa schema: `npx prisma migrate dev` → `npx prisma generate`.

---

## 5. File Naming Convention

| Loại file | Convention | Ví dụ |
|---|---|---|
| Controller | `<feature>.controller.ts` | `transaction.controller.ts` |
| Service | `<feature>.service.ts` | `transaction.service.ts` |
| Repository | `<feature>.repository.ts` | `transaction.repository.ts` |
| Module | `<feature>.module.ts` | `transaction.module.ts` |
| DTO | `<feature>.dto.ts` | `transaction.dto.ts` |
| Barrel | `index.ts` | export tất cả từ folder |
