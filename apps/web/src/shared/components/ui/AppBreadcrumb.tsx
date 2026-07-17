import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  type BreadcrumbProps,
  Icon,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiChevronRight } from "@/shared/components/icons";

export interface BreadcrumbEntry {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface AppBreadcrumbProps extends BreadcrumbProps {
  items: BreadcrumbEntry[];
}

export function AppBreadcrumb({ items, ...props }: AppBreadcrumbProps) {
  return (
    <Breadcrumb
      separator={<Icon as={FiChevronRight} boxSize={3.5} />}
      fontSize={{ base: "xs", md: "sm" }}
      color="text.secondary"
      overflowX="auto"
      whiteSpace="nowrap"
      css={{
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        // Chakra's separator is a plain <span role="presentation"> (no class)
        // whose text strut lifts the chevron above the label. Flex-center the
        // icon and zero the line-height to drop the strut, so it sits on the
        // label's midline.
        "& [role='presentation']": {
          display: "flex",
          alignItems: "center",
          lineHeight: 0,
        },
      }}
      {...props}
    >
      {items.map((item) => (
        <BreadcrumbItem
          key={`${item.label}_${item.href ?? "current"}`}
          isCurrentPage={item.isCurrentPage}
        >
          {item.href ? (
            <BreadcrumbLink as={RouterLink} to={item.href} color="text.secondary">
              {item.label}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbLink color="text.primary" fontWeight="600">
              {item.label}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}
