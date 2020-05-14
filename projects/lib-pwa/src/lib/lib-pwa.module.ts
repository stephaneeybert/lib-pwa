import { NgModule, APP_INITIALIZER } from '@angular/core';
import { MaterialModule } from './material.module';
import { PwaService } from './pwa.service';
import { PwaPromptComponent } from './pwa-prompt.component';
import { MAT_BOTTOM_SHEET_DEFAULT_OPTIONS } from '@angular/material/bottom-sheet';
import { LibCoreModule } from '@stephaneeybert/lib-core';
import { BrowserModule } from '@angular/platform-browser';
import { PwaPromptDirective } from './pwa-prompt.directive';
import { SWModule } from './sw.module';

const checkForBeforeInstallEvents: Function = (pwaService: PwaService) => () => pwaService.checkForBeforeInstallEvents();

@NgModule({
  declarations: [
    PwaPromptDirective,
    PwaPromptComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    LibCoreModule,
    SWModule
  ],
  exports: [
    BrowserModule,
    MaterialModule,
    PwaPromptDirective,
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
    }
  ]
})
export class LibPwaModule { }
