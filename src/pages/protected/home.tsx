import { isLoggedIn } from "@/lib/auth";
import { withSession } from "@/lib/session";

export default function home({ userID }) {
  return (
    <div>
      <h1>Protected Home</h1>
      <p>
        This page is protected and can only be accessed by authenticated users.
      </p>
      <p>You are logged in as: {userID} </p>
      <form
        method="POST"
        action="/api/logout"
        className=" p-3 rounded-md py-1.5 block"
      >
        <button>Logout</button>
      </form>
    </div>
  );
}

export const getServerSideProps = withSession(async function ({ req, res }) {
  if (!isLoggedIn(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  return {
    props: {
      userID: req.session.userId,
    },
  };
});