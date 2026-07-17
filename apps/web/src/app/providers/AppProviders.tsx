import { Suspense, type PropsWithChildren } from "react";
import { ChakraProvider, ColorModeScript, createLocalStorageManager } from "@chakra-ui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/modules/auth/presentation/context/AuthContext";
import { queryClient } from "@/core/query/queryClient";
import { theme, COLOR_MODE_STORAGE_KEY } from "@/app/theme";
import { lazyWithRetry } from "@/app/router/lazyWithRetry";

const colorModeManager = createLocalStorageManager(COLOR_MODE_STORAGE_KEY);

// `lazyWithRetry` (not raw `lazy`): this renders above the router, so a stale
// devtools chunk would otherwise crash straight to GlobalErrorBoundary.
const ReactQueryDevtools = import.meta.env.DEV
  ? lazyWithRetry(() =>
      import("@tanstack/react-query-devtools").then((m) => ({ default: m.ReactQueryDevtools }))
    )
  : () => null;

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      <ColorModeScript
        initialColorMode={theme.config.initialColorMode}
        storageKey={COLOR_MODE_STORAGE_KEY}
        type="localStorage"
      />
      <ChakraProvider theme={theme} colorModeManager={colorModeManager}>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={googleClientId}>
            <AuthProvider>{children}</AuthProvider>
          </GoogleOAuthProvider>
          <Suspense>
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </Suspense>
        </QueryClientProvider>
      </ChakraProvider>
    </>
  );
}
