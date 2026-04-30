import { Model } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class Purchase extends Model {
  static table = 'purchases';
  static associations: Associations = {
    containers: { type: 'has_many', foreignKey: 'purchase_id' },
  };

  @field('server_id') serverId!: string;
  @field('bl_number') blNumber!: string;
  @field('bl_date') blDate!: string;
  @field('supplier_name') supplierName!: string;
  @field('country') country!: string;
  @field('remarks') remarks!: string;
  @field('local_status') localStatus!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('containers') containers: any;
}