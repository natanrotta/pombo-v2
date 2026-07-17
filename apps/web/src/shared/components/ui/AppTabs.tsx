import {
  Box,
  Flex,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  keyframes,
  type TabsProps,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

const dotPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
`;

export interface AppTabItem {
  id: string;
  label: string;
  content: ReactNode;
  badge?: string;
  badgeColorScheme?: string;
  dotIndicator?: boolean;
}

export type ProfileTabItem = AppTabItem;

interface AppTabsProps extends Omit<TabsProps, "children" | "isLazy" | "lazyBehavior"> {
  items: AppTabItem[];
  syncWithUrl?: boolean;
  /**
   * Defaults to `true` (`lazyBehavior="keepMounted"`) so tab panels only
   * mount when first activated. Opt-out only with a documented reason —
   * see `code-review-checklist.md` § F-H18.
   */
  isLazy?: boolean;
}

export function AppTabs({ items, syncWithUrl = false, isLazy = true, ...props }: AppTabsProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = syncWithUrl ? searchParams.get("tab") : null;
  const defaultIndex = tabParam
    ? Math.max(
        0,
        items.findIndex((item) => item.id === tabParam)
      )
    : 0;

  function handleTabChange(index: number) {
    if (!syncWithUrl) return;
    const item = items[index];
    if (item && index > 0) {
      setSearchParams({ tab: item.id }, { replace: true });
    } else {
      searchParams.delete("tab");
      setSearchParams(searchParams, { replace: true });
    }
  }

  return (
    <Tabs
      variant="soft-line"
      colorScheme="brand"
      // Lazy mount + keepMounted: tab panels only mount when first
      // activated, and stay mounted after — queries inside an inactive
      // tab don't fire, and switching back doesn't refetch.
      isLazy={isLazy}
      lazyBehavior="keepMounted"
      {...(syncWithUrl ? { defaultIndex, onChange: handleTabChange } : {})}
      {...props}
    >
      <TabList
        overflowX="auto"
        overflowY="hidden"
        css={{ "&::-webkit-scrollbar": { display: "none" }, scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <Tab key={item.id} display="flex" gap={2} whiteSpace="nowrap" flexShrink={0}>
            {item.label}
            {item.dotIndicator ? (
              <Box
                w="5px"
                h="5px"
                borderRadius="full"
                bg="status.error.fg"
                animation={`${dotPulse} 2s ease-out infinite`}
                flexShrink={0}
              />
            ) : item.badge ? (
              <Flex
                align="center"
                justify="center"
                w="16px"
                h="16px"
                borderRadius="full"
                bg={item.badgeColorScheme === "red" ? "status.error.bg" : "bg.brand.subtle"}
                color={item.badgeColorScheme === "red" ? "status.error.fg" : "text.brand"}
                fontSize="2xs"
                fontWeight="700"
                lineHeight={1}
                flexShrink={0}
              >
                {item.badge}
              </Flex>
            ) : null}
          </Tab>
        ))}
        {/* Sliding underline — inside TabList so it scrolls with the tabs when
            the list overflows. Styled via the `indicator` part of the theme. */}
        <TabIndicator />
      </TabList>
      <TabPanels>
        {items.map((item) => (
          <TabPanel key={item.id} px={0} pt={4}>
            {item.content}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
}
