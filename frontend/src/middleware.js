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
            Subscriber: ["/subscriber"],
        };

        console.log(`Checking access for role ${role} on path ${req.nextUrl.pathname}`);

        for (const [allowedRole, routes] of Object.entries(protectedRoutes)) {
            if (
                routes.some(route => req.nextUrl.pathname.startsWith(route)) &&
                role !== allowedRole
            ) {
                console.log(`Unauthorized Access: ${req.nextUrl.pathname} for role ${role}`);
                return NextResponse.redirect(new URL("/unauthorized", req.url));
            }
        }

        return NextResponse.next();

    } catch (error) {
        console.error("JWT verification failed:", error);
        return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
}

export const config = {
    matcher: ["/groupowner/:path*", "/subscriber/:path*"],
};
