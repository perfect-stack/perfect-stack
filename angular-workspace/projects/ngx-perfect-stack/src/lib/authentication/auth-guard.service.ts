import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthenticationService} from './authentication.service';
import {ActionType} from '../domain/meta.role';
import {AuthorizationService} from './authorization.service';
import {Action} from 'rxjs/internal/scheduler/Action';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  actionTypeMap = new Map<string, ActionType>();

  constructor(protected readonly router: Router,
              protected readonly authenticationService: AuthenticationService,
              protected readonly authorizationService: AuthorizationService) {

    this.actionTypeMap.set('search', ActionType.Read);
    this.actionTypeMap.set('search_edit', ActionType.Read);
    this.actionTypeMap.set('view', ActionType.Read)
    this.actionTypeMap.set('edit', ActionType.Edit);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if(this.authenticationService.isLoggedIn) {
      let canActivate = true;
      const actionSubject = this.findActionAndSubjectFromURL(state.url);
      if(actionSubject) {
        console.log(`findActionAndSubjectFromURL: ${actionSubject.action}.${actionSubject.subject}`);
        canActivate = this.authorizationService.checkPermission(actionSubject.action, actionSubject.subject);
      }
      else {
        console.log(`findActionAndSubjectFromURL: NO Action or subject found. Keep calm and carry on.`)
      }

      console.log(`canActivate.1: ${canActivate} ${state.url}`);
      if(canActivate) {
        return canActivate;
      }
      else {
        return this.router.navigate(['/authorization-error']);
      }
    }
    else {
      // Store the attempted URL for redirecting
      this.authenticationService.redirectUrl = state.url;
      console.log(`canActivate.2: FALSE ${state.url}`);
      this.authenticationService.login();
      return this.router.navigate(['/']);
    }
  }

  findActionAndSubjectFromURL(url: string): ActionSubject | null {
    const segments = url.split('/')
    if(url.startsWith('/data/')) {
      const actionSegment = segments[3];
      const subjectSegment = segments[2];
      if(actionSegment && subjectSegment) {
        const action = this.actionTypeMap.get(actionSegment);
        if(action)
        return {
          action: action,
          subject: subjectSegment
        }
      }
      // else return null at the bottom of the method
    }

    // the rule for the meta pages is more about "Menu" access since everyone needs to "Read" the metadata in order
    // for the application to work.
    if(url.startsWith('/meta/')) {
      return {
        action: url.includes('/edit/') ? ActionType.Edit : ActionType.Menu,
        subject: 'Meta'
      }
    }

    return null;
  }
}

class ActionSubject {
  action: ActionType;
  subject: string;
}

