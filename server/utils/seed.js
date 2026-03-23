import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import PG from '../models/PG.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    PG.deleteMany({}),
    Review.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Users ──────────────────────────────────────────────
  const users = await User.insertMany([
    { name: 'Admin User', email: 'admin@sikkimpg.com', password: await bcrypt.hash('admin123', 12), role: 'admin', ownerRequestStatus: 'approved' },
    { name: 'Raj Sharma', email: 'owner@sikkimpg.com', password: await bcrypt.hash('owner123', 12), role: 'owner', ownerRequestStatus: 'approved' },
    { name: 'Priya Gurung', email: 'owner2@sikkimpg.com', password: await bcrypt.hash('owner123', 12), role: 'owner', ownerRequestStatus: 'approved' },
    { name: 'Amit Tamang', email: 'user@sikkimpg.com', password: await bcrypt.hash('user123', 12), role: 'user', ownerRequestStatus: 'none' },
    { name: 'Sita Rai', email: 'sita@gmail.com', password: await bcrypt.hash('user123', 12), role: 'user', ownerRequestStatus: 'pending' },
    { name: 'Blocked User', email: 'blocked@gmail.com', password: await bcrypt.hash('user123', 12), role: 'user', isBlocked: true },
  ]);
  console.log(`✅ Seeded ${users.length} users`);

  const [admin, owner1, owner2, user1, user2] = users;

  // ── PGs ────────────────────────────────────────────────
  const pgData = [
    {
      title: 'Sunrise PG for Boys',
      description: 'Comfortable and affordable PG accommodation located in the heart of Gangtok near MG Road. Perfect for students and working professionals. Enjoy stunning mountain views, home-cooked meals, and a clean, secure environment. Our rooms are well-furnished with all essential amenities.',
      price: 4500, location: { city: 'Gangtok', area: 'MG Road', address: 'Near Hotel Tashi Delek, MG Road, Gangtok' },
      roomType: 'Single', genderPreference: 'Boys',
      amenities: ['WiFi', 'Food', 'AC', 'Parking', 'CCTV', 'Water'],
      images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80'],
      contactNumber: '9876543210', owner: owner1._id, status: 'approved',
    },
    {
      title: 'Mountain View Girls Hostel',
      description: 'Safe and comfortable PG exclusively for girls located in Tadong area. We provide home-cooked food, 24/7 security, and a friendly environment. Ideal for college students attending Sikkim University or working women in the area.',
      price: 5500, location: { city: 'Gangtok', area: 'Tadong', address: 'Near Sikkim University Gate, Tadong' },
      roomType: 'Double', genderPreference: 'Girls',
      amenities: ['WiFi', 'Food', 'Laundry', 'CCTV', 'Water'],
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'],
      contactNumber: '9876543211', owner: owner1._id, status: 'approved',
    },
    {
      title: 'Deorali Heights Co-ed PG',
      description: 'Modern co-ed PG accommodation in the premium locality of Deorali. Features spacious rooms, high-speed WiFi, and excellent mountain views. Walking distance from major offices, hospitals, and shopping areas. Very well-maintained property with 24/7 security.',
      price: 7000, location: { city: 'Gangtok', area: 'Deorali', address: 'Deorali Market Road, Near SBI Bank' },
      roomType: 'Single', genderPreference: 'Co-ed',
      amenities: ['WiFi', 'Food', 'AC', 'Parking', 'Laundry', 'CCTV', 'Water'],
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'],
      contactNumber: '9876543212', owner: owner2._id, status: 'approved',
    },
    {
      title: 'Ranipool Budget Stay',
      description: 'Affordable triple-sharing PG accommodation in Ranipool area. Great for students looking for budget-friendly options. Basic amenities included with hygienic food service. Located near NH10 highway for easy connectivity to Gangtok and Siliguri.',
      price: 3000, location: { city: 'Gangtok', area: 'Ranipool', address: 'NH10 Highway, Ranipool, Sikkim' },
      roomType: 'Triple', genderPreference: 'Boys',
      amenities: ['WiFi', 'Food', 'Water', 'CCTV'],
      images: ['https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80'],
      contactNumber: '9876543213', owner: owner1._id, status: 'approved',
    },
    {
      title: 'Singtam Comfort Inn PG',
      description: 'Premium PG accommodation in Singtam town with excellent connectivity to Gangtok and other parts of Sikkim. Spacious double rooms with modern furnishings. Great food and warm hospitality. Popular among government employees and teachers.',
      price: 6000, location: { city: 'Singtam', area: 'Main Bazaar', address: 'Near Singtam Bus Stand, Main Market' },
      roomType: 'Double', genderPreference: 'Co-ed',
      amenities: ['WiFi', 'Food', 'AC', 'Parking', 'Water', 'CCTV'],
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'],
      contactNumber: '9876543214', owner: owner2._id, status: 'approved',
    },
    {
      title: 'Namchi Green Valley PG',
      description: 'Beautiful PG surrounded by lush greenery in Namchi. Perfect for those working in South Sikkim. Enjoy fresh mountain air, organic food, and peaceful surroundings. The property has a garden and common sitting area with panoramic views.',
      price: 4000, location: { city: 'Namchi', area: 'Palilayo', address: 'Near Namchi Siksha Niketan School' },
      roomType: 'Single', genderPreference: 'Girls',
      amenities: ['WiFi', 'Food', 'Laundry', 'Water', 'CCTV'],
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
      contactNumber: '9876543215', owner: owner1._id, status: 'approved',
    },
    {
      title: 'Jorethang River View PG',
      description: 'Unique PG experience by the Teesta River in Jorethang. Great for nature lovers and those working in West Sikkim. The sound of the river is incredibly calming. Spacious rooms with breathtaking views of the river and surrounding hills.',
      price: 3500, location: { city: 'Jorethang', area: 'River Side', address: 'Teesta River Bank Road, Jorethang' },
      roomType: 'Double', genderPreference: 'Boys',
      amenities: ['WiFi', 'Parking', 'Water', 'CCTV'],
      images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80'],
      contactNumber: '9876543216', owner: owner2._id, status: 'approved',
    },
    {
      title: 'Gyalshing Executive Suites',
      description: 'Premium executive PG accommodation in Gyalshing for working professionals. Fully furnished rooms with AC, attached bathroom, and high-speed internet. Ideal for government officials and corporate employees posted in West Sikkim district headquarters.',
      price: 9000, location: { city: 'Gyalshing', area: 'Town Center', address: 'Near District Collector Office, Gyalshing' },
      roomType: 'Single', genderPreference: 'Co-ed',
      amenities: ['WiFi', 'Food', 'AC', 'Parking', 'Laundry', 'CCTV', 'Water', 'Gym'],
      images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80'],
      contactNumber: '9876543217', owner: owner1._id, status: 'pending',
    },
    {
      title: 'Mangan Valley Home Stay PG',
      description: 'Cozy home-stay style PG in Mangan, North Sikkim. Experience authentic Sikkimese hospitality with traditional food. Great base for exploring North Sikkim tourist spots including Gurudongmar Lake and Lachen. Very family-oriented environment.',
      price: 5000, location: { city: 'Mangan', area: 'Main Market', address: 'Near Mangan Bus Stand, North Sikkim' },
      roomType: 'Double', genderPreference: 'Co-ed',
      amenities: ['Food', 'Water', 'WiFi'],
      images: ['https://images.unsplash.com/photo-1587985064135-0366536eab42?w=800&q=80'],
      contactNumber: '9876543218', owner: owner2._id, status: 'pending',
    },
    {
      title: 'Ravangla Monastery View PG',
      description: 'Peaceful PG with views of the Buddha Park and mountains in Ravangla. Perfect for meditation practitioners and spiritual seekers. Clean and serene environment with daily yoga sessions. Good connectivity to Namchi and Gangtok by road.',
      price: 4500, location: { city: 'Ravangla', area: 'Buddha Park Area', address: 'Near Ralong Monastery Road, Ravangla' },
      roomType: 'Single', genderPreference: 'Co-ed',
      amenities: ['WiFi', 'Food', 'Water', 'Parking'],
      images: ['https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=800&q=80'],
      contactNumber: '9876543219', owner: owner1._id, status: 'rejected',
      rejectionReason: 'Incomplete documentation. Please provide property ownership certificate and local authority NOC.',
    },
    {
      title: 'Tadong Student Hub',
      description: 'Dedicated student PG near Sikkim University in Tadong with excellent study facilities. Affordable triple sharing rooms with common study room, fast internet, and regular food service. Very popular among engineering, MBA and law students.',
      price: 3200, location: { city: 'Gangtok', area: 'Tadong', address: 'Sikkim University Road, Tadong, Gangtok' },
      roomType: 'Triple', genderPreference: 'Boys',
      amenities: ['WiFi', 'Food', 'Water', 'CCTV', 'Laundry'],
      images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80'],
      contactNumber: '9876543220', owner: owner2._id, status: 'rejected',
      rejectionReason: 'Images do not match the described property. Please submit accurate property photos.',
    },
    {
      title: 'MG Road Premium Residency',
      description: 'Luxury PG accommodation right on MG Road with stunning views of Kangchenjunga. Premium furnishings, gourmet meals, and concierge services. Perfect for senior executives and tourists looking for extended comfortable stays in Gangtok.',
      price: 8500, location: { city: 'Gangtok', area: 'MG Road', address: 'MG Marg, Central Gangtok, Near Church' },
      roomType: 'Single', genderPreference: 'Co-ed',
      amenities: ['WiFi', 'Food', 'AC', 'Parking', 'Laundry', 'CCTV', 'Water', 'Gym'],
      images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80'],
      contactNumber: '9876543221', owner: owner1._id, status: 'pending_update',
      averageRating: 4.7, totalReviews: 3,
    },
  ];

  const pgs = await PG.insertMany(pgData);
  console.log(`✅ Seeded ${pgs.length} PGs`);

  // ── Reviews ────────────────────────────────────────────
  const approvedPGs = pgs.filter((p) => p.status === 'approved' || p.status === 'pending_update');
  const reviewData = [
    { pg: approvedPGs[0]._id, user: user1._id, rating: 5, comment: 'Excellent place to stay! Very clean and the owner is responsive. WiFi speed is great for working from home.' },
    { pg: approvedPGs[0]._id, user: user2._id, rating: 4, comment: 'Good location near MG Road. Food is decent and rooms are clean. Would recommend to friends in Gangtok.' },
    { pg: approvedPGs[1]._id, user: user1._id, rating: 4, comment: 'Nice PG for girls. Very safe neighborhood. The warden is strict but caring about the residents.' },
    { pg: approvedPGs[2]._id, user: user2._id, rating: 5, comment: 'Best PG I have stayed in Gangtok. The view from the balcony is absolutely amazing. Highly recommended!' },
    { pg: approvedPGs[3]._id, user: user1._id, rating: 3, comment: 'Decent place but a bit far from the city center. Rooms are comfortable though and the price is right.' },
    { pg: approvedPGs[4]._id, user: user2._id, rating: 5, comment: 'Amazing PG with all amenities. The food is delicious and home-cooked. Very peaceful area in Singtam.' },
  ];

  const reviews = await Review.insertMany(reviewData);
  console.log(`✅ Seeded ${reviews.length} reviews`);

  // Update PG ratings
  for (const pg of approvedPGs.slice(0, 5)) {
    const pgReviews = reviews.filter((r) => r.pg.toString() === pg._id.toString());
    if (pgReviews.length > 0) {
      const avg = pgReviews.reduce((s, r) => s + r.rating, 0) / pgReviews.length;
      await PG.findByIdAndUpdate(pg._id, {
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: pgReviews.length,
      });
    }
  }

  // ── Notifications ──────────────────────────────────────
  const notifData = [
    { message: `New PG submitted: ${pgs[0].title} by ${owner1.name}`, type: 'ADD_PG', userId: owner1._id, relatedId: pgs[0]._id, isRead: false },
    { message: `New user registered: ${user1.name} (${user1.email})`, type: 'USER_SIGNUP', userId: user1._id, relatedId: user1._id, isRead: false },
    { message: `Owner access requested by ${user2.name}`, type: 'OWNER_REQUEST', userId: user2._id, relatedId: user2._id, isRead: false },
    { message: `PG updated: ${pgs[1].title} needs re-approval`, type: 'UPDATE_PG', userId: owner1._id, relatedId: pgs[1]._id, isRead: true },
    { message: `PG reported: ${pgs[3].title} for inaccurate information`, type: 'REPORT_PG', userId: user1._id, relatedId: pgs[3]._id, isRead: false },
    { message: `New PG submitted: ${pgs[7].title} by ${owner1.name}`, type: 'ADD_PG', userId: owner1._id, relatedId: pgs[7]._id, isRead: true },
    { message: `New PG submitted: ${pgs[8].title} by ${owner2.name}`, type: 'ADD_PG', userId: owner2._id, relatedId: pgs[8]._id, isRead: false },
    { message: 'PG deleted: Old Gangtok Stay removed by owner', type: 'DELETE_PG', userId: owner2._id, isRead: true },
    { message: 'New user registered: Karma Bhutia (karma@gmail.com)', type: 'USER_SIGNUP', isRead: false },
    { message: `PG updated: ${pgs[11].title} pending re-approval`, type: 'UPDATE_PG', userId: owner1._id, relatedId: pgs[11]._id, isRead: false },
  ];

  const notifications = await Notification.insertMany(notifData);
  console.log(`✅ Seeded ${notifications.length} notifications`);

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📋 Login credentials:');
  console.log('   Admin  → admin@sikkimpg.com   / admin123');
  console.log('   Owner  → owner@sikkimpg.com   / owner123');
  console.log('   Owner2 → owner2@sikkimpg.com  / owner123');
  console.log('   User   → user@sikkimpg.com    / user123\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
