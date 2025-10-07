import cx from "classnames";
import * as React from "react";

type PlaceholderProps = {
  children: React.ReactNode;
  className?: string;
};

export const Placeholder = ({ children, className }: PlaceholderProps) => {
  return (
    <div
      className={cx(
        "override",
        "border border-dashed border-black/[var(--border-alpha)] dark:border-white/[var(--border-alpha)]",
        "rounded",
        "p-8",
        "bg-white dark:bg-black",
        "gap-3",
        "grid",
        "text-center",
        "justify-items-center",
        className,
      )}
    >
      {children}
    </div>
  );
};
