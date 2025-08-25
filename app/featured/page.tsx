'use client';

/**
 * IMPORTANT: NEVER USE DUMMY DATA!
 * 
 * This page fetches featured Snarkels from the actual database via API routes.
 * Always use real data from your database and API endpoints.
 * 
 * API Route: /api/snarkel/featured
 * Database: Featured Snarkels with priority ordering
 */

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
import { sdk } from '@farcaster/miniapp-sdk';
import FarcasterUserProfile from '@/components/FarcasterUserProfile'

// Snarkel type definition - Updated to match actual API response
interface Snarkel {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  formattedParticipants: string;
  duration: string;
  reward?: {
    amount: string;
    symbol: string;
    name: string;
  };
  snarkelCode: string;
  totalQuestions: number;
  totalParticipants: number;
  isActive: boolean;
  startTime?: string;
  rewardsEnabled: boolean;
  basePointsPerQuestion: number;
  speedBonusEnabled: boolean;
  maxSpeedBonus: number;
  priority: number;
}

// Featured Snarkel Card Component
const FeaturedSnarkelCard = ({ snarkel, index }: { snarkel: Snarkel; index: number }) => {
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
      className="group relative bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient border on hover */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Header with category and difficulty */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                {snarkel.title}
              </h3>
              
              {/* Description */}
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 line-clamp-2 leading-relaxed">
                {snarkel.description}
              </p>
            </div>
            
            {/* Category and Difficulty */}
            <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:ml-3">
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {snarkel.category}
              </span>
              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200">
                <span className="text-xs sm:text-sm">{difficultyIcons[snarkel.difficulty]}</span>
                <span className={`text-xs font-semibold ${difficultyColors[snarkel.difficulty]}`}>
                  {snarkel.difficulty}
                </span>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-3 border-t border-gray-100">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{snarkel.formattedParticipants}</p>
              <p className="text-xs text-gray-500">Players</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">{snarkel.duration}</p>
              <p className="text-xs text-gray-500">Duration</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                {snarkel.reward ? `${snarkel.reward.amount} ${snarkel.reward.symbol}` : 'No rewards'}
              </p>
              <p className="text-xs text-gray-500">
                {snarkel.reward ? 'Reward' : 'Free to play'}
              </p>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="pt-2">
            <Link
              href={`/join?snarkelCode=${snarkel.snarkelCode}`}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold text-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group text-sm sm:text-base"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4 group-hover:scale-110 transition-transform" />
              Join Snarkel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FeaturedPage() {
  const { isConnected } = useAccount();
  const [featuredSnarkels, setFeaturedSnarkels] = useState<Snarkel[]>([]);
  const [loadingSnarkels, setLoadingSnarkels] = useState(true);
  const [snarkelError, setSnarkelError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch featured Snarkels from API instead of using dummy data
  useEffect(() => {
    // Call sdk.actions.ready() to hide Farcaster Mini App splash screen
    const callReady = async () => {
      try {
        await sdk.actions.ready();
        console.log('Farcaster Mini App ready() called successfully on featured page');
      } catch (error) {
        console.error('Error calling sdk.actions.ready():', error);
      }
    };
    
    callReady();
    
    const fetchFeaturedSnarkels = async () => {
      try {
        setLoadingSnarkels(true);
        setSnarkelError(null);
        const response = await fetch('/api/snarkel/featured?limit=50');
        
        if (response.ok) {
          const data = await response.json();
          setFeaturedSnarkels(data.featuredSnarkels || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || 'Failed to fetch featured Snarkels';
          console.error('Failed to fetch featured Snarkels:', errorMessage);
          setSnarkelError(errorMessage);
          setFeaturedSnarkels([]);
        }
      } catch (error) {
        console.error('Error fetching featured Snarkels:', error);
        setSnarkelError('Network error. Please check your connection and try again.');
        setFeaturedSnarkels([]);
      } finally {
        setLoadingSnarkels(false);
        setIsLoaded(true);
      }
    };

    fetchFeaturedSnarkels();
  }, []);

  // Retry function for failed API calls
  const retryFetch = () => {
    setSnarkelError(null);
    setLoadingSnarkels(true);
    const fetchFeaturedSnarkels = async () => {
      try {
        const response = await fetch('/api/snarkel/featured?limit=50');
        
        if (response.ok) {
          const data = await response.json();
          setFeaturedSnarkels(data.featuredSnarkels || []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || 'Failed to fetch featured Snarkels';
          setSnarkelError(errorMessage);
        }
      } catch (error) {
        setSnarkelError('Network error. Please check your connection and try again.');
      } finally {
        setLoadingSnarkels(false);
      }
    };
    
    fetchFeaturedSnarkels();
  };

  // Filter Snarkels based on search and filters
  const filteredSnarkels = featuredSnarkels.filter(snarkel => {
    const matchesSearch = snarkel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snarkel.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (snarkel.category && snarkel.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || snarkel.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || snarkel.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Get unique categories from actual data
  const categories = ['all', ...Array.from(new Set(featuredSnarkels.map(s => s.category).filter(Boolean)))];
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-8 gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <Link
                href="/"
                className="group p-2 sm:p-3 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:text-white rounded-xl transition-all duration-300 flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-medium">Back to Home</span>
                <span className="sm:hidden font-medium">Back</span>
              </Link>
              
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl sm:shadow-2xl">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Trophy className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
              
              <div className="relative">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Featured Snarkels
                </h1>
                <p className="text-gray-600 text-sm sm:text-lg mt-1">
                  Discover amazing challenges and test your knowledge
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
              <Link
                href="/admin"
                className="group p-2 sm:p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all duration-300 text-white hover:scale-105 transform shadow-lg hover:shadow-xl"
                title="Dashboard"
              >
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
              </Link>
              <Link
                href="/create"
                className="group p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-300 text-white hover:scale-105 transform shadow-lg hover:shadow-xl"
                title="Create Snarkel"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
              </Link>
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Farcaster User Profile - Show when in Farcaster context */}
        <div className="mb-6">
          <FarcasterUserProfile variant="inline" showPfp={true} showEmoji={true} />
        </div>

        {/* Search and Filters */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl border border-white/30">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search featured Snarkels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Difficulty Filter */}
              <div className="flex items-center gap-2 flex-1">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-3 bg-white/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty === 'all' ? 'All Difficulties' : difficulty}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center justify-center sm:justify-end">
              <div className="flex items-center gap-2 bg-white/80 rounded-xl p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing <span className="font-semibold text-gray-900">{filteredSnarkels.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{featuredSnarkels.length}</span> featured Snarkels
          </p>
          
          {searchTerm || selectedCategory !== 'all' || selectedDifficulty !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 text-sm sm:text-base"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Snarkels Grid/List */}
        {loadingSnarkels ? (
          // Loading state
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
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
        ) : snarkelError ? (
          // Error state
          <div className="text-center py-12">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md mx-auto">
              <p className="text-lg text-amber-800 mb-4">{snarkelError}</p>
              <button 
                onClick={retryFetch}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredSnarkels.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg text-blue-800 mb-2">No Snarkels found</p>
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
          // Snarkel cards
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
              : 'space-y-4'
          }`}>
            {filteredSnarkels.map((snarkel, index) => (
              <FeaturedSnarkelCard key={snarkel.id} snarkel={snarkel} index={index} />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-8 sm:mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-blue-200 shadow-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Want to create your own featured Snarkel?
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
              Join our community of Snarkel creators and share your knowledge with the world. 
              Create engaging content and earn rewards!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 transform hover:-translate-y-1 shadow-xl hover:shadow-2xl"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Create Your Snarkel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
