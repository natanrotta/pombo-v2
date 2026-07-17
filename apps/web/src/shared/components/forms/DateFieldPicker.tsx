import { memo } from "react";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { FormControl, FormErrorMessage, FormLabel, Input, type InputProps } from "@chakra-ui/react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { parse, format, isValid } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";

registerLocale("pt-BR", ptBR);

export interface DateFieldProps {
  label?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isReadOnly?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const CustomInput = forwardRef<HTMLInputElement, InputProps>(function CustomInput(props, ref) {
  return <Input ref={ref} {...props} cursor="pointer" onKeyDown={(e) => e.preventDefault()} />;
});

function DateFieldComponent({
  label,
  value,
  error,
  onChange,
  placeholder,
  isReadOnly,
  minDate,
  maxDate,
}: DateFieldProps) {
  const { t } = useTranslation("common");
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const validDate = selected && isValid(selected) ? selected : null;

  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <DatePicker
        selected={validDate}
        onChange={(date: Date | null) => {
          onChange(date ? format(date, "yyyy-MM-dd") : "");
        }}
        dateFormat="dd/MM/yyyy"
        locale="pt-BR"
        placeholderText={placeholder ?? t("forms.datePlaceholder")}
        calendarClassName="custom-datepicker"
        wrapperClassName="custom-datepicker-wrapper"
        popperClassName="custom-datepicker-popper"
        customInput={<CustomInput />}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        minDate={minDate}
        maxDate={maxDate}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        disabled={isReadOnly}
      />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export default memo(DateFieldComponent);
