import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // WARNING: Fixed import path to point to '@/lib/supabase'

export type CFDState = {
  cart: any[];
  total: number;
  clientName: string;
  isNisia: boolean;
};

const CFD_CHANNEL_NAME = 'dasta_cfd_sync';

export function useCFDSync(role: 'sender' | 'receiver', onReceive?: (state: CFDState) => void) {
  const broadcastChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // 1. Setup Local Broadcast Channel
    broadcastChannel.current = new BroadcastChannel(CFD_CHANNEL_NAME);

    // 2. Setup Supabase Realtime
    const realtimeChannel = supabase.channel(CFD_CHANNEL_NAME);

    if (role === 'receiver' && onReceive) {
      // Listen to Local Broadcast
      broadcastChannel.current.onmessage = (event) => {
        onReceive(event.data);
      };

      // Listen to Supabase Realtime
      realtimeChannel
        .on('broadcast', { event: 'sync_state' }, (payload) => {
          onReceive(payload.payload as CFDState);
        })
        .subscribe();
    } else if (role === 'sender') {
      // Just subscribe for sending (sender role)
      realtimeChannel.subscribe();
    }

    return () => {
      broadcastChannel.current?.close();
      supabase.removeChannel(realtimeChannel);
    };
  }, [role, onReceive]);

  const sendState = useCallback((state: CFDState) => {
    if (role !== 'sender') return;

    // 1. Send via Local Broadcast
    if (broadcastChannel.current) {
      broadcastChannel.current.postMessage(state);
    }

    // 2. Send via Supabase Realtime
    supabase.channel(CFD_CHANNEL_NAME).send({
      type: 'broadcast',
      event: 'sync_state',
      payload: state as any,
    }).catch(err => console.error("CFD Sync Error (Supabase):", err));
    
  }, [role]);

  return { sendState };
}
