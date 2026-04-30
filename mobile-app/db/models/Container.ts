import { Model } from '@nozbe/watermelondb';
import type { Associations } from '@nozbe/watermelondb/Model';
import { field, date, relation, children } from '@nozbe/watermelondb/decorators';

export default class Container extends Model {
  static table = 'containers';
  static associations: Associations = {
    purchases: { type: 'belongs_to', key: 'purchase_id' },
    log_measurements: { type: 'has_many', foreignKey: 'container_id' },
  };

  @field('server_id') serverId!: string;
  @field('purchase_id') purchaseId!: string;
  @field('sr_no') srNo!: number;
  @field('container_number') containerNumber!: string;
  @field('cbm_gross') cbmGross!: number;
  @field('cbm_net') cbmNet!: number;
  @field('pcs_supplier') pcsSupplier!: number;
  @field('avg_girth_gross') avgGirthGross!: number;
  @field('avg_girth_net') avgGirthNet!: number;
  @field('l_avg') lAvg!: number;
  @field('quality_supplier') qualitySupplier!: string;
  @field('bend_percent') bendPercent!: number;
  @field('quality_by_us') qualityByUs!: string;
  @field('measurement_date') measurementDate!: string;
  @field('is_loading_complete') isLoadingComplete!: boolean;
  @field('completed_at') completedAt!: number;
  @field('local_status') localStatus!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('purchases', 'purchase_id') purchase: any;
  @children('log_measurements') logMeasurements: any;
}