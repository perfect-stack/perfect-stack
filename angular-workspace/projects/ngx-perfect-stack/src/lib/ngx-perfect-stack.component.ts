import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-ngx-perfect-stack',
  template: `
    <p>
      ngx-perfect-stack works!
    </p>

    <button class="btn btn-primary" (click)="onClick()" >Click Me</button>
  `,
  styles: [
  ]
})
export class NgxPerfectStackComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  onClick() {
    console.log(`I have been clicked at: ${Date.now()}`);
  }
}
