import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';

export async function PATCH(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    if (!auth || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isAnonymous, showBadgesPublicly, receiveEmergencyOnly } = body;

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(typeof isAnonymous === 'boolean' && { isAnonymous }),
        ...(typeof showBadgesPublicly === 'boolean' && { showBadgesPublicly }),
        ...(typeof receiveEmergencyOnly === 'boolean' && { receiveEmergencyOnly }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully',
      user: {
        id: updatedUser.id,
        isAnonymous: updatedUser.isAnonymous,
        showBadgesPublicly: updatedUser.showBadgesPublicly,
        receiveEmergencyOnly: updatedUser.receiveEmergencyOnly,
      },
    });
  } catch (error) {
    console.error('Privacy settings update error:', error);
    return NextResponse.json({ error: 'Failed to update privacy settings' }, { status: 500 });
  }
}
