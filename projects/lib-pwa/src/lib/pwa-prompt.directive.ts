import { Directive, HostListener, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { PwaService } from './pwa.service';
import { Subject, Subscription } from 'rxjs';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';
import { delay } from 'rxjs/operators';

@Directive({
  selector: '[appPwaPrompt]'
})
export class PwaPromptDirective implements OnInit, OnDestroy {

  private clicks = new Subject();
  private clickSubscription?: Subscription;
  private isPromptableForInstallationSubscription?: Subscription;

  constructor(
    private elementRef: ElementRef,
    private pwaService: PwaService,
    private screenDeviceService: ScreenDeviceService
  ) { }

  ngOnInit() {
    this.observeAppIsInstallable();

    // Handle a click on the element containing the directive
    this.clickSubscription = this.clicks
    .subscribe((event: any) => {
      this.pwaService.displayPwaInstallPrompt();
    });
  }

  ngOnDestroy() {
    if (this.isPromptableForInstallationSubscription) {
      this.isPromptableForInstallationSubscription.unsubscribe();
    }
    if (this.clickSubscription) {
      this.clickSubscription.unsubscribe();
    }
  }

  @HostListener('click', ['$event'])
  onClickEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }

  private observeAppIsInstallable(): void {
    this.isPromptableForInstallationSubscription = this.pwaService.isPromptableForInstallation$()
    .pipe(
      delay(500)
      ).subscribe((isInstallable: boolean) => {
        if (isInstallable) {
          this.screenDeviceService.showElement(this.elementRef);
        } else {
          this.screenDeviceService.hideElement(this.elementRef);
        }
      });
  }

}
