'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Users, 
  Plus, 
  Sparkles, 
  Trophy, 
  Star, 
  Clock,
  Gamepad2,
  ArrowLeft,
  Award,
  Zap,
  Shield,
  User,
  Brain,
  Lightbulb,
  HelpCircle,
  Home,
  Search,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import WalletConnectButton from '@/components/WalletConnectButton';
import { useAccount } from 'wagmi';

// Quiz type definition
interface Quiz {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  participants: string;
  duration: string;
  reward: string;
  snarkelCode?: string;
  network?: string;
}

// Featured Quiz Card Component
const FeaturedQuizCard = ({ quiz, index }: { quiz: Quiz; index: number }) => {
  const { isConnected } = useAccount();
  const [isHovered, setIsHovered] = useState(false);
  
  const difficultyColors = {
    Easy: 'text-emerald-600',
    Medium: 'text-amber-600', 
    Hard: 'text-red-600'
  };

  const difficultyIcons = {
    Easy: '🟢',
    Medium: '🟡',
    Hard: '🔴'
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex flex-col gap-4">
          {/* Header with category and difficulty */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                {quiz.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
                {quiz.description}
              </p>
            </div>
            
            {/* Category and Difficulty */}
            <div className="flex flex-col items-end gap-2 ml-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {quiz.category}
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
                <span className="text-sm">{difficultyIcons[quiz.difficulty]}</span>
                <span className={`text-xs font-semibold ${difficultyColors[quiz.difficulty]}`}>
                  {quiz.difficulty}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{quiz.participants}</p>
              <p className="text-xs text-gray-500">Players</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{quiz.duration}</p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Trophy className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-gray-900">{quiz.reward}</p>
              <p className="text-xs text-gray-500">Reward</p>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="pt-2">
            <Link
              href={`/quiz/${quiz.snarkelCode || quiz.id}`}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-semibold text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Start Quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeaturedPage() {
  const { isConnected } = useAccount();
  const [featuredQuizzes, setFeaturedQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoaded, setIsLoaded] = useState(false);

  // Sample featured quizzes data
  const sampleQuizzes: Quiz[] = [
    {
      id: 1,
      title: "Web3 Fundamentals Quiz",
      description: "Test your knowledge of blockchain basics, smart contracts, and decentralized applications. Perfect for beginners starting their Web3 journey.",
      category: "Blockchain",
      difficulty: "Easy",
      participants: "1.2k",
      duration: "15 min",
      reward: "50 USDC",
      snarkelCode: "web3-fundamentals"
    },
    {
      id: 2,
      title: "DeFi Master Challenge",
      description: "Advanced questions about decentralized finance protocols, yield farming, and liquidity pools. For experienced DeFi users.",
      category: "DeFi",
      difficulty: "Hard",
      participants: "856",
      duration: "25 min",
      reward: "100 USDC",
      snarkelCode: "defi-master"
    },
    {
      id: 3,
      title: "NFT & Metaverse Quiz",
      description: "Explore the world of non-fungible tokens, digital art, and virtual worlds. Learn about the future of digital ownership.",
      category: "NFT",
      difficulty: "Medium",
      participants: "2.1k",
      duration: "20 min",
      reward: "75 USDC",
      snarkelCode: "nft-metaverse"
    },
    {
      id: 4,
      title: "Layer 2 Scaling Solutions",
      description: "Deep dive into Ethereum scaling solutions like Polygon, Arbitrum, and Optimism. Understand the technical details.",
      category: "Scaling",
      difficulty: "Hard",
      participants: "432",
      duration: "30 min",
      reward: "150 USDC",
      snarkelCode: "layer2-scaling"
    },
    {
      id: 5,
      title: "Crypto Security Basics",
      description: "Essential security practices for cryptocurrency users. Learn about wallets, private keys, and avoiding scams.",
      category: "Security",
      difficulty: "Easy",
      participants: "3.4k",
      duration: "12 min",
      reward: "25 USDC",
      snarkelCode: "crypto-security"
    },
    {
      id: 6,
      title: "Smart Contract Development",
      description: "Test your Solidity knowledge and smart contract best practices. For developers and advanced users.",
      category: "Development",
      difficulty: "Hard",
      participants: "298",
      duration: "35 min",
      reward: "200 USDC",
      snarkelCode: "smart-contracts"
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setFeaturedQuizzes(sampleQuizzes);
      setLoadingQuizzes(false);
      setIsLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter quizzes based on search and filters
  const filteredQuizzes = featuredQuizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || quiz.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || quiz.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(featuredQuizzes.map(q => q.category)))];
  const difficulties = ['all', 'Easy', 'Medium', 'Hard'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-sm shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-8">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="group p-3 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white rounded-xl transition-all duration-300 flex items-center gap-3 text-gray-600 hover:text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-medium">Back to Home</span>
              </Link>
              
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Star className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div className="relative">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Featured Snarkels
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Discover amazing challenges and test your knowledge
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/create"
                className="group p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-300 text-white hover:scale-105 transform shadow-lg hover:shadow-xl"
                title="Create Quiz"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </Link>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-xl border border-white/30">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search featured quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gray-600" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Difficulties' : difficulty}
                  </option>
                ))}
              </select>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white/80 rounded-xl p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredQuizzes.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{featuredQuizzes.length}</span> featured quizzes
          </p>
          
          {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Quizzes Grid/List */}
        {loadingQuizzes ? (
          // Loading state
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white shadow-2xl rounded-3xl p-6 animate-pulse border border-blue-200">
                <div className="h-4 bg-blue-200 rounded mb-4"></div>
                <div className="h-3 bg-blue-200 rounded mb-2"></div>
                <div className="h-3 bg-blue-200 rounded mb-4 w-3/4"></div>
                <div className="h-8 bg-blue-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : quizError ? (
          // Error state
          <div className="text-center py-12">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-lg text-amber-800 mb-4">{quizError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg text-blue-800 mb-2">No quizzes found</p>
              <p className="text-blue-600 mb-4">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          // Quiz cards
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {filteredQuizzes.map((quiz, index) => (
              <FeaturedQuizCard key={quiz.id} quiz={quiz} index={index} />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want to create your own featured quiz?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join our community of quiz creators and share your knowledge with the world. 
              Create engaging content and earn rewards!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl"
            >
              <Plus className="w-5 h-5" />
              Create Your Quiz
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
