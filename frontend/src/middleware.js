import { NextResponse } from "next/server";

export function middleware(req) {
  console.log("🔒 SubChat Middleware is running...");

  const role = req.cookies.get("role")?.value;
  console.log("👤 Detected role from cookie:", role);

  if (!role) {
    console.log("❌ No role found, redirecting to /unauthorized");
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Define protected routes for each role
  const protectedRoutes = {
    GroupOwner: ["/groupowner"],
    GroupSubscriber: ["/subscriber"],
  };

  const currentPath = req.nextUrl.pathname;
  console.log(`📍 Requested path: ${currentPath}`);

  for (const [allowedRole, paths] of Object.entries(protectedRoutes)) {
    const isProtected = paths.some(path => currentPath.startsWith(path));
    if (isProtected && role !== allowedRole) {
      console.log(`⛔ Unauthorized access by ${role} to ${currentPath}`);
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Allow access if role matches path
  return NextResponse.next();
}

// 👇 Apply middleware only on the dashboard access points
export const config = {
  matcher: ["/groupowner/:path*", "/subscriber/:path*"],
};
