declare module "react-responsive-masonry" {
  import { ComponentType, ReactNode } from "react";

  interface MasonryProps {
    columnsCount?: number;
    gutter?: string;
    children?: ReactNode;
    className?: string;
  }

  interface ResponsiveMasonryProps {
    columnsCountBreakPoints?: Record<number, number>;
    children?: ReactNode;
    className?: string;
  }

  const Masonry: ComponentType<MasonryProps>;
  export const ResponsiveMasonry: ComponentType<ResponsiveMasonryProps>;
  export default Masonry;
}
