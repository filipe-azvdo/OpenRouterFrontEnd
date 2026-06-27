import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

const inputClasses = [
  "h-11 w-full rounded-md border border-hairline-strong bg-canvas px-3.5",
  "text-base text-ink placeholder:text-muted",
  "transition-colors duration-150",
  "focus:border-primary focus:outline-2 focus:outline-offset-0 focus:outline-primary/40",
].join(" ");

/** Campo de texto/numérico com rótulo opcional. */
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const input = (
      <input ref={ref} id={id} className={[inputClasses, className].join(" ")} {...props} />
    );
    if (!label) return input;
    return (
      <label htmlFor={id} className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">{label}</span>
        {input}
      </label>
    );
  },
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className = "", id, children, ...props }, ref) => {
    const select = (
      <select
        ref={ref}
        id={id}
        className={[inputClasses, "cursor-pointer", className].join(" ")}
        {...props}
      >
        {children}
      </select>
    );
    if (!label) return select;
    return (
      <label htmlFor={id} className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">{label}</span>
        {select}
      </label>
    );
  },
);
Select.displayName = "Select";
