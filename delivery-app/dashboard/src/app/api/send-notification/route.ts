import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, title, body: notificationBody, data } = body;

    if (!to) {
      return NextResponse.json({ error: 'Expo push token is required' }, { status: 400 });
    }

    const message = {
      to: to,
      sound: 'default',
      title: title,
      body: notificationBody,
      data: data || {},
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const receipt = await response.json();

    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
