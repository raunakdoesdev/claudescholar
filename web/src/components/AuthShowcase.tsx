import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthShowcase() {
    const { data: sessionData } = useSession();
  
    return (
      <div className="flex flex-row items-center justify-center gap-4">
        <p className="text-2l text-center font-semibold">
          {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        </p>
        <button
          className="rounded-full border-none bg-transparent px-10 py-3 font-semibold text-white no-underline transition hover:cursor-pointer"
          style={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            transition: "background-color 0.3s ease",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
          }
          onClick={
            sessionData ? () => void signOut() : () => void signIn("google")
          }
        >
          {sessionData ? "Sign out" : "Sign in"}
        </button>
      </div>
    );
  }