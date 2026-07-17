import { memo } from "react";
import { Button, Divider, Flex, Heading, Icon, Text, type StackProps } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import type { PropsWithChildren, ReactNode } from "react";
import { FiPlus } from "@/shared/components/icons";
import type { IconType } from "@/shared/components/icons";
import { TRANSITION_DEFAULT, TRANSITION_FAST } from "@/shared/constants/animation";

const MotionFlex = motion(Flex);
const MotionText = motion(Text);

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: IconType;
}

interface PageHeaderProps extends StackProps {
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  primaryAction?: PageHeaderAction;
  actions?: ReactNode;
}

function PageHeaderComponent({
  title,
  description,
  count,
  countLabel,
  primaryAction,
  actions,
  children,
  ...stackProps
}: PropsWithChildren<PageHeaderProps>) {
  const hasActions = primaryAction || actions;

  return (
    <MotionFlex
      direction="column"
      gap={0}
      mb={5}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION_DEFAULT}
      {...stackProps}
    >
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap={{ base: 3, md: 4 }}
        pb={4}
      >
        <Flex direction="column" gap={0.5} minW={0}>
          <Flex align="baseline" gap={2}>
            <Heading
              as="h1"
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="700"
              letterSpacing="tight"
              color="text.primary"
            >
              {title}
            </Heading>
            <AnimatePresence>
              {count !== undefined && (
                <MotionText
                  fontSize="sm"
                  fontWeight="500"
                  color="text.muted"
                  whiteSpace="nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={TRANSITION_FAST}
                >
                  {count} {countLabel}
                </MotionText>
              )}
            </AnimatePresence>
          </Flex>
          {description && (
            <Text color="text.secondary" fontSize="sm" maxW="2xl">
              {description}
            </Text>
          )}
          {children}
        </Flex>

        {hasActions && (
          <Flex align="center" gap={2} flexShrink={0} w={{ base: "full", md: "auto" }}>
            {primaryAction && (
              <Button
                size="xs"
                colorScheme="brand"
                leftIcon={<Icon as={primaryAction.icon ?? FiPlus} boxSize={3.5} />}
                onClick={primaryAction.onClick}
                borderRadius="md"
                fontWeight="500"
                fontSize={{ base: "sm", md: "xs" }}
                h={{ base: "44px", md: "30px" }}
                px={3}
                flex={{ base: 1, md: "initial" }}
                _active={{
                  transform: "scale(0.98)",
                }}
                transition="all 0.15s ease"
                data-testid="page-header-primary-action"
              >
                {primaryAction.label}
              </Button>
            )}
            {actions}
          </Flex>
        )}
      </Flex>
      <Divider borderColor="border.subtle" />
    </MotionFlex>
  );
}

export const PageHeader = memo(PageHeaderComponent);
