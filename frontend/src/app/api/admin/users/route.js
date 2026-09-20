import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const whereClause = {};
    if (role && role !== 'ALL') {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        donor: {
          select: {
            bloodGroup: true,
            eligibilityStatus: true,
            city: true,
          },
        },
        patient: {
          select: {
            medicalId: true,
            city: true,
          },
        },
        hospital: {
          select: {
            name: true,
            city: true,
          },
        },
        labTechnician: {
          select: {
            licenseNumber: true,
            hospital: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users from database' }, { status: 500 });
  }
}
