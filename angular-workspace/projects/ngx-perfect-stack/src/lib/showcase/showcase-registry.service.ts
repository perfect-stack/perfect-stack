import { Injectable } from '@angular/core';
import { ShowcaseItem } from './showcase.model';
import { SHOWCASE_REGISTRATIONS } from './registrations';

@Injectable({
  providedIn: 'root'
})
export class ShowcaseRegistryService {

  private readonly items: ShowcaseItem[] = SHOWCASE_REGISTRATIONS;

  getItems(): ShowcaseItem[] {
    return this.items;
  }

  getCategories(): string[] {
    return Array.from(new Set(this.items.map(i => i.category)));
  }

  getItemsByCategory(category: string): ShowcaseItem[] {
    return this.items.filter(i => i.category === category);
  }

  getItem(id: string): ShowcaseItem | undefined {
    return this.items.find(i => i.id === id);
  }
}
