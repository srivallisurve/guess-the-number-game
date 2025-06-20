import React, { useState, useEffect } from 'react';
import { Brain, RotateCcw, Trophy, Target, Clock, Star } from 'lucide-react';

interface GameState {
  targetNumber: number;
  currentGuess: string;
  attempts: number;
  gameStatus: 'playing' | 'won' | 'lost';
  hint: string;
  gameMode: 'easy' | 'medium' | 'hard' | 'expert';
  maxAttempts: number;
  score: number;
  bestScore: number;
  timeLeft: number;
  isTimedMode: boolean;
}

const GAME_MODES = {
  easy: { range: [1, 50], attempts: 10, label: 'Easy (1-50)' },
  medium: { range: [1, 100], attempts: 8, label: 'Medium (1-100)' },
  hard: { range: [1, 200], attempts: 6, label: 'Hard (1-200)' },
  expert: { range: [1, 500], attempts: 5, label: 'Expert (1-500)' }
};

function App() {
  const [gameState, setGameState] = useState<GameState>({
    targetNumber: 0,
    currentGuess: '',
    attempts: 0,
    gameStatus: 'playing',
    hint: 'Make your first guess!',
    gameMode: 'medium',
    maxAttempts: 8,
    score: 0,
    bestScore: parseInt(localStorage.getItem('bestScore') || '0'),
    timeLeft: 60,
    isTimedMode: false
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [gameHistory, setGameHistory] = useState<Array<{guess: number, result: string}>>([]);

  useEffect(() => {
    initializeGame();
  }, [gameState.gameMode, gameState.isTimedMode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.isTimedMode && gameState.gameStatus === 'playing' && gameState.timeLeft > 0) {
      timer = setTimeout(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            return { ...prev, timeLeft: 0, gameStatus: 'lost', hint: 'Time\'s up! Try again.' };
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [gameState.timeLeft, gameState.isTimedMode, gameState.gameStatus]);

  const initializeGame = () => {
    const mode = GAME_MODES[gameState.gameMode];
    const [min, max] = mode.range;
    const targetNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    
    setGameState(prev => ({
      ...prev,
      targetNumber,
      currentGuess: '',
      attempts: 0,
      gameStatus: 'playing',
      hint: `I'm thinking of a number between ${min} and ${max}!`,
      maxAttempts: mode.attempts,
      timeLeft: prev.isTimedMode ? 60 : 0
    }));
    
    setGameHistory([]);
    setShowCelebration(false);
  };

  const makeGuess = () => {
    const guess = parseInt(gameState.currentGuess);
    if (isNaN(guess) || guess < GAME_MODES[gameState.gameMode].range[0] || guess > GAME_MODES[gameState.gameMode].range[1]) {
      setGameState(prev => ({ ...prev, hint: 'Please enter a valid number within the range!' }));
      return;
    }

    const newAttempts = gameState.attempts + 1;
    let newHint = '';
    let newStatus: 'playing' | 'won' | 'lost' = 'playing';
    let newScore = gameState.score;

    if (guess === gameState.targetNumber) {
      newHint = `🎉 Congratulations! You guessed it in ${newAttempts} attempts!`;
      newStatus = 'won';
      newScore = Math.max(0, 1000 - (newAttempts * 50) - (gameState.isTimedMode ? (60 - gameState.timeLeft) * 5 : 0));
      setShowCelebration(true);
      
      if (newScore > gameState.bestScore) {
        localStorage.setItem('bestScore', newScore.toString());
      }
    } else if (newAttempts >= gameState.maxAttempts) {
      newHint = `Game over! The number was ${gameState.targetNumber}. Try again!`;
      newStatus = 'lost';
    } else {
      const difference = Math.abs(guess - gameState.targetNumber);
      if (difference <= 5) {
        newHint = guess < gameState.targetNumber ? '🔥 Very close! Try higher!' : '🔥 Very close! Try lower!';
      } else if (difference <= 15) {
        newHint = guess < gameState.targetNumber ? '🎯 Getting warm! Try higher!' : '🎯 Getting warm! Try lower!';
      } else {
        newHint = guess < gameState.targetNumber ? '❄️ Too low! Try higher!' : '❄️ Too high! Try lower!';
      }
    }

    const result = guess === gameState.targetNumber ? 'Correct!' : 
                  guess < gameState.targetNumber ? 'Too low' : 'Too high';

    setGameHistory(prev => [...prev, { guess, result }]);
    
    setGameState(prev => ({
      ...prev,
      attempts: newAttempts,
      hint: newHint,
      gameStatus: newStatus,
      currentGuess: '',
      score: newScore,
      bestScore: Math.max(prev.bestScore, newScore)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.gameStatus === 'playing') {
      makeGuess();
    }
  };

  const getProgressPercentage = () => {
    return (gameState.attempts / gameState.maxAttempts) * 100;
  };

  const getTimePercentage = () => {
    return gameState.isTimedMode ? (gameState.timeLeft / 60) * 100 : 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Game Panel */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-300" />
              <h1 className="text-3xl font-bold text-white">Number Guessing Game</h1>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">{gameState.score}</span>
            </div>
          </div>

          {/* Game Mode Selection */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(GAME_MODES).map(([mode, config]) => (
                <button
                  key={mode}
                  onClick={() => setGameState(prev => ({ ...prev, gameMode: mode as any }))}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    gameState.gameMode === mode
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-white/80">
                <input
                  type="checkbox"
                  checked={gameState.isTimedMode}
                  onChange={(e) => setGameState(prev => ({ ...prev, isTimedMode: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/30"
                />
                <Clock className="w-4 h-4" />
                Timed Mode (60s)
              </label>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between text-white/80 text-sm">
              <span>Attempts: {gameState.attempts}/{gameState.maxAttempts}</span>
              <span>Remaining: {gameState.maxAttempts - gameState.attempts}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            
            {gameState.isTimedMode && (
              <div className="flex items-center justify-between text-white/80 text-sm">
                <span>Time: {gameState.timeLeft}s</span>
                <div className="w-full bg-white/10 rounded-full h-2 ml-4">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      gameState.timeLeft > 20 ? 'bg-green-400' : 
                      gameState.timeLeft > 10 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${getTimePercentage()}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hint Display */}
          <div className={`mb-6 p-4 rounded-2xl text-center font-medium transition-all duration-300 ${
            showCelebration ? 'bg-green-500/20 text-green-300 animate-pulse' :
            gameState.gameStatus === 'lost' ? 'bg-red-500/20 text-red-300' :
            'bg-blue-500/20 text-blue-300'
          }`}>
            {gameState.hint}
          </div>

          {/* Input Section */}
          {gameState.gameStatus === 'playing' && (
            <div className="mb-6">
              <div className="flex gap-3">
                <input
                  type="number"
                  value={gameState.currentGuess}
                  onChange={(e) => setGameState(prev => ({ ...prev, currentGuess: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your guess..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  min={GAME_MODES[gameState.gameMode].range[0]}
                  max={GAME_MODES[gameState.gameMode].range[1]}
                />
                <button
                  onClick={makeGuess}
                  disabled={!gameState.currentGuess}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Guess
                </button>
              </div>
            </div>
          )}

          {/* Game Over Actions */}
          {gameState.gameStatus !== 'playing' && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={initializeGame}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                New Game
              </button>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Statistics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-white/80">
                <span>Best Score:</span>
                <span className="font-semibold text-yellow-400">{gameState.bestScore}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Current Score:</span>
                <span className="font-semibold">{gameState.score}</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>Difficulty:</span>
                <span className="font-semibold capitalize">{gameState.gameMode}</span>
              </div>
            </div>
          </div>

          {/* Game History */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Recent Guesses</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gameHistory.length === 0 ? (
                <p className="text-white/60 text-center py-4">No guesses yet</p>
              ) : (
                gameHistory.slice(-8).reverse().map((entry, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg">
                    <span className="text-white font-medium">{entry.guess}</span>
                    <span className={`text-sm font-medium ${
                      entry.result === 'Correct!' ? 'text-green-400' :
                      entry.result === 'Too low' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {entry.result}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">How to Play</h3>
            <div className="space-y-2 text-white/80 text-sm">
              <p>🎯 Guess the secret number within the range</p>
              <p>🔢 You have limited attempts based on difficulty</p>
              <p>🔥 Get hints about how close you are</p>
              <p>⏱️ Try timed mode for extra challenge</p>
              <p>🏆 Score higher with fewer attempts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎉</div>
        </div>
      )}
    </div>
  );
}

export default App;