import { NextResponse } from "next/server";

export function middleware(req) {
  console.log("🔒 SubChat Middleware is running...");

  const { pathname } = req.nextUrl;

  // ⛔ Ignore _next (static files, JS chunks) and RSC prefetches
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api') ||
    req.headers.get('accept')?.includes('text/x-component') // <-- This is for _rsc
  ) {
    console.log("⚡ Skipping middleware for internal/asset requests.");
    return NextResponse.next();
  }

  // ⬇️ Read cookies (token and role)
  const token = req.cookies.get('token')?.value;
  const role = req.cookies.get('role')?.value;

  console.log("🔑 Token:", token ? "[Present]" : "[Missing]");
  console.log("👤 Role:", role ? "[Present]" : "[Missing]");

  if (!token || !role) {
    console.log("❌ No token or role found in cookies, redirecting to /unauthorized");
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  const protectedRoutes = {
    GroupOwner: ["/groupowner"],
    GroupSubscriber: ["/subscriber"],
  };

  let isAuthorized = false;
  for (const [allowedRole, paths] of Object.entries(protectedRoutes)) {
    const isProtected = paths.some(path => pathname.startsWith(path));
    if (isProtected && role === allowedRole) {
      console.log(`✅ Authorized access for ${role} to ${pathname}`);
      isAuthorized = true;
      break;
    }
  }

  if (!isAuthorized) {
    console.log(`⛔ Unauthorized access by ${role} to ${pathname}`);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  console.log("✅ Access granted, proceeding with the request.");
  return NextResponse.next();
}

export const config = {
  matcher: ["/groupowner/:path*", "/subscriber/:path*"],
};
