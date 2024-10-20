import { NgModule } from '@angular/core';
import { ServiceWorkerModule, SwRegistrationOptions } from '@angular/service-worker';

function serviceWorkerFactory(environment: any): SwRegistrationOptions {
  const isProduction: boolean = environment.production;
  return ({
    enabled: isProduction
  });
};

@NgModule({
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js')
  ],
  providers: [
    {
      provide: SwRegistrationOptions,
      useFactory: serviceWorkerFactory,
      deps: []
    }
  ]
})
export class SWModule { }
