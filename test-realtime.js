import { createClient } from '@insforge/sdk';

const insforge = createClient({
  baseUrl: 'https://afhtz3nj.us-west.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDEwMTh9.RFo4b__rgHhxdFujh-xzaU99d9Qeqjjb3hacFYaibuY'
});

async function test() {
  insforge.realtime.on('error', err => console.error('Realtime ERROR:', err));
  insforge.realtime.on('connect_error', err => console.error('Connect ERROR:', err));

  console.log('Connecting...');
  await insforge.realtime.connect();
  console.log('Connected!');

  console.log('Subscribing...');
  const res = await insforge.realtime.subscribe('team_progress:all');
  console.log('Subscribe Result:', res);
  
  const res2 = await insforge.realtime.subscribe('chat:test');
  console.log('Subscribe Result (chat:test):', res2);

  insforge.realtime.disconnect();
}

test();
