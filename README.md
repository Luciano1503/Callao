# Callao

Sistema web organizado con Angular para el frontend, Spring Boot para API REST y PostgreSQL como base de datos.

## Estructura

```text
Callao/
  frontend/   Aplicacion Angular
  backend/    API REST Java 17 con Spring Boot
  docker-compose.yml
```

## Frontend

```bash
cd frontend
npm start
```

El frontend corre en `http://localhost:4200` y usa proxy hacia `http://localhost:8080`.

## Backend

```bash
cd backend
./mvnw spring-boot:run
```

En Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

El backend corre en `http://localhost:8080`.

## Base de datos

```bash
docker compose up -d postgres
```

Docker Desktop debe estar abierto antes de ejecutar ese comando.

Credenciales iniciales:

```text
DB: callao_db
User: callao_user
Password: callao_pass
Host: localhost
Port: 5433
```

## Endpoint inicial

```text
GET http://localhost:8080/api/v1/health
```
