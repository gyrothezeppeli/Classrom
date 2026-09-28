// app/api/debug/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL 
      ? process.env.DATABASE_URL.substring(0, 40) 
      : 'NO EXISTE',
    hasDatabaseUrlUnpooled: !!process.env.DATABASE_URL_UNPOOLED,
    databaseUrlUnpooledPrefix: process.env.DATABASE_URL_UNPOOLED 
      ? process.env.DATABASE_URL_UNPOOLED.substring(0, 40) 
      : 'NO EXISTE',
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NO EXISTE',
    nodeEnv: process.env.NODE_ENV,
  });
}