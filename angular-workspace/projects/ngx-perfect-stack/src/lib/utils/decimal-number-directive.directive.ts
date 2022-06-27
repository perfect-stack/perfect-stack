import {Directive, ElementRef, HostListener, Input} from '@angular/core';

/**
 * https://stackoverflow.com/questions/50722368/limit-input-field-to-two-decimal-places-angular-5
 */
@Directive({
  selector: '[libDecimalNumberDirective]'
})
export class DecimalNumberDirectiveDirective {

  @Input()
  scale: number | undefined;

  private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', '-', 'ArrowLeft', 'ArrowRight', 'Del', 'Delete'];

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

    if(this.scale || this.scale === 0) {
      // Allow Copy & Paste key combos
      if((event.ctrlKey || event.metaKey) && event.keyCode == 67) {
        console.log('CTRL + C');
        return;
      }

      if((event.ctrlKey || event.metaKey) && event.keyCode == 86) {
        console.log('CTRL +  V');
        return;
      }

      // Allow Backspace, tab, end, and home keys
      if (this.specialKeys.indexOf(event.key) !== -1) {
        return;
      }

      // create a preview of what next value will be
      let current: string = this.el.nativeElement.value;
      const position = this.el.nativeElement.selectionStart;
      const next: string = [current.slice(0, position), event.key == 'Decimal' ? '.' : event.key, current.slice(position)].join('');

      // if we don't like what the next value will look like then prevent it from happening
      //const regex: RegExp = new RegExp(/^\d*\.?\d{0,2}$/g);
      const regex: RegExp = new RegExp('^\\d*\\.?\\d{0,' + this.scale + '}$', 'g');
      if (next && !String(next).match(regex)) {
        event.preventDefault();
      }
    }
  }

}
