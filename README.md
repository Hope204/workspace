# Thành Danh Workspace

Giao diện frontend quản lý Workspace, kế hoạch và công việc nội bộ, xây bằng Next.js App Router, TypeScript, Tailwind CSS và mock data.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Kiểm tra chất lượng

```bash
npm run lint
npm run build
```

Mock domain nằm trong `src/types`, `src/lib/mock-data`; UI chính nằm ở `src/components/workspace-app.tsx`. Các dependency dnd-kit, React Hook Form/Zod, Recharts, TanStack Query/Table và Zustand đã được cài để mở rộng theo feature/API thật.
