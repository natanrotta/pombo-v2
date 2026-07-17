import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./router/AppRouter";
import { SidebarProvider } from "@/shared/contexts/SidebarContext";
import { GlobalErrorBoundary } from "@/shared/components/ui/GlobalErrorBoundary";

export function App() {
  return (
    <GlobalErrorBoundary>
      <AppProviders>
        <SidebarProvider>
          <AppRouter />
        </SidebarProvider>
      </AppProviders>
    </GlobalErrorBoundary>
  );
}
