import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export default function ThemeStyles() {
  const { data: systemSettings } = trpc.settings.getSystemSettings.useQuery(undefined, {
    staleTime: Infinity, // Keep it cached as it rarely changes
  });

  useEffect(() => {
    if (!systemSettings?.primaryColor) return;

    const styleId = 'custom-brand-styles';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    // Update the CSS variables
    // We update --primary and --ring to keep focus rings consistent
    styleTag.innerHTML = `
      :root {
        --primary: ${systemSettings.primaryColor} !important;
        --ring: ${systemSettings.primaryColor} !important;
      }
      .dark {
        --primary: ${systemSettings.primaryColor} !important;
        --ring: ${systemSettings.primaryColor} !important;
      }
    `;
  }, [systemSettings?.primaryColor]);

  return null;
}
