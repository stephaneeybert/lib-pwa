import { Component, OnInit } from '@angular/core';
import { PwaService } from './pwa.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pwa-prompt-icon',
  templateUrl: './pwa-prompt-icon.component.html',
  styleUrls: ['./pwa-prompt-icon.component.css']
})
export class PwaPromptIconComponent implements OnInit {

  isPromptableForInstallation$?: Observable<boolean>;

  constructor(
    private pwaService: PwaService
  ) { }

  ngOnInit() {
    this.isPromptableForInstallation$ = this.pwaService.isPromptableForInstallation$();
  }

  public displayPwaInstallPrompt(): void {
    this.pwaService.displayPwaInstallPrompt();
  }

}
