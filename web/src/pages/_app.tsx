import { type AppType } from "next/app";
import { api } from "~/utils/api";
import "~/styles/globals.css";
import { clarity } from "react-microsoft-clarity";
import { useEffect } from "react";

const MyApp: AppType = ({ Component, pageProps }) => {
  useEffect(() => {
    clarity.init("i80wpqjzo9");
  }, []);
  return <Component {...pageProps} />;
};

export default api.withTRPC(MyApp);
