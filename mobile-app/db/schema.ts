import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'purchases',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'bl_number', type: 'string', isIndexed: true },
        { name: 'bl_date', type: 'string' },
        { name: 'supplier_name', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'remarks', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' }, // 'pending', 'synced', 'error'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'containers',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'purchase_id', type: 'string', isIndexed: true },
        { name: 'sr_no', type: 'number' },
        { name: 'container_number', type: 'string' },
        { name: 'cbm_gross', type: 'number', isOptional: true },
        { name: 'cbm_net', type: 'number', isOptional: true },
        { name: 'pcs_supplier', type: 'number', isOptional: true },
        { name: 'avg_girth_gross', type: 'number', isOptional: true },
        { name: 'avg_girth_net', type: 'number', isOptional: true },
        { name: 'l_avg', type: 'number', isOptional: true },
        { name: 'quality_supplier', type: 'string', isOptional: true },
        { name: 'bend_percent', type: 'number', isOptional: true },
        { name: 'quality_by_us', type: 'string', isOptional: true },
        { name: 'measurement_date', type: 'string', isOptional: true },
        { name: 'is_loading_complete', type: 'boolean' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'log_measurements',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'container_id', type: 'string', isIndexed: true },
        { name: 'log_number', type: 'number' },
        { name: 'le1', type: 'number' },
        { name: 'l', type: 'number' },
        { name: 'g1', type: 'number' },
        { name: 'g2', type: 'number' },
        { name: 'cbm1', type: 'number' },
        { name: 'cbm2', type: 'number' },
        { name: 'cft1', type: 'number' },
        { name: 'cft2', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'suppliers',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'countries',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'sync_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});