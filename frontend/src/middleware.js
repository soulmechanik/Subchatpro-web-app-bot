import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req) {
  console.log("Middleware is running...");

  const token = req.cookies.get("token")?.value;
  console.log("Token from cookies:", token);

  if (!token) {
    console.log("No token found, redirecting to unauthorized");
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    console.log("JWT payload:", payload);

    const role = payload.role;
    console.log("Middleware detected role:", role);

    const protectedRoutes = {
      GroupOwner: ["/groupowner"],
      GroupSubscriber: ["/groupsubscriber"],
    };

    const allowedRoutes = protectedRoutes[role] || [];
    const isAllowed = allowedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

    if (!isAllowed) {
      console.log(`Unauthorized access attempt by role ${role} to ${req.nextUrl.pathname}`);
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();

  } catch (error) {
    console.error("JWT verification failed. Reason:", error?.message || error);
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
}

export const config = {
  matcher: ["/groupowner/:path*", "/groupsubscriber/:path*"],
};
