import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../config/typeorm.config';
import { User } from '../users/user.entity';
import { Court } from '../courts/court.entity';
import { CourtPrice } from '../courts/court-price.entity';
import { Equipment } from '../equipment/equipment.entity';
import {
  DayType,
  FloorType,
  LocationType,
  UserRole,
} from '../common/enums';

async function run() {
  const ds = new DataSource({
    ...buildTypeOrmOptions(process.env),
    synchronize: true,
  } as any);
  await ds.initialize();

  // ---- Users ----
  const users = ds.getRepository(User);
  const seedUsers = [
    { name: 'Admin FutsalKu', email: 'admin@futsalku.com', password: 'Admin123!', phone: '081200000001', role: UserRole.ADMIN },
    { name: 'Budi Santoso', email: 'budi@mail.com', password: 'Customer123!', phone: '081200000002', role: UserRole.CUSTOMER },
    { name: 'Siti Aminah', email: 'siti@mail.com', password: 'Customer123!', phone: '081200000003', role: UserRole.CUSTOMER },
  ];
  for (const u of seedUsers) {
    if (await users.findOne({ where: { email: u.email } })) continue;
    await users.save(users.create({ ...u, password: await bcrypt.hash(u.password, 10) }));
    console.log(`+ user ${u.email}`);
  }

  // ---- Courts + prices ----
  const courts = ds.getRepository(Court);
  const prices = ds.getRepository(CourtPrice);
  const seedCourts = [
    { name: 'Lapangan A', floorType: FloorType.VINYL, locationType: LocationType.INDOOR, rates: [80000, 120000, 150000], description: 'Lantai vinyl, indoor ber-AC' },
    { name: 'Lapangan B', floorType: FloorType.INTERLOCK, locationType: LocationType.INDOOR, rates: [90000, 130000, 160000], description: 'Lantai interlock, indoor' },
    { name: 'Lapangan C', floorType: FloorType.SINTETIS, locationType: LocationType.OUTDOOR, rates: [70000, 110000, 140000], description: 'Rumput sintetis, outdoor' },
  ];
  for (const c of seedCourts) {
    if (await courts.findOne({ where: { name: c.name } })) continue;
    const court = await courts.save(
      courts.create({
        name: c.name,
        floorType: c.floorType,
        locationType: c.locationType,
        description: c.description,
        capacity: 10,
        isActive: true,
      }),
    );
    await prices.save([
      prices.create({ courtId: court.id, dayType: DayType.WEEKDAY, startTime: '08:00', endTime: '17:00', pricePerHour: c.rates[0] }),
      prices.create({ courtId: court.id, dayType: DayType.WEEKDAY, startTime: '17:00', endTime: '23:00', pricePerHour: c.rates[1] }),
      prices.create({ courtId: court.id, dayType: DayType.WEEKEND, startTime: '08:00', endTime: '23:00', pricePerHour: c.rates[2] }),
    ]);
    console.log(`+ court ${c.name} (+3 harga)`);
  }

  // ---- Equipment ----
  const equipment = ds.getRepository(Equipment);
  const seedEquipment = [
    { name: 'Bola Futsal', rentalPrice: 15000, stock: 5 },
    { name: 'Rompi', rentalPrice: 10000, stock: 20 },
    { name: 'Sepatu Futsal', rentalPrice: 20000, stock: 10 },
  ];
  for (const e of seedEquipment) {
    if (await equipment.findOne({ where: { name: e.name } })) continue;
    await equipment.save(equipment.create({ ...e, isActive: true }));
    console.log(`+ equipment ${e.name}`);
  }

  await ds.destroy();
  console.log('Seeding selesai.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
