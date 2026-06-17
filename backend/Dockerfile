# Etapa 1: Compilacion (Build)
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
# Copiar el pom.xml y resolver las dependencias primero (cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B
# Copiar el codigo fuente y compilar
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Imagen de produccion (Run)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copiar el archivo JAR de la etapa de compilacion
COPY --from=build /app/target/*.jar app.jar

# Exponer el puerto por el que escuchara la aplicacion
EXPOSE 8080

# Configurar punto de entrada
ENTRYPOINT ["java", "-jar", "app.jar"]
