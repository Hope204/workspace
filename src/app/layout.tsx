import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter=Inter({variable:"--font-inter",subsets:["latin","vietnamese"]});
export const metadata:Metadata={title:"Thành Danh Workspace",description:"Quản lý kế hoạch và công việc doanh nghiệp"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi" className={inter.variable}><body>{children}</body></html>}
