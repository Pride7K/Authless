import crypto from "node:crypto";
import { verifyRegistrationResponse,verifyAuthenticationResponse } from "@simplewebauthn/server";
import dbConnect from "./dbConnect";
import Credentials from "./models/Credential";
import user from "./models/user";
import { Request } from "express";
import { Session } from "express-session";
import { NextApiRequest } from "next";

const HOST_SETTINGS = {
    expectedOrigin: process.env.VERCEL_URL ?? "http://localhost:3000",
    expectedRPID: process.env.RPID ?? "localhost",
  };

function clean(str:string) {
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function generateChallenge() {
  return clean(crypto.randomBytes(32).toString("base64"));
}

// Helper function to translate values between
// `@github/webauthn-json` and `@simplewebauthn/server`
function binaryToBase64url(bytes:Uint8Array) {
  let str = "";

  bytes.forEach((charCode) => {
    str += String.fromCharCode(charCode);
  });

  return btoa(str);
}

interface MyRequestBody {
  challenge: string;
  cred?: string;
  userId?: string;
  credential?: string;
  email?: string;
}


export async function verifyCredentials(request:NextApiRequest) {

  const challenge = request.body?.challenge as string ;
  const credential = request.body.cred ?? "";

  if (credential == null) {
    throw new Error("Invalid Credentials");
  }


  let verification;


  verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge: challenge,
    requireUserVerification: true,
    ...HOST_SETTINGS,
  });


  if (!verification.verified) {
    throw new Error("Invalid Credentials - Registration verification failed.");
  }

  const { credentialID, credentialPublicKey } =
    verification.registrationInfo ?? {};

  if (credentialID == null || credentialPublicKey == null) {
    throw new Error("Registration failed");
  }

  return {
    credentialID: clean(binaryToBase64url(credentialID)),
    publicKey: Buffer.from(credentialPublicKey).toString("base64"),
  };
}

export function isLoggedIn(request:NextApiRequest) {
  return request.session?.userId != null;
}

function base64ToArray(base64:string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function login(request: NextApiRequest) {
  await dbConnect();
  const challenge = request.session.challenge ?? "";
  const credential = request.body.credential ?? "";
  const email = request.body.email ?? "";
  
  console.log(credential)

  if (credential?.id == null) {
    throw new Error("Invalid Credentials");
  }

  console.log("login")

  console.log("credential: ", credential)

  const cred = await Credentials.findOne({ externalId: credential.id });
  if (cred == null) {
    throw new Error("Invalid Credentials");
  }

  let verification;

  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      requireUserVerification: true,
      
      authenticator: {
        counter: cred.counter,
        credentialID: cred.externalId,
        credentialPublicKey: base64ToArray(cred.publicKey),
      },
      ...HOST_SETTINGS,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }

  const usr = await user.findOne({ credentials: cred._id });

  if (!verification.verified || email !== usr.email) {
    throw new Error("Login verification Failed");
  }

  return usr._id;
}