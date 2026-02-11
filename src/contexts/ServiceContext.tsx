/**
 * Service Context
 *
 * Provides dependency injection for services.
 * Makes it easy to swap localStorage implementations with API implementations later.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { ILevelService } from '../services/interfaces/ILevelService';
import type { IProgressService } from '../services/interfaces/IProgressService';
import type { INumberGenerator } from '../services/interfaces/INumberGenerator';
import { localLevelService } from '../services/LocalLevelService';
import { localProgressService } from '../services/LocalProgressService';
import { numberGenerator } from '../services/NumberGenerator';

/**
 * Service container interface
 */
export interface Services {
  levelService: ILevelService;
  progressService: IProgressService;
  numberGenerator: INumberGenerator;
}

/**
 * Default services using local implementations
 */
const defaultServices: Services = {
  levelService: localLevelService,
  progressService: localProgressService,
  numberGenerator: numberGenerator,
};

/**
 * Service context
 */
const ServiceContext = createContext<Services>(defaultServices);

/**
 * Service provider props
 */
interface ServiceProviderProps {
  children: ReactNode;
  services?: Partial<Services>;
}

/**
 * Service provider component
 *
 * Wrap your app with this to provide services.
 * Pass custom services prop to override defaults (e.g., for testing or API implementations).
 */
export function ServiceProvider({ children, services }: ServiceProviderProps) {
  const mergedServices: Services = {
    ...defaultServices,
    ...services,
  };

  return (
    <ServiceContext.Provider value={mergedServices}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access all services
 */
export function useServices(): Services {
  return useContext(ServiceContext);
}

/**
 * Hook to access level service
 */
export function useLevelService(): ILevelService {
  return useContext(ServiceContext).levelService;
}

/**
 * Hook to access progress service
 */
export function useProgressService(): IProgressService {
  return useContext(ServiceContext).progressService;
}

/**
 * Hook to access number generator
 */
export function useNumberGenerator(): INumberGenerator {
  return useContext(ServiceContext).numberGenerator;
}
