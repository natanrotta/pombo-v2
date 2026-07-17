import { memo } from "react";
import { useState } from "react";
import { Box, Button, Flex, Icon, Text } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheckSquare, FiTrash2, FiX } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";
import { TRANSITION_DEFAULT } from "@/shared/constants/animation";
import { ConfirmDialog } from "@/shared/components/ui/ConfirmDialog";

const MotionFlex = motion(Flex);

interface BulkActionBarProps {
  isOpen: boolean;
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onCancel: () => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  deleteTitle: string;
  deleteDescription: string;
}

function BulkActionBarComponent({
  isOpen,
  selectedCount,
  allSelected,
  onSelectAll,
  onCancel,
  onDelete,
  isDeleting,
  deleteTitle,
  deleteDescription,
}: BulkActionBarProps) {
  const { t } = useTranslation("common");
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleConfirmDelete() {
    await onDelete();
    setShowConfirm(false);
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            zIndex="banner"
            display={{ base: "none", md: "flex" }}
            justifyContent="center"
            pointerEvents="none"
            pb={6}
          >
            <MotionFlex
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={TRANSITION_DEFAULT}
              align="center"
              gap={3}
              px={5}
              py={3}
              bg="neutral.800"
              color="white"
              borderRadius="lg"
              boxShadow="shadow.lg"
              pointerEvents="auto"
              maxW="fit-content"
            >
              <Flex align="center" gap={2} mr={1}>
                <Icon as={FiCheckSquare} boxSize={4} color="brand.300" />
                <Text fontSize="sm" fontWeight="600" whiteSpace="nowrap">
                  {t("bulk.selected", { count: selectedCount })}
                </Text>
              </Flex>

              {!allSelected && (
                <Button
                  size="sm"
                  variant="ghost"
                  color="neutral.300"
                  fontWeight="500"
                  _hover={{ bg: "whiteAlpha.200", color: "white" }}
                  onClick={onSelectAll}
                >
                  {t("actions.selectAll")}
                </Button>
              )}

              <Box w="1px" h={5} bg="whiteAlpha.300" />

              <Button
                size="sm"
                colorScheme="red"
                leftIcon={<Icon as={FiTrash2} boxSize={3.5} />}
                isDisabled={selectedCount === 0}
                onClick={() => setShowConfirm(true)}
                _hover={{ bg: "red.500" }}
              >
                {t("actions.delete")}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                color="neutral.400"
                leftIcon={<Icon as={FiX} boxSize={3.5} />}
                _hover={{ bg: "whiteAlpha.200", color: "white" }}
                onClick={onCancel}
              >
                {t("actions.cancel")}
              </Button>
            </MotionFlex>
          </Box>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel={t("actions.delete")}
        isLoading={isDeleting}
        isDanger
      />
    </>
  );
}

export const BulkActionBar = memo(BulkActionBarComponent);
