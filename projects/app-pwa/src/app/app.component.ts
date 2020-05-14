import { Component, OnInit } from '@angular/core';
import { PwaService } from 'lib-pwa';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    private pwaService: PwaService
  ) { }

  ngOnInit() {
    this.pwaService.fakeBottomSheet();
  }

}
