import { config } from '../config';
import EventEmitterBroker from '../events';
import logger from '../core/Logger';
import { AgentNotificationPayload } from '../constants';
import { BadRequestError } from '../errors/api.error';
import AddressFormatter from '../formatters/task.formatter';
import IdentityFormatter from '../formatters/identity.formatter';

export interface IAssignTaskToAgent {
  agents: [
    {
      agentId: string;
      distance: number;
      status: string;
      partner: unknown;
      price?: number;
    },
  ];
  last?: boolean;
  body: {
    verificationId: string;
    addressId: string;
    landmark: string;
    candidate: {
      firstName: string;
      lastName: string;
      phoneNumber?: string;
    };
    address: string;
  };
  title?: string;
  position: {
    longitude: number;
    latitude: number;
  };
}

export default class TaskLogic {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static setNotificationIntervalId: any;

  public static assignTaskToAgent(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AblyClient: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AddressDataAccess: any,
    notificationObject: IAssignTaskToAgent,
  ) {
    let index = 0;
    let last = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let address: any;

    notificationObject.title = AgentNotificationPayload.title;

    if (!notificationObject.agents.length) {
      logger.info('No agents found for this address');
      return 'Notification sent to all agents successfully';
    }

    // If one agent is found, don't push to setInterval
    if (notificationObject.agents.length === index + 1) {
      notificationObject.last = true;
    } else {
      notificationObject.last = false;
    }

    EventEmitterBroker.emit('sendNotificationToAgent', { AblyClient, notificationObject, index });

    index += 1;

    TaskLogic.setNotificationIntervalId = setInterval(
      async () => {
        if (index < notificationObject.agents.length) {
          address = await AddressDataAccess.getAddressById(notificationObject.body.addressId);

          if (address?.agent) {
            logger.info('Address Task has been accepted');
            clearInterval(TaskLogic.setNotificationIntervalId);
            TaskLogic.setNotificationIntervalId = null;
            return;
          }

          if (notificationObject.agents.length === index + 1) {
            last = true;
          }

          notificationObject.last = last;
          notificationObject.title = AgentNotificationPayload.title;

          logger.info(
            `Agent ${notificationObject.agents[index].agentId} Found and published to device`,
          );

          EventEmitterBroker.emit('sendNotificationToAgent', {
            AblyClient,
            notificationObject,
            index,
          });

          index += 1;
        } else {
          logger.info('Notification Ended', TaskLogic.setNotificationIntervalId);
          clearInterval(TaskLogic.setNotificationIntervalId);

          if (!address?.agent) {
            address = await AddressDataAccess.getAddressById(notificationObject.body.addressId);

            const firstAgent = notificationObject?.agents[0];

            await AddressDataAccess.updateAddress(
              { _id: address?._id },
              {
                partner: firstAgent?.partner,
              },
            );
          }
          return;
        }
      },
      config.get('agentResponseTime') as number,
    );

    return 'Notification sent to all agents successfully';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static formatTaskResult(tasks: any) {
    const results: { identities: string[]; addresses: string[] } = {
      identities: [],
      addresses: [],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tasks.forEach((task: any) => {
      if (task.identity) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const identityFormat = <any>IdentityFormatter({ identity: task.identity });
        results.identities.push(identityFormat);
      }
      if (task.address) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const addressFormat = <any>AddressFormatter({ task: task.address });
        results.addresses.push(addressFormat);
      }
    });

    return results;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static calculateVerificationCost(services: any, verifications: any) {
    const costOfVerification = {
      total: 0,
    };

    const mappedServices = services.map((service: Record<string, unknown>) => service?.slug);

    const verificationExists = Object.keys(verifications).every((item: string) => {
      if (item === 'identity') {
        item = verifications[item]?.type;
      }

      if (item === 'bankStatement') {
        item = 'bank-statement';
      }

      if (item === 'certificateDocuments') {
        item = 'certificate-documents';
      }

      if (item === 'academicDocuments') {
        item = 'academic-documents';
      }

      if (item === 'projectVerification') {
        item = 'project-verification';
      }

      if (item === 'documents') {
        item = 'document-verifications';
      }

      if (item === 'businessPartnership') {
        item = 'business-partnership';
      }

      if (item === 'guarantorVerification') {
        item = 'guarantor-verification';
      }

      if (item === 'employmentVerification') {
        item = 'employment-verification';
      }

      if (item === 'businessVerification') {
        item = 'business-verification';
      }

      return mappedServices.includes(item);
    });

    if (!verificationExists) {
      throw new BadRequestError('Unable to create verification, missing access', {
        code: 'BUSINESS_NOT_ALLOWED',
      });
    }

    Object.keys(verifications).forEach((item: string) => {
      for (const service of services) {
        if (item === 'identity') {
          item = verifications[item]?.type;
        }

        if (item === 'bankStatement') {
          item = 'bank-statement';
        }

        if (item === 'certificateDocuments') {
          item = 'certificate-documents';
        }

        if (item === 'academicDocuments') {
          item = 'academic-documents';
        }

        if (item === 'projectVerification') {
          item = 'project-verification';
        }

        if (item === 'documents') {
          item = 'document-verifications';
        }

        if (item === 'businessPartnership') {
          item = 'business-partnership';
        }

        if (item === 'guarantorVerification') {
          item = 'guarantor-verification';
        }

        if (item === 'employmentVerification') {
          item = 'employment-verification';
        }

        if (item === 'businessVerification') {
          item = 'business-verification';
        }

        if (!service.price) {
          throw new BadRequestError(`Service ${service?.slug} does not have a price`, {
            code: 'PRICE_NOT_FOUND',
          });
        }

        if (item === service?.slug) {
          costOfVerification.total = costOfVerification.total + service.price;
          costOfVerification[item as keyof typeof costOfVerification] =
            +costOfVerification[item as keyof typeof costOfVerification] || 0 + service.price;

          break;
        }
      }
    });

    return costOfVerification;
  }

  // public static calculateIndividualVerificationCost(costOfVerification: any, item: string, services: any, verifications: any) {
  //   for (const service of services) {
  //     if (item === 'identity') {
  //       item = verifications[item]?.type;
  //     }

  //     if (!service.price) {
  //       throw new BadRequestError(`Service ${service?.slug} does not have a price`, {
  //         code: 'PRICE_NOT_FOUND',
  //       });
  //     }

  //     if (item === service?.slug) {
  //       costOfVerification.total = costOfVerification.total + service.price;
  //       costOfVerification[item as keyof typeof costOfVerification] =
  //           +costOfVerification[item as keyof typeof costOfVerification] || 0 + service.price;

  //       break;
  //     }
  //   }

  //   return costOfVerification;
  // }
}
