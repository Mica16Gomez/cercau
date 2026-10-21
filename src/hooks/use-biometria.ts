import { useCallback } from 'react';

import { useConsulta } from './use-consulta';

import { consultarBiometria } from '@/servicios/biometria';

export function useBiometria() {
  return useConsulta(useCallback(() => consultarBiometria(), []));
}
