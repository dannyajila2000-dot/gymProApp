import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { establecerAccessToken } from '@/api/client';
import { guardar, leer, eliminar } from '@/lib/almacenamiento';
import * as authApi from '@/api/auth';
import type { Cliente } from '@/api/auth';

const CLAVE_REFRESH_TOKEN = 'gymsaas_refresh_token';

interface DatosSesion {
  cliente: Cliente | null;
  isLoading: boolean;
  iniciarSesion: (datos: { email: string; password: string; codigoGimnasio: string }) => Promise<void>;
  registrarse: (datos: {
    nombres: string;
    apellidos: string;
    email: string;
    password: string;
    codigoGimnasio: string;
  }) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<DatosSesion | null>(null);

export function useSesion() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error('useSesion debe usarse dentro de <SessionProvider />');
  return valor;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restaurarSesion() {
      try {
        const refreshTokenGuardado = await leer(CLAVE_REFRESH_TOKEN);
        if (!refreshTokenGuardado) return;

        const tokens = await authApi.refrescar(refreshTokenGuardado);
        establecerAccessToken(tokens.accessToken);
        await guardar(CLAVE_REFRESH_TOKEN, tokens.refreshToken);

        const perfil = await authApi.obtenerPerfil();
        setCliente(perfil);
      } catch {
        await eliminar(CLAVE_REFRESH_TOKEN);
        establecerAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restaurarSesion();
  }, []);

  async function iniciarSesion(datos: { email: string; password: string; codigoGimnasio: string }) {
    const respuesta = await authApi.login(datos);
    establecerAccessToken(respuesta.accessToken);
    await guardar(CLAVE_REFRESH_TOKEN, respuesta.refreshToken);
    setCliente(respuesta.cliente);
  }

  async function registrarse(datos: {
    nombres: string;
    apellidos: string;
    email: string;
    password: string;
    codigoGimnasio: string;
  }) {
    const respuesta = await authApi.registro(datos);
    establecerAccessToken(respuesta.accessToken);
    await guardar(CLAVE_REFRESH_TOKEN, respuesta.refreshToken);
    setCliente(respuesta.cliente);
  }

  async function salir() {
    const refreshTokenGuardado = await leer(CLAVE_REFRESH_TOKEN);
    if (refreshTokenGuardado) {
      authApi.cerrarSesion(refreshTokenGuardado).catch(() => {});
    }
    await eliminar(CLAVE_REFRESH_TOKEN);
    establecerAccessToken(null);
    setCliente(null);
  }

  return (
    <AuthContext.Provider
      value={{ cliente, isLoading, iniciarSesion, registrarse, cerrarSesion: salir }}>
      {children}
    </AuthContext.Provider>
  );
}
