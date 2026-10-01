import AdminService from '../../services/admin.service';
import BusinessService from '../../services/business.service';
import RabbitmqService from '../../services/rabbit-mq';

export interface IAwilixAdminController {
  AdminService: AdminService;
  BusinessService: BusinessService;
  RabbitMqService: RabbitmqService;
}
