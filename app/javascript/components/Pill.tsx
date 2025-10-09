import cx from "classnames";
import * as React from "react";

export type PillColor = "filled" | "primary" | "black" | "accent" | "success" | "danger" | "warning" | "info";
export type PillVariant = "default" | "dismissable" | "expandable" | "select";
export type PillSize = "default" | "small";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: PillSize;
  color?: PillColor;
  variant?: PillVariant;
  outline?: boolean;
  onDismiss?: () => void;
  onExpand?: () => void;
  selectElement?: React.ReactElement<HTMLSelectElement>;
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  (
    { className, size, color, variant = "default", outline, children, onDismiss, onExpand, selectElement, ...props },
    ref,
  ) => {
    const handleClick = () => {
      if (variant === "dismissable" && onDismiss) {
        onDismiss();
      } else if (variant === "expandable" && onExpand) {
        onExpand();
      }
    };

    const isClickable = variant === "dismissable" || variant === "expandable" || variant === "select";

    const pillClasses = cx(
      "override",
      "inline-block align-middle",
      "px-[0.75rem] py-[0.5rem]",
      "border border-border rounded-[10rem]",
      "overflow-hidden whitespace-nowrap text-ellipsis",
      "shrink-0",
      "first:-ml-2 last:-mr-2",
      {
        // Size variants
        "rounded-[0.25rem] px-1 py-1 text-[0.875rem] leading-[1.3]": size === "small",

        // Color variants with proper CSS variable usage
        "bg-background text-foreground": !color || color === "filled",
        "bg-[rgb(var(--primary))] border-[rgb(var(--primary))] text-[rgb(var(--contrast-primary))] [--color:var(--contrast-primary)] [--active-bg:rgb(var(--contrast-primary)/0.1)]":
          color === "primary" && !outline,
        "bg-[rgb(var(--black))] border-[rgb(var(--black))] text-[rgb(var(--contrast-black))] [--color:var(--contrast-black)] [--active-bg:rgb(var(--contrast-black)/0.1)]":
          color === "black" && !outline,
        "bg-[rgb(var(--accent))] border-[rgb(var(--accent))] text-[rgb(var(--contrast-accent))] [--color:var(--contrast-accent)] [--active-bg:rgb(var(--contrast-accent)/0.1)]":
          color === "accent" && !outline,
        "bg-[rgb(var(--success))] border-[rgb(var(--success))] text-[rgb(var(--contrast-success))] [--color:var(--contrast-success)] [--active-bg:rgb(var(--contrast-success)/0.1)]":
          color === "success" && !outline,
        "bg-[rgb(var(--danger))] border-[rgb(var(--danger))] text-[rgb(var(--contrast-danger))] [--color:var(--contrast-danger)] [--active-bg:rgb(var(--contrast-danger)/0.1)]":
          color === "danger" && !outline,
        "bg-[rgb(var(--warning))] border-[rgb(var(--warning))] text-[rgb(var(--contrast-warning))] [--color:var(--contrast-warning)] [--active-bg:rgb(var(--contrast-warning)/0.1)]":
          color === "warning" && !outline,
        "bg-[rgb(var(--info))] border-[rgb(var(--info))] text-[rgb(var(--contrast-info))] [--color:var(--contrast-info)] [--active-bg:rgb(var(--contrast-info)/0.1)]":
          color === "info" && !outline,

        // Outline variants
        "bg-transparent": outline,
        "border-[rgb(var(--primary))] text-[rgb(var(--primary))]": color === "primary" && outline,
        "border-[rgb(var(--black))] text-[rgb(var(--black))]": color === "black" && outline,
        "border-[rgb(var(--accent))] text-[rgb(var(--accent))]": color === "accent" && outline,
        "border-[rgb(var(--success))] text-[rgb(var(--success))]": color === "success" && outline,
        "border-[rgb(var(--danger))] text-[rgb(var(--danger))]": color === "danger" && outline,
        "border-[rgb(var(--warning))] text-[rgb(var(--warning))]": color === "warning" && outline,
        "border-[rgb(var(--info))] text-[rgb(var(--info))]": color === "info" && outline,

        // Variant-specific styles
        "cursor-pointer": isClickable,
        relative: variant === "select",

        // Icon styling for dismissable/expandable
        "after:content-['✕'] after:float-right after:ml-2": variant === "dismissable",
        "after:content-['⌄'] after:float-right after:ml-2": variant === "expandable",
      },
      className,
    );

    return (
      <span className={pillClasses} onClick={isClickable ? handleClick : undefined} ref={ref} {...props}>
        {children}
        {variant === "select" &&
          selectElement &&
          React.cloneElement(selectElement, {
            className: cx(
              "absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer",
              "text-foreground bg-background",
              selectElement.props.className,
            ),
          })}
      </span>
    );
  },
);

Pill.displayName = "Pill";
