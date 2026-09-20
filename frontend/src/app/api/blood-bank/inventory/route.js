import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let hospitalId = searchParams.get('hospitalId');
    const auth = getAuthUserFromRequest(request);

    // If request has auth and is a hospital user or lab tech, use their hospital
    if (!hospitalId && auth) {
      if (auth.hospitalId) hospitalId = auth.hospitalId;
    }

    const whereClause = hospitalId ? { bloodBank: { hospitalId } } : {};

    const bloodUnits = await prisma.bloodUnit.findMany({
      where: whereClause,
      include: {
        bloodBank: {
          include: { hospital: true },
        },
        labTechnician: {
          include: { user: true },
        },
        bloodDonation: {
          include: {
            donor: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { collectionDate: 'desc' },
    });

    // Compute summary analytics by Blood Group & Status
    const bloodGroups = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG'];
    const stockByGroup = {};
    const stockByComponent = { WHOLE_BLOOD: 0, RED_CELLS: 0, PLATELETS: 0, PLASMA: 0 };
    const stockByStatus = { AVAILABLE: 0, TESTING: 0, RESERVED: 0, ISSUED: 0, EXPIRED: 0, DISCARDED: 0 };

    bloodGroups.forEach((bg) => {
      stockByGroup[bg] = {
        totalUnits: 0,
        available: 0,
        testing: 0,
        reserved: 0,
        isLowStock: false,
      };
    });

    bloodUnits.forEach((unit) => {
      // Status breakdown
      if (stockByStatus[unit.status] !== undefined) {
        stockByStatus[unit.status]++;
      }

      // Component breakdown
      if (unit.status === 'AVAILABLE' && stockByComponent[unit.componentType] !== undefined) {
        stockByComponent[unit.componentType]++;
      }

      // Group breakdown
      if (stockByGroup[unit.bloodGroup]) {
        stockByGroup[unit.bloodGroup].totalUnits++;
        if (unit.status === 'AVAILABLE') stockByGroup[unit.bloodGroup].available++;
        if (unit.status === 'TESTING') stockByGroup[unit.bloodGroup].testing++;
        if (unit.status === 'RESERVED') stockByGroup[unit.bloodGroup].reserved++;
      }
    });

    // Check low-stock threshold (threshold = < 2 available units)
    bloodGroups.forEach((bg) => {
      stockByGroup[bg].isLowStock = stockByGroup[bg].available < 2;
    });

    return NextResponse.json({
      success: true,
      totalUnitsCount: bloodUnits.length,
      stockByStatus,
      stockByComponent,
      stockByGroup,
      units: bloodUnits,
    });
  } catch (error) {
    console.error('Blood bank inventory fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}
