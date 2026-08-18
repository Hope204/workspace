# Thành Danh Workspace

Ứng dụng quản lý Workspace, kế hoạch và công việc nội bộ. Frontend dùng Next.js App Router, TypeScript, Tailwind CSS, Zustand, TanStack và dnd-kit; REST API dùng Drizzle ORM với PostgreSQL Neon.

## Chạy dự án

1. Sao chép `.env.example` thành `.env.local` và đặt chuỗi kết nối Neon vào `DATABASE_URL`.
2. Cài package: `npm install`.
3. Đồng bộ schema database: `npm run db:push`.
4. Chạy môi trường phát triển: `npm run dev`.

Mở `http://localhost:3000`.

## Kiểm tra

```bash
npm run lint
npm run build
```

Mock domain nằm trong `src/types` và `src/lib/mock-data`. API và database nằm trong `src/app/api`, `src/db`, `src/lib/api`. Xem danh sách REST endpoint và quy tắc nghiệp vụ tại [docs/API.md](docs/API.md).
