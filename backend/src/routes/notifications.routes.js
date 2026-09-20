const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const auth = req.user;
    if (!auth || !auth.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    console.error('Notifications GET error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/mark-read
router.patch('/mark-read', async (req, res) => {
  try {
    const auth = req.user;
    const { notificationId } = req.body;

    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    let whereClause = { userId: auth.id };
    if (notificationId) whereClause.notificationId = notificationId;

    await prisma.notification.updateMany({
      where: whereClause,
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Notifications update error:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
