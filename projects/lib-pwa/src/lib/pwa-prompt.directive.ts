import { Directive, HostListener, OnInit, OnDestroy, ElementRef, Input } from '@angular/core';
import { PwaService } from './pwa.service';
import { Subject, Subscription } from 'rxjs';
import { ScreenDeviceService } from '@stephaneeybert/lib-core';

@Directive({
  selector: '[appPwaPrompt]'
})
export class PwaPromptDirective implements OnInit, OnDestroy {

  @Input() i18nCancel: string = '';
  @Input() i18nInstall: string = '';
  @Input() i18nIOSInstructions: string = '';

  private clicks = new Subject();
  private clickSubscription?: Subscription;
  private isPromptableForInstallationSubscription?: Subscription;

  constructor(
    private elementRef: ElementRef,
    private pwaService: PwaService,
    private screenDeviceService: ScreenDeviceService
  ) { }

  ngOnInit() {
    this.isPromptableForInstallation();

    // Handle a click on the element containing the directive
    this.clickSubscription = this.clicks
    .subscribe((event: any) => {
      this.pwaService.displayPwaInstallPrompt(this.i18nCancel, this.i18nInstall, this.i18nIOSInstructions);
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

  private isPromptableForInstallation(): void {
    this.isPromptableForInstallationSubscription = this.pwaService.isPromptableForInstallation$()
    .subscribe((isPromptable: boolean) => {
      if (isPromptable) {
        this.screenDeviceService.showElement(this.elementRef);
      } else {
        this.screenDeviceService.hideElement(this.elementRef);
      }
    });
  }

}
