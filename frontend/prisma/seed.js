const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning database - removing all mock and seeded records...');

  // Clean all records in reverse dependency order
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

  console.log('✅ Database is 100% clean and empty. Ready for user registrations and data entry!');
}

main()
  .catch((e) => {
    console.error('❌ Clean error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
