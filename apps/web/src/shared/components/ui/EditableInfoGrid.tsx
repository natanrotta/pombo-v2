import { memo } from "react";
import { Flex, FormControl, FormLabel, Grid, Icon, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FiExternalLink } from "@/shared/components/icons";
import type { SelectOption } from "@/shared/components/forms/SelectField";
import { FormField } from "@/shared/components/forms/FormField";
import { SelectField } from "@/shared/components/forms/SelectField";
import { TextAreaField } from "@/shared/components/forms/TextAreaField";
import { DateField } from "@/shared/components/forms/DateField";
import { PhoneField } from "@/shared/components/forms/PhoneField";
import { DocumentField } from "@/shared/components/forms/DocumentField";

export type EditableFieldType =
  | "text"
  | "date"
  | "select"
  | "textarea"
  | "readonly"
  | "document"
  | "phone";

export interface EditableInfoGridItem {
  key: string;
  label: string;
  value: string;
  colSpan?: 1 | 2;
  type?: EditableFieldType;
  options?: SelectOption[];
  placeholder?: string;
  onLinkClick?: () => void;
}

interface EditableInfoGridProps {
  items: EditableInfoGridItem[];
  columns?: number;
  onChange: (key: string, value: string) => void;
}

function EditableInfoGridComponent({ items, columns = 2, onChange }: EditableInfoGridProps) {
  return (
    <Grid templateColumns={{ base: "1fr", md: `repeat(${columns}, 1fr)` }} gap={{ base: 3, md: 4 }}>
      {items.map((item) => (
        <FormControl key={item.key} gridColumn={item.colSpan === 2 ? { md: "span 2" } : undefined}>
          <FormLabel>{item.label}</FormLabel>
          <FieldInput item={item} onChange={onChange} />
        </FormControl>
      ))}
    </Grid>
  );
}

function FieldInput({
  item,
  onChange,
}: {
  item: EditableInfoGridItem;
  onChange: (key: string, value: string) => void;
}) {
  const { t } = useTranslation("common");
  const type = item.type ?? "text";

  if (type === "readonly") {
    if (item.onLinkClick) {
      return (
        <Flex
          as="button"
          align="center"
          gap={1.5}
          px={3}
          py={1.5}
          bg="brand.50"
          color="brand.700"
          borderRadius="md"
          fontSize="sm"
          fontWeight="500"
          w="fit-content"
          cursor="pointer"
          transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
          _hover={{ bg: "bg.brand.subtle" }}
          onClick={item.onLinkClick}
        >
          {item.value || "\u2014"}
          <Icon as={FiExternalLink} boxSize={3.5} />
        </Flex>
      );
    }
    return (
      <Text fontWeight="500" color="text.secondary" fontSize="sm" py={2}>
        {item.value || "\u2014"}
      </Text>
    );
  }

  if (type === "select") {
    return (
      <SelectField
        value={item.value}
        onChange={(v) => onChange(item.key, v)}
        options={[{ value: "", label: t("forms.selectPlaceholder") }, ...(item.options ?? [])]}
      />
    );
  }

  if (type === "textarea") {
    return (
      <TextAreaField
        value={item.value}
        onChange={(v) => onChange(item.key, v)}
        placeholder={item.placeholder ?? item.label}
        rows={3}
        resize="vertical"
      />
    );
  }

  if (type === "date") {
    return (
      <DateField
        value={item.value}
        onChange={(v) => onChange(item.key, v)}
        placeholder={item.placeholder}
      />
    );
  }

  if (type === "phone") {
    return (
      <PhoneField
        value={item.value}
        onChange={(v) => onChange(item.key, v)}
        placeholder={item.placeholder}
      />
    );
  }

  if (type === "document") {
    return (
      <DocumentField
        value={item.value}
        onChange={(v) => onChange(item.key, v)}
        placeholder={item.placeholder}
      />
    );
  }

  return (
    <FormField
      value={item.value}
      onChange={(v) => onChange(item.key, v)}
      placeholder={item.placeholder ?? item.label}
    />
  );
}

export const EditableInfoGrid = memo(EditableInfoGridComponent);
