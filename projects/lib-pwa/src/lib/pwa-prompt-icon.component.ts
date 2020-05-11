import { Component, OnInit } from '@angular/core';
import { PwaService } from './pwa.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pwa-prompt-icon',
  templateUrl: './pwa-prompt-icon.component.html',
  styleUrls: ['./pwa-prompt-icon.component.css']
})
export class PwaPromptIconComponent implements OnInit {

  appIsInstallable$?: Observable<boolean>;

  constructor(
    private pwaService: PwaService
  ) { }

  ngOnInit() {
    this.appIsInstallable$ = this.pwaService.appIsInstallable$();
  }

  public displayPwaInstallPrompt(): void {
    this.pwaService.displayPwaInstallPrompt();
  }

}
