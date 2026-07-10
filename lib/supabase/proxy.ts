import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthOnlyRoute, isPublicRoute } from "@/lib/auth";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;
  if (url.includes("your-project") || anonKey.includes("your-anon-key")) {
    return null;
  }

  try {
    new URL(url);
  } catch {
    return null;
  }

  return { url, anonKey };
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

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let supabaseResponse = NextResponse.next({ request });

  const env = getSupabaseEnv();
  if (!env) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/splash", request.url));
    }

    if (!isPublicRoute(pathname)) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
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
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/splash", request.url));
    }

    if (!isPublicRoute(pathname)) {
      return NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    return supabaseResponse;
  }
}
