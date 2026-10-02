# gymProApp

SaaS de gestión de gimnasios para vender a gyms. Backend NestJS + Prisma + Neon Postgres en `backend/`. App móvil Expo + Expo Router en `mobile/`. Usuario: Danny, Ecuador (zona horaria America/Guayaquil, moneda USD, SRI no SUNAT).

Mobile tiene su propio `mobile/AGENTS.md` (reglas de Expo/RN) — léelo antes de tocar código ahí.

## Multi-sesión: no asumas que eres el único trabajando aquí

Danny trabaja desde 2 máquinas y a veces usa otra sesión de Claude en paralelo mientras esta está ocupada o pausada. **Antes de retomar cualquier trabajo "en progreso" de una sesión anterior, corre `git log --oneline -10` y `git status --short`** — el código pudo haber avanzado o cambiado de diseño sin que esta sesión lo supiera. Si encuentras commits que no reconoces, revisa qué hacen antes de asumir que tu plan anterior sigue vigente.

## Git

- Nunca `git add -A`/`.` — stagear archivos específicos.
- Nunca commitear `.env` ni archivos con secretos.
- Mensajes de commit en español, explicando el porqué, no solo el qué.
- Terminar commits con `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- Después de commitear: `git push origin main` (no hace falta pedir permiso cada vez, ya está autorizado para este repo).

## Verificar cambios de backend

No hay entorno de staging — todo se prueba contra la base real (Neon). Para cualquier endpoint nuevo o modificado:
1. Levantar el backend local (`npm run start:dev`), apuntando al `.env` real.
2. Crear una cuenta de prueba desechable: `_test_<feature>_<timestamp>@example.com`.
3. Probar con curl (incluyendo casos de error/validación, no solo el camino feliz).
4. **Borrar la cuenta de prueba inmediatamente** (un script `_cleanup-test.mjs` con Prisma, `deleteMany` por email, luego borrar el script). Nunca dejar cuentas de prueba en la base real.

## Prisma

- Usa el adapter `PrismaPg` (`@prisma/adapter-pg`), no conexión directa clásica. Import normal de `@prisma/client` (sin ruta de cliente generado custom).
- Tras cualquier cambio de `schema.prisma`: `npx prisma migrate dev --name <nombre>` y luego `npx prisma generate`.

## Antes de dar por terminado

- Backend: `npx tsc --noEmit -p .` (el único error esperado es en `test/app.e2e-spec.ts` por un tipo de `supertest` — preexistente, ignorarlo) y `npm run build`.
- Mobile: `npx tsc --noEmit` y `npx expo lint` (el único error esperado es en `use-color-scheme.web.ts`, `react-hooks/set-state-in-effect` — preexistente, ignorarlo).
- Si tocaste algo relacionado a rutas de Expo Router y `tsc` se queja de una ruta que sí existe, probablemente `.expo/types/router.d.ts` está desactualizado — se regenera solo con `npx expo start`.

## Filosofía de producto

El cliente tiene control total sobre sus propias rutinas — las plantillas del gimnasio nunca se mutan directamente, todo pasa por copias personales (`Rutina.creadaPorClienteId`). La rotación automática del plan semanal (`planSemana()` en `backend/src/rutinas/rutinas.service.ts`) solo usa plantillas del gym (match por nivel+objetivo); las rutinas personales solo entran al plan si el cliente las fija a mano a un día específico (`RutinaPorDia`).

## Tema visual (mobile)

- Fondo blanco siempre, sin importar el modo oscuro del celular (decisión explícita, ver `mobile/src/constants/theme.ts` — `Colors.dark` es copia de `Colors.light`).
- Acento azul cielo (`colors.tint`), un segundo acento (`colors.energia`) para elementos "destacados" (ej. tarjeta del día de hoy en el dashboard).
- `CardShadow` (en `theme.ts`) es la receta de sombra reutilizada en toda la app — usarla en vez de definir sombras custom.

## Mapa del dominio de rutinas (lo que más cambia)

- `backend/src/rutinas/rutinas.service.ts` + `.controller.ts` — el corazón: personalización de rutinas, plan semanal, rotación automática, rutinas fijadas por día, rutinas personales.
- `backend/prisma/schema.prisma` — modelos clave: `Rutina`, `RutinaEjercicio`, `ClienteRutina`, `RutinaPorDia`, `SesionEntrenamiento`, `ActividadLibre`.
- `mobile/src/app/(tabs)/index.tsx` — dashboard, línea de tiempo semanal.
- `mobile/src/app/(tabs)/rutina.tsx` + `mobile/src/app/rutinas/categorias.tsx` — pantalla "Descubre" (catálogo, categorías, búsqueda).
- `mobile/src/app/rutinas/mias/[rutinaId].tsx` — editor de rutina personal (arrastrar para reordenar, agregar/quitar ejercicios).
- `mobile/src/components/rutinas/` — modales compartidos de fijar rutina por día (`cambiar-rutina-dia-modal.tsx`, `usar-en-dia-modal.tsx`) y tarjetas de rutina reutilizables (`tarjetas-rutina.tsx`).
