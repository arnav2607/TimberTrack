import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Supplier extends Model {
  static table = 'suppliers';

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('sync_status') syncStatus!: string;
  @date('created_at') createdAt!: Date;
}