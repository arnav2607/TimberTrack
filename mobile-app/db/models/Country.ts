import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class Country extends Model {
  static table = 'countries';

  @field('server_id') serverId!: string;
  @field('name') name!: string;
  @field('local_status') localStatus!: string;
  @date('created_at') createdAt!: Date;
}