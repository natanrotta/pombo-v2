import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { FiUploadCloud, FiX } from "@/shared/components/icons";

type SelectionMode = "single" | "multiple";

interface FileUploadFieldProps {
  label: string;
  helperText?: string;
  /** Overrides the auto-generated formats line in the dropzone. Use this when
   *  the auto-rendered list (e.g. "PDF, JPG, PNG…") is too long or you want
   *  to bundle the size limit into the same line. */
  formatsLabel?: string;
  error?: string;
  selectionMode?: SelectionMode;
  acceptedTypes?: string[];
  accept?: string;
  maxFiles?: number;
  maxSizeBytes?: number;
  onChange?: (files: File[]) => void;
  variant?: "default" | "compact";
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function FileUploadField({
  label,
  helperText,
  formatsLabel,
  error,
  selectionMode = "single",
  acceptedTypes,
  accept,
  maxFiles,
  maxSizeBytes,
  onChange,
  variant = "default",
}: FileUploadFieldProps) {
  const { t } = useTranslation("common");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [internalError, setInternalError] = useState<string | undefined>();
  const [isDragging, setIsDragging] = useState(false);

  const resolvedAccept = acceptedTypes?.length ? acceptedTypes.join(",") : accept;
  const isMultiple = selectionMode === "multiple";
  const getFileKey = (file: File) => `${file.name}_${file.size}_${file.lastModified}`;

  const isFileAllowed = (file: File, tokens: string[]) => {
    if (!tokens.length) {
      return true;
    }

    const lowerName = file.name.toLowerCase();
    const lowerType = file.type.toLowerCase();

    return tokens.some((token) => {
      const normalized = token.trim().toLowerCase();

      if (!normalized) {
        return false;
      }

      if (normalized.startsWith(".")) {
        return lowerName.endsWith(normalized);
      }

      if (normalized.endsWith("/*")) {
        const prefix = normalized.replace("*", "");
        return lowerType.startsWith(prefix);
      }

      return lowerType === normalized;
    });
  };

  const processFiles = useCallback(
    (incoming: File[]) => {
      const tokens = acceptedTypes ?? [];
      const filteredByMode = isMultiple ? incoming : incoming.slice(0, 1);
      const validByType = filteredByMode.filter((file) => isFileAllowed(file, tokens));
      const hasInvalidType = validByType.length !== filteredByMode.length;

      const validBySize = maxSizeBytes
        ? validByType.filter((file) => file.size <= maxSizeBytes)
        : validByType;
      const hasOversized = validBySize.length !== validByType.length;

      const baseFiles = isMultiple ? selectedFiles : [];
      const mergedFiles = [...baseFiles, ...validBySize];
      const deduplicatedFiles = mergedFiles.filter(
        (file, index, allFiles) =>
          allFiles.findIndex((candidate) => getFileKey(candidate) === getFileKey(file)) === index
      );

      // Guard on `!== undefined` (not truthiness) so a cap of 0 — e.g. no
      // remaining slots — actually rejects the batch instead of falling through
      // to "no limit". `Math.max(0, …)` keeps a 0 cap as 0.
      const maxAllowed = isMultiple && maxFiles !== undefined ? Math.max(0, maxFiles) : undefined;
      const limitedFiles =
        maxAllowed !== undefined ? deduplicatedFiles.slice(0, maxAllowed) : deduplicatedFiles;
      const exceededLimit = Boolean(
        maxAllowed !== undefined && deduplicatedFiles.length > maxAllowed
      );

      if (hasInvalidType) {
        setInternalError(t("forms.fileUpload.invalidType"));
      } else if (hasOversized && maxSizeBytes) {
        setInternalError(t("forms.fileUpload.exceedsSize", { size: formatSize(maxSizeBytes) }));
      } else if (exceededLimit && maxAllowed !== undefined) {
        setInternalError(t("forms.fileUpload.exceedsLimit", { max: maxAllowed }));
      } else {
        setInternalError(undefined);
      }

      setSelectedFiles(limitedFiles);
      onChange?.(limitedFiles);
    },
    [acceptedTypes, isMultiple, maxFiles, maxSizeBytes, onChange, selectedFiles, t]
  );

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = event.target.files ? Array.from(event.target.files) : [];
    processFiles(incomingFiles);
    event.target.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const removeFile = (fileKey: string) => {
    const updated = selectedFiles.filter((file) => getFileKey(file) !== fileKey);
    setSelectedFiles(updated);
    onChange?.(updated);
  };

  return (
    <FormControl isInvalid={Boolean(error || internalError)}>
      {label && <FormLabel>{label}</FormLabel>}

      <Stack spacing={3}>
        <Input
          id={id}
          ref={inputRef}
          type="file"
          accept={resolvedAccept}
          multiple={isMultiple}
          display="none"
          onChange={handleFiles}
        />

        {variant === "compact" ? (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Icon as={FiUploadCloud} boxSize={4} />}
            onClick={() => inputRef.current?.click()}
            w="100%"
            borderStyle="dashed"
            borderColor="border.default"
            color="text.secondary"
            fontWeight="500"
            _hover={{ borderColor: "border.brand", color: "brand.500", bg: "bg.brand.subtle" }}
          >
            {helperText ?? t("forms.fileUpload.addFile")}
          </Button>
        ) : (
          <Flex
            direction="column"
            align="center"
            gap={2}
            p={5}
            borderWidth="2px"
            borderStyle="dashed"
            borderColor={isDragging ? "brand.400" : "gray.200"}
            borderRadius="xl"
            bg={isDragging ? "brand.50" : "bg.sunken"}
            cursor="pointer"
            transition="all 0.2s cubic-bezier(0.22, 1, 0.36, 1)"
            _hover={{ borderColor: "border.brand", bg: "bg.brand.subtle" }}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Flex
              align="center"
              justify="center"
              w={10}
              h={10}
              borderRadius="full"
              bg={isDragging ? "brand.100" : "gray.100"}
              color={isDragging ? "brand.500" : "gray.400"}
            >
              <Icon as={FiUploadCloud} boxSize={5} />
            </Flex>
            <Text fontSize="sm" fontWeight="600" color={isDragging ? "brand.600" : "gray.600"}>
              {helperText ??
                (isMultiple
                  ? t("forms.fileUpload.dragMultiple")
                  : t("forms.fileUpload.dragSingle"))}
            </Text>
            <Text fontSize="xs" color="text.muted">
              {formatsLabel ??
                (resolvedAccept
                  ? resolvedAccept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")
                  : t("forms.fileUpload.anyType"))}
            </Text>
          </Flex>
        )}

        {selectedFiles.length > 0 ? (
          // Cap the height so a large batch scrolls inside the list instead of
          // pushing the modal (and its footer/submit button) past the viewport.
          // `pr` reserves room so the scrollbar never overlaps the remove button.
          <Stack
            spacing={2}
            maxH="17rem"
            overflowY="auto"
            pr={selectedFiles.length > 4 ? 1 : 0}
          >
            {selectedFiles.map((file) => (
              <HStack
                key={getFileKey(file)}
                p={2.5}
                borderWidth="1px"
                borderColor="border.subtle"
                borderRadius="md"
                justify="space-between"
                bg="bg.surface"
                flexShrink={0}
              >
                <Text fontSize="sm" color="text.primary" noOfLines={1}>
                  {file.name}
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  leftIcon={<FiX />}
                  onClick={() => removeFile(getFileKey(file))}
                  color="text.secondary"
                >
                  {t("forms.fileUpload.remove")}
                </Button>
              </HStack>
            ))}
          </Stack>
        ) : null}
      </Stack>

      {error || internalError ? (
        <FormErrorMessage>{error ?? internalError}</FormErrorMessage>
      ) : null}
    </FormControl>
  );
}
