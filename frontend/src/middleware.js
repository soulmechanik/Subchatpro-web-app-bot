import { NextResponse } from "next/server";

export function middleware(req) {
  console.log("🔒 SubChat Middleware is running...");

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

  const currentPath = req.nextUrl.pathname;
  console.log(`📍 Requested path: ${currentPath}`);

  let isAuthorized = false;
  for (const [allowedRole, paths] of Object.entries(protectedRoutes)) {
    const isProtected = paths.some(path => currentPath.startsWith(path));
    if (isProtected && role === allowedRole) {
      console.log(`✅ Authorized access for ${role} to ${currentPath}`);
      isAuthorized = true;
      break;
    }
  }

  if (!isAuthorized) {
    console.log(`⛔ Unauthorized access by ${role} to ${currentPath}`);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  console.log("✅ Access granted, proceeding with the request.");
  return NextResponse.next();
}

export const config = {
  matcher: ["/groupowner/:path*", "/subscriber/:path*"],
};
