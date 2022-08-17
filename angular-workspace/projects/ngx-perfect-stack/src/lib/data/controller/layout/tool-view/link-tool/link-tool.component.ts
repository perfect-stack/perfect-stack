import {Component, Input, OnInit} from '@angular/core';
import {LinkTool} from '../../../../../domain/meta.page';
import {FormContext} from '../../../../data-edit/form-service/form.service';
import {PropertySheetService} from '../../../../../template/property-sheet/property-sheet.service';
import {ExpressionService} from '../../controls/expression-control/expression.service';
import {EventService} from '../../../../../event/event.service';
import {Router} from '@angular/router';

@Component({
  selector: 'lib-link-tool',
  templateUrl: './link-tool.component.html',
  styleUrls: ['./link-tool.component.css']
})
export class LinkToolComponent implements OnInit {

  @Input()
  linkTool: LinkTool;

  @Input()
  ctx: FormContext;

  @Input()
  editorMode = false;

  linkFragments: LinkFragment[];

  constructor(protected readonly propertySheetService: PropertySheetService,
              protected readonly expressionService: ExpressionService,
              protected readonly eventService: EventService,
              protected readonly router: Router) { }

  ngOnInit(): void {
    console.log(`LinkTool processing: ${this.linkTool.text}`);
    this.linkFragments = [];

    const text = this.linkTool.text;

    // cursor equals start of text
    let cursor = 0;

    // look for the first marker
    let marker = '<a>';

    do {
      let markerIdx = text.indexOf(marker, cursor);

      // fragment type equals = Text if searching for <a> because there is "text" in front of the <a>
      const fragmentType = marker === '<a>' ? LinkFragmentType.Text : LinkFragmentType.Link;

      // if found then fragment = from cursor to start of marker
      if(markerIdx >= 0) {
        // if fragment length > 0 then add fragment with fragment type
        const fragmentText = text.substring(cursor, markerIdx);
        if(fragmentText.length > 0) {
          this.linkFragments.push({
            type: fragmentType,
            text: fragmentText,
          });
        }
        // else fragment text length could be zero if the text starts with the marker - so just ignore and keep going.

        // move cursor to end of marker
        cursor = markerIdx + marker.length;

        // switch to the next marker type
        marker = marker === '<a>' ? '</a>' : '<a>';
      }
      else {
        // no more markers found so push all remaining text with current fragment type
        const fragmentText = text.substring(cursor, text.length);
        if(fragmentText.length > 0) {
          this.linkFragments.push({
            type: fragmentType,
            text: fragmentText
          });
        }
        // else fragment text length could be zero if the text starts with the marker - so just ignore and keep going.

        // move cursor to the end of the text
        cursor = text.length;
      }
      // do while cursor < text length
    } while (cursor < text.length);

    console.log('LinkFragments:', this.linkFragments);
  }

  onClick($event: MouseEvent) {
    $event.preventDefault();
    if(this.editorMode) {
      this.doEditorAction();
    }
    else {
      this.doApplicationAction();
    }
  }

  doEditorAction() {
    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit('Link', this.linkTool);
  }

  doApplicationAction() {
    if(this.linkTool.action) {
      this.eventService.dispatchOnAction(this.ctx.metaPage.name, this.ctx, this.linkTool.action);
    }
    else if(this.linkTool.route) {

      let route = this.linkTool.route;

      console.log('route before evaluate()', route);
      route = this.expressionService.evaluate(route, this.ctx.dataMap);
      console.log('route after evaluate()', route);

      this.router.navigateByUrl(route);
    }
  }
}

export enum LinkFragmentType {
  Text = 'Text',
  Link = 'Link'
}

export class LinkFragment {
  type: LinkFragmentType;
  text: string;
}
