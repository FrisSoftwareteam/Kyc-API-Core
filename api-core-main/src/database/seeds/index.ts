import mongoose from 'mongoose';
import logger from '../../core/Logger';
import RoleSchema from '../../models/role.model';
import AdminRoleSeeding from './data/admin.role.seed';
import BusinessRoleSeeding from './data/business.role.seed';
import PartnerRoleSeeding from './data/partner.role.seed';

(async () => {
  const mongooseConnection: mongoose.Connection = await mongoose.createConnection(
    <string>process.env.DATABASE_URI,
  );

  logger.info('STARTING SEEDING');

  await AdminRoleSeeding(RoleSchema({ mongooseConnection }));
  await BusinessRoleSeeding(RoleSchema({ mongooseConnection }));
  await PartnerRoleSeeding(RoleSchema({ mongooseConnection }));

  logger.info('DONE SEEDING');
  process.exit(0);
})().catch((err) => {
  logger.error({ err });
});
