import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthOnlyRoute, isPublicRoute } from "@/lib/auth";
import { getSupabaseEnv } from "@/lib/supabase/env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
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

export async function updateSession(request: NextRequest) {
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
