'use server';

import prisma from '../../lib/prisma.js';

export const DEFAULT_BADGES = [
  {
    name: 'First Drop',
    description: 'Completed your first voluntary blood donation!',
    iconUrl: '💧',
    requiredDonationsCount: 1,
  },
  {
    name: 'Life Saver',
    description: 'Saved up to 15 lives through 5 voluntary blood donations!',
    iconUrl: '❤️',
    requiredDonationsCount: 5,
  },
  {
    name: 'Hero Donor',
    description: 'A true community hero with 10 completed blood donations!',
    iconUrl: '🏆',
    requiredDonationsCount: 10,
  },
  {
    name: 'Blood Champion',
    description: 'Champion of life! Reached 25 voluntary blood donations!',
    iconUrl: '👑',
    requiredDonationsCount: 25,
  },
];

/**
 * Ensures default gamification badges exist in the database.
 */
export async function ensureDefaultBadgesExist() {
  for (const badge of DEFAULT_BADGES) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {
        description: badge.description,
        iconUrl: badge.iconUrl,
        requiredDonationsCount: badge.requiredDonationsCount,
      },
      create: badge,
    });
  }
}

/**
 * Evaluates donor donation milestone counts and automatically awards new badges.
 * Transaction safety ensures no duplicate badge assignments can occur.
 * 
 * @param {string} identifier - User ID or Donor ID
 */
export async function evaluateAndAwardBadges(identifier) {
  try {
    if (!identifier) {
      return { success: false, error: 'User or Donor ID required' };
    }

    // 1. Ensure default badges exist in DB
    await ensureDefaultBadgesExist();

    // 2. Resolve userId and donorId
    let userId = identifier;

    const donorRecord = await prisma.donor.findFirst({
      where: {
        OR: [
          { userId: identifier },
          { donorId: identifier },
        ],
      },
    });

    if (donorRecord) {
      userId = donorRecord.userId;
    } else {
      const userRecord = await prisma.user.findUnique({ where: { id: identifier } });
      if (!userRecord) {
        return { success: false, error: 'User not found' };
      }
      userId = userRecord.id;
    }

    // 3. Calculate total completed donation count for this donor
    const completedDonationsCount = await prisma.bloodDonation.count({
      where: {
        donor: { userId },
        donationStatus: 'COMPLETED',
      },
    });

    // 4. Find all badges that the donor qualifies for
    const qualifyingBadges = await prisma.badge.findMany({
      where: {
        requiredDonationsCount: {
          lte: completedDonationsCount,
        },
      },
    });

    // 5. Find existing awarded badges for this user
    const existingUserBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const existingBadgeIds = new Set(existingUserBadges.map((ub) => ub.badgeId));

    // 6. Identify newly unlocked badges
    const newBadgesToAward = qualifyingBadges.filter((b) => !existingBadgeIds.has(b.id));

    if (newBadgesToAward.length === 0) {
      const currentBadges = await prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { awardedAt: 'desc' },
      });
      return {
        success: true,
        newlyAwarded: [],
        totalCompletedDonations: completedDonationsCount,
        userBadges: currentBadges,
      };
    }

    // 7. Transaction safety: Award new badges and create notifications
    const newlyAwardedBadges = await prisma.$transaction(async (tx) => {
      const awarded = [];

      for (const badge of newBadgesToAward) {
        const userBadge = await tx.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId,
              badgeId: badge.id,
            },
          },
          update: {},
          create: {
            userId,
            badgeId: badge.id,
            awardedAt: new Date(),
          },
          include: { badge: true },
        });

        awarded.push(userBadge);

        // Notify user about newly unlocked badge
        await tx.notification.create({
          data: {
            userId,
            title: `🎉 Badge Unlocked: ${badge.name}!`,
            message: `Congratulations! You unlocked the "${badge.name}" badge (${badge.iconUrl}) for completing ${completedDonationsCount} blood donation(s).`,
            notificationType: 'INFO',
            linkUrl: '/donor',
          },
        });
      }

      return awarded;
    });

    const allUserBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });

    return {
      success: true,
      newlyAwarded: newlyAwardedBadges,
      totalCompletedDonations: completedDonationsCount,
      userBadges: allUserBadges,
    };
  } catch (error) {
    console.error('Error in evaluateAndAwardBadges:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action to update user privacy settings (Anonymous mode, show badges publicly, emergency alerts).
 */
export async function updatePrivacySettings({ userId, isAnonymous, showBadgesPublicly, receiveEmergencyOnly }) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof isAnonymous === 'boolean' && { isAnonymous }),
        ...(typeof showBadgesPublicly === 'boolean' && { showBadgesPublicly }),
        ...(typeof receiveEmergencyOnly === 'boolean' && { receiveEmergencyOnly }),
      },
    });

    return {
      success: true,
      message: 'Privacy settings updated successfully',
      user: {
        id: updatedUser.id,
        isAnonymous: updatedUser.isAnonymous,
        showBadgesPublicly: updatedUser.showBadgesPublicly,
        receiveEmergencyOnly: updatedUser.receiveEmergencyOnly,
      },
    };
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return { success: false, error: error.message };
  }
}
