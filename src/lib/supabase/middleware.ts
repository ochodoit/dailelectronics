import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 중요: createServerClient와 getUser() 사이에 코드 작성 금지
  const { data: { user } } = await supabase.auth.getUser()

  // 비로그인 사용자 리다이렉트 (랜딩, 로그인, 회원가입 페이지만 허용)
  const publicPaths = ['/', '/login', '/signup', '/unauthorized']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

  // API routes and auth callbacks should be allowed
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isPublicPath && !isApiRoute && !isAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인한 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // 권한 체크(is_active, is_admin)는 각 페이지에서 수행
  // 미들웨어에서는 로그인 여부만 체크하여 타임아웃 방지

  return supabaseResponse
}