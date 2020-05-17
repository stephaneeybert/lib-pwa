import { Platform } from '@angular/cdk/platform';
import { Injectable, OnDestroy, SkipSelf, Optional } from '@angular/core';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { timer, Subscription, Observable, interval } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { PwaPromptComponent } from './pwa-prompt.component';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { Environmenter } from 'ng-environmenter';

const CHECK_FOR_INSTALL_DELAY: number = 5000;
const OFFER_TO_INSTALL_DELAY: number = 15000;
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

  public displayPwaInstallPrompt(i18nQuestion: string, i18nCancel: string, i18nInstall: string, i18nIOSInstructions: string) {
    if (this.platform.ANDROID) {
      if (!this.isInStandaloneModeAndroid()) {
        console.log('PWA - Opening the propt install on Android');
        const matBottomSheet: MatBottomSheetRef = this.createBottomSheet(PLATFORM_ANDROID, i18nQuestion, i18nCancel, i18nInstall, '');
        this.openBottomSheet(matBottomSheet);
      }
    } else if (this.platform.IOS) {
      if (!this.isInStandaloneModeIOS()) {
        // Prevent the installation prompt when the app is already installed
        console.log('PWA - Opening the propt install on iOS');
        const matBottomSheet: MatBottomSheetRef = this.createBottomSheet(PLATFORM_IOS, i18nQuestion, i18nCancel, '', i18nIOSInstructions);
        this.openBottomSheet(matBottomSheet);
      }
    } else {
      console.log('PWA - The platform is not supporting PWA installation');
    }
  }

  public checkForBeforeInstallEvents(): void {
    if (this.platform.ANDROID) {
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
  }

  public autoDisplayPwaInstallPrompt(i18nQuestion: string, i18nCancel: string, i18nInstall: string, i18nIOSInstructions: string): void {
    this.pwaPromptForInstallSubscription = timer(OFFER_TO_INSTALL_DELAY)
    .pipe(
      take(1)
    )
    .subscribe(() => {
      if (this.isInstallable() && this.isOfferedAutomaticallyForInstallation()) {
        this.displayPwaInstallPrompt(i18nQuestion, i18nCancel, i18nInstall, i18nIOSInstructions);
      }
    });
  }

  // Called if the application if already installed
  private handleAlreadyInstalledAndroid(event: Event): void {
    console.log('PWA - In handleAlreadyInstalledAndroid');
    console.log(event);
    this.alreadyInstalledEvent = event;
    console.log(this.alreadyInstalledEvent);
  }

  // TODO Do I need this method ?
  // Called when the service worker receives an install event
  private handleServiceWorkerInstallEvent(event: any): void {
    console.log('PWA - In handleServiceWorkerInstallEvent');
    console.log(event);
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
    console.log('PWA - In handleServiceWorkerFetchEvent');
    console.log(event);
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
    const i18nQuestion: string = 'Install on the device ?';
    const i18nCancel: string = 'CANCEL';
    const i18nInstall: string = 'INSTALL';
    const i18nIOSInstructions: string = "To install this web app on your device, tap the Menu button and the 'Add to Home screen' button";
    const matBottomSheet: MatBottomSheetRef = this.createBottomSheet(PLATFORM_ANDROID, i18nQuestion, i18nCancel, i18nInstall, i18nIOSInstructions);
    this.openBottomSheet(matBottomSheet);
  }

  private createBottomSheet(mobilePlatform: 'ios' | 'android', i18nQuestion: string, i18nCancel: string, i18nInstall: string, i18nIOSInstructions: string): MatBottomSheetRef {
    return this.matBottomSheet.open(PwaPromptComponent, {
      ariaLabel: '', // TODO I'm not sure this label is actually used
      data: {
        mobileType: mobilePlatform,
        promptEvent: this.installPromptEvent,
        i18nQuestion: i18nQuestion,
        i18nCancel: i18nCancel,
        i18nInstall: i18nInstall,
        i18nIOSInstructions: i18nIOSInstructions
      }
    });
  }

  private openBottomSheet(bottomSheetRef: MatBottomSheetRef): void {
    this.afterDismissedSubscription = bottomSheetRef.afterDismissed()
    .subscribe((data: any) => {
      console.log('PWA - The bottom sheet has been dismissed.');
    });
  }

  private receivedInstallPromptEventAndroid(): boolean {
    return this.installPromptEvent != null;
  }

  private isInStandaloneModeAndroid(): boolean {
    return matchMedia('(display-mode: standalone)').matches;
  }

  public isNotAutomaticallyOfferedForInstallation$(): Observable<boolean> {
    return interval(CHECK_FOR_INSTALL_DELAY)
      .pipe(
        take(3),
        map((value: number) => {
          return this.isInstallable() && !this.isOfferedAutomaticallyForInstallation();
        })
      );
  }

  private isOfferedAutomaticallyForInstallation(): boolean {
    return this.environmenter.getGlobalEnvironment().environment.pwaInstallPromptAutoDisplay;
  }

  private isInstallable(): boolean {
    if (this.platform.ANDROID) {
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
    if (this.swUpdate.isEnabled) {
      this.pwaCheckForUpdateSubscription = this.swUpdate.available
      .subscribe(() => {
        if (confirm(i18nNewVersionAvailable)) {
          this.screenDeviceService.reloadPage();
        }
      });
    }
  }

}
