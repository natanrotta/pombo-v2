import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useDisclosure,
  useOutsideClick,
  type InputProps,
} from "@chakra-ui/react";
import { FiChevronDown, FiX } from "@/shared/components/icons";
import { useTranslation } from "react-i18next";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js/min";

import { SearchField } from "./SearchField";
import { flagFromCode } from "@/shared/constants/countries";
import type { PhoneInput } from "@/shared/types/phone";

interface PhoneInputFieldProps extends Omit<InputProps, "onChange" | "value"> {
  label?: string;
  error?: string;
  value: PhoneInput | null;
  onChange: (value: PhoneInput | null) => void;
  /** Default country for an empty value. Defaults to "BR". */
  defaultCountry?: string;
  /**
   * Optional max width override. Defaults to `"100%"` so the field fills
   * whatever cell its parent grid allocates — mirrors how `<Input>` /
   * `<Select>` behave inside the project's form rows.
   */
  maxW?: InputProps["maxW"];
}

interface CountryOption {
  code: string;
  flag: string;
  name: string;
  dial: string;
}

const DEFAULT_COUNTRY = "BR";

/**
 * Diacritic-insensitive normalization so "uniao" matches "União",
 * "espana" matches "España", etc. Mirrors `CountrySelectField`.
 */
function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Wire-protocol input for a holder's phone (Contact / Workplace / User
 * Settings). The trigger is a compact pill (`🇧🇷 +55`); the popover hosts a
 * searchable country list with localized names. The digits input renders
 * the in-progress mask via libphonenumber's `AsYouType` so the user sees
 * `(11) 99999-8888` while typing, but the persisted `nationalNumber` is
 * always digit-only.
 */
function PhoneInputFieldComponent({
  label,
  error,
  value,
  onChange,
  defaultCountry = DEFAULT_COUNTRY,
  maxW = "100%",
  ...inputProps
}: PhoneInputFieldProps) {
  const { i18n, t } = useTranslation("common");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  /**
   * Locally-remembered country when the user picks one before typing any
   * digit. Without this, picking "US" while the phone is empty would call
   * `onChange(null)` (no digits ⇒ value stays null), and on the next
   * render `activeCountry` would fall back to `defaultCountry` — making
   * the trigger appear stuck on BR. The state is only consulted when
   * `value` itself doesn't carry a country yet.
   */
  const [pendingCountry, setPendingCountry] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useOutsideClick({
    ref: contentRef,
    enabled: isOpen,
    handler: (event) => {
      if (triggerRef.current?.contains(event.target as Node)) return;
      onClose();
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const tryFocus = (attempt = 0) => {
      if (cancelled) return;
      const el = searchInputRef.current;
      if (el && document.contains(el)) {
        el.focus({ preventScroll: true });
        if (document.activeElement === el) return;
      }
      if (attempt < 10) {
        requestAnimationFrame(() => tryFocus(attempt + 1));
      }
    };
    tryFocus();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const allOptions = useMemo<CountryOption[]>(() => {
    const DisplayNames = (Intl as { DisplayNames?: typeof Intl.DisplayNames }).DisplayNames;
    const formatter = DisplayNames
      ? new DisplayNames([i18n.language], { type: "region", fallback: "code" })
      : null;
    return getCountries()
      .map((code) => ({
        code,
        flag: flagFromCode(code),
        name: formatter?.of(code) ?? code,
        dial: getCountryCallingCode(code as CountryCode),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, i18n.language));
  }, [i18n.language]);

  const filteredOptions = useMemo<CountryOption[]>(() => {
    const trimmed = search.trim();
    if (!trimmed) return allOptions;
    const folded = foldText(trimmed);
    const digitsOnly = folded.replace(/\D/g, "");
    return allOptions.filter(
      (o) =>
        foldText(o.name).includes(folded) ||
        o.code.toLowerCase().includes(folded) ||
        (digitsOnly && o.dial.includes(digitsOnly))
    );
  }, [allOptions, search]);

  const activeCountry = value?.countryCode ?? pendingCountry ?? defaultCountry;
  const nationalDigits = value?.nationalNumber ?? "";

  const selectedOption = useMemo<CountryOption | null>(() => {
    return allOptions.find((o) => o.code === activeCountry) ?? null;
  }, [allOptions, activeCountry]);

  /**
   * Display mask via `AsYouType`. We feed it the raw digits and let it
   * insert the region-specific separators; if the country doesn't have a
   * known mask, the formatter returns the digits unchanged. The persisted
   * `nationalNumber` stays digit-only — formatting is read-time cosmetic.
   * We intentionally do NOT validate number quality: the user is free to
   * type whatever they have, and the backend stores it as-is. Strict
   * region validation is a future concern.
   */
  const displayValue = useMemo(() => {
    if (!nationalDigits) return "";
    try {
      return new AsYouType(activeCountry as CountryCode).input(nationalDigits);
    } catch {
      return nationalDigits;
    }
  }, [activeCountry, nationalDigits]);

  const handleOpen = useCallback(() => {
    setSearch("");
    setActiveIndex(0);
    onOpen();
  }, [onOpen]);

  const handleSelectCountry = useCallback(
    (code: string) => {
      onClose();
      // No digits yet ⇒ the form still has `phone: null` and the parent
      // should NOT receive a PhoneInput (validation would fail and the
      // wire payload would be incomplete). Remember the choice locally so
      // the trigger reflects it and the next typed digit uses this code.
      if (!nationalDigits) {
        setPendingCountry(code);
        return;
      }
      onChange({ countryCode: code, nationalNumber: nationalDigits });
    },
    [nationalDigits, onChange, onClose]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, Math.max(filteredOptions.length - 1, 0)));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const target = filteredOptions[activeIndex];
        if (target) handleSelectCountry(target.code);
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [filteredOptions, activeIndex, handleSelectCountry, onClose]
  );

  const handleDigitsChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D+/g, "");
      if (!digits) {
        onChange(null);
        return;
      }
      // Promote any locally-remembered country to the persisted value the
      // moment a real digit shows up. Subsequent digits stay on the same
      // country until the user explicitly picks a different one.
      onChange({ countryCode: activeCountry, nationalNumber: digits });
      setPendingCountry(null);
    },
    [activeCountry, onChange]
  );

  /**
   * Intercepts Backspace when the cursor sits right after a formatter char
   * (e.g. the closing `)` in `(21)`). Without this, deleting `)` leaves the
   * digit count unchanged, the AsYouType formatter immediately re-adds the
   * `)`, and the user perceives the input as stuck. We manually drop the
   * last digit in that case so each Backspace press visibly reduces the
   * stored number.
   */
  const handleDigitsKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Backspace") return;
      // CJK/Korean IME composition fires Backspace as part of compositing
      // before the final character commits. Let the browser cancel the
      // composition instead of dropping a digit from our stored state.
      if (event.nativeEvent.isComposing) return;
      const input = event.currentTarget;
      const { selectionStart, selectionEnd } = input;
      if (selectionStart === null || selectionStart === 0) return;
      // Selection ⇒ user wants to delete a range, let the browser handle it.
      if (selectionStart !== selectionEnd) return;
      const charBefore = input.value[selectionStart - 1];
      if (charBefore && /\d/.test(charBefore)) return;
      event.preventDefault();
      if (!nationalDigits) return;
      const nextDigits = nationalDigits.slice(0, -1);
      if (!nextDigits) {
        onChange(null);
        return;
      }
      onChange({ countryCode: activeCountry, nationalNumber: nextDigits });
    },
    [activeCountry, nationalDigits, onChange]
  );

  const handleClearDigits = useCallback(() => {
    onChange(null);
  }, [onChange]);

  return (
    <FormControl isInvalid={Boolean(error)} maxW={maxW}>
      {label && <FormLabel>{label}</FormLabel>}
      <HStack spacing={2} align="stretch">
        <Popover
          isOpen={isOpen}
          onOpen={handleOpen}
          onClose={onClose}
          placement="bottom-start"
          autoFocus={false}
          returnFocusOnClose={false}
          isLazy
          lazyBehavior="unmount"
        >
          <PopoverTrigger>
            <Button
              ref={triggerRef}
              type="button"
              flex="0 0 6.5rem"
              h={{ base: "44px", md: "40px" }}
              px={3}
              bg="bg.surface"
              borderWidth="1.5px"
              borderColor={isOpen ? "border.focus" : "border.default"}
              borderRadius="sm"
              color="text.primary"
              fontWeight="normal"
              fontSize={{ base: "16px", md: "sm" }}
              justifyContent="space-between"
              rightIcon={<FiChevronDown />}
              _hover={{ bg: "bg.surface", borderColor: "border.strong" }}
              _active={{ bg: "bg.surface" }}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-label={t("forms.countryLabel")}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
            >
              <Box as="span" display="flex" alignItems="center" gap={1.5} minW={0}>
                <Box as="span" lineHeight={1} fontSize="md">
                  {selectedOption?.flag ?? flagFromCode(activeCountry)}
                </Box>
                <Box as="span">
                  +{selectedOption?.dial ?? getCountryCallingCode(activeCountry as CountryCode)}
                </Box>
              </Box>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            ref={contentRef}
            w="20rem"
            maxW="20rem"
            borderColor="border.default"
            boxShadow="card-hover"
          >
            <PopoverBody p={2}>
              <Box mb={2}>
                <SearchField
                  inputRef={searchInputRef}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setActiveIndex(0);
                  }}
                  onClear={() => {
                    setSearch("");
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t("address.placeholder.countrySearch")}
                  autoFocus
                />
              </Box>
              <Box h="240px" overflowY="auto" role="listbox">
                {filteredOptions.length === 0 ? (
                  <Text fontSize="sm" color="text.muted" p={3} textAlign="center">
                    {t("address.noCountryResults")}
                  </Text>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = option.code === activeCountry;
                    const isActive = index === activeIndex;
                    return (
                      <Box
                        key={option.code}
                        role="option"
                        aria-selected={isSelected}
                        px={3}
                        py={2}
                        cursor="pointer"
                        borderRadius="md"
                        bg={isActive ? "bg.brand.subtle" : isSelected ? "bg.sunken" : "transparent"}
                        color="text.primary"
                        fontSize="sm"
                        display="flex"
                        alignItems="center"
                        gap={2}
                        onClick={() => handleSelectCountry(option.code)}
                        onMouseEnter={() => setActiveIndex(index)}
                      >
                        <Box as="span">{option.flag}</Box>
                        <Box
                          as="span"
                          flex="1"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {option.name}
                        </Box>
                        <Box as="span" color="text.muted" fontSize="xs">
                          +{option.dial}
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </PopoverBody>
          </PopoverContent>
        </Popover>
        <InputGroup flex="1">
          <Input
            inputMode="tel"
            value={displayValue}
            onChange={handleDigitsChange}
            onKeyDown={handleDigitsKeyDown}
            placeholder={t("forms.phonePlaceholder")}
            pr={displayValue ? "2.25rem" : undefined}
            {...inputProps}
          />
          {displayValue && (
            <InputRightElement>
              <IconButton
                aria-label={t("forms.phoneClear", { defaultValue: "Clear phone" })}
                icon={<FiX />}
                size="xs"
                variant="ghost"
                onClick={handleClearDigits}
              />
            </InputRightElement>
          )}
        </InputGroup>
      </HStack>
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export const PhoneInputField = memo(PhoneInputFieldComponent);
