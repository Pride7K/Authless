import { generateChallenge, isLoggedIn } from "@/lib/auth";
import { withSession } from "@/lib/session";
import { supported, create, get } from "@github/webauthn-json";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Login({ challenge }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [support, setSupport] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setSupport(available && supported());
    };

    checkAvailability();
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    const credential = await get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: "required",
        rpId: "localhost",
      },
    });

    const result = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, credential }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (result.status !== 200) {
      try {
        const { message } = await result.json();
        setError(message);
      } catch (e) {
        setError("Something went wrong");
      }
      return;
    } else {
      router.push("/protected/home");
    }
  };

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <h1 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
        Login
      </h1>

      {support ? (
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {error && <div className="text-red-500">{error}</div>}
          <form method="POST" onSubmit={handleLogin}>
            <div className="p-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6"
              >
                email
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
              <button
                type="submit"
                className="w-full bg-blue-600 p-3 rounded-md py-1.5 block"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>Webauthn is not supported by your browser.</div>
      )}
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
  const challenge = await generateChallenge();
  req.session.challenge = challenge;
  await req.session.save();

  return { props: { challenge } };
});