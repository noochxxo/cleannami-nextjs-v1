import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const userRole = user?.user_metadata?.role;

  // const protectedCustomerRoutesList = [
  //   "/customers",
  //   "/customers/dashboard",
  //   "/customers/*",
  //   "/portal",
  //   "/portal/*"
  // ];

  // const protectedAdminRoutesList = [
  //   "/admin",
  //   "/admin/dashboard",
  //   "/admin/*",
  // ];

  // const isProtectedCustomerRoute = protectedCustomerRoutesList.some(
  //   (route) =>
  //     request.nextUrl.pathname === route ||
  //     request.nextUrl.pathname.startsWith(route + "/")
  // );

  // const isProtectedAdminRoute = protectedAdminRoutesList.some(
  //   (route) =>
  //     request.nextUrl.pathname === route ||
  //     request.nextUrl.pathname.startsWith(route + "/")
  // );

  const pathname = request.nextUrl.pathname;

   const isProtectedCustomerRoute = 
    pathname.startsWith('/customer');

    const isProtectedAdminRoute = pathname.startsWith('/admin');


  const isAdmin = userRole === 'super_admin' || userRole === 'admin';


  // 1. Redirect unauthenticated users from protected customer routes
  if (!user && isProtectedCustomerRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // 2. Redirect unauthenticated users from protected admin routes
  if (!user && isProtectedAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // 3. CRITICAL: Redirect authenticated non-admin users from admin routes
  if (user && isProtectedAdminRoute && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/customer/dashboard";
    return NextResponse.redirect(url);
  }
  // if (isAdmin && !user && isProtectedAdminRoute) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/admin/dashboard";
  //   return NextResponse.redirect(url);
  // }

  // if (!user && isProtectedCustomerRoute  ) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/customers/dashboard";
  //   return NextResponse.redirect(url);
  // }

  // if (!user && isProtectedCustomerRoute ) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/sign-in";
  //   return NextResponse.redirect(url);
  // }

  // if (!user && isProtectedAdminRoute ) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/sign-in";
  //   return NextResponse.redirect(url);
  // }

  

  

  

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}