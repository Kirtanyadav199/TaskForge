import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-[6px] bg-[#F0F0F0]", className)}
      {...props}
    />
  );
}

export { Skeleton };
