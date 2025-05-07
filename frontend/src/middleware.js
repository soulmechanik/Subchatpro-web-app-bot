import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(req) {
  console.log("🔒 SubChat Middleware is running...");

  const token = req.cookies.get("token")?.value; // grab token
  const role = req.cookies.get("role")?.value;   // grab role

  console.log("🔑 Token (cookie):", token);
  console.log("👤 Role (cookie):", role);

  if (!token || !role) {
    console.log("❌ No token or role found, redirecting to /unauthorized");
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

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

  // ✅ Passed all checks
  return NextResponse.next();
}

// 👇 Apply middleware only on these paths
export const config = {
  matcher: ["/groupowner/:path*", "/subscriber/:path*"],
};
