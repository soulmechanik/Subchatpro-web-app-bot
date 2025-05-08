import { NextResponse } from "next/server";

export function middleware(req) {
  console.log("🔒 SubChat Middleware is running...");

  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  console.log("🔑 Token (cookie):", token?.value);
  console.log("👤 Role (cookie):", role?.value);

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
    const isProtected = paths.some((path) => currentPath.startsWith(path));
    if (isProtected && role.value !== allowedRole) {
      console.log(`⛔ Unauthorized access by ${role.value} to ${currentPath}`);
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/groupowner/:path*", "/subscriber/:path*"],
};
