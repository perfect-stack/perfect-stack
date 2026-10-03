import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapAttributionService {
  // Holds the formatted attribution HTML/text. Null when no map is active.
  readonly attributionText = signal<string | null>(null);

  setAttribution(text: string | null): void {
    this.attributionText.set(text);
  }

  clearAttribution(): void {
    this.attributionText.set(null);
  }
}
