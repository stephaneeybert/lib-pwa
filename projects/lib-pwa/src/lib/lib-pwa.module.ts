import { NgModule, APP_INITIALIZER } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';

import { MaterialModule } from './material.module';
import { PwaService } from './pwa.service';
import { PwaPromptComponent } from './pwa-prompt.component';
import { MAT_BOTTOM_SHEET_DEFAULT_OPTIONS } from '@angular/material/bottom-sheet';
import { PwaPromptIconComponent } from './pwa-prompt-icon.component';
import { LibI18nModule } from 'lib-i18n';
import { LibCoreModule } from 'lib-core';
import { BrowserModule } from '@angular/platform-browser';
import { PwaPromptDirective } from './pwa-prompt.directive';
import { environment } from '../environments/environment';

const checkForBeforeInstallEvents: Function = (pwaService: PwaService) => () => pwaService.checkForBeforeInstallEvents();
const pwaCheckForUpdateFactory: Function = (pwaService: PwaService) => () => pwaService.checkForAppUpdate();

@NgModule({
  declarations: [
    PwaPromptDirective,
    PwaPromptIconComponent,
    PwaPromptComponent
  ],
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    MaterialModule,
    BrowserModule,
    LibI18nModule,
    LibCoreModule
  ],
  exports: [
    BrowserModule,
    MaterialModule,
    PwaPromptDirective,
    PwaPromptIconComponent,
    PwaPromptComponent
  ],
  providers: [
    {
      provide: MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: false
      }
    },
    {
      provide: APP_INITIALIZER,
      useFactory: checkForBeforeInstallEvents,
      deps: [PwaService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: pwaCheckForUpdateFactory,
      deps: [PwaService],
      multi: true
    }
  ]
})
export class LibPwaModule { }
