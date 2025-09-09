import {
  ClaimsContractSet as ClaimsContractSetEvent,
  CreatorFeeClaimed as CreatorFeeClaimedEvent,
  CreatorFeePercentageUpdated as CreatorFeePercentageUpdatedEvent,
  MarketCreated as MarketCreatedEvent,
  MarketCreationFeeUpdated as MarketCreationFeeUpdatedEvent,
  MarketResolved as MarketResolvedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  RewardsDisbursed as RewardsDisbursedEvent,
  SharesBought as SharesBoughtEvent,
  UsernameChanged as UsernameChangedEvent,
  UsernameSet as UsernameSetEvent
} from "../generated/PredictionMarketCore/PredictionMarketCore"
import {
  ClaimsContractSet,
  CreatorFeeClaimed,
  CreatorFeePercentageUpdated,
  MarketCreated,
  MarketCreationFeeUpdated,
  MarketResolved,
  OwnershipTransferred,
  RewardsDisbursed,
  SharesBought,
  UsernameChanged,
  UsernameSet
} from "../generated/schema"

export function handleClaimsContractSet(event: ClaimsContractSetEvent): void {
  let entity = new ClaimsContractSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldContract = event.params.oldContract
  entity.newContract = event.params.newContract

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCreatorFeeClaimed(event: CreatorFeeClaimedEvent): void {
  let entity = new CreatorFeeClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketId = event.params.marketId
  entity.creator = event.params.creator
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCreatorFeePercentageUpdated(
  event: CreatorFeePercentageUpdatedEvent
): void {
  let entity = new CreatorFeePercentageUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldPercentage = event.params.oldPercentage
  entity.newPercentage = event.params.newPercentage

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMarketCreated(event: MarketCreatedEvent): void {
  let entity = new MarketCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketId = event.params.marketId
  entity.creator = event.params.creator
  entity.question = event.params.question
  entity.description = event.params.description
  entity.source = event.params.source
  entity.endTime = event.params.endTime
  entity.creationFee = event.params.creationFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMarketCreationFeeUpdated(
  event: MarketCreationFeeUpdatedEvent
): void {
  let entity = new MarketCreationFeeUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldFee = event.params.oldFee
  entity.newFee = event.params.newFee

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMarketResolved(event: MarketResolvedEvent): void {
  let entity = new MarketResolved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketId = event.params.marketId
  entity.resolver = event.params.resolver
  entity.outcome = event.params.outcome

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRewardsDisbursed(event: RewardsDisbursedEvent): void {
  let entity = new RewardsDisbursed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketId = event.params.marketId
  entity.claimant = event.params.claimant
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleSharesBought(event: SharesBoughtEvent): void {
  let entity = new SharesBought(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.marketId = event.params.marketId
  entity.buyer = event.params.buyer
  entity.side = event.params.side
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUsernameChanged(event: UsernameChangedEvent): void {
  let entity = new UsernameChanged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.oldUsername = event.params.oldUsername
  entity.newUsername = event.params.newUsername

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUsernameSet(event: UsernameSetEvent): void {
  let entity = new UsernameSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.username = event.params.username

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
