import { createClient } from '@insforge/sdk';

export const insforge = createClient({
  baseUrl: 'https://afhtz3nj.us-west.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDEwMTh9.RFo4b__rgHhxdFujh-xzaU99d9Qeqjjb3hacFYaibuY',
});

export const FINAL_CLUE = "Your journey ends where it began. Head back to the room where your team was torn apart — your teammate is waiting, and so is your final mission.";
export const REUNION_MESSAGE = "Head back to BSN Auditorium. Your teammate has been solving a puzzle — their answer reveals your next location.";
