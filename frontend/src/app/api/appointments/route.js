import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

// GET: Fetch appointments with role-based filtering
export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospitalId');
    const donorId = searchParams.get('donorId');
    const status = searchParams.get('status');

    let whereClause = {};

    if (donorId) {
      whereClause.donorId = donorId;
    } else if (hospitalId) {
      whereClause.hospitalId = hospitalId;
    } else if (auth) {
      if (auth.role === 'DONOR' && auth.donorId) {
        whereClause.donorId = auth.donorId;
      } else if ((auth.role === 'HOSPITAL' || auth.role === 'LAB_TECH') && auth.hospitalId) {
        whereClause.hospitalId = auth.hospitalId;
      }
    }

    if (status) {
      whereClause.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        donor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        hospital: true,
        bloodDonation: true,
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error('Appointments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST: Book a new appointment
export async function POST(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required. Please log in to book an appointment.' }, { status: 401 });
    }

    const body = await request.json();
    const { hospitalId, appointmentDate, appointmentTime, appointmentType = 'WHOLE_BLOOD', notes } = body;

    let donorId = body.donorId;

    // Auto-resolve donorId from authenticated user if not explicitly passed
    if (!donorId && auth) {
      if (auth.donorId) {
        donorId = auth.donorId;
      } else {
        const targetUserId = auth.userId || auth.id;
        if (targetUserId) {
          let donorRecord = await prisma.donor.findUnique({
            where: { userId: targetUserId },
          });

          // If donor profile does not exist yet, create it on the fly for the donor user
          if (!donorRecord) {
            donorRecord = await prisma.donor.create({
              data: {
                userId: targetUserId,
                bloodGroup: 'O_POS',
                dateOfBirth: new Date('1995-01-01'),
                gender: 'Unspecified',
                eligibilityStatus: 'ELIGIBLE',
              },
            });
          }
          donorId = donorRecord.donorId;
        }
      }
    }

    if (!donorId || !hospitalId || !appointmentDate || !appointmentTime) {
      return NextResponse.json({
        error: `Missing required appointment fields (${!donorId ? 'donor profile' : !hospitalId ? 'hospital' : !appointmentDate ? 'date' : 'time slot'}).`,
      }, { status: 400 });
    }

    const dateObj = new Date(appointmentDate);

    // Double-booking check 1: Check if donor already has an active appointment on this date
    const existingDonorAppt = await prisma.appointment.findFirst({
      where: {
        donorId,
        appointmentDate: dateObj,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingDonorAppt) {
      return NextResponse.json({
        error: 'You already have an appointment scheduled on this date. Please choose another date or manage your existing appointment.',
      }, { status: 409 });
    }

    // Double-booking check 2: Check hospital time-slot capacity
    const slotCount = await prisma.appointment.count({
      where: {
        hospitalId,
        appointmentDate: dateObj,
        appointmentTime,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (slotCount >= 3) {
      return NextResponse.json({
        error: 'This specific time slot at the hospital is fully booked. Please select a different time or date.',
      }, { status: 409 });
    }

    // Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        donorId,
        hospitalId,
        appointmentDate: dateObj,
        appointmentTime,
        appointmentType,
        status: 'CONFIRMED',
        notes,
      },
      include: {
        hospital: true,
        donor: { include: { user: true } },
      },
    });

    // Send Notification to Donor
    if (appointment.donor?.user) {
      await prisma.notification.create({
        data: {
          userId: appointment.donor.user.id,
          title: 'Appointment Booked Successfully',
          message: `Your blood donation appointment at ${appointment.hospital.name} is confirmed for ${dateObj.toLocaleDateString()} at ${appointmentTime}.`,
          notificationType: 'APPOINTMENT',
          linkUrl: '/donor/appointments',
        },
      });
    }

    // Send Notification to Hospital if hospital user exists
    const hospital = await prisma.hospital.findUnique({
      where: { hospitalId },
      include: { user: true },
    });

    if (hospital?.user) {
      await prisma.notification.create({
        data: {
          userId: hospital.user.id,
          title: 'New Donor Appointment Scheduled',
          message: `${appointment.donor.user.name} booked an appointment on ${dateObj.toLocaleDateString()} at ${appointmentTime}.`,
          notificationType: 'APPOINTMENT',
          linkUrl: '/hospital/appointments',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment scheduled successfully',
      appointment,
    }, { status: 201 });
  } catch (error) {
    console.error('Appointment POST error:', error);
    return NextResponse.json({ error: 'Failed to create appointment: ' + error.message }, { status: 500 });
  }
}

// PATCH: Update status
export async function PATCH(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { appointmentId, status, appointmentDate, appointmentTime, notes } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (appointmentTime) updateData.appointmentTime = appointmentTime;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.appointment.update({
      where: { appointmentId },
      data: updateData,
      include: {
        donor: { include: { user: true } },
        hospital: true,
      },
    });

    if (updated.donor?.user) {
      await prisma.notification.create({
        data: {
          userId: updated.donor.user.id,
          title: `Appointment Status: ${updated.status}`,
          message: `Your appointment at ${updated.hospital.name} status is now ${updated.status}.`,
          notificationType: 'APPOINTMENT',
          linkUrl: '/donor/appointments',
        },
      });
    }

    return NextResponse.json({
      success: true,
      appointment: updated,
    });
  } catch (error) {
    console.error('Appointment PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
