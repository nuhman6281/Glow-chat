import * as React from "react";

// Breakpoint constants matching Tailwind CSS defaults
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const DESKTOP_BREAKPOINT = 1280;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`
    );
    const onChange = () => {
      setIsTablet(
        window.innerWidth >= MOBILE_BREAKPOINT && 
        window.innerWidth < TABLET_BREAKPOINT
      );
    };
    mql.addEventListener("change", onChange);
    setIsTablet(
      window.innerWidth >= MOBILE_BREAKPOINT && 
      window.innerWidth < TABLET_BREAKPOINT
    );
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<
    'mobile' | 'tablet' | 'desktop' | 'wide' | undefined
  >(undefined);

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setBreakpoint('mobile');
      } else if (width < TABLET_BREAKPOINT) {
        setBreakpoint('tablet');
      } else if (width < DESKTOP_BREAKPOINT) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('wide');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}

// Hook for responsive values based on breakpoints
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}): T | undefined {
  const breakpoint = useBreakpoint();
  
  if (!breakpoint) return undefined;
  
  // Return the most specific value available, falling back to mobile
  return values[breakpoint] ?? 
         values.desktop ?? 
         values.tablet ?? 
         values.mobile;
}
