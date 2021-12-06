import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, switchMap} from 'rxjs';
import {Person} from '../../domain/person';
import {PersonService} from '../person-service/person.service';

@Component({
  selector: 'app-person-view',
  templateUrl: './person-view.component.html',
  styleUrls: ['./person-view.component.css']
})
export class PersonViewComponent implements OnInit {

  public personId: string | null;
  public person$: Observable<Person>;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly personService: PersonService) {
  }

  ngOnInit(): void {
    this.person$ = this.route.paramMap.pipe(switchMap(params => {
      this.personId = params.get('id');
      console.log(`personId = ${this.personId}`);
      return this.personService.findById(this.personId);
    }));
  }

  onEdit() {
    this.router.navigate(['/person/edit/', this.personId]);
  }

  onCancel() {
    this.router.navigate(['person/search']);
  }
}
