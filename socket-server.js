const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000",
    methods: ["GET", "POST"]
  }
});

// Store active rooms and their state
const activeRooms = new Map();

// Store question answers and scores for each room
const questionAnswers = new Map(); // roomId -> Map(questionId -> answers)
const roomScores = new Map(); // roomId -> Map(userId -> score)

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const { roomId, walletAddress } = socket.handshake.query;
  
  if (!roomId || !walletAddress) {
    console.log('Socket connection rejected: Missing roomId or walletAddress');
    socket.disconnect();
    return;
  }

  // Enhanced wallet address validation
  if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
    console.log('Socket connection rejected: Invalid wallet address format', walletAddress);
    socket.disconnect();
    return;
  }

  // Join the room
  socket.join(roomId);
  console.log(`User ${walletAddress} joined room ${roomId}`);

  // Notify other participants about the new join
  socket.to(roomId).emit('participantJoined', {
    walletAddress,
    timestamp: new Date().toISOString()
  });

  // Emit room stats update when user joins
  emitRoomStatsUpdate(roomId);

  // Handle ready toggle
  socket.on('toggleReady', async () => {
    try {
      // Update participant ready status in database
      const user = await prisma.user.findUnique({
        where: { address: walletAddress.toLowerCase() }
      });

      if (user) {
        const participant = await prisma.roomParticipant.findFirst({
          where: {
            roomId,
            userId: user.id
          }
        });

        if (participant) {
          await prisma.roomParticipant.update({
            where: { id: participant.id },
            data: { isReady: !participant.isReady }
          });

          // Notify all clients in the room
          socket.to(roomId).emit('participantReady', participant.id);
          
          // Emit room stats update
          emitRoomStatsUpdate(roomId);
        }
      }
    } catch (error) {
      console.error('Error toggling ready status:', error);
    }
  });

  // Handle game start (admin only)
  socket.on('startGame', async (data) => {
    try {
      console.log('=== startGame event received on server ===');
      console.log('Data received:', data);
      const { countdownTime = 5 } = data || {};
      console.log('Countdown time:', countdownTime);
      
      // Verify user is admin
      const user = await prisma.user.findUnique({
        where: { address: walletAddress.toLowerCase() }
      });

      if (user) {
        const participant = await prisma.roomParticipant.findFirst({
          where: {
            roomId,
            userId: user.id,
            isAdmin: true
          }
        });

        if (participant) {
          console.log('Admin verified, emitting gameStarting event');
          // Emit gameStarting event to show countdown
          io.to(roomId).emit('gameStarting', countdownTime);
          console.log('gameStarting event emitted with countdown:', countdownTime);
          
          // Start countdown with custom time
          let countdown = countdownTime || 10;
          console.log('Starting countdown from:', countdown);
          
          const countdownInterval = setInterval(() => {
            console.log('Countdown update:', countdown);
            io.to(roomId).emit('countdownUpdate', countdown);
            countdown--;

            if (countdown < 0) {
              console.log('Countdown finished, starting quiz');
              clearInterval(countdownInterval);
              startQuiz(roomId);
            }
          }, 1000);
        } else {
          console.log('User is not admin');
        }
      } else {
        console.log('User not found');
      }
      
      console.log('=== startGame event processed ===');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  });

  // Handle admin messages
  socket.on('sendAdminMessage', async (data) => {
    try {
      const { message, timestamp } = data;
      
      // Verify user is admin
      const user = await prisma.user.findUnique({
        where: { address: walletAddress.toLowerCase() }
      });

      if (user) {
        const participant = await prisma.roomParticipant.findFirst({
          where: {
            roomId,
            userId: user.id,
            isAdmin: true
          }
        });

        if (participant && message) {
          // Broadcast message to all clients in room
          io.to(roomId).emit('adminMessageReceived', { message, timestamp });
        }
      }
    } catch (error) {
      console.error('Error sending admin message:', error);
    }
  });

  // Handle regular messages (for backward compatibility)
  socket.on('sendMessage', async (data) => {
    try {
      console.log('Received sendMessage event:', data);
      const { message } = data;
      
      // Verify user is admin
      const user = await prisma.user.findUnique({
        where: { address: walletAddress.toLowerCase() }
      });

      console.log('User found:', user ? user.address : 'not found');

      if (user) {
        const participant = await prisma.roomParticipant.findFirst({
          where: {
            roomId,
            userId: user.id,
            isAdmin: true
          }
        });

        console.log('Participant found:', participant ? { isAdmin: participant.isAdmin, userId: participant.userId } : 'not found');

        if (participant && message) {
          console.log('Broadcasting message to room:', roomId, 'Message:', message);
          // Broadcast message to all clients in room
          io.to(roomId).emit('adminMessageReceived', { 
            message, 
            timestamp: new Date().toISOString() 
          });
          console.log('Message broadcasted successfully');
        } else {
          console.log('Message not sent - participant not admin or message empty');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle auto-start game (from worker)
  socket.on('autoStartGame', async (data) => {
    try {
      const { roomId, countdownTime = 5 } = data;
      
      console.log(`Auto-starting game for room: ${roomId}`);
      
      // Start countdown
      let countdown = countdownTime * 60; // Convert to seconds
      const countdownInterval = setInterval(() => {
        io.to(roomId).emit('countdownUpdate', countdown);
        countdown--;

        if (countdown < 0) {
          clearInterval(countdownInterval);
          startQuiz(roomId);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error auto-starting game:', error);
    }
  });

  // Handle answer submission with immediate scoring
  socket.on('submitAnswer', async (data) => {
    try {
      const { questionId, answerId, timeLeft } = data;
      const user = await prisma.user.findUnique({
        where: { address: walletAddress.toLowerCase() }
      });

      if (user) {
        // Get the question to check if answer is correct
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          include: {
            options: true,
            snarkel: true
          }
        });

        if (!question) {
          console.error('Question not found:', questionId);
          return;
        }

        // Find the selected option
        const selectedOption = question.options.find(opt => opt.id === answerId);
        const isCorrect = selectedOption ? selectedOption.isCorrect : false;

        // Calculate score using quadratic formula
        const basePoints = question.snarkel.basePointsPerQuestion || 100;
        const maxTime = question.timeLimit;
        const timeUsed = maxTime - timeLeft;
        const timeRatio = timeUsed / maxTime;
        
        // Quadratic scoring: faster answers get exponentially more points
        // Formula: basePoints * (1 - timeRatio^2)
        const score = isCorrect ? Math.round(basePoints * (1 - Math.pow(timeRatio, 2))) : 0;

        // Store the answer
        if (!questionAnswers.has(roomId)) {
          questionAnswers.set(roomId, new Map());
        }
        const roomQuestionAnswers = questionAnswers.get(roomId);
        if (!roomQuestionAnswers.has(questionId)) {
          roomQuestionAnswers.set(questionId, { answers: [] });
        }

        const questionData = roomQuestionAnswers.get(questionId);
        questionData.answers.push({
          userId: user.id,
          answerId,
          isCorrect,
          points: score,
          timeLeft
        });

        // Update room scores
        if (!roomScores.has(roomId)) {
          roomScores.set(roomId, new Map());
        }
        const userScores = roomScores.get(roomId);
        const currentScore = userScores.get(user.id) || 0;
        userScores.set(user.id, currentScore + score);

        console.log(`User ${user.address} submitted answer for question ${questionId}: ${isCorrect ? 'Correct' : 'Incorrect'} (+${score} points)`);
        
        // Emit answer submitted event
        socket.to(roomId).emit('answerSubmitted', {
          userId: user.id,
          questionId,
          isCorrect,
          points: score
        });
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User ${walletAddress} disconnected from room ${roomId}`);
    
    try {
      // Update participant count
      const user = await prisma.user.findUnique({
        where: { address: walletAddress.toLowerCase() }
      });

      if (user) {
        const participant = await prisma.roomParticipant.findFirst({
          where: {
            roomId,
            userId: user.id
          }
        });

        if (participant) {
          try {
            await prisma.roomParticipant.delete({
              where: { id: participant.id }
            });
          } catch (error) {
            // Participant might have already been deleted, just log and continue
            console.log(`Participant ${participant.id} already removed or not found`);
          }

          // Update room participant count
          await prisma.room.update({
            where: { id: roomId },
            data: {
              currentParticipants: {
                decrement: 1
              }
            }
          });

          // Remove from scoring system
          if (roomScores.has(roomId)) {
            const userScores = roomScores.get(roomId);
            userScores.delete(user.id);
          }

          // Remove from current question answers if quiz is active
          if (questionAnswers.has(roomId)) {
            const roomQuestionAnswers = questionAnswers.get(roomId);
            roomQuestionAnswers.forEach((questionData, questionId) => {
              questionData.answers = questionData.answers.filter(answer => answer.userId !== user.id);
            });
          }

          // Notify other participants
          socket.to(roomId).emit('participantLeft', participant.id);
          
          // Emit room stats update
          emitRoomStatsUpdate(roomId);
          
          // Check if room is now empty and end quiz if needed
          const remainingParticipants = await prisma.roomParticipant.count({
            where: { roomId }
          });
          
          if (remainingParticipants === 0) {
            console.log(`Room ${roomId} is now empty, closing room`);
            // Clean up any active quiz state
            questionAnswers.delete(roomId);
            roomScores.delete(roomId);
            
            // Close the room (mark as inactive and finished)
            await prisma.room.update({
              where: { id: roomId },
              data: {
                isStarted: false,
                isWaiting: false,
                isFinished: true,
                isActive: false,
                currentParticipants: 0,
                endTime: new Date()
              }
            });
            
            // Notify remaining clients (if any)
            io.to(roomId).emit('roomEmpty');
          }
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

async function emitRoomStatsUpdate(roomId) {
  try {
    // Get updated room data
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    if (room) {
      // Emit room stats update to all clients in the room
      io.to(roomId).emit('roomStatsUpdate', {
        currentParticipants: room.currentParticipants,
        maxParticipants: room.maxParticipants,
        minParticipants: room.minParticipants,
        isStarted: room.isStarted,
        isWaiting: room.isWaiting,
        participants: room.participants.map(p => ({
          id: p.id,
          userId: p.userId,
          isAdmin: p.isAdmin,
          isReady: p.isReady,
          joinedAt: p.joinedAt,
          user: {
            id: p.user.id,
            address: p.user.address,
            name: p.user.name
          }
        }))
      });
    }
  } catch (error) {
    console.error('Error emitting room stats update:', error);
  }
}

async function startQuiz(roomId) {
  try {
    // Get room and snarkel data
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        snarkel: {
          include: {
            questions: {
              include: {
                options: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!room || !room.snarkel) {
      return;
    }

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: {
        isStarted: true,
        isWaiting: false,
        actualStartTime: new Date()
      }
    });

    // Initialize question answers and scores for this room
    questionAnswers.set(roomId, new Map());
    roomScores.set(roomId, new Map());

    // Start the quiz with questions
    const questions = room.snarkel.questions;
    let currentQuestionIndex = 0;

    const askQuestion = () => {
      if (currentQuestionIndex >= questions.length) {
        // Quiz finished
        endQuiz(roomId);
        return;
      }

      const question = questions[currentQuestionIndex];
      
      // Send question to all clients
      io.to(roomId).emit('questionStart', {
        id: question.id,
        text: question.text,
        timeLimit: question.timeLimit,
        options: question.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect
        }))
      });

      // Set timer for question with countdown updates
      let questionTimeLeft = question.timeLimit;
      const questionTimer = setInterval(() => {
        questionTimeLeft--;
        
        // Emit countdown update every second
        io.to(roomId).emit('questionTimeUpdate', questionTimeLeft);
        
        if (questionTimeLeft <= 0) {
          clearInterval(questionTimer);
          
          // Question time is up - reveal answers
          revealAnswers(roomId, question);
          
          // Wait 10 seconds for answer reveal
          setTimeout(() => {
            // Update leaderboard
            updateLeaderboard(roomId);
            
            // Move to next question
            currentQuestionIndex++;
            setTimeout(askQuestion, 2000);
          }, 10000);
        }
      }, 1000);
    };

    askQuestion();

  } catch (error) {
    console.error('Error starting quiz:', error);
  }
}

async function revealAnswers(roomId, question) {
  try {
    // Get all answers for this question
    const roomQuestionAnswers = questionAnswers.get(roomId);
    const questionData = roomQuestionAnswers?.get(question.id);
    
    if (!questionData) {
      console.log('No answers found for question:', question.id);
      return;
    }

    // Find the correct answer
    const correctOption = question.options.find(opt => opt.isCorrect);
    const correctAnswer = correctOption ? correctOption.text : 'Unknown';

    // Get user names for the answers - prefer actual names over wallet addresses
    const userAnswers = await Promise.all(
      questionData.answers.map(async (answer) => {
        const user = await prisma.user.findUnique({
          where: { id: answer.userId }
        });
        
        let displayName = 'Unknown Player';
        if (user) {
          // Use actual name if available, otherwise use shortened wallet address
          if (user.name && user.name.trim() !== '') {
            displayName = user.name;
          } else if (user.address) {
            displayName = `${user.address.slice(0, 6)}...${user.address.slice(-4)}`;
          }
        }
        
        return {
          userId: answer.userId,
          answerId: answer.answerId,
          isCorrect: answer.isCorrect,
          points: answer.points,
          userName: displayName
        };
      })
    );

    // Emit answer reveal to all clients
    io.to(roomId).emit('answerReveal', {
      questionId: question.id,
      correctAnswer,
      userAnswers
    });

    console.log(`Revealed answers for question ${question.id}:`, userAnswers);

  } catch (error) {
    console.error('Error revealing answers:', error);
  }
}

async function updateLeaderboard(roomId) {
  try {
    const scores = roomScores.get(roomId);
    if (!scores) {
      console.log('No scores found for room:', roomId);
      return;
    }

    // Get user names for the scores - prefer actual names over wallet addresses
    const leaderboard = await Promise.all(
      Array.from(scores.entries()).map(async ([userId, score]) => {
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        
        let displayName = 'Unknown Player';
        if (user) {
          // Use actual name if available, otherwise use shortened wallet address
          if (user.name && user.name.trim() !== '') {
            displayName = user.name;
          } else if (user.address) {
            displayName = `${user.address.slice(0, 6)}...${user.address.slice(-4)}`;
          }
        }
        
        return {
          userId,
          name: displayName,
          score
        };
      })
    );

    // Sort by score (highest first)
    leaderboard.sort((a, b) => b.score - a.score);

    // Emit leaderboard update to all clients
    io.to(roomId).emit('leaderboardUpdate', leaderboard);

    console.log(`Updated leaderboard for room ${roomId}:`, leaderboard);

  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

async function endQuiz(roomId) {
  try {
    // Get room information first
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        snarkel: true
      }
    });

    if (!room) {
      console.error(`Room ${roomId} not found`);
      return;
    }

    // Update room status to finished and inactive
    await prisma.room.update({
      where: { id: roomId },
      data: {
        isFinished: true,
        isStarted: false,
        isActive: false,
        endTime: new Date()
      }
    });

    // Get final leaderboard
    const scores = roomScores.get(roomId);
    if (scores) {
      const finalLeaderboard = await Promise.all(
        Array.from(scores.entries()).map(async ([userId, score]) => {
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          let displayName = 'Unknown Player';
          if (user) {
            // Use actual name if available, otherwise use shortened wallet address
            if (user.name && user.name.trim() !== '') {
              displayName = user.name;
            } else if (user.address) {
              displayName = `${user.address.slice(0, 6)}...${user.address.slice(-4)}`;
            }
          }
          
          return {
            userId,
            name: displayName,
            score
          };
        })
      );

      finalLeaderboard.sort((a, b) => b.score - a.score);

      // Send final results
      io.to(roomId).emit('gameEnd', finalLeaderboard);

      // Automatically distribute rewards if enabled
      if (room.snarkel.rewardsEnabled) {
        console.log(`Attempting automatic reward distribution for room ${roomId}, session ${room.sessionNumber}`);
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000'}/api/quiz/distribute-rewards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              roomId,
              sessionNumber: room.sessionNumber,
              finalLeaderboard
            }),
          });

          // Check if response is successful before trying to parse JSON
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Reward distribution API returned ${response.status}: ${errorText}`);
            
            // Try to parse as JSON if possible, otherwise use the text
            let errorMessage = 'Failed to distribute rewards automatically';
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch (parseError) {
              // If it's HTML or other non-JSON content, use a generic message
              if (response.status === 500) {
                errorMessage = 'Server error during reward distribution';
              } else {
                errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 100)}...`;
              }
            }
            
            io.to(roomId).emit('rewardsDistributed', {
              success: false,
              message: errorMessage,
              error: `HTTP ${response.status}`
            });
            return;
          }

          const result = await response.json();
          
          if (result.success) {
            console.log('Automatic reward distribution completed:', result);
            // Emit reward distribution event to clients
            io.to(roomId).emit('rewardsDistributed', {
              success: true,
              message: 'Rewards have been automatically distributed!',
              results: result.results
            });
          } else {
            console.error('Automatic reward distribution failed:', result.error);
            io.to(roomId).emit('rewardsDistributed', {
              success: false,
              message: 'Failed to distribute rewards automatically',
              error: result.error
            });
          }
        } catch (error) {
          console.error('Error calling reward distribution API:', error);
          io.to(roomId).emit('rewardsDistributed', {
            success: false,
            message: 'Error during automatic reward distribution',
            error: error.message
          });
        }
      } else {
        console.log(`Rewards not enabled for snarkel ${room.snarkelId}`);
      }
    }

    // Clean up room data
    questionAnswers.delete(roomId);
    roomScores.delete(roomId);

    console.log(`Room ${roomId} finished and closed. New sessions will create new rooms.`);

  } catch (error) {
    console.error('Error ending quiz:', error);
  }
}

const PORT = process.env.SOCKET_PORT || 4001;

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
}); 