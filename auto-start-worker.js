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
        room: {
          isStarted: false,
          isFinished: false
        }
      },
      include: {
        room: {
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
      
      if (snarkel.room && snarkel.room.participants.length >= snarkel.room.minParticipants) {
        // Emit start game event to socket server
        socket.emit('autoStartGame', {
          roomId: snarkel.room.id,
          countdownTime: 5 // 5 minute countdown
        });
        
        // Update room status
        await prisma.room.update({
          where: { id: snarkel.room.id },
          data: {
            isWaiting: false,
            scheduledStartTime: now
          }
        });
        
        console.log(`Successfully auto-started snarkel: ${snarkel.snarkelCode}`);
      } else {
        console.log(`Not enough participants for auto-start: ${snarkel.snarkelCode}`);
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