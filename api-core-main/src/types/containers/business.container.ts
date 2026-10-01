import BusinessService from '../../services/business.service';
import RabbitmqService from '../../services/rabbit-mq';

export interface IAwilixBusinessController {
  BusinessService: BusinessService;
  RabbitMqService: RabbitmqService;
}
