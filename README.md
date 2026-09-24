# GymProApp

App móvil para gimnasios (multi-tenant, pensada para venderse a varios gimnasios) + su backend.

## Estructura

- `backend/` — API en NestJS + Prisma + PostgreSQL (JWT auth, multi-tenant por gimnasio)
- `mobile/` — App móvil en Expo + Expo Router (login, registro, tabs de cliente)

## Backend

```
cd backend
npm install
cp .env.example .env   # completa DATABASE_URL con tu propia base de Neon
npx prisma migrate dev
npx prisma db seed     # crea un gimnasio de prueba con código DEMO
npm run start:dev
```

## Mobile

```
cd mobile
npm install
cp .env.example .env   # apunta EXPO_PUBLIC_API_URL a la IP local de tu backend
npx expo start          # celular con Expo Go, o --web para verlo en el navegador
```

Regístrate en la app usando el código de gimnasio `DEMO` (o el que hayas creado).
