import { NextResponse } from "next/server";

export function middleware(req) {
  console.log("🔒 SubChat Middleware is running...");

  // ⬇️ Read cookies (token and role)
  const token = req.cookies.get('token')?.value;
  const role = req.cookies.get('role')?.value;

  // Log the token and role received from cookies
  console.log("🔑 Token:", token ? "[Present]" : "[Missing]");
  console.log("👤 Role:", role ? "[Present]" : "[Missing]");

  // Check if token or role is missing
  if (!token || !role) {
    console.log("❌ No token or role found in cookies, redirecting to /unauthorized");
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Define protected routes based on the role
  const protectedRoutes = {
    GroupOwner: ["/groupowner"],
    GroupSubscriber: ["/subscriber"],
  };

  // Get the current path the user is trying to access
  const currentPath = req.nextUrl.pathname;
  console.log(`📍 Requested path: ${currentPath}`);

  // Check if the requested path is protected and if the role matches
  let isAuthorized = false;
  for (const [allowedRole, paths] of Object.entries(protectedRoutes)) {
    const isProtected = paths.some(path => currentPath.startsWith(path));
    if (isProtected && role === allowedRole) {
      console.log(`✅ Authorized access for ${role} to ${currentPath}`);
      isAuthorized = true;
      break; // Stop checking further roles
    }
  }

  // If the role doesn't match the protected route, log and redirect
  if (!isAuthorized) {
    console.log(`⛔ Unauthorized access by ${role} to ${currentPath}`);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Proceed with the request if authorization is successful
  console.log("✅ Access granted, proceeding with the request.");
  return NextResponse.next();
}

export const config = {
  matcher: ["/groupowner/:path*", "/subscriber/:path*"],
};
