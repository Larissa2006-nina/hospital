import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, signToken, hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        administrator: true,
        donor: true,
        patient: true,
        labTechnician: {
          include: { hospital: true },
        },
        hospital: {
          include: { bloodBank: true },
        },
      },
    });

    // Auto-create Admin account if it doesn't exist yet and admin credentials are entered
    if (!user && cleanEmail === 'admin@bloodlink.org' && password === 'Admin123!') {
      const adminPass = await hashPassword('Admin123!');
      user = await prisma.user.create({
        data: {
          email: 'admin@bloodlink.org',
          passwordHash: adminPass,
          name: 'System Administrator',
          role: 'ADMIN',
          phone: '+237 670 000 000',
          administrator: {
            create: {
              department: 'Executive Medical Operations',
              permissions: 'SUPER_ADMIN_ALL',
            },
          },
        },
        include: {
          administrator: true,
          donor: true,
          patient: true,
          labTechnician: { include: { hospital: true } },
          hospital: { include: { bloodBank: true } },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      donorId: user.donor?.donorId,
      patientId: user.patient?.patientId,
      labTechId: user.labTechnician?.labTechId,
      hospitalId: user.hospital?.hospitalId || user.labTechnician?.hospitalId,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        donor: user.donor,
        patient: user.patient,
        labTechnician: user.labTechnician,
        hospital: user.hospital,
      },
      token,
    });

    // Set HTTP-Only Cookie
    response.cookies.set('bloodlink_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during login: ' + error.message }, { status: 500 });
  }
}
