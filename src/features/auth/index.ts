import { FeatureMetadata } from '../../composition/features';
import { AuthRunner } from './auth.runner';
import { AuthUnit } from './auth.unit';
import { AuthFx } from './auth.fx';
import * as AuthIO from './auth.io';

export class AuthFeature {
  static readonly metadata: FeatureMetadata = {
    name: 'auth',
    version: '1.0.0',
    dependencies: [],
    optional: false
  };

  constructor(private fx: AuthFx) {}

  getRunner(): AuthRunner {
    const unit = new AuthUnit(this.fx);
    return new AuthRunner(unit);
  }

  getIOSchemas() {
    return AuthIO;
  }
}

export { AuthRunner, AuthUnit, AuthFx };
export * from './auth.io';
