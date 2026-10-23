'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

// Every negotiation carries an id (nid) so answers/candidates from a superseded attempt are ignored.
type Signal =
  | { type: 'offer' | 'answer'; sdp: string; nid: string }
  | { candidate: RTCIceCandidateInit; nid: string };
const ICE: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

/**
 * One-to-one WebRTC call over the Socket.io relay.
 * The user is always the offerer; every `rtc:ready` (both sides present, e.g. after a
 * reconnect) makes the user renegotiate with a fresh RTCPeerConnection.
 */
export function useCall(opts: { sessionId: string; video: boolean; isOfferer: boolean; enabled: boolean; getSocket: () => Promise<Socket> }) {
  const { sessionId, video, isOfferer, enabled, getSocket } = opts;
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [state, setState] = useState<RTCPeerConnectionState | 'idle'>('idle');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const nid = useRef<string | null>(null); // negotiation currently in force
  const pending = useRef<{ nid: string; c: RTCIceCandidateInit }[]>([]);
  const media = useRef<Promise<MediaStream | null> | null>(null);
  const startedAt = useRef(0); // when the current negotiation began

  const getMedia = useCallback(() => {
    if (!media.current) {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError('Calls need a secure connection (https or localhost). You can still use chat.');
        media.current = Promise.resolve(null);
      } else {
        media.current = navigator.mediaDevices
          .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false })
          .then((s) => { setLocal(s); return s; })
          .catch((e: DOMException) => {
            setMediaError(
              e.name === 'NotAllowedError' ? `Please allow ${video ? 'camera and microphone' : 'microphone'} access in your browser to talk. You can still use chat.`
                : e.name === 'NotFoundError' ? `No ${video ? 'camera/microphone' : 'microphone'} found on this device. You can still use chat.`
                  : 'Could not start your microphone/camera. You can still use chat.',
            );
            return null;
          });
      }
    }
    return media.current;
  }, [video]);

  /** New peer connection for negotiation `id`. Returns null if a newer negotiation started meanwhile. */
  const fresh = useCallback(async (socket: Socket, id: string) => {
    pc.current?.close();
    pc.current = null;
    nid.current = id;
    startedAt.current = Date.now();
    const stream = await getMedia();
    if (nid.current !== id) return null; // superseded while waiting for the camera/mic
    const conn = new RTCPeerConnection(ICE);
    pc.current = conn;
    (window as unknown as { __pc?: RTCPeerConnection }).__pc = conn; // handy for debugging/tests
    if (stream) stream.getTracks().forEach((t) => conn.addTrack(t, stream));
    else {
      conn.addTransceiver('audio', { direction: 'recvonly' });
      if (video) conn.addTransceiver('video', { direction: 'recvonly' });
    }
    conn.ontrack = (e) => setRemote(e.streams[0] ?? new MediaStream([e.track]));
    conn.onicecandidate = (e) => e.candidate && socket.emit('rtc:signal', { sessionId, data: { candidate: e.candidate.toJSON(), nid: id } });
    conn.onconnectionstatechange = () => pc.current === conn && setState(conn.connectionState);
    setState(conn.connectionState);
    return conn;
  }, [getMedia, sessionId, video]);

  const flushCandidates = async (conn: RTCPeerConnection, id: string) => {
    const mine = pending.current.filter((p) => p.nid === id);
    pending.current = [];
    for (const p of mine) await conn.addIceCandidate(p.c).catch(() => {});
  };

  useEffect(() => {
    if (!enabled) return;
    let socket: Socket;
    let cancelled = false;
    getMedia();

    const onReady = async () => {
      if (!isOfferer || cancelled) return;
      // don't tear down a healthy or still-young negotiation just because a peer said hello
      const st = pc.current?.connectionState;
      if (st === 'connected' || ((st === 'new' || st === 'connecting') && Date.now() - startedAt.current < 12_000)) return;
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const conn = await fresh(socket, id);
      if (!conn || cancelled) return;
      const offer = await conn.createOffer();
      if (nid.current !== id) return;
      await conn.setLocalDescription(offer);
      socket.emit('rtc:signal', { sessionId, data: { type: 'offer', sdp: offer.sdp, nid: id } });
    };

    const onSignal = async ({ data }: { data: Signal }) => {
      if (cancelled || !data?.nid) return;
      try {
        if ('type' in data && data.type === 'offer') {
          const conn = await fresh(socket, data.nid);
          if (!conn) return;
          await conn.setRemoteDescription({ type: 'offer', sdp: data.sdp });
          await flushCandidates(conn, data.nid);
          const answer = await conn.createAnswer();
          if (nid.current !== data.nid) return;
          await conn.setLocalDescription(answer);
          socket.emit('rtc:signal', { sessionId, data: { type: 'answer', sdp: answer.sdp, nid: data.nid } });
        } else if ('type' in data && data.type === 'answer') {
          const conn = pc.current;
          if (conn && data.nid === nid.current && conn.signalingState === 'have-local-offer') {
            await conn.setRemoteDescription({ type: 'answer', sdp: data.sdp });
            await flushCandidates(conn, data.nid);
          }
        } else if ('candidate' in data) {
          const conn = pc.current;
          if (conn?.remoteDescription && data.nid === nid.current) await conn.addIceCandidate(data.candidate).catch(() => {});
          else pending.current.push({ nid: data.nid, c: data.candidate });
        }
      } catch (e) {
        console.warn('rtc signal error', e);
      }
    };

    getSocket().then((s) => {
      if (cancelled) return;
      socket = s;
      s.on('rtc:ready', onReady);
      s.on('rtc:signal', onSignal);
    });
    // Until connected, keep saying hello: the server replies with rtc:ready once both peers are in the room.
    // This recovers from a missed rtc:ready (slow page load, reconnect) and from failed connections.
    const watchdog = setInterval(() => {
      const conn = pc.current;
      const st = conn?.connectionState;
      const stuck = !conn || st === 'failed' || st === 'closed' || st === 'disconnected' || ((st === 'new' || st === 'connecting') && Date.now() - startedAt.current > 12_000);
      if (stuck && socket?.connected) socket.emit('rtc:hello', { sessionId });
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(watchdog);
      socket?.off('rtc:ready', onReady);
      socket?.off('rtc:signal', onSignal);
    };
  }, [enabled, isOfferer, sessionId, getSocket, fresh, getMedia]);

  // stop everything when the call is over / page unmounts
  const hangup = useCallback(() => {
    nid.current = null;
    pc.current?.close();
    pc.current = null;
    media.current?.then((s) => s?.getTracks().forEach((t) => t.stop()));
    media.current = null; // re-acquire on the next call (also keeps React dev double-mount working)
    setLocal(null);
    setState('closed');
  }, []);
  useEffect(() => () => hangup(), [hangup]);
  useEffect(() => { if (!enabled && pc.current) hangup(); }, [enabled, hangup]);

  const toggleMute = () => {
    local?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  };
  const toggleCamera = () => {
    local?.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    setCameraOff(!cameraOff);
  };

  return { local, remote, state, mediaError, muted, cameraOff, toggleMute, toggleCamera, hangup };
}
