import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected paths: All routes except /login and auth-related API routes
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth");

  if (!user && !isLoginPage && !isAuthCallback) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    // Check if user is superadmin or matrix_admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_superadmin, is_matrix_admin")
      .eq("id", user.id)
      .single();

    // You can add your email here temporarily to bypass the check
    const isAlwaysAllowed = user.email === 'atl2159@columbia.edu';
    const isAdmin = profile?.is_superadmin || profile?.is_matrix_admin;

    // Add logging to help debug unauthorized access
    if ((profileError || !isAdmin) && !isAlwaysAllowed) {
      console.log(`Unauthorized access attempt:
        User ID: ${user.id}
        Email: ${user.email}
        Profile exists: ${!!profile}
        is_superadmin: ${profile?.is_superadmin}
        is_matrix_admin: ${profile?.is_matrix_admin}
        Error: ${profileError?.message}
      `);
    }

    if (!isAdmin && !isLoginPage && !isAuthCallback && !isAlwaysAllowed) {
      // Not a superadmin, sign out and redirect to login
      // Note: signOut in middleware can be tricky with response objects
      // For now, we redirect to login with an error param
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }
    
    // If they are on the login page but already logged in as superadmin, redirect to home
    if (isLoginPage && (isAdmin || isAlwaysAllowed)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
