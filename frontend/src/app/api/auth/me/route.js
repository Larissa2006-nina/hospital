import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
