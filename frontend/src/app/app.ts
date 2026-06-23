import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TimeService } from './core/services/time.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private timeService = inject(TimeService);

  ngOnInit() {
    this.timeService.syncWithServer();
  }
}
