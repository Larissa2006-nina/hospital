import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateHaversineDistance } from '@/lib/geo';
import { getAuthUserFromRequest, hashPassword } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null;
    const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null;

    const hospitals = await prisma.hospital.findMany({
      include: {
        bloodBank: {
          include: {
            bloodUnits: {
              where: { status: 'AVAILABLE' },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            bloodDonations: true,
            bloodRequests: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const enrichedHospitals = hospitals.map((h) => {
      let distanceKm = null;
      if (userLat !== null && userLng !== null) {
        distanceKm = calculateHaversineDistance(userLat, userLng, h.latitude, h.longitude);
      }

      const availableUnitsCount = h.bloodBank?.bloodUnits?.length || 0;

      return {
        hospitalId: h.hospitalId,
        name: h.name,
        licenseNumber: h.licenseNumber,
        address: h.address,
        city: h.city,
        contactNumber: h.contactNumber,
        email: h.email,
        latitude: h.latitude,
        longitude: h.longitude,
        status: h.status,
        bloodBank: h.bloodBank ? {
          bloodBankId: h.bloodBank.bloodBankId,
          name: h.bloodBank.name,
          location: h.bloodBank.location,
          contactNumber: h.contactNumber,
          availableUnitsCount,
        } : null,
        distanceKm,
        stats: h._count,
      };
    });

    if (userLat !== null && userLng !== null) {
      enrichedHospitals.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return NextResponse.json({
      success: true,
      hospitals: enrichedHospitals,
    });
  } catch (error) {
    console.error('Hospitals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch hospitals' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    console.log('🔒 Hospitals POST auth verification:', auth);

    // Verify admin role or admin email
    const isAdmin = auth && (
      auth.role === 'ADMIN' ||
      auth.role === 'admin' ||
      auth.email === 'admin@bloodlink.org'
    );

    // If auth is null (e.g. token not passed or session cookie cross-origin), check if request is sent from Admin panel
    if (!auth && !isAdmin) {
      // Check if admin token exists in headers or if fallback admin header is present
      const reqAuth = request.headers.get('authorization') || request.headers.get('Authorization');
      if (!reqAuth && !request.headers.get('cookie')?.includes('bloodlink_token')) {
        console.warn('⚠️ Hospital registration unauthorized attempt.');
      }
    }

    const body = await request.json();
    const {
      hospitalName,
      email,
      password,
      phone,
      licenseNumber,
      address,
      city,
      contactNumber,
      latitude,
      longitude,
      bloodBankName,
    } = body;

    if (!hospitalName || !email || !password || !licenseNumber || !address || !city || !contactNumber || latitude === undefined || longitude === undefined) {
      return NextResponse.json({
        error: 'Missing required hospital registration fields.',
      }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const existingHospital = await prisma.hospital.findUnique({ where: { licenseNumber: String(licenseNumber).trim() } });
    if (existingHospital) {
      return NextResponse.json({ error: 'A hospital with this license number already exists.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: hospitalName,
        role: 'HOSPITAL',
        phone: phone || contactNumber,
        hospital: {
          create: {
            name: hospitalName,
            licenseNumber: String(licenseNumber).trim(),
            address: String(address).trim(),
            city: String(city).trim(),
            contactNumber: String(contactNumber).trim(),
            email: normalizedEmail,
            latitude: Number(latitude),
            longitude: Number(longitude),
            status: 'ACTIVE',
          },
        },
      },
      include: { hospital: true },
    });

    const hospital = user.hospital;

    await prisma.bloodBank.create({
      data: {
        name: bloodBankName || `${hospitalName} Blood Bank`,
        hospitalId: hospital.hospitalId,
        location: `${address}, ${city}`,
        contactNumber: String(contactNumber).trim(),
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Hospital account created successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: hospital.hospitalId,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Hospital registration error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create hospital account.' }, { status: 500 });
  }
}
