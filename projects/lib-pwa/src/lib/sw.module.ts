import { NgModule } from '@angular/core';
import { ServiceWorkerModule, SwRegistrationOptions } from '@angular/service-worker';
import { EnvironmenterModule } from 'ng-environmenter';
import { Environmenter } from 'ng-environmenter';

function serviceWorkerFactory(environmenter: Environmenter): SwRegistrationOptions {
  const isProduction: boolean = environmenter.getGlobalEnvironment().environment.production;
  return ({
    enabled: isProduction
  });
};

@NgModule({
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js'),
    EnvironmenterModule
  ],
  providers: [
    {
      provide: SwRegistrationOptions,
      useFactory: serviceWorkerFactory,
      deps: [Environmenter]
    }
  ]
})
export class SWModule { }
