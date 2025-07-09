import { ReactNode } from 'react';
import { useBreakpoint } from '@/hooks/use-mobile';

interface ShowOnProps {
  children: ReactNode;
  breakpoint?: 'mobile' | 'tablet' | 'desktop' | 'wide';
  above?: 'mobile' | 'tablet' | 'desktop';
  below?: 'tablet' | 'desktop' | 'wide';
  only?: 'mobile' | 'tablet' | 'desktop' | 'wide';
}

export function ShowOn({ 
  children, 
  breakpoint, 
  above, 
  below, 
  only 
}: ShowOnProps) {
  const currentBreakpoint = useBreakpoint();
  
  if (!currentBreakpoint) return null;
  
  const breakpointOrder = ['mobile', 'tablet', 'desktop', 'wide'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Show only on specific breakpoint
  if (only) {
    return currentBreakpoint === only ? <>{children}</> : null;
  }
  
  // Show above a certain breakpoint
  if (above) {
    const aboveIndex = breakpointOrder.indexOf(above);
    return currentIndex > aboveIndex ? <>{children}</> : null;
  }
  
  // Show below a certain breakpoint  
  if (below) {
    const belowIndex = breakpointOrder.indexOf(below);
    return currentIndex < belowIndex ? <>{children}</> : null;
  }
  
  // Show on specific breakpoint (legacy)
  if (breakpoint) {
    return currentBreakpoint === breakpoint ? <>{children}</> : null;
  }
  
  return <>{children}</>;
}

// Convenience components
export const MobileOnly = ({ children }: { children: ReactNode }) => (
  <ShowOn only="mobile">{children}</ShowOn>
);

export const TabletOnly = ({ children }: { children: ReactNode }) => (
  <ShowOn only="tablet">{children}</ShowOn>
);

export const DesktopOnly = ({ children }: { children: ReactNode }) => (
  <ShowOn only="desktop">{children}</ShowOn>
);

export const MobileAndTablet = ({ children }: { children: ReactNode }) => (
  <ShowOn below="desktop">{children}</ShowOn>
);

export const TabletAndDesktop = ({ children }: { children: ReactNode }) => (
  <>
    <ShowOn only="tablet">{children}</ShowOn>
    <ShowOn only="desktop">{children}</ShowOn>
  </>
);

export const DesktopAndWide = ({ children }: { children: ReactNode }) => (
  <ShowOn above="tablet">{children}</ShowOn>
); 