import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class Purchase extends Model {
  static table = 'purchases';
  static associations = {
    containers: { type: 'has_many', foreignKey: 'purchase_id' },
  };

  @field('server_id') serverId!: string;
  @field('bl_number') blNumber!: string;
  @field('bl_date') blDate!: string;
  @field('supplier_name') supplierName!: string;
  @field('country') country!: string;
  @field('remarks') remarks!: string;
  @field('sync_status') syncStatus!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('containers') containers: any;
}