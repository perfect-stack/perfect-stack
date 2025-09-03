import { HttpException } from '@nestjs/common';

export abstract class DataException extends HttpException {}

/**
 * A request was made to lookup data of some kind but the server was unable to find it in the database. In this case
 * we want to return a custom HTTP status code because the Angular SPA web hosting is setup so that 404's redirect
 * to load the index.html page. Returning a different error code allows the client to pop-up a more specific error,
 * returning a 404 would trigger the Angular application to be reloaded.
 *
 * This exception can occur when the URL a user has clicked on to load an entity view page is syntactically valid but
 * uses a UUID for a entity that doesn't exist in the database. Either they have incorrectly copied an emailed link, or
 * the data has been deleted, or they have copied a link from one environment to another.
 *
 * Regardless of how they get the invalid link, the effect is same. To the user it looks a lot like a failed login
 * attempt since they click on the link, the authentication system prompts them to login, then they see an error from
 * the server because it's unable to load the invalid UUID. Prior to this exception being added to the code it would
 * pop up as a generic "Internal Server Error" but now they will get this "Data not found" exception.
 *
 * Since the user likely to see this problem during login then the problem gets reported to support as a login problem
 * but really it's more about how the user got the invalid UUID and should the UUID be available or not.
 */
export class DataNotFound extends DataException {
  constructor() {
    super('Data not found', 444);
  }
}
