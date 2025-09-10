import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import {
  MarketCreated,
  SharesBought,
  MarketResolved,
  CreatorFeeClaimed,
  RewardsDisbursed,
  UsernameSet,
  UsernameChanged,
  WinningsClaimed
} from "../generated/PredictionMarketCore/PredictionMarketCore"
import {
  Market,
  Participant,
  User,
  GlobalStats,
  MarketCreated as MarketCreatedEntity,
  SharesBought as SharesBoughtEntity,
  MarketResolved as MarketResolvedEntity,
  CreatorFeeClaimed as CreatorFeeClaimedEntity,
  RewardsDisbursed as RewardsDisbursedEntity,
  UsernameSet as UsernameSetEntity,
  UsernameChanged as UsernameChangedEntity,
  WinningsClaimed as WinningsClaimedEntity
} from "../generated/schema"

// Helper function to get or create global stats
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global")
  if (!stats) {
    stats = new GlobalStats("global")
    stats.totalMarkets = BigInt.fromI32(0)
    stats.totalParticipants = BigInt.fromI32(0)
    stats.totalVolume = BigInt.fromI32(0)
    stats.totalFees = BigInt.fromI32(0)
    stats.lastUpdated = BigInt.fromI32(0)
  }
  return stats
}

// Helper function to get or create user
function getOrCreateUser(address: Bytes): User {
  let user = User.load(address.toHexString())
  if (!user) {
    user = new User(address.toHexString())
    user.username = null
    user.totalMarketsCreated = BigInt.fromI32(0)
    user.totalMarketsParticipated = BigInt.fromI32(0)
    user.totalInvestment = BigInt.fromI32(0)
    user.totalWinnings = BigInt.fromI32(0)
    user.createdAt = BigInt.fromI32(0)
  }
  return user
}

// Helper function to get or create participant
function getOrCreateParticipant(marketId: BigInt, userAddress: Bytes): Participant {
  const participantId = marketId.toString() + "-" + userAddress.toHexString()
  let participant = Participant.load(participantId)
  if (!participant) {
    participant = new Participant(participantId)
    participant.market = marketId.toString()
    participant.user = userAddress
    participant.totalYesShares = BigInt.fromI32(0)
    participant.totalNoShares = BigInt.fromI32(0)
    participant.totalInvestment = BigInt.fromI32(0)
    participant.firstPurchaseAt = BigInt.fromI32(0)
    participant.lastPurchaseAt = BigInt.fromI32(0)
    participant.transactionCount = BigInt.fromI32(0)
  }
  return participant
}

export function handleMarketCreated(event: MarketCreated): void {
  // Create Market entity
  let market = new Market(event.params.marketId.toString())
  market.question = event.params.question
  market.description = event.params.description
  market.source = event.params.source
  market.endTime = event.params.endTime
  market.creator = event.params.creator
  market.creationFee = event.params.creationFee
  market.totalPool = BigInt.fromI32(0)
  market.totalYes = BigInt.fromI32(0)
  market.totalNo = BigInt.fromI32(0)
  market.status = "ACTIVE"
  market.outcome = false // Changed from null to false
  market.createdAt = event.block.timestamp
  market.resolvedAt = BigInt.fromI32(0) // Changed from null to 0
  market.resolver = Bytes.fromHexString("0x0000000000000000000000000000000000000000") // Changed from null to zero address
  market.save()

  // Create MarketCreated event entity
  let marketCreated = new MarketCreatedEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  marketCreated.marketId = event.params.marketId
  marketCreated.creator = event.params.creator
  marketCreated.question = event.params.question
  marketCreated.description = event.params.description
  marketCreated.source = event.params.source
  marketCreated.endTime = event.params.endTime
  marketCreated.creationFee = event.params.creationFee
  marketCreated.blockNumber = event.block.number
  marketCreated.blockTimestamp = event.block.timestamp
  marketCreated.transactionHash = event.transaction.hash
  marketCreated.save()

  // Update user stats
  let user = getOrCreateUser(event.params.creator)
  user.totalMarketsCreated = user.totalMarketsCreated.plus(BigInt.fromI32(1))
  user.createdAt = event.block.timestamp
  user.save()

  // Update global stats
  let stats = getOrCreateGlobalStats()
  stats.totalMarkets = stats.totalMarkets.plus(BigInt.fromI32(1))
  stats.totalFees = stats.totalFees.plus(event.params.creationFee)
  stats.lastUpdated = event.block.timestamp
  stats.save()
}

export function handleSharesBought(event: SharesBought): void {
  // Load market
  let market = Market.load(event.params.marketId.toString())
  if (!market) return

  // Get or create participant
  let participant = getOrCreateParticipant(event.params.marketId, event.params.buyer)
  
  // Update participant stats
  if (event.params.side) {
    participant.totalYesShares = participant.totalYesShares.plus(event.params.amount)
    market.totalYes = market.totalYes.plus(event.params.amount)
  } else {
    participant.totalNoShares = participant.totalNoShares.plus(event.params.amount)
    market.totalNo = market.totalNo.plus(event.params.amount)
  }
  participant.totalInvestment = participant.totalInvestment.plus(event.params.amount)
  
  if (participant.firstPurchaseAt.equals(BigInt.fromI32(0))) {
    participant.firstPurchaseAt = event.block.timestamp
  }
  participant.lastPurchaseAt = event.block.timestamp
  participant.transactionCount = participant.transactionCount.plus(BigInt.fromI32(1))
  participant.save()

  // Update market totals
  market.totalPool = market.totalYes.plus(market.totalNo)
  market.save()

  // Update user stats
  let user = getOrCreateUser(event.params.buyer)
  user.totalInvestment = user.totalInvestment.plus(event.params.amount)
  if (participant.firstPurchaseAt.equals(event.block.timestamp)) {
    user.totalMarketsParticipated = user.totalMarketsParticipated.plus(BigInt.fromI32(1))
  }
  user.save()

  // Create SharesBought event entity
  let sharesBought = new SharesBoughtEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  sharesBought.marketId = event.params.marketId
  sharesBought.buyer = event.params.buyer
  sharesBought.side = event.params.side
  sharesBought.amount = event.params.amount
  sharesBought.totalYes = market.totalYes
  sharesBought.totalNo = market.totalNo
  sharesBought.blockNumber = event.block.number
  sharesBought.blockTimestamp = event.block.timestamp
  sharesBought.transactionHash = event.transaction.hash
  sharesBought.save()

  // Update global stats
  let stats = getOrCreateGlobalStats()
  stats.totalVolume = stats.totalVolume.plus(event.params.amount)
  stats.lastUpdated = event.block.timestamp
  stats.save()
}

export function handleMarketResolved(event: MarketResolved): void {
  // Load market
  let market = Market.load(event.params.marketId.toString())
  if (!market) return

  // Update market status
  market.status = "RESOLVED"
  market.outcome = event.params.outcome
  market.resolvedAt = event.block.timestamp
  market.resolver = event.params.resolver
  market.save()

  // Create MarketResolved event entity
  let marketResolved = new MarketResolvedEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  marketResolved.marketId = event.params.marketId
  marketResolved.resolver = event.params.resolver
  marketResolved.outcome = event.params.outcome
  marketResolved.blockNumber = event.block.number
  marketResolved.blockTimestamp = event.block.timestamp
  marketResolved.transactionHash = event.transaction.hash
  marketResolved.save()
}

export function handleUsernameSet(event: UsernameSet): void {
  // Update user
  let user = getOrCreateUser(event.params.user)
  user.username = event.params.username
  user.save()

  // Create UsernameSet event entity
  let usernameSet = new UsernameSetEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  usernameSet.user = event.params.user
  usernameSet.username = event.params.username
  usernameSet.blockNumber = event.block.number
  usernameSet.blockTimestamp = event.block.timestamp
  usernameSet.transactionHash = event.transaction.hash
  usernameSet.save()
}

export function handleUsernameChanged(event: UsernameChanged): void {
  // Update user
  let user = getOrCreateUser(event.params.user)
  user.username = event.params.newUsername
  user.save()

  // Create UsernameChanged event entity
  let usernameChanged = new UsernameChangedEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  usernameChanged.user = event.params.user
  usernameChanged.oldUsername = event.params.oldUsername
  usernameChanged.newUsername = event.params.newUsername
  usernameChanged.blockNumber = event.block.number
  usernameChanged.blockTimestamp = event.block.timestamp
  usernameChanged.transactionHash = event.transaction.hash
  usernameChanged.save()
}

export function handleWinningsClaimed(event: WinningsClaimed): void {
  // Update user winnings
  let user = getOrCreateUser(event.params.claimant)
  user.totalWinnings = user.totalWinnings.plus(event.params.amount)
  user.save()

  // Create WinningsClaimed event entity
  let winningsClaimed = new WinningsClaimedEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  winningsClaimed.marketId = event.params.marketId
  winningsClaimed.claimant = event.params.claimant
  winningsClaimed.amount = event.params.amount
  winningsClaimed.blockNumber = event.block.number
  winningsClaimed.blockTimestamp = event.block.timestamp
  winningsClaimed.transactionHash = event.transaction.hash
  winningsClaimed.save()
}

export function handleCreatorFeeClaimed(event: CreatorFeeClaimed): void {
  // Create CreatorFeeClaimed event entity
  let creatorFeeClaimed = new CreatorFeeClaimedEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  creatorFeeClaimed.marketId = event.params.marketId
  creatorFeeClaimed.creator = event.params.creator
  creatorFeeClaimed.amount = event.params.amount
  creatorFeeClaimed.blockNumber = event.block.number
  creatorFeeClaimed.blockTimestamp = event.block.timestamp
  creatorFeeClaimed.transactionHash = event.transaction.hash
  creatorFeeClaimed.save()
}

export function handleRewardsDisbursed(event: RewardsDisbursed): void {
  // Create RewardsDisbursed event entity
  let rewardsDisbursed = new RewardsDisbursedEntity(event.transaction.hash.concatI32(event.logIndex.toI32()))
  rewardsDisbursed.marketId = event.params.marketId
  rewardsDisbursed.claimant = event.params.claimant
  rewardsDisbursed.amount = event.params.amount
  rewardsDisbursed.blockNumber = event.block.number
  rewardsDisbursed.blockTimestamp = event.block.timestamp
  rewardsDisbursed.transactionHash = event.transaction.hash
  rewardsDisbursed.save()
}