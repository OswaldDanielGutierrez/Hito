import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "text";

const base =
  "inline-flex h-10 items-center lg:h-[38px] justify-center gap-2 rounded-button px-4 text-sm font-semibold transition-colors duration-[120ms] ease-out disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-green-700 text-white hover:bg-green-700-hover",
  secondary: "border border-input-border bg-white text-ink hover:bg-surface",
  text: "text-muted hover:text-ink",
};

/** Clases de botón, para aplicar también a enlaces (`<Link className={buttonClass()}>`). */
export function buttonClass(variant: Variant = "primary") {
  return `${base} ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${buttonClass(variant)} ${className}`} {...props} />;
}
