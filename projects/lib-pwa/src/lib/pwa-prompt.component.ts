import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

type matBottomSheetDataType = {
  mobileType: 'ios' | 'android',
  promptEvent: any,
  i18nCancel: string,
  i18nInstall: string,
  i18nIOSInstructions: string
};

type UserChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

@Component({
  selector: 'app-pwa-prompt',
  templateUrl: './pwa-prompt.component.html',
  styleUrls: ['./pwa-prompt.component.scss']
})
export class PwaPromptComponent implements OnInit {

  i18nCancel?: string;
  i18nInstall?: string;
  i18nIOSInstructions?: string;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) private ariaLabel: string, // TODO
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: matBottomSheetDataType,
    private matBottomSheetRef: MatBottomSheetRef<PwaPromptComponent>
  ) { }

  public ngOnInit() {
    this.i18nCancel = this.data.i18nCancel;
    this.i18nInstall = this.data.i18nInstall;
    this.i18nIOSInstructions = this.data.i18nIOSInstructions;
  }

  public installPwaAndroid(event: MouseEvent): void {
    console.log(this.data);
    console.log(event);
    this.data.promptEvent.prompt();
    this.data.promptEvent.userChoice.then((userChoice: UserChoice) => {
      switch (userChoice.outcome) {
        case 'accepted':
          console.log('PWA - User accepted the prompt and installed the app');
          break;
        case 'dismissed':
          console.log('PWA - User dismissed the prompt and did not install the app');
          break;
      }
      this.data.promptEvent = null;
    })
    .catch((error: Error) => {
      console.error("PWA - The user could not be prompted to install the application", error);
    });
    this.cancel();
  }

  public cancel() {
    this.matBottomSheetRef.dismiss();
  }

}
