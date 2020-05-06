import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LibPwaModule } from 'lib-pwa';
import { EnvironmentModule } from './environment.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    EnvironmentModule,
    LibPwaModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
