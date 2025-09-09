import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
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
} from "../generated/PredictionMarketCore/PredictionMarketCore"

export function createClaimsContractSetEvent(
  oldContract: Address,
  newContract: Address
): ClaimsContractSet {
  let claimsContractSetEvent = changetype<ClaimsContractSet>(newMockEvent())

  claimsContractSetEvent.parameters = new Array()

  claimsContractSetEvent.parameters.push(
    new ethereum.EventParam(
      "oldContract",
      ethereum.Value.fromAddress(oldContract)
    )
  )
  claimsContractSetEvent.parameters.push(
    new ethereum.EventParam(
      "newContract",
      ethereum.Value.fromAddress(newContract)
    )
  )

  return claimsContractSetEvent
}

export function createCreatorFeeClaimedEvent(
  marketId: BigInt,
  creator: Address,
  amount: BigInt
): CreatorFeeClaimed {
  let creatorFeeClaimedEvent = changetype<CreatorFeeClaimed>(newMockEvent())

  creatorFeeClaimedEvent.parameters = new Array()

  creatorFeeClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  creatorFeeClaimedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  creatorFeeClaimedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return creatorFeeClaimedEvent
}

export function createCreatorFeePercentageUpdatedEvent(
  oldPercentage: BigInt,
  newPercentage: BigInt
): CreatorFeePercentageUpdated {
  let creatorFeePercentageUpdatedEvent =
    changetype<CreatorFeePercentageUpdated>(newMockEvent())

  creatorFeePercentageUpdatedEvent.parameters = new Array()

  creatorFeePercentageUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldPercentage",
      ethereum.Value.fromUnsignedBigInt(oldPercentage)
    )
  )
  creatorFeePercentageUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newPercentage",
      ethereum.Value.fromUnsignedBigInt(newPercentage)
    )
  )

  return creatorFeePercentageUpdatedEvent
}

export function createMarketCreatedEvent(
  marketId: BigInt,
  creator: Address,
  question: string,
  description: string,
  source: string,
  endTime: BigInt,
  creationFee: BigInt
): MarketCreated {
  let marketCreatedEvent = changetype<MarketCreated>(newMockEvent())

  marketCreatedEvent.parameters = new Array()

  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("question", ethereum.Value.fromString(question))
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam("source", ethereum.Value.fromString(source))
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "endTime",
      ethereum.Value.fromUnsignedBigInt(endTime)
    )
  )
  marketCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "creationFee",
      ethereum.Value.fromUnsignedBigInt(creationFee)
    )
  )

  return marketCreatedEvent
}

export function createMarketCreationFeeUpdatedEvent(
  oldFee: BigInt,
  newFee: BigInt
): MarketCreationFeeUpdated {
  let marketCreationFeeUpdatedEvent =
    changetype<MarketCreationFeeUpdated>(newMockEvent())

  marketCreationFeeUpdatedEvent.parameters = new Array()

  marketCreationFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam("oldFee", ethereum.Value.fromUnsignedBigInt(oldFee))
  )
  marketCreationFeeUpdatedEvent.parameters.push(
    new ethereum.EventParam("newFee", ethereum.Value.fromUnsignedBigInt(newFee))
  )

  return marketCreationFeeUpdatedEvent
}

export function createMarketResolvedEvent(
  marketId: BigInt,
  resolver: Address,
  outcome: boolean
): MarketResolved {
  let marketResolvedEvent = changetype<MarketResolved>(newMockEvent())

  marketResolvedEvent.parameters = new Array()

  marketResolvedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  marketResolvedEvent.parameters.push(
    new ethereum.EventParam("resolver", ethereum.Value.fromAddress(resolver))
  )
  marketResolvedEvent.parameters.push(
    new ethereum.EventParam("outcome", ethereum.Value.fromBoolean(outcome))
  )

  return marketResolvedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createRewardsDisbursedEvent(
  marketId: BigInt,
  claimant: Address,
  amount: BigInt
): RewardsDisbursed {
  let rewardsDisbursedEvent = changetype<RewardsDisbursed>(newMockEvent())

  rewardsDisbursedEvent.parameters = new Array()

  rewardsDisbursedEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  rewardsDisbursedEvent.parameters.push(
    new ethereum.EventParam("claimant", ethereum.Value.fromAddress(claimant))
  )
  rewardsDisbursedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return rewardsDisbursedEvent
}

export function createSharesBoughtEvent(
  marketId: BigInt,
  buyer: Address,
  side: boolean,
  amount: BigInt
): SharesBought {
  let sharesBoughtEvent = changetype<SharesBought>(newMockEvent())

  sharesBoughtEvent.parameters = new Array()

  sharesBoughtEvent.parameters.push(
    new ethereum.EventParam(
      "marketId",
      ethereum.Value.fromUnsignedBigInt(marketId)
    )
  )
  sharesBoughtEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  sharesBoughtEvent.parameters.push(
    new ethereum.EventParam("side", ethereum.Value.fromBoolean(side))
  )
  sharesBoughtEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return sharesBoughtEvent
}

export function createUsernameChangedEvent(
  user: Address,
  oldUsername: string,
  newUsername: string
): UsernameChanged {
  let usernameChangedEvent = changetype<UsernameChanged>(newMockEvent())

  usernameChangedEvent.parameters = new Array()

  usernameChangedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  usernameChangedEvent.parameters.push(
    new ethereum.EventParam(
      "oldUsername",
      ethereum.Value.fromString(oldUsername)
    )
  )
  usernameChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newUsername",
      ethereum.Value.fromString(newUsername)
    )
  )

  return usernameChangedEvent
}

export function createUsernameSetEvent(
  user: Address,
  username: string
): UsernameSet {
  let usernameSetEvent = changetype<UsernameSet>(newMockEvent())

  usernameSetEvent.parameters = new Array()

  usernameSetEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  usernameSetEvent.parameters.push(
    new ethereum.EventParam("username", ethereum.Value.fromString(username))
  )

  return usernameSetEvent
}
