import { Injectable, signal } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Subject } from 'rxjs';

export type MapTargetKind = 'event' | 'occurrence';
export type MapEditPhase =
  | 'idle'
  | 'updating'
  | 'drawing'
  | 'awaiting-centerpoint'
  | 'quick-move';
export type MapDrawTool = 'point' | 'polyline' | 'polygon';
export type MapSizeMode = 'small' | 'medium' | 'split' | 'fullscreen';

export interface MapEditTarget {
  kind: MapTargetKind;
  index?: number;
  label: string;
  formGroup: UntypedFormGroup;
  geometryAttr: string;
  centerpointAttr: string;
}

export interface MapEditRequest {
  target: MapEditTarget;
  mode: 'geometry' | 'centerpoint';
  drawTool?: MapDrawTool;
}

/**
 * Resolves a MapEditTarget from a child FormGroup (either Location or an Occurrence row inside a FormArray).
 */
export function resolveTargetFromFormGroup(
  formGroup: UntypedFormGroup | null | undefined,
  geometryAttr = 'geometry',
  centerpointAttr = 'centerpoint',
): MapEditTarget | null {
  if (!formGroup) {
    return null;
  }

  const parent = formGroup.parent;
  if (
    parent &&
    (parent instanceof UntypedFormArray ||
      (Array.isArray((parent as any).controls) && typeof (parent as any).at === 'function'))
  ) {
    const controls = (parent as UntypedFormArray).controls;
    const index = controls.indexOf(formGroup);
    const resolvedIndex = index >= 0 ? index : 0;
    return {
      kind: 'occurrence',
      index: resolvedIndex,
      label: `Occurrence #${resolvedIndex + 1}`,
      formGroup,
      geometryAttr,
      centerpointAttr,
    };
  }

  return {
    kind: 'event',
    label: parent ? 'Event Location' : 'Location',
    formGroup,
    geometryAttr,
    centerpointAttr,
  };
}

@Injectable({
  providedIn: 'root',
})
export class MapEditCoordinatorService {
  readonly hasRegisteredMap = signal<boolean>(false);
  readonly activeTarget = signal<MapEditTarget | null>(null);
  readonly editPhase = signal<MapEditPhase>('idle');
  readonly activeDrawTool = signal<MapDrawTool | null>(null);
  readonly hoveredTarget = signal<{ kind: MapTargetKind; index?: number } | null>(null);
  readonly mapSizeMode = signal<MapSizeMode>('small');

  readonly editRequest$ = new Subject<MapEditRequest>();
  readonly focusCard$ = new Subject<number>();
  readonly panToTarget$ = new Subject<MapEditTarget>();
  readonly cancelEdit$ = new Subject<void>();

  registerMap(): void {
    this.hasRegisteredMap.set(true);
  }

  unregisterMap(): void {
    this.hasRegisteredMap.set(false);
    this.activeTarget.set(null);
    this.editPhase.set('idle');
    this.activeDrawTool.set(null);
    this.hoveredTarget.set(null);
    this.mapSizeMode.set('small');
  }

  isTargetActive(
    formGroup: UntypedFormGroup | null | undefined,
    geometryAttr?: string,
  ): boolean {
    const active = this.activeTarget();
    if (!active || !formGroup) {
      return false;
    }
    if (active.formGroup !== formGroup) {
      return false;
    }
    if (geometryAttr && active.geometryAttr !== geometryAttr) {
      return false;
    }
    return this.editPhase() !== 'idle';
  }

  isAwaitingCenterpointFor(formGroup: UntypedFormGroup | null | undefined): boolean {
    const active = this.activeTarget();
    return (
      !!active &&
      !!formGroup &&
      active.formGroup === formGroup &&
      this.editPhase() === 'awaiting-centerpoint'
    );
  }

  editTarget(target: MapEditTarget): void {
    const geomVal = target.formGroup?.get(target.geometryAttr)?.value;
    const hasGeom = geomVal !== null && geomVal !== undefined && geomVal !== '';
    this.activeTarget.set(target);
    this.editPhase.set(hasGeom ? 'updating' : 'drawing');
    this.activeDrawTool.set(hasGeom ? null : 'point');
    this.editRequest$.next({ target, mode: 'geometry' });
  }

  startDraw(tool: MapDrawTool): void {
    this.editPhase.set('drawing');
    this.activeDrawTool.set(tool);
  }

  startSetCenterpoint(target: MapEditTarget): void {
    this.activeTarget.set(target);
    this.editPhase.set('awaiting-centerpoint');
    this.activeDrawTool.set(null);
    this.editRequest$.next({ target, mode: 'centerpoint' });
  }

  setPhase(phase: MapEditPhase): void {
    this.editPhase.set(phase);
    if (phase !== 'drawing') {
      this.activeDrawTool.set(null);
    }
  }

  setHoveredTarget(hovered: { kind: MapTargetKind; index?: number } | null): void {
    this.hoveredTarget.set(hovered);
  }

  exitEdit(): void {
    this.activeTarget.set(null);
    this.editPhase.set('idle');
    this.activeDrawTool.set(null);
    this.cancelEdit$.next();
  }

  focusCard(index: number): void {
    this.focusCard$.next(index);
  }

  panToTarget(target: MapEditTarget): void {
    this.panToTarget$.next(target);
  }

  setMapSizeMode(mode: MapSizeMode): void {
    this.mapSizeMode.set(mode);
  }
}
