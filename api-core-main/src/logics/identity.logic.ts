import { isValid, isEqual } from 'date-fns';
import { ValidationDataInput } from '../schemas/identity.schema';

export default class IdentityLogic {
  public static validate(
    requestPayload: ValidationDataInput,
    responsePayload: ValidationDataInput,
  ) {
    const response = {
      lastName: {
        matched: false,
      },
      firstName: {
        matched: false,
      },
      dateOfBirth: {
        matched: false,
      },
    };

    if (!requestPayload) {
      return response;
    }

    if (!responsePayload) {
      return response;
    }

    if (IdentityLogic.matchName(requestPayload?.firstName, responsePayload?.firstName)) {
      response.firstName.matched = true;
    }

    if (IdentityLogic.matchName(requestPayload?.lastName, responsePayload?.lastName)) {
      response.lastName.matched = true;
    }

    if (requestPayload?.dateOfBirth) {
      if (
        IdentityLogic.matchDateOfBirth(
          requestPayload.dateOfBirth as string,
          responsePayload.dateOfBirth as string,
        )
      ) {
        response.dateOfBirth.matched = true;
      }
    }

    return response;
  }

  public static matchName(requestName: string, responseName: string): boolean {
    return requestName?.toLowerCase() === responseName?.toLowerCase();
  }

  public static matchDateOfBirth(requestDateOfBirth: string, responseDateOfBirth: string): boolean {
    if (!isValid(new Date(requestDateOfBirth))) {
      return false;
    }

    if (!isValid(new Date(responseDateOfBirth))) {
      return false;
    }

    return isEqual(new Date(requestDateOfBirth), new Date(responseDateOfBirth));
  }
}
