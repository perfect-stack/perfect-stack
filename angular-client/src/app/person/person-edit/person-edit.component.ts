import {Component, OnInit, ViewChild} from '@angular/core';
import {map, Observable, switchMap} from 'rxjs';
import {Person} from '../../domain/person';
import {ActivatedRoute, Router} from '@angular/router';
import {PersonService} from '../person-service/person.service';
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-person-edit',
  templateUrl: './person-edit.component.html',
  styleUrls: ['./person-edit.component.css']
})
export class PersonEditComponent implements OnInit {
  @ViewChild('form') form: NgForm;
  public personId: string | null;
  public person$: Observable<Person>;

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly personService: PersonService) {
  }

  ngOnInit(): void {
    this.person$ = this.route.paramMap.pipe(switchMap(params => {
      this.personId = params.get('id');
      return this.personService.findById(this.personId);
    }));
  }


  onSubmit(person: Person) {
    console.log(`onSubmit: ${JSON.stringify(person)}`);
    this.personService.save(person).subscribe(() => {
      console.log(`person save completed`);
      this.onCancel();
    });
  }

  onCancel() {
    this.router.navigate(['person/view', this.personId]);
  }
}
