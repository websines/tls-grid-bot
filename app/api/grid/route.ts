import { NextResponse } from 'next/server';
import { GridTradingService } from '@/app/services/gridTradingService';

// Create a singleton instance of the service
const gridService = GridTradingService.getInstance();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { action, config } = data;

    console.log('Grid API received request:', { action, config });

    switch (action) {
      case 'start':
        if (!config) {
          return NextResponse.json(
            { status: 'error', message: 'Missing grid configuration' },
            { status: 400 }
          );
        }
        
        try {
          await gridService.startGrid(config);
          return NextResponse.json({ 
            status: 'success', 
            message: 'Grid started successfully' 
          });
        } catch (error) {
          console.error('Error starting grid:', error);
          return NextResponse.json(
            { 
              status: 'error', 
              message: error instanceof Error ? error.message : 'Failed to start grid' 
            },
            { status: 500 }
          );
        }

      case 'stop':
        try {
          await gridService.stopGrid();
          return NextResponse.json({ 
            status: 'success', 
            message: 'Grid stopped successfully' 
          });
        } catch (error) {
          console.error('Error stopping grid:', error);
          return NextResponse.json(
            { 
              status: 'error', 
              message: error instanceof Error ? error.message : 'Failed to stop grid' 
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { status: 'error', message: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Grid API Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = await gridService.getStatus();
    return NextResponse.json({ status: 'success', data: status });
  } catch (error) {
    console.error('Grid API Error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to get grid status' 
      },
      { status: 500 }
    );
  }
}
