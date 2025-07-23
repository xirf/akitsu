import { D1ContentRepository } from '../infra/content/d1-content';

export interface AppEnv extends Record<string, any> {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface ServiceContainer {
  database: D1Database;
  jwtSecret: string;
  environment: string;
}

export class Container {
  private services = new Map<string, any>();
  
  constructor(private env: AppEnv) {
    this.initialize();
  }
  
  private initialize() {
    // Register core services
    this.register('database', this.env.DB);
    this.register('jwtSecret', this.env.JWT_SECRET);
    this.register('environment', this.env.ENVIRONMENT);
    
    // Register content services
    const contentRepository = new D1ContentRepository(this.env.DB);
    this.register('contentRepository', contentRepository);
  }
  
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }
  
  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not found in container`);
    }
    return service as T;
  }
  
  getServiceContainer(): ServiceContainer {
    return {
      database: this.get('database'),
      jwtSecret: this.get('jwtSecret'),
      environment: this.get('environment')
    };
  }
}
