"use client";

export type RegistrationReferenceField = {
  key: string;
  label: string;
  placeholder: string;
  minLength: number;
  maxLength: number;
  validationMessage: string;
};

type Props = {
  field: RegistrationReferenceField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function RegistrationReferenceInput({
  field,
  value,
  onChange,
  disabled,
  className = "registration-reference-input"
}: Props): JSX.Element {
  const digitsOnly = field.key === "emisNumber";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    let next = e.target.value;
    if (digitsOnly) {
      next = next.replace(/\D/g, "").slice(0, field.maxLength);
    } else {
      next = next.slice(0, field.maxLength);
    }
    onChange(next);
  }

  return (
    <>
      <input
        type="text"
        className={className}
        inputMode={digitsOnly ? "numeric" : "text"}
        autoComplete="off"
        spellCheck={false}
        maxLength={field.maxLength}
        value={value}
        onChange={handleChange}
        placeholder={field.placeholder}
        disabled={disabled}
        aria-label={field.label}
      />
      <span className="registration-reference-hint">{field.validationMessage}</span>
    </>
  );
}
