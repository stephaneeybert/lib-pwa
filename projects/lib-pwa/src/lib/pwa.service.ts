import { Platform } from '@angular/cdk/platform';
import { Injectable, OnDestroy, SkipSelf, Optional } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { timer, Subscription, Observable, interval } from 'rxjs';
import { take, map, filter } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { PwaPromptComponent } from './pwa-prompt.component';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { Environmenter } from 'ng-environmenter';

const PROMPT_DELAY: number = 3000;
const PLATFORM_ANDROID: 'android' = 'android';
const PLATFORM_IOS: 'ios' = 'ios';

@Injectable({
  providedIn: 'root'
})
export class PwaService implements OnDestroy {

  private installPromptEvent?: Event;
  private alreadyInstalledEvent?: Event;

  private pwaPromptForInstallSubscription?: Subscription;
  private pwaCheckForUpdateSubscription?: Subscription;
  private afterDismissedSubscription?: Subscription;

  constructor(
    // Ensure the service is injected only once
    @Optional() @SkipSelf() pwaService: PwaService,
    private matBottomSheet: MatBottomSheet,
    private platform: Platform,
    private swUpdate: SwUpdate,
    private screenDeviceService: ScreenDeviceService,
    private environmenter: Environmenter
  ) {
    if (pwaService) {
      throw new Error('The PWA service has ALREADY been injected.');
    }
  }

  ngOnDestroy() {
    if (this.pwaPromptForInstallSubscription != null) {
      this.pwaPromptForInstallSubscription.unsubscribe();
    }
    if (this.pwaCheckForUpdateSubscription != null) {
      this.pwaCheckForUpdateSubscription.unsubscribe();
    }
    if (this.afterDismissedSubscription != null) {
      this.afterDismissedSubscription.unsubscribe();
    }

    window.removeEventListener('beforeinstallprompt', this.handleBbeforeInstallAndroid);
    window.removeEventListener('appinstalled', this.handleAlreadyInstalledAndroid);
    self.removeEventListener('install', this.handleServiceWorkerInstallEvent);
    self.removeEventListener('fetch', this.handleServiceWorkerFetchEvent);
  }

  public displayPwaInstallPrompt(i18nCancel: string, i18nInstall: string, i18nIOSInstructions: string) {
    console.log('PWA - Is not standalone app yet');
    if (this.platform.ANDROID) {
      if (!this.isInStandaloneModeAndroid()) {
        console.log('PWA - Opening the propt install on Android');
        const matBottomSheet: MatBottomSheetRef = this.createBottomSheet(PLATFORM_ANDROID, i18nCancel, i18nInstall, '');
        this.openBottomSheet(matBottomSheet);
      }
    } else if (this.platform.IOS) {
      if (!this.isInStandaloneModeIOS()) {
        // Prevent the installation prompt when the app is already installed
        console.log('PWA - Opening the propt install on iOS');
        const matBottomSheet: MatBottomSheetRef = this.createBottomSheet(PLATFORM_IOS, i18nCancel, '', i18nIOSInstructions);
        this.openBottomSheet(matBottomSheet);
      }
    } else {
      console.log('PWA - The platform is not supporting PWA installation');
    }
  }

  public checkForBeforeInstallEvents(): void {
    console.log('PWA - In checkForBeforeInstallEvents');
    if (this.platform.ANDROID) {
      console.log('PWA - Is on Android and is not standalone: ' + !this.isInStandaloneModeAndroid());
      if (!this.isInStandaloneModeAndroid()) {
        console.log('PWA - Listening on the install prompt event on Android');
        // Explicitly bind the service instance this reference to the handler
        // as the default this keyword in event handler functions references
        // the DOM window and not the class instance
        window.addEventListener('beforeinstallprompt', this.handleBbeforeInstallAndroid.bind(this));
        window.addEventListener('appinstalled', this.handleAlreadyInstalledAndroid.bind(this));
        self.addEventListener('install', this.handleServiceWorkerInstallEvent.bind(this));
        self.addEventListener('fetch', this.handleServiceWorkerFetchEvent.bind(this));
      }
    } else if (this.platform.IOS) {
    } else {
    }
  }

  // Called if the application is sent an event before offering the user to install it on the device
  private handleBbeforeInstallAndroid(event: Event): void {
    // Prevent the default dialog from opening before our custom dialog
    event.preventDefault();
    // Keep the install prompt event for latter use
    this.installPromptEvent = event;
    console.log('PWA - Received and saved the install prompt event on Android');
  }

  public autoDisplayPwaInstallPrompt(i18nCancel: string, i18nInstall: string, i18nIOSInstructions: string): void {
    console.log('PWA - In autoDisplayPwaInstallPrompt');
    if (this.isInstallable() && this.isDisplayedAutomatically()) {
      this.pwaPromptForInstallSubscription = timer(PROMPT_DELAY)
        take(10)
      .subscribe(() => {
        this.displayPwaInstallPrompt(i18nCancel, i18nInstall, i18nIOSInstructions);
      });
    }
  }

  // Called if the application if already installed
  private handleAlreadyInstalledAndroid(event: Event): void {
    this.alreadyInstalledEvent = event;
    console.log('PWA - The application is already installed');
    console.log(this.alreadyInstalledEvent);
  }

  // Called when the service worker receives an install event
  private handleServiceWorkerInstallEvent(event: any): void {
    event.waitUntil(
      caches.open('v1').then(function(cache) {
        console.log('PWA - Caching custom resources for the service worker');
        return cache.addAll([
          './index.html', // Caching the resource specified in the start_url in the manifest file
          // is a prerequisite to receiving the beforeinstallprompt event from the browser
        ]);
      })
    );
  }

  // Called when the service worker receives a fetch event
  // Listening to the fetch event is a prerequisite to receiving the beforeinstallprompt event from the browser
  private handleServiceWorkerFetchEvent(event: any): void {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        if (response) {
          console.log('PWA - Found response in cache:', response);
          return response;
        }
        console.log('PWA - No response found in cache. About to fetch from network...');
        return fetch(event.request).then(function(response) {
          console.log('PWA - Response from network is:', response);
          return response;
        }, function(error) {
          console.error('PWA - Fetching failed:', error);
          throw error;
        });
      })
    );
  }

  public fakeBottomSheet(): void {
    const matBottomSheet: MatBottomSheetRef = this.createBottomSheet(PLATFORM_ANDROID, 'CANCEL', 'INSTALL', 'To install this web app on your device, tap the Menu button and the \'Add to Home screen\' button');
    this.openBottomSheet(matBottomSheet);
  }

  private createBottomSheet(mobilePlatform: 'ios' | 'android', i18nCancel: string, i18nInstall: string, i18nIOSInstructions: string): MatBottomSheetRef {
    return this.matBottomSheet.open(PwaPromptComponent, {
      ariaLabel: '', // TODO I'm not sure this label is actually used
      data: {
        mobileType: mobilePlatform,
        promptEvent: this.installPromptEvent,
        i18nCancel: i18nCancel,
        i18nInstall: i18nInstall,
        i18nIOSInstructions: i18nIOSInstructions
      }
    });
  }

  private openBottomSheet(bottomSheetRef: MatBottomSheetRef): void {
    this.afterDismissedSubscription = bottomSheetRef.afterDismissed().subscribe(() => {
      console.log('PWA - The bottom sheet has been dismissed.');
    });
  }

  private receivedInstallPromptEventAndroid(): boolean {
    console.log('PWA - Check if received install prompt event');
    return this.installPromptEvent != null;
  }

  private isInStandaloneModeAndroid(): boolean {
    console.log('PWA - Check if in standalone mode ' + matchMedia('(display-mode: standalone)').matches);
    return matchMedia('(display-mode: standalone)').matches;
  }

  public isPromptableForInstallation$(): Observable<boolean> {
    console.log('PWA - In isPromptableForInstallation');
    return interval(PROMPT_DELAY)
      .pipe(
        take(10),
        map((value: number) => {
          console.log('PWA - Is promptable for installation ? ' + this.isInstallable() && !this.isDisplayedAutomatically());
          return this.isInstallable() && !this.isDisplayedAutomatically();
        }),
          console.log('PWA - returning isPromptable: ' + isPromptable);
      );
  }

  private isDisplayedAutomatically(): boolean {
    console.log('PWA - Is displayed automatically ? ' + this.environmenter.getGlobalEnvironment().environment.pwaInstallPromptAutoDisplay);
    return this.environmenter.getGlobalEnvironment().environment.pwaInstallPromptAutoDisplay;
  }

  private isInstallable(): boolean {
    console.log('PWA - Check if is installable');
    if (this.platform.ANDROID) {
      console.log('PWA - Check if android is installable');
      return this.receivedInstallPromptEventAndroid() && !this.isInStandaloneModeAndroid();
    } else if (this.platform.IOS) {
      return this.isInStandaloneModeIOS();
    } else {
      return false;
    }
  }

  private isInStandaloneModeIOS(): boolean {
    return ('standalone' in window.navigator) && (window.navigator['standalone']);
  }

  public checkForAppUpdate(i18nNewVersionAvailable: string): void {
    console.log('PWA - In checkForAppUpdate');
    if (this.swUpdate.isEnabled) {
      console.log('PWA - Update is enabled');
      this.pwaCheckForUpdateSubscription = this.swUpdate.available
        .subscribe(() => {
          console.log('PWA - Offering a new version');
          if (confirm(i18nNewVersionAvailable)) {
            this.screenDeviceService.reloadPage();
          }
        });
    }
  }

}
