import {FormContext} from '../data/data-edit/form-service/form.service';

export interface ActionListener {
  onAction(ctx: FormContext, channel: string, action: string): void;
}
