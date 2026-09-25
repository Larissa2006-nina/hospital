import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUserFromRequest } from '@/lib/auth';
import { evaluateAndAwardBadges, ensureDefaultBadgesExist } from '@/app/actions/badges';

export async function GET(request) {
  try {
    const auth = getAuthUserFromRequest(request);
    await ensureDefaultBadgesExist();

    // 1. Fetch all system badges
    const allBadges = await prisma.badge.findMany({
      orderBy: { requiredDonationsCount: 'asc' },
    });

    let currentDonorData = null;

    if (auth && auth.userId) {
      // Evaluate badges for current logged in user
      await evaluateAndAwardBadges(auth.userId);

      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        include: {
          donor: {
            include: {
              bloodDonations: {
                where: { donationStatus: 'COMPLETED' },
              },
            },
          },
          userBadges: {
            include: { badge: true },
            orderBy: { awardedAt: 'desc' },
          },
        },
      });

      if (user) {
        const totalCompletedDonations = user.donor?.bloodDonations?.length || 0;
        const earnedBadgeIds = new Set(user.userBadges.map((ub) => ub.badgeId));

        const earnedBadges = user.userBadges.map((ub) => ({
          ...ub.badge,
          awardedAt: ub.awardedAt,
        }));

        const lockedBadges = allBadges
          .filter((b) => !earnedBadgeIds.has(b.id))
          .map((b) => ({
            ...b,
            progress: Math.min(totalCompletedDonations, b.requiredDonationsCount),
            needed: b.requiredDonationsCount,
          }));

        currentDonorData = {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isAnonymous: user.isAnonymous ?? false,
            showBadgesPublicly: user.showBadgesPublicly ?? true,
            receiveEmergencyOnly: user.receiveEmergencyOnly ?? false,
          },
          totalCompletedDonations,
          earnedBadges,
          lockedBadges,
        };
      }
    }

    // 2. Fetch Public Community Leaderboard with Data Masking Rule
    const donorsWithDonations = await prisma.donor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            isAnonymous: true,
            showBadgesPublicly: true,
            userBadges: {
              include: { badge: true },
            },
          },
        },
        bloodDonations: {
          where: { donationStatus: 'COMPLETED' },
        },
      },
    });

    const leaderboard = donorsWithDonations
      .map((d) => {
        const donationCount = d.bloodDonations.length;
        const isAnonymous = d.user?.isAnonymous ?? false;
        const showBadgesPublicly = d.user?.showBadgesPublicly ?? true;

        // Mask identity if isAnonymous === true OR showBadgesPublicly === false
        const isMasked = isAnonymous || !showBadgesPublicly;
        const displayName = isMasked ? 'Anonymous Donor' : (d.user?.name || 'Hero Donor');

        const badges = showBadgesPublicly
          ? d.user?.userBadges?.map((ub) => ub.badge) || []
          : [];

        return {
          donorId: d.donorId,
          userId: d.userId,
          displayName,
          bloodGroup: d.bloodGroup,
          donationCount,
          isAnonymous: isMasked,
          badges,
        };
      })
      .filter((entry) => entry.donationCount > 0)
      .sort((a, b) => b.donationCount - a.donationCount)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      allBadges,
      currentDonorData,
      leaderboard,
    });
  } catch (error) {
    console.error('Badges GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch badge data' }, { status: 500 });
  }
}
