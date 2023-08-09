import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { clarity } from "react-microsoft-clarity";
import { type Session } from "next-auth";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useEffect(() => {
    clarity.init("i80wpqjzo9");
  }, []);
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
