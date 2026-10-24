import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const CONTROL_ROUTES = ["/control_estudios"];
const STAFF_ROUTES = [
  "/editar",
  "/asistencias",
  "/dashboard/horarios",
  "/Notas",
];

const isRoute = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = token?.role;

  if (!role) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const pathname = request.nextUrl.pathname;
  const isControlRoute = CONTROL_ROUTES.some((route) =>
    isRoute(pathname, route)
  );
  const isStaffRoute = STAFF_ROUTES.some((route) => isRoute(pathname, route));

  if (
    (isControlRoute && role !== "ADMIN" && role !== "COORDINACION") ||
    (isStaffRoute && role !== "DOCENTE" && role !== "ADMIN" && role !== "COORDINACION")
  ) {
    const destination =
      role === "ESTUDIANTE"
        ? "/dashboard/estudiante"
        : role === "DOCENTE"
          ? "/editar"
          : role === "ADMIN" || role === "COORDINACION"
            ? "/control_estudios"
            : "/";

    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/control_estudios/:path*",
    "/editar/:path*",
    "/asistencias/:path*",
    "/dashboard/horarios/:path*",
    "/Notas/:path*",
  ],
};
