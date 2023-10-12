import { useEffect, useState } from "react";
import { create, supported } from "@github/webauthn-json";

import { generateChallenge, isLoggedIn } from "@/lib/auth";
import { withSession } from "@/lib/session";
import { useRouter } from "next/router";
import { FormEvent, FormEventHandler } from "react";

function generateRandomId() {
  // Crie um array de bytes (Uint8Array) para armazenar o ID
  const idBytes = new Uint8Array(16);

  // Preencha o array de bytes com valores aleatórios
  crypto.getRandomValues(idBytes);

  // Converta os bytes em uma representação hexadecimal
  const idHex = Array.from(idBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  // Retorne o ID como uma string hexadecimal
  return idHex;
}

function stringToArrayBuffer(str: string) {
  let encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

function base64url_encode(buffer: ArrayBuffer): string {
  return btoa(
    Array.from(new Uint8Array(buffer), (b) => String.fromCharCode(b)).join("")
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default function register({ challenge }) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [support, setSupport] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const checkAvailability = async () => {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setSupport(available && supported());
    };
    checkAvailability();
  }, []);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const userAvailable = await fetch("/api/usercheck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, username }),
    });

    if (userAvailable.status !== 200) {
      const { message } = await userAvailable.json();
      setError(message);
      return;
    }

    var newChallenger = stringToArrayBuffer(challenge);

    console.log(newChallenger);

    const userId = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const cred = await create({
      publicKey: {
        challenge: challenge,
        rp: {
          // These are seen by the authenticator when selecting which key to use
          name: "WebAuthn Demo",
          id: router.hostname,
        },
        user: {
          // You can choose any id you please, as long as it is unique
          id: base64url_encode(
            Uint8Array.from("UZSL85T9AFC", (c) => c.charCodeAt(0))
          ),
          name: username,
          displayName: email,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },
          { type: "public-key", alg: -257 },
        ],
        timeout: 120000,
        attestation: "direct",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "required",
          userVerification: "required",
        },
      },
    });

    console.log(cred.id);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username,
        cred: cred,
        challenge,
      }),
    });

    if (res.status === 200) {
      router.push("/protected/home");
    } else {
      const { message } = await res.json();
      setError(message);
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
        Register
      </h1>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {support ? (
          <form method="POST" action="/api/register" onSubmit={handleRegister}>
            <div className="p-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="block w-full rounded-md border-0 py-1.5 text-black"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="p-3">
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-6"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="block w-full rounded-md border-0 py-1.5 text-black"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
              <button
                type="submit"
                className="w-full bg-blue-600 p-3 rounded-md py-1.5 block"
              >
                Register
              </button>
            </div>
          </form>
        ) : (
          <div>Sorry, your browser does not support WebAuthn.</div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps = withSession(async function ({ req, res }) {
  if (isLoggedIn(req)) {
    return {
      redirect: {
        destination: "/protected/home",
        permanent: false,
      },
    };
  }
  const challenge = generateChallenge();
  req.session.challenge = challenge;
  await req.session.save();
  return { props: { challenge } };
});
