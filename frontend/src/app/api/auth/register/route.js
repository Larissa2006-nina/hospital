import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, role, phone, ...roleData } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, password, name, and role' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Create user with specific role relation
    let user;
    if (role === 'DONOR') {
      const bloodGroup = roleData.bloodGroup || 'O_POS';
      const dob = roleData.dateOfBirth ? new Date(roleData.dateOfBirth) : new Date('1995-01-01');
      const weight = roleData.weight ? parseFloat(roleData.weight) : 65.0;
      const lat = roleData.latitude ? parseFloat(roleData.latitude) : 4.0511;
      const lng = roleData.longitude ? parseFloat(roleData.longitude) : 9.7679;

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          name,
          role: 'DONOR',
          phone,
          donor: {
            create: {
              bloodGroup,
              dateOfBirth: dob,
              gender: roleData.gender || 'Not specified',
              weight,
              latitude: lat,
              longitude: lng,
              address: roleData.address || '',
              city: roleData.city || 'Douala',
              eligibilityStatus: 'ELIGIBLE',
            },
          },
        },
        include: { donor: true },
      });
    } else if (role === 'PATIENT') {
      const dob = roleData.dateOfBirth ? new Date(roleData.dateOfBirth) : new Date('1990-01-01');
      const medicalId = roleData.medicalId || `MED-${Date.now()}`;

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
          name,
          role: 'PATIENT',
          phone,
          patient: {
            create: {
              dateOfBirth: dob,
              gender: roleData.gender || 'Not specified',
              medicalId,
              address: roleData.address || '',
              city: roleData.city || 'New York',
            },
          },
        },
        include: { patient: true },
      });
    } else {
      return NextResponse.json({ error: 'Public registration is only available for Donors and Patients. Hospital & Lab accounts are created by Administrator.' }, { status: 400 });
    }

    // Create Welcome Notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to BloodLink!',
        message: `Welcome ${user.name}! Your account as a registered ${role} is now active.`,
        notificationType: 'INFO',
        linkUrl: role === 'DONOR' ? '/donor' : '/patient',
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      donorId: user.donor?.donorId,
      patientId: user.patient?.patientId,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        donor: user.donor,
        patient: user.patient,
      },
      token,
    }, { status: 201 });

    response.cookies.set('bloodlink_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to create account. ' + error.message }, { status: 500 });
  }
}
