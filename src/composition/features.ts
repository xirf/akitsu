export interface FeatureConfig {
  enabled: boolean;
  dependencies?: string[];
  version?: string;
}

export interface FeatureMetadata {
  name: string;
  version: string;
  dependencies: string[];
  optional: boolean;
}

export const FEATURES: Record<string, FeatureConfig> = {
  auth: { 
    enabled: true, 
    version: '1.0.0' 
  },
  apikey: {
    enabled: true,
    dependencies: ['auth'],
    version: '1.0.0'
  },
  content: { 
    enabled: true, 
    dependencies: ['auth'], 
    version: '1.0.0' 
  },
  media: { 
    enabled: true, 
    dependencies: ['auth'], 
    version: '1.0.0' 
  },
  analytics: { 
    enabled: false, 
    dependencies: ['auth'], 
    version: '1.0.0' 
  }
};

export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, config]) => config.enabled)
    .map(([name]) => name);
}

export function validateFeatureDependencies(): void {
  const enabled = getEnabledFeatures();
  
  for (const featureName of enabled) {
    const config = FEATURES[featureName];
    if (config.dependencies) {
      for (const dep of config.dependencies) {
        if (!enabled.includes(dep)) {
          throw new Error(`Feature '${featureName}' requires '${dep}' to be enabled`);
        }
      }
    }
  }
}
