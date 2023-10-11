import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import { NextApiHandler } from "next";

export const sessionOptions = {
  cookieName: "webauthn-token",
  password: process.env.COOKIE_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

export function withSessionAPI(handler:NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export function withSession(handler) {
  return withIronSessionSsr(handler, sessionOptions);
}