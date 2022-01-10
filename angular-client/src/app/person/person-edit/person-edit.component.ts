import {Component, OnInit, ViewChild} from '@angular/core';
import {Observable, switchMap} from 'rxjs';
import {Person} from '../../domain/person';
import {ActivatedRoute, Router} from '@angular/router';
import {PersonService} from '../person-service/person.service';
import {FormControl, FormGroup, NgForm} from '@angular/forms';

@Component({
  selector: 'app-person-edit',
  templateUrl: './person-edit.component.html',
  styleUrls: ['./person-edit.component.css']
})
export class PersonEditComponent implements OnInit {
  @ViewChild('form') form: NgForm;
  public personId: string | null;
  public person$: Observable<Person>;

  personForm = new FormGroup({
    id: new FormControl(''),
    given_name: new FormControl(''),
    family_name: new FormControl(''),
    email_address: new FormControl(''),
  });

  constructor(protected readonly route: ActivatedRoute,
              protected readonly router: Router,
              protected readonly personService: PersonService) {
  }

  ngOnInit(): void {
    this.person$ = this.route.paramMap.pipe(switchMap(params => {
      this.personId = params.get('id');
      return this.personService.findById(this.personId);
    }));

    this.person$.subscribe((person) => {
      if(person) {
        console.log(`About to set form value: ${JSON.stringify(person)}`);
        this.personForm.patchValue(person);
      }
    });
  }


  onSubmit() {
    const personData = this.personForm.value;
    console.log(`onSubmit: ${JSON.stringify(personData)}`);
    this.personService.update(personData).subscribe(() => {
      console.log(`person save completed`);
      this.onCancel();
    });
  }

  onCancel() {
    this.router.navigate(['person/view', this.personId]);
  }
}
