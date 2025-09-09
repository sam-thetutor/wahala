import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple test data
    const testData = {
      id: "1",
      question: "Test question",
      endtime: "1757084760",
      totalpool: "100",
      totalyes: "50",
      totalno: "50",
      status: 0,
      outcome: false,
      createdat: "1757081080",
      creator: "0x123",
      description: "Test description",
      category: "Test",
      image: "test.jpg",
      source: "test",
      updatedat: "2025-09-05T15:13:53.647933+00:00"
    };

    // Test transformation
    const transformed = {
      id: testData.id,
      question: testData.question,
      endTime: testData.endtime, // Transform from lowercase to camelCase
      totalPool: testData.totalpool,
      totalYes: testData.totalyes,
      totalNo: testData.totalno,
      status: testData.status,
      outcome: testData.outcome,
      createdAt: testData.createdat,
      creator: testData.creator,
      description: testData.description,
      category: testData.category,
      image: testData.image,
      source: testData.source,
      updatedAt: testData.updatedat
    };

    return NextResponse.json({
      success: true,
      original: testData,
      transformed: transformed,
      originalKeys: Object.keys(testData),
      transformedKeys: Object.keys(transformed),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test Simple API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test simple transformation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
