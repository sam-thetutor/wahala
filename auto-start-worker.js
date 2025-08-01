const { PrismaClient } = require('@prisma/client');
const { io } = require('socket.io-client');

const prisma = new PrismaClient();

// Connect to socket server
const socket = io(process.env.SOCKET_URL || 'http://localhost:3001');

// Check for scheduled quizzes every minute
setInterval(async () => {
  try {
    const now = new Date();
    
    // Find snarkels that should start now
    const scheduledSnarkels = await prisma.snarkel.findMany({
      where: {
        autoStartEnabled: true,
        startTime: {
          lte: now,
          gte: new Date(now.getTime() - 60000) // Within last minute
        },
        isActive: true,
        rooms: {
          some: {
            isStarted: false,
            isFinished: false
          }
        }
      },
      include: {
        rooms: {
          where: {
            isStarted: false,
            isFinished: false
          },
          include: {
            participants: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    for (const snarkel of scheduledSnarkels) {
      console.log(`Auto-starting snarkel: ${snarkel.title} (${snarkel.snarkelCode})`);
      
      // Process each active room for this snarkel
      for (const room of snarkel.rooms) {
        if (room.participants.length >= room.minParticipants) {
          // Emit start game event to socket server
          socket.emit('autoStartGame', {
            roomId: room.id,
            countdownTime: 5 // 5 minute countdown
          });
          
          // Update room status
          await prisma.room.update({
            where: { id: room.id },
            data: {
              isWaiting: false,
              scheduledStartTime: now
            }
          });
          
          console.log(`Successfully auto-started room: ${room.id} for snarkel: ${snarkel.snarkelCode}`);
        } else {
          console.log(`Not enough participants for auto-start in room ${room.id}: ${snarkel.snarkelCode}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-start worker:', error);
  }
}, 60000); // Check every minute

// Handle socket connection
socket.on('connect', () => {
  console.log('Auto-start worker connected to socket server');
});

socket.on('disconnect', () => {
  console.log('Auto-start worker disconnected from socket server');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Auto-start worker shutting down...');
  socket.disconnect();
  process.exit(0);
});

console.log('Auto-start worker started'); 