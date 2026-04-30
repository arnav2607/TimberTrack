import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import Purchase from './models/Purchase';
import Container from './models/Container';
import LogMeasurement from './models/LogMeasurement';
import Supplier from './models/Supplier';
import Country from './models/Country';

const adapter = new SQLiteAdapter({
  schema,
  // jsi: true requires bare workflow / dev-client. Set to false for Expo Go compat.
  jsi: false,
});

export const database = new Database({
  adapter,
  modelClasses: [Purchase, Container, LogMeasurement, Supplier, Country],
});