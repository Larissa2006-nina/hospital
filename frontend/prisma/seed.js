const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database - removing all user accounts, transactions, and test data...');

  // Clean all records in reverse dependency order
  await prisma.userBadge.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emergencyDonorResponse.deleteMany();
  await prisma.emergencyDonation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bloodTransaction.deleteMany();
  await prisma.bloodUnit.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.bloodDonation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.labTechnician.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.bloodBank.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.administrator.deleteMany();
  await prisma.user.deleteMany();

  // Ensure system badge definitions exist for real donor gamification milestones
  const defaultBadges = [
    { name: 'First Drop', description: 'Completed your first voluntary blood donation!', iconUrl: '💧', requiredDonationsCount: 1 },
    { name: 'Life Saver', description: 'Saved up to 15 lives through 5 voluntary blood donations!', iconUrl: '❤️', requiredDonationsCount: 5 },
    { name: 'Hero Donor', description: 'A true community hero with 10 completed blood donations!', iconUrl: '🏆', requiredDonationsCount: 10 },
    { name: 'Blood Champion', description: 'Champion of life! Reached 25 voluntary blood donations!', iconUrl: '👑', requiredDonationsCount: 25 },
  ];

  for (const b of defaultBadges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: b,
      create: b,
    });
  }

  console.log('✅ Database is 100% clean and empty of users. Ready for real user registrations!');
}

main()
  .catch((e) => {
    console.error('❌ Clean error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
