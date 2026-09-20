import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest, hashPassword } from '@/lib/auth';

// GET /api/hospital/lab-technicians - List lab technicians for the hospital
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    if (!auth || (auth.role !== 'HOSPITAL' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Hospital access required.' }, { status: 401 });
    }

    let hospitalId = auth.hospitalId;

    // If hospitalId is missing from token, lookup by userId
    if (!hospitalId && auth.role === 'HOSPITAL') {
      const hosp = await prisma.hospital.findUnique({ where: { userId: auth.userId } });
      if (hosp) hospitalId = hosp.hospitalId;
    }

    const { searchParams } = new URL(request.url);
    const filterHospitalId = searchParams.get('hospitalId') || hospitalId;

    let whereClause = {};
    if (filterHospitalId) {
      whereClause.hospitalId = filterHospitalId;
    }

    const labTechnicians = await prisma.labTechnician.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, createdAt: true },
        },
        hospital: { select: { hospitalId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      labTechnicians,
    });
  } catch (error) {
    console.error('Lab technicians GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch lab technicians: ' + error.message }, { status: 500 });
  }
}

// POST /api/hospital/lab-technicians - Create new lab technician account for the hospital
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    if (!auth || (auth.role !== 'HOSPITAL' && auth.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Only Hospital accounts can create Lab Technicians.' }, { status: 401 });
    }

    let hospitalId = auth.hospitalId;
    if (!hospitalId) {
      const targetUserId = auth.userId || auth.id;
      if (targetUserId) {
        const hosp = await prisma.hospital.findUnique({ where: { userId: targetUserId } });
        if (hosp) hospitalId = hosp.hospitalId;
      }
    }


    const body = await request.json();
    const {
      email,
      password,
      name,
      phone,
      licenseNumber,
      qualification = 'Certified Hematologist & Lab Specialist',
      targetHospitalId,
    } = body;

    const finalHospitalId = targetHospitalId || hospitalId;

    if (!finalHospitalId) {
      return NextResponse.json({ error: 'Hospital record not found for this account.' }, { status: 400 });
    }

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    // Auto-generate licenseNumber if not provided
    const finalLicenseNumber = licenseNumber || `LAB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Check if license number exists
    const existingLicense = await prisma.labTechnician.findUnique({
      where: { licenseNumber: finalLicenseNumber },
    });
    if (existingLicense) {
      return NextResponse.json({ error: 'A lab technician with this license number already exists.' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create User with nested LabTechnician relation
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash: hashedPassword,
        name,
        role: 'LAB_TECH',
        phone: phone || null,
        labTechnician: {
          create: {
            hospitalId: finalHospitalId,
            licenseNumber: finalLicenseNumber,
            qualification,
            status: 'ACTIVE',
          },
        },
      },
      include: {
        labTechnician: {
          include: { hospital: true },
        },
      },
    });

    // Create Notification for the new Lab Tech
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Laboratory Technician Account Created',
        message: `Welcome ${user.name}! Your account has been created by ${user.labTechnician.hospital.name}. You can now log into the Laboratory Portal.`,
        notificationType: 'INFO',
        linkUrl: '/lab',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Lab Technician account created successfully.',
      labTechnician: user.labTechnician,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create lab technician POST error:', error);
    return NextResponse.json({ error: 'Failed to create lab technician account: ' + error.message }, { status: 500 });
  }
}
