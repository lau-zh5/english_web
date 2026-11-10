import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

export function Portal({ children, containerId = 'portal-root' }: PortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let existingContainer = document.getElementById(containerId);
    
    if (!existingContainer) {
      existingContainer = document.createElement('div');
      existingContainer.id = containerId;
      document.body.appendChild(existingContainer);
    }
    
    setContainer(existingContainer);

    return () => {
      if (existingContainer && !existingContainer.hasChildNodes()) {
        existingContainer.remove();
      }
    };
  }, [containerId]);

  if (!container) return null;

  return createPortal(children, container);
}