import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/splash",
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
  "/terms",
  "/about",
  "/feed",
  "/articles",
] as const;

const AUTH_ONLY_ROUTES = [
  "/splash",
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
] as const;

function matchesRoute(pathname: string, routes: readonly string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isPublicRoute(pathname: string) {
  return matchesRoute(pathname, PUBLIC_ROUTES) || pathname.startsWith("/auth/");
}

function isAuthOnlyRoute(pathname: string) {
  return matchesRoute(pathname, AUTH_ONLY_ROUTES);
}

function isPlaceholder(value: string) {
  const lower = value.toLowerCase();
  return (
    lower.includes("your-project") ||
    lower.includes("your-anon-key") ||
    lower.includes("your-service-role-key") ||
    lower.includes("xxxx") ||
    lower.startsWith("your-")
  );
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publicKey || isPlaceholder(url) || isPlaceholder(publicKey)) {
    return null;
  }

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, publicKey };
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

function fallbackResponse(request: NextRequest, pathname: string) {
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/splash", request.url));
  }

  if (!isPublicRoute(pathname)) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  return NextResponse.next({ request });
}

function redirectWithCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
  searchParams?: Record<string, string>
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  const response = NextResponse.redirect(url);
  copyCookies(supabaseResponse, response);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let supabaseResponse = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) {
    return fallbackResponse(request, pathname);
  }

  try {
    const supabase = createServerClient(env.url, env.publicKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (pathname === "/") {
      return redirectWithCookies(
        request,
        supabaseResponse,
        user ? "/feed" : "/splash"
      );
    }

    if (!user && !isPublicRoute(pathname)) {
      return redirectWithCookies(request, supabaseResponse, "/login", {
        next: pathname,
      });
    }

    if (user && isAuthOnlyRoute(pathname)) {
      return redirectWithCookies(request, supabaseResponse, "/feed");
    }

    return supabaseResponse;
  } catch {
    return fallbackResponse(request, pathname);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
