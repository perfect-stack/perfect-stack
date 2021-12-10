import { Person } from '../domain/person';

export const personsProviders = [
  {
    provide: 'PERSONS_REPOSITORY',
    useValue: Person,
  },
];
