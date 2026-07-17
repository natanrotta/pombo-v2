import { memo } from "react";
import { Box, SimpleGrid, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { PRESET_COLORS } from "./ColorPicker.colors";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  colors?: string[];
}

function ColorPickerComponent({
  value,
  onChange,
  label,
  colors = PRESET_COLORS,
}: ColorPickerProps) {
  const { t } = useTranslation("common");
  const resolvedLabel = label ?? t("forms.colorLabel");

  return (
    <Box>
      <Text fontSize="sm" fontWeight="600" color="text.primary" mb={2}>
        {resolvedLabel}
      </Text>
      <SimpleGrid columns={8} gap={2.5}>
        {colors.map((c) => (
          <Box
            key={c}
            w={8}
            h={8}
            borderRadius="full"
            bg={c}
            cursor="pointer"
            outline={value === c ? `2.5px solid ${c}` : "none"}
            outlineOffset="2px"
            _hover={{ transform: "scale(1.15)" }}
            transition="all 0.15s"
            onClick={() => onChange(c)}
            boxShadow={value === c ? `0 2px 8px ${c}40` : "none"}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
}

export const ColorPicker = memo(ColorPickerComponent);
