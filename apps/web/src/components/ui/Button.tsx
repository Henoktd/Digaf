export type ButtonVariant = "primary" | "secondary" | "danger" | "warning" | "ghost";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  warning: "bg-amber-600 text-white shadow-sm hover:bg-amber-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2 text-sm",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md"
) {
  return `${base} ${variants[variant]} ${sizes[size]}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses(variant, size)} ${className}`.trim()}
      {...props}
    />
  );
}
