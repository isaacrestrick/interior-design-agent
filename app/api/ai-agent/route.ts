import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool, stepCountIs, type CoreMessage } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import type { Fixture } from '@/types';

// Schema for fixture parameters in tool calling
const fixtureSchema = z.object({
  type: z.string().describe('Type of fixture (e.g., sink, mirror, light, outlet, window, cabinet)'),
  name: z.string().describe('Name or description of the fixture'),
  widthInches: z.number().describe('Width of the fixture in inches'),
  heightInches: z.number().describe('Height of the fixture in inches'),
  positionX: z.number().describe('X position from the left edge of the wall in inches'),
  positionY: z.number().describe('Y position from the bottom edge of the wall in inches'),
  productUrl: z.string().optional().describe('URL to product information or specifications'),
  notes: z.string().optional().describe('Additional notes about the fixture'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction: rawInstruction, wallId, messages: rawMessages } = body;

    const normalizedWallId = typeof wallId === 'string' ? wallId.trim() : '';

    console.log('[AI Agent] Received wallId:', wallId);
    console.log('[AI Agent] Normalized wallId:', normalizedWallId);

    if (!normalizedWallId) {
      return NextResponse.json(
        { error: 'Missing wallId' },
        { status: 400 }
      );
    }

    const incomingMessages =
      Array.isArray(rawMessages) && rawMessages.length > 0
        ? rawMessages.filter(
            (message: unknown): message is { role: 'user' | 'assistant'; content: string } => {
              if (typeof message !== 'object' || message === null) {
                return false;
              }
              const { role, content } = message as { role?: unknown; content?: unknown };
              return (role === 'user' || role === 'assistant') && typeof content === 'string';
            }
          )
        : undefined;

    let normalizedMessages: CoreMessage[] | undefined = incomingMessages?.map((message) => ({
      role: message.role,
      content: [{ type: 'text', text: message.content.trim() }],
    }));

    if (normalizedMessages && normalizedMessages.length > 0) {
      const firstUserIndex = normalizedMessages.findIndex((message) => message.role === 'user');
      if (firstUserIndex === -1) {
        // No user messages found. Fall back to prompt-only mode so the model receives the latest instruction.
        normalizedMessages = undefined;
      } else if (firstUserIndex > 0) {
        normalizedMessages = normalizedMessages.slice(firstUserIndex);
      }
    }

    let instruction = typeof rawInstruction === 'string' ? rawInstruction.trim() : '';

    if (!instruction && incomingMessages) {
      for (let i = incomingMessages.length - 1; i >= 0; i -= 1) {
        const message = incomingMessages[i];
        if (message.role === 'user' && message.content.trim().length > 0) {
          instruction = message.content.trim();
          break;
        }
      }
    }

    if (!instruction) {
      return NextResponse.json(
        { error: 'Missing instruction' },
        { status: 400 }
      );
    }

    // Get wall information
    const wall = db.getWallWithFixtures(normalizedWallId);
    if (!wall) {
      return NextResponse.json(
        { error: 'Wall not found' },
        { status: 404 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your-api-key-here') {
      // Fallback: parse instruction manually without AI
      return handleManualParsing(instruction, normalizedWallId, wall);
    }

    // Use AI with proper tool calling
    const systemPrompt = `You are an AI assistant helping interior designers create wall elevations.

Wall Information:
- Dimensions: ${wall.widthFeet} feet wide × ${wall.heightFeet} feet tall
- Total width in inches: ${wall.widthFeet * 12}"
- Total height in inches: ${wall.heightFeet * 12}"

Current fixtures on this wall:
${wall.fixtures.length > 0 ? wall.fixtures.map(f =>
  `- ${f.name} (${f.type}): ${f.widthInches}" W × ${f.heightInches}" H at position (${f.positionX}", ${f.positionY}")`
).join('\n') : 'None'}

Your task is to interpret the interior designer's instructions and:
1. Extract fixture information (type, dimensions, position)
2. Convert measurements to inches if needed
3. Calculate positions (X from left edge, Y from bottom edge)
4. Suggest reasonable defaults if information is missing

Important positioning rules:
- X position: distance from LEFT edge of wall in inches (0 to ${wall.widthFeet * 12})
- Y position: distance from BOTTOM edge of wall in inches (0 to ${wall.heightFeet * 12})
- Positions should be reasonable and not overlap with existing fixtures
- Standard heights:
  - Outlets: typically 12-18" from floor
  - Light switches: typically 48" from floor
  - Vanity sinks: typically 30-36" from floor
  - Mirrors: typically 40-72" from floor (above sinks)
  - Vanity lights: typically 75-80" from floor
  - Windows: vary, but often 36-48" from floor

When the user provides clear instructions to add fixtures, use the add_fixture tool to add them.
If the instruction is unclear or asking a question, respond with helpful guidance.`;

    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      tools: {
        add_fixture: tool({
          description: 'Add a fixture to the wall elevation. Call this tool once for each fixture to add.',
          inputSchema: fixtureSchema,
          execute: async (params: z.infer<typeof fixtureSchema>) => {
            console.log('[AI Agent] Creating fixture with wallId:', normalizedWallId);
            console.log('[AI Agent] Fixture params:', params);
            const fixture = db.createFixture({
              type: params.type,
              name: params.name,
              widthInches: params.widthInches,
              heightInches: params.heightInches,
              positionX: params.positionX,
              positionY: params.positionY,
              wallId: normalizedWallId,
              productUrl: params.productUrl,
              notes: params.notes,
            });
            console.log('[AI Agent] Created fixture:', fixture);
            return {
              success: true,
              fixture: fixture,
              message: `Successfully added ${params.name} at position (${params.positionX}", ${params.positionY}")`,
            };
          },
        }),
      },
      system: systemPrompt,
      temperature: 0.3,
      stopWhen: stepCountIs(10), // Allow up to 10 tool call steps
      ...(normalizedMessages
        ? { messages: normalizedMessages }
        : { prompt: instruction }),
    });

    // Process the tool calling response
    const response = processToolCallingResponse(result);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in AI agent:', error);
    return NextResponse.json(
      { error: 'Failed to process instruction', details: String(error) },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processToolCallingResponse(result: any) {
  // Check if any fixtures were added via tool calls
  const addedFixtures: Fixture[] = [];

  console.log('[AI Agent] Processing tool calling response');
  console.log('[AI Agent] Tool results:', result.toolResults);

  const toolMessages: string[] = [];

  if (result.toolResults && result.toolResults.length > 0) {
    // Extract fixtures from successful tool calls
    for (const toolResult of result.toolResults) {
      console.log('[AI Agent] Tool result:', toolResult);

      if (toolResult.type !== 'tool-result') {
        continue;
      }

      const output = toolResult.output as
        | { success?: boolean; fixture?: Fixture; message?: string }
        | undefined;

      if (output?.success && output.fixture) {
        addedFixtures.push(output.fixture);
        if (output.message) {
          toolMessages.push(output.message);
        }
      }
    }
  }

  console.log('[AI Agent] Added fixtures:', addedFixtures);

  // If fixtures were added, return them with the AI's text response
  if (addedFixtures.length > 0) {
    const messageFromTools = toolMessages.join('\n');
    const assistantMessage = result.text?.trim()
      || (messageFromTools.length > 0 ? messageFromTools : undefined)
      || `Successfully added ${addedFixtures.length} fixture(s)`;

    return {
      action: 'add_fixture',
      fixtures: addedFixtures,
      message: assistantMessage,
    };
  }

  // Otherwise, return the AI's text response as a clarification
  return {
    action: 'clarify',
    message: result.text || 'I can help you add fixtures to your wall elevation. What would you like to add?',
  };
}

interface WallWithFixtures {
  widthFeet: number;
  heightFeet: number;
}

interface ManualParseResponse {
  action: string;
  fixtures?: unknown[];
  message: string;
}

function handleManualParsing(instruction: string, wallId: string, wall: WallWithFixtures) {
  // Simple keyword-based parsing as fallback
  const lowerInstruction = instruction.toLowerCase();

  let response: ManualParseResponse = {
    action: 'clarify',
    message: '',
  };

  // Detect common patterns
  if (lowerInstruction.includes('add') || lowerInstruction.includes('place') || lowerInstruction.includes('put')) {
    let fixtureType = 'unknown';
    let name = 'New Fixture';

    if (lowerInstruction.includes('sink')) {
      fixtureType = 'sink';
      name = 'Sink';
    } else if (lowerInstruction.includes('mirror')) {
      fixtureType = 'mirror';
      name = 'Mirror';
    } else if (lowerInstruction.includes('light')) {
      fixtureType = 'light';
      name = 'Light Fixture';
    } else if (lowerInstruction.includes('outlet')) {
      fixtureType = 'outlet';
      name = 'Outlet';
    } else if (lowerInstruction.includes('window')) {
      fixtureType = 'window';
      name = 'Window';
    }

    // Extract dimensions if present
    const dimensionMatch = instruction.match(/(\d+)\s*(?:in|inch|inches|")?\s*(?:by|x|×)\s*(\d+)\s*(?:in|inch|inches|")?/i);
    let width = 24; // default
    let height = 24; // default

    if (dimensionMatch) {
      width = parseInt(dimensionMatch[1]);
      height = parseInt(dimensionMatch[2]);
    } else {
      // Use defaults based on fixture type
      if (fixtureType === 'sink') { width = 24; height = 8; }
      else if (fixtureType === 'mirror') { width = 30; height = 36; }
      else if (fixtureType === 'light') { width = 24; height = 6; }
      else if (fixtureType === 'outlet') { width = 4; height = 6; }
      else if (fixtureType === 'window') { width = 36; height = 48; }
    }

    // Extract position
    const posMatch = instruction.match(/(?:at|position)\s*(?:\()?(\d+)\s*(?:in|inch|inches|")?\s*(?:,|and)\s*(\d+)\s*(?:in|inch|inches|")?(?:\))?/i);
    let posX = wall.widthFeet * 6; // Center by default
    let posY = 36; // Default height

    if (posMatch) {
      posX = parseInt(posMatch[1]);
      posY = parseInt(posMatch[2]);
    } else {
      // Use defaults based on fixture type
      if (fixtureType === 'outlet') { posY = 15; }
      else if (fixtureType === 'sink') { posY = 32; }
      else if (fixtureType === 'mirror') { posY = 48; }
      else if (fixtureType === 'light') { posY = 78; }
      else if (fixtureType === 'window') { posY = 42; }
    }

    // Create the fixture
    const fixture = db.createFixture({
      type: fixtureType,
      name,
      widthInches: width,
      heightInches: height,
      positionX: posX,
      positionY: posY,
      wallId,
    });

    response = {
      action: 'add_fixture',
      fixtures: [fixture],
      message: `Added ${name} (${width}" × ${height}") at position (${posX}", ${posY}")`,
    };
  } else {
    response.message = `To use the AI agent, please set your ANTHROPIC_API_KEY in the .env file.\n\nFor manual entry, use this format:\n"Add a [fixture type] that is [width] by [height] inches at position [x], [y]"\n\nExample: "Add a sink that is 24 by 8 inches at position 30, 36"`;
  }

  return NextResponse.json(response);
}
