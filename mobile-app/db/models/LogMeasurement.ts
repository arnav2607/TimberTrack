import { Model } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class LogMeasurement extends Model {
  static table = 'log_measurements';
  static associations: Associations = {
    containers: { type: 'belongs_to', key: 'container_id' },
  };

  @field('server_id') serverId!: string;
  @field('container_id') containerId!: string;
  @field('log_number') logNumber!: number;
  @field('le1') le1!: number;
  @field('l') l!: number;
  @field('g1') g1!: number;
  @field('g2') g2!: number;
  @field('cbm1') cbm1!: number;
  @field('cbm2') cbm2!: number;
  @field('cft1') cft1!: number;
  @field('cft2') cft2!: number;
  @field('local_status') localStatus!: string;
  @date('created_at') createdAt!: Date;

  @relation('containers', 'container_id') container: any;
}