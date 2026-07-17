import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntries?: string[];
  queryClient?: QueryClient;
}

/**
 * Wraps RTL `render` with the providers every page in this app expects:
 * Chakra theme, TanStack Query, React Router, and react-i18next. Mirrors
 * `AppProviders` minus the AuthContext / error-reporter wrappers (tests stub
 * those directly via `vi.mock`).
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ["/"], queryClient, ...options }: RenderWithProvidersOptions = {}
) {
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <ChakraProvider>
          <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
          </QueryClientProvider>
        </ChakraProvider>
      </I18nextProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient: client };
}
