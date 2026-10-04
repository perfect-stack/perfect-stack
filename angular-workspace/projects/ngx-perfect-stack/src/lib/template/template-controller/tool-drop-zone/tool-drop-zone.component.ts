import {ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {Template, TemplateLocationType, Tool} from '../../../domain/meta.page';
import {PropertyListMap, PropertySheetService} from '../../property-sheet/property-sheet.service';
import {DragService} from '../../../utils/dragdrop/drag.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'lib-tool-drop-zone',
    templateUrl: './tool-drop-zone.component.html',
    styleUrls: ['./tool-drop-zone.component.css'],
    standalone: false
})
export class ToolDropZoneComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  template: Template;

  @Input()
  templateLocationType: TemplateLocationType;

  @Input()
  editorMode = false;

  @Output()
  toolChanged = new EventEmitter<void>();

  tool: Tool;
  isDragging = false;
  private dragSub: Subscription;

  constructor(
    protected propertySheetService: PropertySheetService,
    protected dragService: DragService,
    protected changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.updateTool();
    this.isDragging = this.dragService.isDragging;
    this.dragSub = this.dragService.dragInProgress$.subscribe((status: string) => {
      this.isDragging = status === 'started';
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateTool();
  }

  ngOnDestroy(): void {
    this.dragSub?.unsubscribe();
  }

  private updateTool() {
    if(this.template && this.template.locations && this.templateLocationType) {
      this.tool = this.template.locations[this.templateLocationType]!;
    }
  }

  getLocationLabel(): string {
    switch (this.templateLocationType) {
      case TemplateLocationType.TopRight:
        return 'Top Right';
      case TemplateLocationType.BottomLeft:
        return 'Bottom Left';
      case TemplateLocationType.BottomMiddle:
        return 'Bottom Middle';
      case TemplateLocationType.BottomRight:
        return 'Bottom Right';
      default:
        return '';
    }
  }

  onDropEvent($event: any) {
    console.log('ToolDropZoneComponent.onDropEvent()', $event);
    if(!this.template) {
      throw new Error(`No template has been supplied for this drop zone`);
    }

    if(!this.templateLocationType) {
      throw new Error(`No templateLocation has been supplied for this drop zone`);
    }

    if(!Tool.isTool($event)) {
      console.warn('Dropped object is not a Tool', $event);
      return;
    }

    const toolPrototype = $event as Tool;
    this.tool = Object.assign({}, toolPrototype);

    // trigger the PropertySheetService to start editing it
    this.propertySheetService.edit(this.tool.type, this.tool);

    // just in time, create the map if needed
    if(!this.template.locations) {
      this.template.locations = {};
    }

    // now assign the tool to the locations map
    this.template.locations[this.templateLocationType] = this.tool;
    this.changeDetectorRef.detectChanges();
    this.toolChanged.emit();
  }

  onRemoveTool($event: MouseEvent) {
    $event.stopPropagation();
    if(this.template && this.template.locations && this.templateLocationType) {
      delete this.template.locations[this.templateLocationType];
      this.tool = undefined as any;
      this.changeDetectorRef.detectChanges();
      this.toolChanged.emit();
    }
  }
}
