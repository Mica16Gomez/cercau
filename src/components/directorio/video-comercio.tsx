import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function VideoComercio({ url }: { url: string }) {
  const tema = useTheme();
  const player = useVideoPlayer(urlAccesible(url));
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const [vistaKey, setVistaKey] = useState(0);
  const sinPistaDeVideo = status === 'readyToPlay' &&
    !player.videoTrack &&
    player.availableVideoTracks.length === 0;
  const mensaje = status === 'error'
    ? `No se pudo reproducir el video${error?.message ? `: ${error.message}` : '.'}`
    : sinPistaDeVideo
      ? 'El archivo publicado por la API no contiene una pista de imagen reproducible.'
      : null;

  return <View style={estilos.marco}>
    {mensaje ? <View accessibilityRole="alert" style={[estilos.fallback, { backgroundColor: tema.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary" style={estilos.mensaje}>{mensaje}</ThemedText>
      {sinPistaDeVideo && <ThemedText type="small" themeColor="textSecondary" style={estilos.mensaje}>
        Para ver un video, hay que reemplazar el archivo de muestra en la API.
      </ThemedText>}
    </View> : <VideoView
      key={vistaKey}
      style={estilos.video}
      player={player}
      nativeControls
      surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
      fullscreenOptions={{ enable: true }}
      onFullscreenExit={() => setVistaKey((actual) => actual + 1)}
    />}
  </View>;
}

function urlAccesible(url: string): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) return url;

  try {
    const video = new URL(url);
    const api = new URL(apiUrl);
    const hostVideo = video.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!['localhost', '127.0.0.1', '::1'].includes(hostVideo)) return url;
    video.protocol = api.protocol;
    video.hostname = api.hostname;
    video.port = api.port;
    return video.toString();
  } catch {
    return url;
  }
}

const estilos = StyleSheet.create({
  marco: { width: '100%', overflow: 'hidden', borderRadius: 16 },
  video: { width: '100%', aspectRatio: 16 / 9 },
  fallback: { minHeight: 160, justifyContent: 'center', gap: 8, padding: 20 },
  mensaje: { textAlign: 'center' },
});
