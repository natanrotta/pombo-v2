import { memo, useCallback, useEffect, useRef } from "react";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { FormControl, FormErrorMessage, FormLabel, Input, type InputProps } from "@chakra-ui/react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
import { parse, format, isValid } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";

registerLocale("pt-BR", ptBR);

export interface TimeFieldProps {
  label?: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isReadOnly?: boolean;
}

const CustomTimeInput = forwardRef<HTMLInputElement, InputProps>(
  function CustomTimeInput(props, ref) {
    return <Input ref={ref} {...props} cursor="pointer" onKeyDown={(e) => e.preventDefault()} />;
  }
);

function TimeFieldComponent({
  label,
  value,
  error,
  onChange,
  placeholder,
  isReadOnly,
}: TimeFieldProps) {
  const { t } = useTranslation("common");
  const selected = value ? parse(value, "HH:mm", new Date()) : null;
  const validTime = selected && isValid(selected) ? selected : null;

  // react-datepicker portals the scrollable time list onto <body> (see
  // `portalId` below). When the field sits inside a modal whose scroll-lock
  // (Chakra's react-remove-scroll) is active, that lock preventDefaults every
  // wheel event fired outside the modal's DOM subtree — so the trackpad can't
  // scroll the list even though dragging its scrollbar still works. We drive the
  // list's scrollTop ourselves on wheel, which is immune to the ancestor
  // preventDefault, making the picker scroll regardless of any enclosing lock.
  const detachWheel = useRef<(() => void) | null>(null);

  const handleCalendarOpen = useCallback(() => {
    // Defer a frame so the portaled list is mounted before we query for it.
    requestAnimationFrame(() => {
      const portal = document.getElementById("datepicker-portal") ?? document;
      const lists = portal.querySelectorAll<HTMLElement>(".react-datepicker__time-list");
      const onWheel = (event: WheelEvent) => {
        const list = event.currentTarget as HTMLElement;
        // Normalize line/page deltas to pixels; trackpads already report pixels.
        const step = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? list.clientHeight : 1;
        list.scrollTop += event.deltaY * step;
        event.preventDefault();
      };
      lists.forEach((list) => list.addEventListener("wheel", onWheel, { passive: false }));
      detachWheel.current = () =>
        lists.forEach((list) => list.removeEventListener("wheel", onWheel));
    });
  }, []);

  const handleCalendarClose = useCallback(() => {
    detachWheel.current?.();
    detachWheel.current = null;
  }, []);

  // Safety net: drop the listener if the field unmounts while the list is open.
  useEffect(() => () => detachWheel.current?.(), []);

  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <DatePicker
        selected={validTime}
        onChange={(date: Date | null) => {
          onChange(date ? format(date, "HH:mm") : "");
        }}
        showTimeSelect
        showTimeSelectOnly
        timeIntervals={15}
        timeCaption={t("forms.timeCaption")}
        dateFormat="HH:mm"
        locale="pt-BR"
        placeholderText={placeholder ?? t("forms.timePlaceholder")}
        calendarClassName="custom-timepicker"
        wrapperClassName="custom-datepicker-wrapper"
        popperClassName="custom-datepicker-popper"
        customInput={<CustomTimeInput />}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        onCalendarOpen={handleCalendarOpen}
        onCalendarClose={handleCalendarClose}
        // Render the popper on <body> so it isn't clipped by (or stuck behind)
        // a modal's overflow/stacking context — it still anchors to the input.
        portalId="datepicker-portal"
        disabled={isReadOnly}
      />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export default memo(TimeFieldComponent);
