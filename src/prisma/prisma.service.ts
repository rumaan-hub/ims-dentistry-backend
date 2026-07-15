import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { als } from './als';

@Injectable()
// export class PrismaService extends PrismaClient {}
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    const tenantModels = [
      'Inventory', 'Office', 'Staff', 'PurchaseOrder',
      'Transfer', 'Quotation', 'Agreement', 'ClientSubscription',
      'ImsCustomProduct'
    ];

    this.$use(async (params, next) => {
      const context = als.getStore();
      const { model, action, args } = params;

      // ----------------------------------------------------
      // 1. AUTOMATIC TENANT ISOLATION
      // ----------------------------------------------------
      if (context && context.clientId && !context.isSuperAdmin && model && tenantModels.includes(model)) {
        // Enforce tenant isolation securely for reads, updates, deletes
        if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate'].includes(action)) {
          if (!args) params.args = {};
          if (!params.args.where) params.args.where = {};

          // If findUnique is used with composite unique keys, adding 'client_id' turns it into findFirst
          if (action === 'findUnique') {
            params.action = 'findFirst';
          }

          if (model === 'Inventory') {
            params.args.where.office = {
              ...(params.args.where.office || {}),
              client_id: context.clientId,
            };
          } else {
            params.args.where.client_id = context.clientId;
          }
        }

        // For creation, automatically inject the client_id
        if (['create', 'createMany'].includes(action)) {
          if (!args) params.args = { data: {} };

          if (model !== 'Inventory') {
            if (action === 'create') {
              params.args.data = { ...params.args.data, client_id: context.clientId };
            } else if (action === 'createMany') {
              if (Array.isArray(params.args.data)) {
                params.args.data = params.args.data.map(d => ({ ...d, client_id: context.clientId }));
              } else {
                params.args.data.client_id = context.clientId;
              }
            }
          }
        }
      }

      // Execute actual database query
      const result = await next(params);

      // ----------------------------------------------------
      // 2. AUDIT LOGGING (only for IMS-related write operations)
      // ----------------------------------------------------
      const imsModels = [
        'ImsUser', 'Office', 'Staff', 'Inventory', 'Transfer', 'TransferDetail',
        'PurchaseOrder', 'PurchaseOrderDetail', 'Quotation', 'Agreement',
        'ClientSubscription', 'ImsRole', 'ImsPermission', 'ImsRolePermission',
        'ImsStaffRole', 'ImsUserRole', 'SystemActivity', 'ImsCustomProduct',
      ];

      if (context && model && model !== 'AuditLog' && imsModels.includes(model)) {
        let actionType = 'UNKNOWN';
        if (action.includes('create')) actionType = 'CREATE';
        else if (action.includes('update')) actionType = 'UPDATE';
        else if (action.includes('delete')) actionType = 'DELETE';

        // Only log write operations (CREATE, UPDATE, DELETE)
        if (['CREATE', 'UPDATE', 'DELETE'].includes(actionType)) {
          let recordId: string | null = null;
          if (result && typeof result === 'object' && 'id' in result) recordId = String(result.id);
          else if (result && typeof result === 'object' && 'client_id' in result) recordId = String(result.client_id);
          else if (args?.where && 'id' in args.where) recordId = String(args.where.id);

          try {
            // Use raw SQL to bypass the middleware (avoids infinite recursion)
            // user_id is set to NULL to avoid FK issues with non-IMS users
            const clientId = context.isSuperAdmin ? null : (context.clientId || null);
            const meta = args ? JSON.stringify(args) : null;

            await this.$queryRawUnsafe(
              `INSERT INTO ims_audit_logs (id, user_id, client_id, action_type, model_name, record_id, timestamp, metadata)
               VALUES (gen_random_uuid(), NULL, $1::uuid, $2, $3, $4, NOW(), $5::jsonb)`,
              clientId,
              actionType,
              model,
              recordId,
              meta,
            );
          } catch (error) {
            console.error('[Audit Logger Error]', error.message);
          }
        }
      }

      return result;
    });
  }
}
