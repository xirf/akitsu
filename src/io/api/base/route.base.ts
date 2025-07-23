import { OpenAPIHono } from '@hono/zod-openapi';
import { Container } from '../../../composition/container';

export interface RouteConfig {
  prefix?: string;
  middleware?: any[];
  requiresAuth?: boolean;
}

export interface RouteSetup {
  setup(app: OpenAPIHono, container?: Container, config?: RouteConfig): void;
}

export abstract class BaseRouteSetup implements RouteSetup {
  protected abstract getRoutePrefix(): string;
  protected abstract getTag(): string;

  abstract setup(app: OpenAPIHono, container?: Container, config?: RouteConfig): void;

  protected getFullPath(path: string, config?: RouteConfig): string {
    const prefix = config?.prefix || this.getRoutePrefix();
    return `${prefix}${path}`;
  }
}
