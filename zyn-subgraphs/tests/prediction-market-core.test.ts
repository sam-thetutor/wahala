import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ClaimsContractSet } from "../generated/schema"
import { ClaimsContractSet as ClaimsContractSetEvent } from "../generated/PredictionMarketCore/PredictionMarketCore"
import { handleClaimsContractSet } from "../src/prediction-market-core"
import { createClaimsContractSetEvent } from "./prediction-market-core-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let oldContract = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newContract = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let newClaimsContractSetEvent = createClaimsContractSetEvent(
      oldContract,
      newContract
    )
    handleClaimsContractSet(newClaimsContractSetEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ClaimsContractSet created and stored", () => {
    assert.entityCount("ClaimsContractSet", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ClaimsContractSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "oldContract",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ClaimsContractSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newContract",
      "0x0000000000000000000000000000000000000001"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
